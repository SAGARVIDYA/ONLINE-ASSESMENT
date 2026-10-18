const fs = require('fs');

const questions = JSON.parse(fs.readFileSync('questions.json', 'utf8'));

console.log('Total questions:', questions.length);

const answerCounts = { A: 0, B: 0, C: 0, D: 0, other: 0 };
let errors = 0;

questions.forEach((q, idx) => {
  if (!q.question || q.question.length < 5) {
    console.error(`Short question at index ${idx}:`, q);
    errors++;
  }
  ['A', 'B', 'C', 'D'].forEach(opt => {
    if (!q.options[opt] || q.options[opt].length === 0) {
      console.error(`Missing option ${opt} in Q${q.qNum}`);
      errors++;
    }
  });
  if (['A', 'B', 'C', 'D'].includes(q.correctAnswer)) {
    answerCounts[q.correctAnswer]++;
  } else {
    answerCounts.other++;
    console.error(`Invalid answer ${q.correctAnswer} in Q${q.qNum}`);
    errors++;
  }
});

console.log('Answer distribution:', answerCounts);
console.log('Validation errors:', errors);

// Inspect any questions with fractions or powers
const sampleMath = questions.filter(q => q.question.includes('^') || q.question.includes('/'));
console.log(`Found ${sampleMath.length} questions with ^ or / symbols.`);
console.log('Example with power:', sampleMath.find(q => q.question.includes('^')));
console.log('Example with fraction:', sampleMath.find(q => q.question.includes('/')));
