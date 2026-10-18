const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Support DATABASE_PATH environment variable (for Render persistent disks, e.g. /var/data/exam.db)
// Fallback to local project directory: data/exam.db
const defaultDbPath = path.join(__dirname, '..', 'data', 'exam.db');
const dbPath = process.env.DATABASE_PATH || defaultDbPath;
const dbDir = path.dirname(dbPath);

// Ensure the target database directory exists before connecting
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log(`[Database] Initializing SQLite database at: ${dbPath}`);
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for high performance and durability
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema safely without dropping or resetting existing tables
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    roll_number TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS questions (
    original_id TEXT PRIMARY KEY,
    q_num INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT NOT NULL,
    answer_text TEXT
  );

  CREATE TABLE IF NOT EXISTS attempts (
    id TEXT PRIMARY KEY,
    student_id INTEGER,
    roll_number TEXT NOT NULL,
    full_name TEXT NOT NULL,
    attempt_number INTEGER NOT NULL,
    randomized_question_order TEXT NOT NULL,
    answers_json TEXT DEFAULT '{}',
    review_flags_json TEXT DEFAULT '[]',
    start_time TEXT NOT NULL,
    deadline TEXT NOT NULL,
    submitted_at TEXT,
    duration_seconds INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    percentage REAL DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    unanswered_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'in_progress',
    FOREIGN KEY (student_id) REFERENCES students(id)
  );

  CREATE INDEX IF NOT EXISTS idx_attempts_roll ON attempts(roll_number);
  CREATE INDEX IF NOT EXISTS idx_students_roll ON students(roll_number);
`);

// Seed questions if empty, preserving any existing questions and NEVER touching attempts or students
function seedQuestions() {
  const countRow = db.prepare('SELECT COUNT(*) as c FROM questions').get();
  const currentCount = countRow ? countRow.c : 0;
  
  if (currentCount < 200) {
    console.log(`[Database] Seeding questions table (current count: ${currentCount})...`);
    const questionsFile = path.join(__dirname, '..', 'questions.json');
    if (!fs.existsSync(questionsFile)) {
      throw new Error(`questions.json not found at ${questionsFile}`);
    }
    const questions = JSON.parse(fs.readFileSync(questionsFile, 'utf8'));

    const insert = db.prepare(`
      INSERT OR IGNORE INTO questions 
      (original_id, q_num, question_text, option_a, option_b, option_c, option_d, correct_option, answer_text)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((qList) => {
      for (const q of qList) {
        insert.run(
          q.id,
          q.qNum,
          q.question,
          q.options.A,
          q.options.B,
          q.options.C,
          q.options.D,
          q.correctAnswer,
          q.answerText || ''
        );
      }
    });

    insertMany(questions);
    console.log(`[Database] Successfully populated ${questions.length} questions into SQLite.`);
  } else {
    console.log(`[Database] All ${currentCount} questions already present.`);
  }
}

seedQuestions();

module.exports = db;
