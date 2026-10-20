const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper to shuffle an array (Fisher-Yates)
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/questions/count
app.get('/api/questions/count', (req, res) => {
  try {
    const row = db.prepare('SELECT COUNT(*) as count FROM questions').get();
    res.json({ count: row.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attempts/start - Start a new assessment attempt
app.post('/api/attempts/start', (req, res) => {
  try {
    let { full_name, roll_number } = req.body;
    if (!full_name || !roll_number) {
      return res.status(400).json({ error: 'Full name and Roll number are required.' });
    }

    full_name = full_name.trim();
    roll_number = roll_number.trim().toUpperCase();

    if (full_name.length < 2 || roll_number.length < 1) {
      return res.status(400).json({ error: 'Please enter valid details.' });
    }

    // Insert student or update name
    let student = db.prepare('SELECT * FROM students WHERE roll_number = ?').get(roll_number);
    if (!student) {
      const stmt = db.prepare('INSERT INTO students (full_name, roll_number) VALUES (?, ?)');
      const info = stmt.run(full_name, roll_number);
      student = { id: info.lastInsertRowid, full_name, roll_number };
    } else {
      // update full_name if changed
      db.prepare('UPDATE students SET full_name = ? WHERE id = ?').run(full_name, student.id);
    }

    // Determine attempt number
    const countRow = db.prepare('SELECT COUNT(*) as c FROM attempts WHERE roll_number = ?').get(roll_number);
    const attempt_number = (countRow.c || 0) + 1;

    // Fetch all questions
    const allQuestions = db.prepare('SELECT original_id, q_num, question_text, option_a, option_b, option_c, option_d FROM questions').all();
    
    // Shuffle question order
    const shuffledQuestions = shuffleArray(allQuestions);
    const randomizedOrder = shuffledQuestions.map(q => q.original_id);

    // Duration is exactly 120 minutes (7200 seconds)
    const durationSeconds = 120 * 60;
    const now = new Date();
    const startTimeStr = now.toISOString();
    const deadline = new Date(now.getTime() + durationSeconds * 1000).toISOString();

    const attemptId = 'att_' + crypto.randomBytes(8).toString('hex');

    db.prepare(`
      INSERT INTO attempts (
        id, student_id, roll_number, full_name, attempt_number,
        randomized_question_order, answers_json, review_flags_json,
        start_time, deadline, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      attemptId,
      student.id,
      roll_number,
      full_name,
      attempt_number,
      JSON.stringify(randomizedOrder),
      '{}',
      '[]',
      startTimeStr,
      deadline,
      'in_progress'
    );

    res.json({
      success: true,
      attempt: {
        id: attemptId,
        attempt_number,
        full_name,
        roll_number,
        start_time: startTimeStr,
        deadline,
        duration_seconds: durationSeconds,
        total_questions: shuffledQuestions.length,
        questions: shuffledQuestions.map((q, idx) => ({
          displayNumber: idx + 1,
          id: q.original_id,
          originalId: q.original_id,
          qNum: q.q_num,
          question: q.question_text,
          options: {
            A: q.option_a,
            B: q.option_b,
            C: q.option_c,
            D: q.option_d,
          }
        }))
      }
    });
  } catch (err) {
    console.error('Error starting attempt:', err);
    res.status(500).json({ error: 'Failed to start attempt: ' + err.message });
  }
});

// POST /api/attempts/sync - Autosave answers and marked for review flags
app.post('/api/attempts/sync', (req, res) => {
  try {
    const { attempt_id, answers, review_flags } = req.body;
    if (!attempt_id) {
      return res.status(400).json({ error: 'Missing attempt_id' });
    }

    const attempt = db.prepare('SELECT status FROM attempts WHERE id = ?').get(attempt_id);
    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }
    if (attempt.status === 'submitted') {
      return res.json({ success: true, message: 'Attempt already submitted' });
    }

    db.prepare(`
      UPDATE attempts 
      SET answers_json = ?, review_flags_json = ? 
      WHERE id = ?
    `).run(
      JSON.stringify(answers || {}),
      JSON.stringify(review_flags || []),
      attempt_id
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attempts/submit - Grade and finalize attempt
app.post('/api/attempts/submit', (req, res) => {
  try {
    const { attempt_id, answers } = req.body;
    if (!attempt_id) {
      return res.status(400).json({ error: 'Missing attempt_id' });
    }

    const attempt = db.prepare('SELECT * FROM attempts WHERE id = ?').get(attempt_id);
    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    // Prevent duplicate submission re-calculation if already submitted
    if (attempt.status === 'submitted') {
      return res.json({
        success: true,
        already_submitted: true,
        result: formatAttemptResult(attempt)
      });
    }

    const userAnswers = answers || JSON.parse(attempt.answers_json || '{}');
    const order = JSON.parse(attempt.randomized_question_order || '[]');

    // Fetch questions with answer key
    const allQuestions = db.prepare('SELECT * FROM questions').all();
    const qMap = new Map();
    allQuestions.forEach(q => qMap.set(q.original_id, q));

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    const reviewList = [];

    for (let i = 0; i < order.length; i++) {
      const qId = order[i];
      const q = qMap.get(qId);
      if (!q) continue;

      const selected = userAnswers[qId] ? userAnswers[qId].toUpperCase() : null;
      let status = 'unanswered';
      if (selected) {
        if (selected === q.correct_option.toUpperCase()) {
          correctCount++;
          status = 'correct';
        } else {
          incorrectCount++;
          status = 'incorrect';
        }
      } else {
        unansweredCount++;
      }

      reviewList.push({
        displayNumber: i + 1,
        id: q.original_id,
        qNum: q.q_num,
        question: q.question_text,
        options: {
          A: q.option_a,
          B: q.option_b,
          C: q.option_c,
          D: q.option_d,
        },
        selectedOption: selected,
        correctOption: q.correct_option,
        answerText: q.answer_text,
        status
      });
    }

    const totalQuestions = order.length;
    const score = correctCount; // 1 mark per correct, 0 for incorrect/unanswered
    const percentage = Number(((score / totalQuestions) * 100).toFixed(2));
    const now = new Date();
    const submittedAt = now.toISOString();

    const startTime = new Date(attempt.start_time);
    const durationSeconds = Math.min(7200, Math.max(1, Math.round((now.getTime() - startTime.getTime()) / 1000)));

    db.prepare(`
      UPDATE attempts SET
        answers_json = ?,
        submitted_at = ?,
        duration_seconds = ?,
        score = ?,
        percentage = ?,
        correct_count = ?,
        incorrect_count = ?,
        unanswered_count = ?,
        status = 'submitted'
      WHERE id = ?
    `).run(
      JSON.stringify(userAnswers),
      submittedAt,
      durationSeconds,
      score,
      percentage,
      correctCount,
      incorrectCount,
      unansweredCount,
      attempt_id
    );

    const updated = db.prepare('SELECT * FROM attempts WHERE id = ?').get(attempt_id);

    res.json({
      success: true,
      result: {
        id: updated.id,
        attemptNumber: updated.attempt_number,
        rollNumber: updated.roll_number,
        fullName: updated.full_name,
        startTime: updated.start_time,
        submittedAt: updated.submitted_at,
        durationSeconds: updated.duration_seconds,
        score: updated.score,
        percentage: updated.percentage,
        totalQuestions,
        correctCount: updated.correct_count,
        incorrectCount: updated.incorrect_count,
        unansweredCount: updated.unanswered_count,
        reviewList
      }
    });
  } catch (err) {
    console.error('Error submitting attempt:', err);
    res.status(500).json({ error: 'Failed to submit attempt: ' + err.message });
  }
});

// Helper to format full review for already submitted attempts
function formatAttemptResult(attempt) {
  const userAnswers = JSON.parse(attempt.answers_json || '{}');
  const order = JSON.parse(attempt.randomized_question_order || '[]');
  const allQuestions = db.prepare('SELECT * FROM questions').all();
  const qMap = new Map();
  allQuestions.forEach(q => qMap.set(q.original_id, q));

  const reviewList = order.map((qId, idx) => {
    const q = qMap.get(qId);
    if (!q) return null;
    const selected = userAnswers[qId] || null;
    let status = 'unanswered';
    if (selected) {
      status = selected.toUpperCase() === q.correct_option.toUpperCase() ? 'correct' : 'incorrect';
    }
    return {
      displayNumber: idx + 1,
      id: q.original_id,
      qNum: q.q_num,
      question: q.question_text,
      options: {
        A: q.option_a,
        B: q.option_b,
        C: q.option_c,
        D: q.option_d,
      },
      selectedOption: selected,
      correctOption: q.correct_option,
      answerText: q.answer_text,
      status
    };
  }).filter(Boolean);

  return {
    id: attempt.id,
    attemptNumber: attempt.attempt_number,
    rollNumber: attempt.roll_number,
    fullName: attempt.full_name,
    startTime: attempt.start_time,
    submittedAt: attempt.submitted_at,
    durationSeconds: attempt.duration_seconds,
    score: attempt.score,
    percentage: attempt.percentage,
    totalQuestions: order.length,
    correctCount: attempt.correct_count,
    incorrectCount: attempt.incorrect_count,
    unansweredCount: attempt.unanswered_count,
    reviewList
  };
}

// GET /api/attempts/:id - View specific attempt details with review
app.get('/api/attempts/:id', (req, res) => {
  try {
    const attempt = db.prepare('SELECT * FROM attempts WHERE id = ?').get(req.params.id);
    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }
    if (attempt.status !== 'submitted') {
      return res.status(403).json({ error: 'Attempt is still in progress' });
    }
    res.json({ success: true, result: formatAttemptResult(attempt) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/history - Get all attempts or by roll number
app.get('/api/history', (req, res) => {
  try {
    const { roll } = req.query;
    let query = `
      SELECT id, roll_number, full_name, attempt_number, start_time, submitted_at,
             duration_seconds, score, percentage, correct_count, incorrect_count, unanswered_count, status
      FROM attempts
      WHERE status = 'submitted'
    `;
    const params = [];
    if (roll) {
      query += ` AND roll_number = ?`;
      params.push(roll.trim().toUpperCase());
    }
    query += ` ORDER BY submitted_at DESC`;

    const rows = db.prepare(query).all(...params);
    res.json({ success: true, history: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static frontend in production if dist exists
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
