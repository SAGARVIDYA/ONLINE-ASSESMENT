import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  Bookmark, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  AlertTriangle, 
  ListFilter,
  User,
  Hash,
  Eye
} from 'lucide-react';
import { formatTime } from '../utils/storage';

export default function ExamInterface({ attempt, onAutoSubmit, onManualSubmit }) {
  const { questions = [], deadline, fullName, rollNumber } = attempt;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(attempt.answers || {});
  const [reviewFlags, setReviewFlags] = useState(new Set(attempt.reviewFlags || []));
  const [visited, setVisited] = useState(new Set(attempt.visited || [questions[0]?.id].filter(Boolean)));
  const [paletteFilter, setPaletteFilter] = useState('all');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Timer calculation
  const deadlineMs = useRef(new Date(deadline).getTime());
  const [secondsRemaining, setSecondsRemaining] = useState(() => {
    const diff = Math.floor((deadlineMs.current - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  const currentQ = questions[currentIndex];

  // Mark current as visited on change
  useEffect(() => {
    if (currentQ?.id) {
      setVisited(prev => {
        if (!prev.has(currentQ.id)) {
          const next = new Set(prev);
          next.add(currentQ.id);
          return next;
        }
        return prev;
      });
    }
  }, [currentIndex, currentQ?.id]);

  // Autosave answers & state to parent attempt handler / storage
  useEffect(() => {
    if (attempt.onSync) {
      attempt.onSync({
        answers,
        reviewFlags: Array.from(reviewFlags),
        visited: Array.from(visited),
        lastIndex: currentIndex
      });
    }
  }, [answers, reviewFlags, visited, currentIndex]);

  // Countdown timer loop
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((deadlineMs.current - now) / 1000));
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        handleTimeExpired();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleTimeExpired = async () => {
    if (submitting) return;
    setSubmitting(true);
    await onAutoSubmit({ answers });
  };

  const handleOptionSelect = (optionKey) => {
    if (!currentQ) return;
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: optionKey
    }));
  };

  const handleClearResponse = () => {
    if (!currentQ) return;
    setAnswers(prev => {
      const updated = { ...prev };
      delete updated[currentQ.id];
      return updated;
    });
  };

  const handleToggleReview = () => {
    if (!currentQ) return;
    setReviewFlags(prev => {
      const next = new Set(prev);
      if (next.has(currentQ.id)) {
        next.delete(currentQ.id);
      } else {
        next.add(currentQ.id);
      }
      return next;
    });
  };

  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    try {
      await onManualSubmit({ answers });
    } finally {
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  // Stats calculation
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const markedCount = reviewFlags.size;
  const unansweredCount = totalQuestions - answeredCount;

  // Determine question status for palette
  const getQuestionStatus = (qId) => {
    const isAnswered = Boolean(answers[qId]);
    const isMarked = reviewFlags.has(qId);
    const isVisited = visited.has(qId);

    if (isMarked && isAnswered) return 'marked-answered';
    if (isMarked) return 'marked';
    if (isAnswered) return 'answered';
    if (isVisited) return 'unanswered';
    return 'not-visited';
  };

  // Filtered palette questions
  const filteredPaletteQuestions = questions.filter(q => {
    const st = getQuestionStatus(q.id);
    if (paletteFilter === 'answered') return st === 'answered' || st === 'marked-answered';
    if (paletteFilter === 'unanswered') return st === 'unanswered' || st === 'not-visited';
    if (paletteFilter === 'marked') return st === 'marked' || st === 'marked-answered';
    return true;
  });

  const isLowTime = secondsRemaining < 300; // < 5 mins

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* Sticky Exam Header */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Branding & Student Info */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-base shadow">
              NA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm md:text-base font-bold tracking-tight text-white">
                  NUMERICAL APTITUDE
                </h1>
                <span className="text-[10px] bg-indigo-900/80 border border-indigo-700/60 text-indigo-200 px-2 py-0.5 rounded-full font-medium">
                  CBT 200Q
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  {fullName}
                </span>
                <span className="flex items-center gap-1 font-mono text-indigo-300">
                  <Hash className="w-3 h-3 text-indigo-400" />
                  {rollNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Live Timer */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono font-bold text-sm md:text-base tracking-wider transition ${
              isLowTime
                ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-white'
            }`}>
              <Clock className={`w-4 h-4 ${isLowTime ? 'text-rose-400' : 'text-amber-400'}`} />
              <span>{formatTime(secondsRemaining)}</span>
            </div>
          </div>

          {/* Right: Progress & Submit Button */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end text-xs">
              <span className="text-slate-300 font-medium">
                Answered: <strong className="text-emerald-400">{answeredCount}</strong> / {totalQuestions}
              </span>
              <div className="w-28 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1 border border-slate-700">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs md:text-sm font-semibold shadow transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Exam</span>
            </button>
          </div>
        </div>
      </header>

      {/* Low time alert banner */}
      {isLowTime && (
        <div className="bg-rose-600 text-white text-xs py-1 px-4 text-center font-medium flex items-center justify-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
          Attention: Less than 5 minutes remaining. Your responses will be automatically submitted when time expires!
        </div>
      )}

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Question Area */}
        <section className="lg:col-span-8 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[580px] justify-between">
          {/* Question Header */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-800">
                Question {currentIndex + 1}
              </span>
              <span className="text-xs text-slate-400">
                of {totalQuestions}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200/80 text-slate-600 ml-1">
                {currentQ?.originalId || `Q${currentIndex + 1}`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleReview}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  reviewFlags.has(currentQ?.id)
                    ? 'bg-purple-50 border-purple-300 text-purple-700'
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${reviewFlags.has(currentQ?.id) ? 'fill-purple-600 text-purple-600' : ''}`} />
                <span>{reviewFlags.has(currentQ?.id) ? 'Marked for Review' : 'Mark for Review'}</span>
              </button>

              {answers[currentQ?.id] && (
                <button
                  onClick={handleClearResponse}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  title="Clear selected option"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear Response</span>
                </button>
              )}
            </div>
          </div>

          {/* Question Text & Options */}
          <div className="p-6 md:p-8 flex-1 space-y-6">
            <div className="text-base md:text-lg font-medium text-slate-900 leading-relaxed">
              {currentQ?.question}
            </div>

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {['A', 'B', 'C', 'D'].map(optKey => {
                const optText = currentQ?.options?.[optKey];
                const isSelected = answers[currentQ?.id] === optKey;

                return (
                  <label
                    key={optKey}
                    onClick={() => handleOptionSelect(optKey)}
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition select-none ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-600 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-300 text-slate-500 bg-slate-50'
                    }`}>
                      {optKey}
                    </div>
                    <div className="flex-1 text-sm md:text-base text-slate-800 pt-0.5 leading-normal">
                      {optText}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={goToPrev}
              disabled={currentIndex === 0}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border transition cursor-pointer ${
                currentIndex === 0
                  ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                  : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700 shadow-xs'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="text-xs text-slate-500 font-medium">
              {currentIndex + 1} of {totalQuestions}
            </div>

            {currentIndex < totalQuestions - 1 ? (
              <button
                onClick={goToNext}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow transition cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition cursor-pointer"
              >
                <span>Review & Submit</span>
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </section>

        {/* Right Column: Question Palette */}
        <section className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center justify-between">
              <span>Question Palette</span>
              <span className="text-xs font-normal text-slate-500">
                {answeredCount}/{totalQuestions} Answered
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any question number to jump directly to it.
            </p>
          </div>

          {/* Status Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-sm bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">✓</span>
              <span className="text-slate-600">Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-sm bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center">★</span>
              <span className="text-slate-600">Review ({markedCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-sm bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">!</span>
              <span className="text-slate-600">Unanswered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-sm bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">·</span>
              <span className="text-slate-600">Not Visited</span>
            </div>
          </div>

          {/* Palette Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
            {['all', 'answered', 'unanswered', 'marked'].map(flt => (
              <button
                key={flt}
                onClick={() => setPaletteFilter(flt)}
                className={`flex-1 py-1 px-2 rounded-md capitalize transition cursor-pointer ${
                  paletteFilter === flt
                    ? 'bg-white text-indigo-600 font-bold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                {flt}
              </button>
            ))}
          </div>

          {/* Question Grid (Scrollable) */}
          <div className="max-h-[380px] overflow-y-auto pr-1">
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-5 gap-2">
              {filteredPaletteQuestions.map((q) => {
                const qIdx = questions.findIndex(item => item.id === q.id);
                const isCurrent = qIdx === currentIndex;
                const status = getQuestionStatus(q.id);

                let bgClass = 'bg-slate-200 text-slate-700 hover:bg-slate-300';
                if (status === 'answered') {
                  bgClass = 'bg-emerald-600 text-white hover:bg-emerald-700';
                } else if (status === 'marked-answered') {
                  bgClass = 'bg-purple-600 text-white ring-2 ring-emerald-500 hover:bg-purple-700';
                } else if (status === 'marked') {
                  bgClass = 'bg-purple-600 text-white hover:bg-purple-700';
                } else if (status === 'unanswered') {
                  bgClass = 'bg-rose-500 text-white hover:bg-rose-600';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(qIdx)}
                    className={`h-9 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center relative cursor-pointer ${bgClass} ${
                      isCurrent ? 'ring-3 ring-indigo-500 ring-offset-2' : ''
                    }`}
                    title={`Question ${qIdx + 1} (${status})`}
                  >
                    {qIdx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Manual Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Submit Assessment</h3>
                <p className="text-xs text-slate-500">Review your completion status</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 py-3 bg-slate-50 rounded-xl border border-slate-200 mb-4 text-center">
              <div className="p-2">
                <span className="block text-xl font-bold text-emerald-600">{answeredCount}</span>
                <span className="text-[11px] text-slate-500">Answered</span>
              </div>
              <div className="p-2 border-x border-slate-200">
                <span className="block text-xl font-bold text-purple-600">{markedCount}</span>
                <span className="text-[11px] text-slate-500">Marked</span>
              </div>
              <div className="p-2">
                <span className="block text-xl font-bold text-rose-500">{unansweredCount}</span>
                <span className="text-[11px] text-slate-500">Unanswered</span>
              </div>
            </div>

            {unansweredCount > 0 ? (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs mb-5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  You still have <strong>{unansweredCount} unanswered questions</strong>. Are you sure you want to finalize and submit?
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-600 mb-5">
                You have answered all 200 questions! Click Confirm to grade your assessment.
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition cursor-pointer"
              >
                Return to Exam
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmSubmit}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
