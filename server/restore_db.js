const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

async function restoreDatabase() {
  const args = process.argv.slice(2);
  const backupDir = path.join(__dirname, '..', 'backups');

  // Determine source backup file
  let sourceBackup = args[0];
  if (!sourceBackup) {
    if (fs.existsSync(backupDir)) {
      const backupFiles = fs.readdirSync(backupDir)
        .filter(f => f.endsWith('.db') && !f.includes('safety_copy'))
        .sort()
        .reverse();
      if (backupFiles.length > 0) {
        sourceBackup = path.join(backupDir, backupFiles[0]);
      }
    }
  }

  if (!sourceBackup || !fs.existsSync(sourceBackup)) {
    console.error(`[Error] Source backup file not found: ${sourceBackup}`);
    console.error('Usage: node server/restore_db.js [path_to_backup.db] [target_path]');
    process.exit(1);
  }

  // Determine target database path
  const defaultTarget = path.join(__dirname, '..', 'data', 'exam.db');
  const targetDbPath = args[1] || process.env.DATABASE_PATH || defaultTarget;
  const targetDir = path.dirname(targetDbPath);

  console.log('==============================================');
  console.log('SQLITE DATABASE RESTORATION & MIGRATION');
  console.log('==============================================');
  console.log(`Source Backup File: ${sourceBackup}`);
  console.log(`Target Database:    ${targetDbPath}`);

  // 1. Verify source backup before proceeding
  console.log('\n[Step 1] Validating source backup integrity...');
  let sourceDb;
  try {
    sourceDb = new Database(sourceBackup, { readonly: true });
    const qCount = sourceDb.prepare('SELECT COUNT(*) as c FROM questions').get().c;
    const sCount = sourceDb.prepare('SELECT COUNT(*) as c FROM students').get().c;
    const aCount = sourceDb.prepare('SELECT COUNT(*) as c FROM attempts').get().c;
    console.log(`  Source Questions: ${qCount}`);
    console.log(`  Source Students:  ${sCount}`);
    console.log(`  Source Attempts:  ${aCount}`);
    if (qCount !== 200) {
      throw new Error(`Backup corrupted: expected 200 questions, found ${qCount}`);
    }
  } finally {
    if (sourceDb) sourceDb.close();
  }

  // 2. Ensure target directory exists
  if (!fs.existsSync(targetDir)) {
    console.log(`\n[Step 2] Creating target directory: ${targetDir}`);
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 3. If target database already exists, create safety backup
  if (fs.existsSync(targetDbPath)) {
    const safetyFile = `${targetDbPath}.safety_${Date.now()}.bak`;
    console.log(`\n[Step 3] Existing target detected. Creating pre-migration safety copy at:\n  ${safetyFile}`);
    fs.copyFileSync(targetDbPath, safetyFile);
    if (fs.existsSync(`${targetDbPath}-wal`)) {
      fs.copyFileSync(`${targetDbPath}-wal`, `${safetyFile}-wal`);
    }
  }

  // 4. Perform atomic copy
  console.log('\n[Step 4] Copying validated backup to target path...');
  fs.copyFileSync(sourceBackup, targetDbPath);

  // Remove stale WAL/SHM files from previous target to prevent journal corruption
  if (fs.existsSync(`${targetDbPath}-wal`)) fs.unlinkSync(`${targetDbPath}-wal`);
  if (fs.existsSync(`${targetDbPath}-shm`)) fs.unlinkSync(`${targetDbPath}-shm`);

  // 5. Verify restored database
  console.log('\n[Step 5] Verifying restored database at destination...');
  const restoredDb = new Database(targetDbPath);
  restoredDb.pragma('journal_mode = WAL');
  restoredDb.pragma('foreign_keys = ON');

  const finalQuestions = restoredDb.prepare('SELECT COUNT(*) as c FROM questions').get().c;
  const finalStudents = restoredDb.prepare('SELECT * FROM students').all();
  const finalAttempts = restoredDb.prepare('SELECT id, roll_number, full_name, attempt_number, score, status FROM attempts').all();
  restoredDb.close();

  console.log('\n==============================================');
  console.log('RESTORATION COMPLETED SUCCESSFULLY!');
  console.log('==============================================');
  console.log(`Questions: ${finalQuestions} (Expected: 200)`);
  console.log(`Students:  ${finalStudents.length}`);
  finalStudents.forEach(s => console.log(`  - ${s.full_name} (${s.roll_number})`));
  console.log(`Attempts:  ${finalAttempts.length}`);
  finalAttempts.forEach(a => console.log(`  - [Attempt #${a.attempt_number}] ${a.full_name} (${a.roll_number}): Score ${a.score}/200`));
  console.log('==============================================\n');
}

restoreDatabase().catch(err => {
  console.error('\n[Error] Restoration failed:', err);
  process.exit(1);
});
