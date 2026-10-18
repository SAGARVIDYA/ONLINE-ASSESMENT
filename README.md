# NUMERICAL APTITUDE — Online Assessment Portal

A comprehensive, fully functional Computer-Based Test (CBT) web application built with **React 18**, **Tailwind CSS**, **Node.js/Express**, and **SQLite**.

The application accurately imports all **200 original Numerical Aptitude questions (Q1–Q200)** from `Numerical_Aptitude_Corrected_v2.pdf`, preserving exact question text, options A–D, mathematical expressions, powers, fractions, and the official answer key for server-side evaluation.

---

## 🌟 Key Features

1. **Student Registration & Confirmation**:
   - Clean, exam-focused landing page with test specs: **200 Questions**, **90 Minutes Duration**, **200 Max Marks**, **Negative Marking: No**.
   - Student Name and Roll Number inputs with validation.
   - Pre-exam confirmation modal to verify candidate details.

2. **Accurate Question Dataset**:
   - All 200 questions extracted directly from the official PDF.
   - Exact mathematical symbols (`^`, fractions `/`, units `km/h`, `m/s`, etc.) preserved.
   - Answer key securely evaluated server-side.

3. **Dynamic Shuffling**:
   - Every attempt randomizes the order of all 200 questions using the Fisher-Yates algorithm.
   - Shuffled sequence is locked to the attempt and preserved across navigation and page refreshes.

4. **Interactive Exam Interface**:
   - **Header**: Live countdown timer in `HH:MM:SS` format (90 minutes / 1 hr 30 mins), candidate info, and answered progress indicator.
   - **Question Workspace**: Displays one question at a time with 4 selectable radio options (A, B, C, D).
   - **Controls**: Previous, Next, Clear Response, Mark for Review (with purple bookmark badge).
   - **Question Palette**: 200-question responsive grid with real-time status indicators:
     - 🟩 **Green**: Answered
     - 🟪 **Purple**: Marked for Review
     - 🟥 **Red**: Visited but Unanswered
     - ⬜ **Grey**: Not Visited
   - **Palette Filters**: View All, Answered, Unanswered, or Marked questions.
   - Instant jump to any question by clicking its palette number.

5. **Server-Validated Timer & Auto-Submit**:
   - 90-minute countdown with low-time warning banner (< 5 minutes).
   - Automatically submits when the timer reaches zero.
   - Confirmation modal on manual submission showing answered, unanswered, and marked counts.

6. **Scoring & Solution Review**:
   - Server-side grading: +1 mark for correct answers, 0 for incorrect or unanswered questions. Maximum score: 200.
   - **Results Dashboard**: Total score out of 200, percentage, performance evaluation tier, and duration taken.
   - **Question Review**: Complete post-exam review showing the original question, selected option, official answer key, and correct/incorrect status.

7. **Persistent Attempt History**:
   - Unlimited retakes for any roll number.
   - Persistent storage in both browser `localStorage` and SQLite database (`data/exam.db`).
   - History page with search and filtering by Roll Number or Name.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ or v22+)
- npm

### Installation
Dependencies are already installed in this directory. If setting up on a fresh machine:
```bash
npm install
```

### Running the Application

1. **Start the Production Server** (serves both API and frontend on port 5000):
   ```bash
   npm start
   ```
   Open your browser at:
   **`http://localhost:5000/`**

2. **Development Mode** (Vite dev server with hot reload):
   ```bash
   # Terminal 1: Backend API
   npm run server

   # Terminal 2: Frontend Vite
   npm run dev
   ```
   Open your browser at:
   **`http://localhost:3000/`**

### Running the Test Suite
To run the automated verification suite:
```bash
npm test
```
The test suite validates:
- Exactly 200 questions stored in SQLite.
- Integrity of all Q1–Q200 questions, options, and answer keys.
- Shuffling randomness and question uniqueness.
- Server grading logic and scoring (+1 / 0).
- Multiple attempt tracking and score persistence.

---

## 📂 Project Structure

```
├── data/
│   └── exam.db                  # Persistent SQLite database (WAL mode)
├── dist/                        # Production frontend build
├── server/
│   ├── db.js                    # SQLite schema and question seeder
│   └── index.js                 # Express server & REST API
├── src/
│   ├── components/
│   │   ├── ExamInterface.jsx    # Real-time CBT interface & palette
│   │   ├── HistoryPage.jsx      # Previous attempts and score review
│   │   ├── LandingPage.jsx      # Candidate details & exam guidelines
│   │   └── ResultsPage.jsx      # Score dashboard & answer key review
│   ├── data/
│   │   └── questions.json       # All 200 parsed questions
│   ├── utils/
│   │   └── storage.js           # LocalStorage and time format utilities
│   ├── App.jsx                  # Main application controller
│   ├── index.css                # Tailwind CSS v4 styles
│   └── main.jsx                 # React root mount
├── test/
│   └── suite.js                 # Automated end-to-end test suite
├── package.json
└── vite.config.mjs
```

---

## 🔒 Scoring & Grading Rules

| Metric | Rule |
| :--- | :--- |
| **Correct Answer** | +1 mark |
| **Incorrect Answer** | 0 marks |
| **Unanswered** | 0 marks |
| **Negative Marking** | None |
| **Total Marks** | 200 marks |
| **Duration** | 90 minutes (5400 seconds) |
