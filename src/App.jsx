import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import ExamInterface from './components/ExamInterface';
import ResultsPage from './components/ResultsPage';
import HistoryPage from './components/HistoryPage';
import localQuestions from './data/questions.json';
import { 
  getActiveAttempt, 
  saveActiveAttempt, 
  clearActiveAttempt, 
  saveAttemptToHistory, 
  getAttemptHistory 
} from './utils/storage';

function shuffleQuestions(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'exam' | 'result' | 'history'
  const [activeAttempt, setActiveAttempt] = useState(null);
  const [currentResult, setCurrentResult] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [lastStudent, setLastStudent] = useState({ fullName: '', rollNumber: '' });

  // On mount: Load history and restore any active in-progress attempt
  useEffect(() => {
    // Load local history
    const storedHistory = getAttemptHistory();
    setHistoryList(storedHistory);

    // Try fetching remote history as well
    fetch('/api/history')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.history) {
          // Merge remote history with local
          const mergedMap = new Map();
          storedHistory.forEach(item => mergedMap.set(item.id, item));
          data.history.forEach(item => {
            const existing = mergedMap.get(item.id) || {};
            mergedMap.set(item.id, {
              ...existing,
              id: item.id,
              rollNumber: item.roll_number,
              fullName: item.full_name,
              attemptNumber: item.attempt_number,
              score: item.score,
              percentage: item.percentage,
              correctCount: item.correct_count,
              incorrectCount: item.incorrect_count,
              unansweredCount: item.unanswered_count,
              durationSeconds: item.duration_seconds,
              startTime: item.start_time,
              submittedAt: item.submitted_at
            });
          });
          const mergedList = Array.from(mergedMap.values()).sort(
            (a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0)
          );
          setHistoryList(mergedList);
        }
      })
      .catch(() => {
        // Fallback to local storage silently
      });

    // Check if there is an in-progress attempt to resume
    const inProgress = getActiveAttempt();
    if (inProgress && inProgress.questions && inProgress.deadline) {
      const now = Date.now();
      const deadlineMs = new Date(inProgress.deadline).getTime();
      if (deadlineMs > now) {
        setActiveAttempt(inProgress);
        setView('exam');
      } else {
        // Expired while offline/closed - auto submit
        handleAutoSubmit({ answers: inProgress.answers || {} }, inProgress);
      }
    }
  }, []);

  // Sync active attempt to localStorage & backend
  const handleAttemptSync = (syncData) => {
    if (!activeAttempt) return;
    const updated = {
      ...activeAttempt,
      answers: syncData.answers,
      reviewFlags: syncData.reviewFlags,
      visited: syncData.visited,
      lastIndex: syncData.lastIndex
    };
    setActiveAttempt(updated);
    saveActiveAttempt(updated);

    // Sync to backend if attempt ID exists
    if (activeAttempt.id && activeAttempt.id.startsWith('att_')) {
      fetch('/api/attempts/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: activeAttempt.id,
          answers: syncData.answers,
          review_flags: syncData.reviewFlags
        })
      }).catch(() => {});
    }
  };

  // Start new assessment
  const handleStartAssessment = async ({ fullName, rollNumber }) => {
    setLastStudent({ fullName, rollNumber });

    // Try backend API first
    try {
      const res = await fetch('/api/attempts/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, roll_number: rollNumber })
      });
      const data = await res.json();
      if (data.success && data.attempt) {
        const attemptData = {
          id: data.attempt.id,
          attemptNumber: data.attempt.attempt_number,
          fullName,
          rollNumber,
          startTime: data.attempt.start_time,
          deadline: data.attempt.deadline,
          durationSeconds: data.attempt.duration_seconds,
          totalQuestions: data.attempt.total_questions,
          questions: data.attempt.questions,
          answers: {},
          reviewFlags: [],
          visited: [data.attempt.questions[0]?.id]
        };
        setActiveAttempt(attemptData);
        saveActiveAttempt(attemptData);
        setView('exam');
        return;
      }
    } catch (err) {
      console.warn('Backend start endpoint unavailable, using local client mode:', err);
    }

    // Client-side fallback if server offline
    const previousAttempts = historyList.filter(
      h => h.rollNumber && h.rollNumber.toUpperCase() === rollNumber.toUpperCase()
    );
    const attemptNumber = previousAttempts.length + 1;

    // Shuffle questions
    const shuffled = shuffleQuestions(localQuestions);
    const durationSeconds = 120 * 60; // 120 minutes
    const startTime = new Date().toISOString();
    const deadline = new Date(Date.now() + durationSeconds * 1000).toISOString();
    const attemptId = 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

    const clientAttempt = {
      id: attemptId,
      attemptNumber,
      fullName,
      rollNumber,
      startTime,
      deadline,
      durationSeconds,
      totalQuestions: shuffled.length,
      questions: shuffled.map((q, idx) => ({
        displayNumber: idx + 1,
        id: q.id,
        originalId: q.id,
        qNum: q.qNum,
        question: q.question,
        options: q.options,
        // Answer kept separate for grading
        _correctAnswer: q.correctAnswer,
        _answerText: q.answerText
      })),
      answers: {},
      reviewFlags: [],
      visited: [shuffled[0]?.id]
    };

    setActiveAttempt(clientAttempt);
    saveActiveAttempt(clientAttempt);
    setView('exam');
  };

  // Grade attempt on submission
  const processSubmission = async ({ answers }, targetAttempt = activeAttempt) => {
    if (!targetAttempt) return;

    // Try backend submission if attempt was initiated with server
    if (targetAttempt.id && targetAttempt.id.startsWith('att_')) {
      try {
        const res = await fetch('/api/attempts/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attempt_id: targetAttempt.id,
            answers
          })
        });
        const data = await res.json();
        if (data.success && data.result) {
          clearActiveAttempt();
          setActiveAttempt(null);
          saveAttemptToHistory(data.result);
          setHistoryList(prev => [data.result, ...prev.filter(item => item.id !== data.result.id)]);
          setCurrentResult(data.result);
          setView('result');
          return;
        }
      } catch (err) {
        console.warn('Backend submit error, falling back to local grading:', err);
      }
    }

    // Client grading fallback
    const qList = targetAttempt.questions || [];
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const reviewList = qList.map((q, idx) => {
      // Find original question data
      const orig = localQuestions.find(item => item.id === q.id);
      const correctOpt = orig ? orig.correctAnswer : (q._correctAnswer || 'A');
      const ansTxt = orig ? orig.answerText : (q._answerText || '');

      const selected = answers[q.id] || null;
      let status = 'unanswered';
      if (selected) {
        if (selected.toUpperCase() === correctOpt.toUpperCase()) {
          correctCount++;
          status = 'correct';
        } else {
          incorrectCount++;
          status = 'incorrect';
        }
      } else {
        unansweredCount++;
      }

      return {
        displayNumber: idx + 1,
        id: q.id,
        qNum: q.qNum,
        question: q.question,
        options: q.options,
        selectedOption: selected,
        correctOption: correctOpt,
        answerText: ansTxt,
        status
      };
    });

    const score = correctCount; // +1 per correct, 0 for incorrect/unanswered
    const percentage = Number(((score / qList.length) * 100).toFixed(2));
    const now = new Date();
    const startTime = new Date(targetAttempt.startTime || now);
    const durationSeconds = Math.min(7200, Math.max(1, Math.round((now.getTime() - startTime.getTime()) / 1000)));

    const result = {
      id: targetAttempt.id,
      attemptNumber: targetAttempt.attemptNumber,
      fullName: targetAttempt.fullName,
      rollNumber: targetAttempt.rollNumber,
      startTime: targetAttempt.startTime,
      submittedAt: now.toISOString(),
      durationSeconds,
      score,
      percentage,
      totalQuestions: qList.length,
      correctCount,
      incorrectCount,
      unansweredCount,
      reviewList
    };

    clearActiveAttempt();
    setActiveAttempt(null);
    saveAttemptToHistory(result);
    setHistoryList(prev => [result, ...prev.filter(item => item.id !== result.id)]);
    setCurrentResult(result);
    setView('result');
  };

  const handleManualSubmit = async ({ answers }) => {
    await processSubmission({ answers });
  };

  const handleAutoSubmit = async ({ answers }, target = activeAttempt) => {
    await processSubmission({ answers }, target);
  };

  // Retake exam
  const handleRetake = () => {
    if (currentResult) {
      handleStartAssessment({
        fullName: currentResult.fullName,
        rollNumber: currentResult.rollNumber
      });
    } else {
      setView('landing');
    }
  };

  // Inspect past attempt from history
  const handleSelectHistoryAttempt = async (item) => {
    // If it has reviewList in item, use it directly
    if (item.reviewList && item.reviewList.length > 0) {
      setCurrentResult(item);
      setView('result');
      return;
    }

    // Try fetching from API
    if (item.id && item.id.startsWith('att_')) {
      try {
        const res = await fetch(`/api/attempts/${item.id}`);
        const data = await res.json();
        if (data.success && data.result) {
          setCurrentResult(data.result);
          setView('result');
          return;
        }
      } catch (err) {
        console.warn('Failed to fetch detailed review:', err);
      }
    }

    // Fallback: construct review list using localQuestions if answers_json exists
    setCurrentResult(item);
    setView('result');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {view === 'landing' && (
        <LandingPage
          onStartAssessment={handleStartAssessment}
          onViewHistory={() => setView('history')}
          defaultName={lastStudent.fullName}
          defaultRoll={lastStudent.rollNumber}
        />
      )}

      {view === 'exam' && activeAttempt && (
        <ExamInterface
          attempt={{
            ...activeAttempt,
            onSync: handleAttemptSync
          }}
          onAutoSubmit={handleAutoSubmit}
          onManualSubmit={handleManualSubmit}
        />
      )}

      {view === 'result' && currentResult && (
        <ResultsPage
          result={currentResult}
          onRetake={handleRetake}
          onViewHistory={() => setView('history')}
          onReturnHome={() => setView('landing')}
        />
      )}

      {view === 'history' && (
        <HistoryPage
          historyList={historyList}
          onSelectAttempt={handleSelectHistoryAttempt}
          onStartNew={() => setView('landing')}
          onReturnHome={() => setView('landing')}
        />
      )}
    </div>
  );
}
