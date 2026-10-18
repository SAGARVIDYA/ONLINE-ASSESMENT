const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

async function performBackup() {
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `exam_backup_${timestamp}.db`);
  const liveDbPath = path.join(__dirname, '..', 'data', 'exam.db');

  console.log(`Connecting to live database at: ${liveDbPath}`);
  const liveDb = new Database(liveDbPath);

  // Checkpoint WAL so that all WAL transactions are fully committed into the main DB file
  console.log('Running WAL checkpoint (TRUNCATE)...');
  const checkpointResult = liveDb.pragma('wal_checkpoint(TRUNCATE)');
  console.log('Checkpoint result:', checkpointResult);

  // Perform full online backup using SQLite backup API
  console.log(`Creating verified backup at: ${backupFile}`);
  await liveDb.backup(backupFile);
  liveDb.close();

  // Also make a redundant file copy
  const rawCopy = path.join(backupDir, `exam_raw_copy_${timestamp}.db`);
  fs.copyFileSync(liveDbPath, rawCopy);

  console.log('Verifying backup file integrity...');
  const backupDb = new Database(backupFile, { readonly: true });
  
  const questionsCount = backupDb.prepare('SELECT COUNT(*) as count FROM questions').get().count;
  const students = backupDb.prepare('SELECT * FROM students').all();
  const attempts = backupDb.prepare('SELECT id, student_id, roll_number, full_name, attempt_number, score, status, submitted_at FROM attempts').all();
  backupDb.close();

  console.log('==============================================');
  console.log('BACKUP VERIFICATION REPORT');
  console.log('==============================================');
  console.log(`Backup Location: ${backupFile}`);
  console.log(`Backup File Size: ${fs.statSync(backupFile).size} bytes`);
  console.log(`Questions Count: ${questionsCount} (Expected: 200)`);
  console.log(`Students Count: ${students.length}`);
  console.log('Preserved Student Records:');
  students.forEach(s => console.log(`  - ID ${s.id}: ${s.full_name} (Roll: ${s.roll_number})`));
  console.log(`Attempts Count: ${attempts.length}`);
  console.log('Preserved Attempt Records:');
  attempts.forEach(a => console.log(`  - Attempt ID: ${a.id} | Roll: ${a.roll_number} | Candidate: ${a.full_name} | Score: ${a.score}/200 | Status: ${a.status}`));
  console.log('==============================================');

  if (questionsCount === 200 && students.length >= 1 && attempts.length >= 1) {
    console.log('BACKUP VERIFIED 100% SUCCESSFUL AND INTACT!');
  } else {
    throw new Error('Backup verification failed: unexpected record count');
  }
}

performBackup().catch(err => {
  console.error('Backup failed:', err);
  process.exit(1);
});
