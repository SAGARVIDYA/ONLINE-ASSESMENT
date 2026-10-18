const fs = require('fs');
const pdf = require('pdf-parse');

async function extract(filename, outname) {
  const dataBuffer = fs.readFileSync(filename);
  const data = await pdf(dataBuffer);
  console.log(`=== ${filename} ===`);
  console.log('Pages:', data.numpages);
  console.log('Text length:', data.text.length);
  fs.writeFileSync(outname, data.text);
  console.log(`Saved to ${outname}`);
}

async function run() {
  if (fs.existsSync('Numerical_Aptitude_Corrected_v2.pdf')) {
    await extract('Numerical_Aptitude_Corrected_v2.pdf', 'extracted_v2.txt');
  }
  if (fs.existsSync('Numerical_Aptitude_with_Answers.pdf')) {
    await extract('Numerical_Aptitude_with_Answers.pdf', 'extracted_with_answers.txt');
  }
  if (fs.existsSync('Numerical_Aptitude_Corrected.pdf')) {
    await extract('Numerical_Aptitude_Corrected.pdf', 'extracted_corrected.txt');
  }
}

run().catch(console.error);
