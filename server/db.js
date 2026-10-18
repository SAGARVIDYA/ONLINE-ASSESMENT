const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'exam.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for high performance and durability
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
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

// Seed questions if not already seeded
function seedQuestions() {
  const count = db.prepare('SELECT COUNT(*) as c FROM questions').get().c;
  if (count < 200) {
    console.log(`Seeding questions table (current count: ${count})...`);
    const questionsFile = path.join(__dirname, '..', 'questions.json');
    if (!fs.existsSync(questionsFile)) {
      throw new Error(`questions.json not found at ${questionsFile}`);
    }
    const questions = JSON.parse(fs.readFileSync(questionsFile, 'utf8'));

    const insert = db.prepare(`
      INSERT OR REPLACE INTO questions 
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
    console.log(`Successfully seeded ${questions.length} questions into SQLite.`);
  }
}

seedQuestions();

module.exports = db;
