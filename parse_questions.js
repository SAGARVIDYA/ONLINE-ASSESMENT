const fs = require('fs');

const rawText = fs.readFileSync('extracted_v2.txt', 'utf8');

// The lines may contain page headers like:
// "Numerical Aptitude · answer shown below each questionPage X"
// or "NUMERICAL APTITUDE\nOriginal question wording and options preserved from the Excel file; answer key shown below each question."

// Clean out page header lines
const lines = rawText.split(/\r?\n/).filter(line => {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (/^Numerical Aptitude · answer shown below each questionPage \d+$/i.test(trimmed)) return false;
  if (/^NUMERICAL APTITUDE$/i.test(trimmed)) return false;
  if (/^Original question wording and options preserved from the Excel file/i.test(trimmed)) return false;
  return true;
});

const cleanedText = lines.join('\n');

// Questions start with Q1., Q2., etc. up to Q200.
// Let's split by Q\d+\.
const qRegex = /Q(\d+)\.\s*/g;
let match;
const qIndices = [];

while ((match = qRegex.exec(cleanedText)) !== null) {
  qIndices.push({
    qNum: parseInt(match[1], 10),
    index: match.index,
    matchLen: match[0].length
  });
}

console.log(`Found ${qIndices.length} question markers.`);

const questions = [];

for (let i = 0; i < qIndices.length; i++) {
  const current = qIndices[i];
  const next = qIndices[i + 1];
  const qNum = current.qNum;
  const chunk = cleanedText.slice(current.index + current.matchLen, next ? next.index : undefined).trim();

  // Each chunk should contain Question text, A., B., C., D., and Answer:
  // Let's use regex to extract question text, options A, B, C, D, and Answer.
  const aIdx = chunk.search(/\nA\.\s+/);
  const bIdx = chunk.search(/\nB\.\s+/);
  const cIdx = chunk.search(/\nC\.\s+/);
  const dIdx = chunk.search(/\nD\.\s+/);
  const ansIdx = chunk.search(/\nAnswer:\s+/i);

  if (aIdx === -1 || bIdx === -1 || cIdx === -1 || dIdx === -1 || ansIdx === -1) {
    console.error(`Error parsing Q${qNum}: missing one of A, B, C, D, or Answer.`);
    console.error(chunk);
    continue;
  }

  const questionText = chunk.slice(0, aIdx).trim().replace(/\r?\n\s*/g, ' ');
  const optA = chunk.slice(aIdx + 4, bIdx).trim().replace(/\r?\n\s*/g, ' ');
  const optB = chunk.slice(bIdx + 4, cIdx).trim().replace(/\r?\n\s*/g, ' ');
  const optC = chunk.slice(cIdx + 4, dIdx).trim().replace(/\r?\n\s*/g, ' ');
  const optD = chunk.slice(dIdx + 4, ansIdx).trim().replace(/\r?\n\s*/g, ' ');
  
  const ansLine = chunk.slice(ansIdx).trim();
  const ansMatch = ansLine.match(/Answer:\s*([A-D])(?:\s*—\s*(.*))?/i);
  if (!ansMatch) {
    console.error(`Error extracting answer for Q${qNum}: ${ansLine}`);
    continue;
  }
  const correctOption = ansMatch[1].toUpperCase();
  const explanationOrText = ansMatch[2] ? ansMatch[2].trim() : '';

  questions.push({
    id: `Q${qNum}`,
    qNum,
    question: questionText,
    options: {
      A: optA,
      B: optB,
      C: optC,
      D: optD
    },
    correctAnswer: correctOption,
    answerText: explanationOrText
  });
}

console.log(`Parsed ${questions.length} questions successfully.`);

// Validate sequence
let missing = [];
for (let i = 1; i <= 200; i++) {
  if (!questions.find(q => q.qNum === i)) {
    missing.push(i);
  }
}
if (missing.length > 0) {
  console.log(`Missing question numbers: ${missing.join(', ')}`);
} else {
  console.log(`All 200 questions present (Q1 to Q200) without any missing!`);
}

// Check sample questions
console.log('Sample Q1:', JSON.stringify(questions[0], null, 2));
console.log('Sample Q200:', JSON.stringify(questions[199], null, 2));

// Save questions to JSON
fs.writeFileSync('questions.json', JSON.stringify(questions, null, 2));
console.log('Saved all questions to questions.json');
