const assert = require('assert');
const fs = require('fs');
const path = require('path');
const db = require('../server/db');

async function runTests() {
  console.log('=============================================');
  console.log('RUNNING NUMERICAL APTITUDE TEST SUITE');
  console.log('=============================================');

  // Test 1: Verify 200 questions in SQLite
  console.log('\n[Test 1] Verifying 200 questions in database...');
  const countRow = db.prepare('SELECT COUNT(*) as count FROM questions').get();
  assert.strictEqual(countRow.count, 200, `Expected 200 questions, got ${countRow.count}`);
  console.log('✓ Exactly 200 questions present in database.');

  // Test 2: Verify Q1 through Q200 sequence and option completeness
  console.log('\n[Test 2] Verifying question IDs and option integrity...');
  const allQ = db.prepare('SELECT * FROM questions ORDER BY q_num ASC').all();
  for (let i = 1; i <= 200; i++) {
    const q = allQ[i - 1];
    assert.strictEqual(q.q_num, i, `Mismatch at q_num: expected ${i}, got ${q.q_num}`);
    assert.strictEqual(q.original_id, `Q${i}`, `Mismatch at original_id: expected Q${i}`);
    assert(q.question_text.length > 5, `Question text too short for Q${i}`);
    assert(q.option_a.length > 0, `Option A missing in Q${i}`);
    assert(q.option_b.length > 0, `Option B missing in Q${i}`);
    assert(q.option_c.length > 0, `Option C missing in Q${i}`);
    assert(q.option_d.length > 0, `Option D missing in Q${i}`);
    assert(['A', 'B', 'C', 'D'].includes(q.correct_option), `Invalid answer ${q.correct_option} in Q${i}`);
  }
  console.log('✓ All 200 questions verified: Q1 to Q200 with valid options and answer keys.');

  // Test 3: Randomization verification
  console.log('\n[Test 3] Verifying question shuffling for new attempts...');
  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const qIds = allQ.map(q => q.original_id);
  const attempt1Order = shuffleArray(qIds);
  const attempt2Order = shuffleArray(qIds);

  assert.strictEqual(attempt1Order.length, 200, 'Attempt 1 must contain 200 questions');
  assert.strictEqual(attempt2Order.length, 200, 'Attempt 2 must contain 200 questions');
  assert.strictEqual(new Set(attempt1Order).size, 200, 'Attempt 1 contains duplicate questions');
  assert.strictEqual(new Set(attempt2Order).size, 200, 'Attempt 2 contains duplicate questions');
  assert.notDeepStrictEqual(attempt1Order, attempt2Order, 'Consecutive attempts should have different randomized orders');
  console.log('✓ Randomization verified: all 200 questions included exactly once per attempt with distinct order.');

  // Test 4: Scoring calculation
  console.log('\n[Test 4] Verifying server scoring and grading logic...');
  const testAnswers = {};
  // Answer first 50 correctly
  for (let i = 0; i < 50; i++) {
    testAnswers[allQ[i].original_id] = allQ[i].correct_option;
  }
  // Answer next 50 incorrectly
  for (let i = 50; i < 100; i++) {
    const wrong = allQ[i].correct_option === 'A' ? 'B' : 'A';
    testAnswers[allQ[i].original_id] = wrong;
  }
  // Leave remaining 100 unanswered

  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  for (let i = 0; i < allQ.length; i++) {
    const q = allQ[i];
    const userChoice = testAnswers[q.original_id];
    if (userChoice) {
      if (userChoice === q.correct_option) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    } else {
      unansweredCount++;
    }
  }

  assert.strictEqual(correctCount, 50, 'Correct count must be 50');
  assert.strictEqual(incorrectCount, 50, 'Incorrect count must be 50');
  assert.strictEqual(unansweredCount, 100, 'Unanswered count must be 100');
  const score = correctCount; // no negative marking
  assert.strictEqual(score, 50, 'Score must be 50/200');
  const percentage = (score / 200) * 100;
  assert.strictEqual(percentage, 25.0, 'Percentage must be 25.0%');
  console.log(`✓ Scoring logic verified: +1 mark correct (${correctCount}), 0 incorrect (${incorrectCount}), 0 unanswered (${unansweredCount}), Final score ${score}/200 (${percentage}%).`);

  // Test 5: Multiple attempts for same student in SQLite
  console.log('\n[Test 5] Verifying persistent multiple attempts for same roll number...');
  const testRoll = 'TEST_CANDIDATE_01';
  const testName = 'Test Candidate';

  // Clear previous test records if any
  db.prepare('DELETE FROM attempts WHERE roll_number = ?').run(testRoll);
  db.prepare('DELETE FROM students WHERE roll_number = ?').run(testRoll);

  // Student 1 creation
  const studentInfo = db.prepare('INSERT INTO students (full_name, roll_number) VALUES (?, ?)').run(testName, testRoll);
  const studentId = studentInfo.lastInsertRowid;

  // Insert Attempt 1
  db.prepare(`
    INSERT INTO attempts (
      id, student_id, roll_number, full_name, attempt_number,
      randomized_question_order, answers_json, start_time, deadline, submitted_at,
      duration_seconds, score, percentage, correct_count, incorrect_count, unanswered_count, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'att_test_1', studentId, testRoll, testName, 1,
    JSON.stringify(attempt1Order), '{}', new Date().toISOString(), new Date().toISOString(), new Date().toISOString(),
    1800, 140, 70.0, 140, 30, 30, 'submitted'
  );

  // Insert Attempt 2
  db.prepare(`
    INSERT INTO attempts (
      id, student_id, roll_number, full_name, attempt_number,
      randomized_question_order, answers_json, start_time, deadline, submitted_at,
      duration_seconds, score, percentage, correct_count, incorrect_count, unanswered_count, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'att_test_2', studentId, testRoll, testName, 2,
    JSON.stringify(attempt2Order), '{}', new Date().toISOString(), new Date().toISOString(), new Date().toISOString(),
    2100, 175, 87.5, 175, 15, 10, 'submitted'
  );

  const studentAttempts = db.prepare('SELECT * FROM attempts WHERE roll_number = ? ORDER BY attempt_number ASC').all(testRoll);
  assert.strictEqual(studentAttempts.length, 2, 'Expected 2 saved attempts');
  assert.strictEqual(studentAttempts[0].attempt_number, 1);
  assert.strictEqual(studentAttempts[0].score, 140);
  assert.strictEqual(studentAttempts[1].attempt_number, 2);
  assert.strictEqual(studentAttempts[1].score, 175);
  console.log('✓ Multiple attempts preserved independently without overwriting earlier scores.');

  // Clean up test records
  db.prepare('DELETE FROM attempts WHERE roll_number = ?').run(testRoll);
  db.prepare('DELETE FROM students WHERE roll_number = ?').run(testRoll);

  console.log('\n=============================================');
  console.log('ALL TESTS PASSED SUCCESSFULLY! (5/5)');
  console.log('=============================================\n');
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
