import React, { useState } from 'react';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  HelpCircle, 
  RotateCcw, 
  History, 
  Home, 
  Filter,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  User,
  Hash,
  Calendar
} from 'lucide-react';
import { formatTime, formatDate } from '../utils/storage';

export default function ResultsPage({ result, onRetake, onViewHistory, onReturnHome }) {
  const [reviewFilter, setReviewFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const {
    fullName,
    rollNumber,
    attemptNumber = 1,
    score = 0,
    percentage = 0,
    totalQuestions = 200,
    correctCount = 0,
    incorrectCount = 0,
    unansweredCount = 0,
    durationSeconds = 0,
    submittedAt,
    reviewList = []
  } = result;

  const filteredReview = reviewList.filter(item => {
    if (reviewFilter === 'correct') return item.status === 'correct';
    if (reviewFilter === 'incorrect') return item.status === 'incorrect';
    if (reviewFilter === 'unanswered') return item.status === 'unanswered';
    return true;
  });

  // Performance tier
  let tier = 'Needs Practice';
  let tierColor = 'text-amber-500 bg-amber-50 border-amber-200';
  if (percentage >= 80) {
    tier = 'Outstanding Performance';
    tierColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  } else if (percentage >= 60) {
    tier = 'Good Proficiency';
    tierColor = 'text-indigo-700 bg-indigo-50 border-indigo-200';
  } else if (percentage >= 40) {
    tier = 'Moderate Score';
    tierColor = 'text-sky-700 bg-sky-50 border-sky-200';
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Top Header */}
      <header className="bg-slate-900 text-white shadow sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-base">
              NA
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">
                NUMERICAL APTITUDE
              </h1>
              <p className="text-xs text-indigo-300">Assessment Report & Solution Key</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onViewHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>History</span>
            </button>
            <button
              onClick={onReturnHome}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Home</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Score Dashboard */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Score Hero Banner */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border capitalize">
                <span className={`px-2.5 py-0.5 rounded-full border ${tierColor}`}>
                  {tier}
                </span>
                <span className="text-slate-500">Attempt #{attemptNumber}</span>
              </div>

              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Exam Completed Successfully
              </h2>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Candidate: <strong className="text-slate-800 font-semibold">{fullName}</strong>
                </span>
                <span className="flex items-center gap-1.5 font-mono">
                  <Hash className="w-3.5 h-3.5 text-indigo-500" />
                  Roll: <strong className="text-indigo-600 font-semibold">{rollNumber}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatDate(submittedAt)}
                </span>
              </div>
            </div>

            {/* Score Pill Card */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 text-center shadow-lg min-w-[240px]">
              <span className="text-xs uppercase tracking-wider text-indigo-300 font-bold block mb-1">
                Total Score
              </span>
              <div className="text-4xl md:text-5xl font-black tracking-tight text-white">
                {score} <span className="text-xl font-normal text-indigo-300">/ {totalQuestions}</span>
              </div>
              <div className="mt-2 inline-block px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-xs font-bold text-indigo-200">
                {percentage}% Accuracy
              </div>
            </div>
          </div>

          {/* Stat Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-slate-100">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-1" />
              <span className="text-2xl font-bold text-emerald-700">{correctCount}</span>
              <span className="text-xs text-emerald-800 font-medium">Correct (+{correctCount})</span>
            </div>

            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <XCircle className="w-5 h-5 text-rose-600 mb-1" />
              <span className="text-2xl font-bold text-rose-700">{incorrectCount}</span>
              <span className="text-xs text-rose-800 font-medium">Incorrect (0)</span>
            </div>

            <div className="bg-slate-100/80 border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <HelpCircle className="w-5 h-5 text-slate-500 mb-1" />
              <span className="text-2xl font-bold text-slate-700">{unansweredCount}</span>
              <span className="text-xs text-slate-600 font-medium">Unanswered</span>
            </div>

            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <Clock className="w-5 h-5 text-indigo-600 mb-1" />
              <span className="text-xl font-bold text-indigo-700">{formatTime(durationSeconds)}</span>
              <span className="text-xs text-indigo-800 font-medium">Time Taken</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 mt-6">
            <button
              onClick={onRetake}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Assessment</span>
            </button>
            <button
              onClick={onViewHistory}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-300 shadow-xs transition cursor-pointer"
            >
              <History className="w-4 h-4 text-slate-500" />
              <span>Attempt History</span>
            </button>
          </div>
        </div>

        {/* Detailed Solutions & Answer Key Section */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>Detailed Question Review</span>
                <span className="text-xs font-normal text-slate-500">
                  ({filteredReview.length} questions displayed)
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Compare your selected options with the official answer key extracted from the original exam paper.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-medium text-slate-600">
              <button
                onClick={() => setReviewFilter('all')}
                className={`py-1.5 px-3 rounded-lg transition cursor-pointer ${
                  reviewFilter === 'all' ? 'bg-white text-indigo-600 font-bold shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                All ({reviewList.length})
              </button>
              <button
                onClick={() => setReviewFilter('correct')}
                className={`py-1.5 px-3 rounded-lg transition cursor-pointer ${
                  reviewFilter === 'correct' ? 'bg-white text-emerald-600 font-bold shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Correct ({correctCount})
              </button>
              <button
                onClick={() => setReviewFilter('incorrect')}
                className={`py-1.5 px-3 rounded-lg transition cursor-pointer ${
                  reviewFilter === 'incorrect' ? 'bg-white text-rose-600 font-bold shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Incorrect ({incorrectCount})
              </button>
              <button
                onClick={() => setReviewFilter('unanswered')}
                className={`py-1.5 px-3 rounded-lg transition cursor-pointer ${
                  reviewFilter === 'unanswered' ? 'bg-white text-slate-700 font-bold shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Unanswered ({unansweredCount})
              </button>
            </div>
          </div>

          {/* Questions Review List */}
          <div className="space-y-4">
            {filteredReview.map((item, idx) => {
              const isCorrect = item.status === 'correct';
              const isIncorrect = item.status === 'incorrect';
              const isUnanswered = item.status === 'unanswered';

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border transition ${
                    isCorrect
                      ? 'bg-emerald-50/20 border-emerald-200'
                      : isIncorrect
                      ? 'bg-rose-50/20 border-rose-200'
                      : 'bg-slate-50/40 border-slate-200'
                  }`}
                >
                  {/* Item Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800">
                        Question #{item.displayNumber}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200/80 text-slate-600">
                        {item.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCorrect && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Check className="w-3 h-3" /> Correct (+1)
                        </span>
                      )}
                      {isIncorrect && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                          <X className="w-3 h-3" /> Incorrect (0)
                        </span>
                      )}
                      {isUnanswered && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
                          Not Answered
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className="text-sm md:text-base font-medium text-slate-900 mb-4 leading-relaxed">
                    {item.question}
                  </p>

                  {/* Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                    {['A', 'B', 'C', 'D'].map(optKey => {
                      const optText = item.options[optKey];
                      const isSelected = item.selectedOption === optKey;
                      const isActualCorrect = item.correctOption === optKey;

                      let style = 'bg-white border-slate-200 text-slate-700';
                      if (isActualCorrect) {
                        style = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold ring-1 ring-emerald-500';
                      } else if (isSelected && !isActualCorrect) {
                        style = 'bg-rose-50 border-rose-400 text-rose-950 line-through';
                      }

                      return (
                        <div
                          key={optKey}
                          className={`flex items-start gap-3 p-3 rounded-xl border text-xs md:text-sm ${style}`}
                        >
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                            isActualCorrect
                              ? 'bg-emerald-600 text-white'
                              : isSelected
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {optKey}
                          </span>
                          <span className="flex-1 leading-normal pt-0.5">{optText}</span>
                          {isActualCorrect && (
                            <span className="text-[11px] font-bold text-emerald-700 shrink-0">Correct</span>
                          )}
                          {isSelected && !isActualCorrect && (
                            <span className="text-[11px] font-bold text-rose-600 shrink-0">Your Choice</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Answer Key Explanation Box */}
                  <div className="bg-slate-100 rounded-xl p-3 text-xs flex flex-wrap items-center justify-between gap-2 border border-slate-200">
                    <span className="text-slate-600">
                      Official Key: <strong className="text-emerald-700 font-bold text-sm">Option {item.correctOption}</strong>
                      {item.answerText ? ` — ${item.answerText}` : ''}
                    </span>
                    <span className="text-slate-500">
                      Your response: <strong className={isCorrect ? 'text-emerald-700' : isIncorrect ? 'text-rose-600' : 'text-slate-600'}>
                        {item.selectedOption ? `Option ${item.selectedOption}` : 'None'}
                      </strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
