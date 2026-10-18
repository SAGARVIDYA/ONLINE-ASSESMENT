import React, { useState } from 'react';
import { 
  History, 
  Search, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Award, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ExternalLink,
  RotateCcw,
  User,
  Hash
} from 'lucide-react';
import { formatTime, formatDate } from '../utils/storage';

export default function HistoryPage({ historyList = [], onSelectAttempt, onStartNew, onReturnHome }) {
  const [searchRoll, setSearchRoll] = useState('');

  const filtered = historyList.filter(item => {
    if (!searchRoll.trim()) return true;
    const term = searchRoll.trim().toUpperCase();
    return (
      (item.rollNumber && item.rollNumber.toUpperCase().includes(term)) ||
      (item.fullName && item.fullName.toUpperCase().includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Top Header */}
      <header className="bg-slate-900 text-white shadow sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onReturnHome}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="Return to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">
                Assessment History
              </h1>
              <p className="text-xs text-indigo-300">All Completed Numerical Aptitude Sessions</p>
            </div>
          </div>

          <button
            onClick={onStartNew}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Assessment</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchRoll}
              onChange={(e) => setSearchRoll(e.target.value)}
              placeholder="Search by Roll No or Name..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div className="text-xs text-slate-500">
            Showing <strong>{filtered.length}</strong> recorded attempt{filtered.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Attempts List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <History className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No Assessment Attempts Found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              {searchRoll ? 'No records match your search filter.' : 'You have not submitted any test attempts yet. Complete a test to see your performance history.'}
            </p>
            <div>
              <button
                onClick={onStartNew}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow transition cursor-pointer"
              >
                <span>Take Assessment Now</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item) => {
              const pct = item.percentage ?? (item.totalQuestions ? ((item.score / item.totalQuestions) * 100).toFixed(1) : 0);
              
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                          Attempt #{item.attemptNumber || 1}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(item.submittedAt || item.startTime)}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-slate-400" />
                        {item.fullName}
                      </h4>
                      <p className="text-xs font-mono text-indigo-600 font-semibold flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5" />
                        {item.rollNumber}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black text-slate-900">
                        {item.score} <span className="text-xs font-normal text-slate-500">/ 200</span>
                      </div>
                      <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {pct}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 py-2 px-3 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs">
                    <div>
                      <span className="block font-bold text-emerald-600">{item.correctCount ?? '-'}</span>
                      <span className="text-[10px] text-slate-500">Correct</span>
                    </div>
                    <div>
                      <span className="block font-bold text-rose-500">{item.incorrectCount ?? '-'}</span>
                      <span className="text-[10px] text-slate-500">Incorrect</span>
                    </div>
                    <div>
                      <span className="block font-bold text-slate-600">{item.unansweredCount ?? '-'}</span>
                      <span className="text-[10px] text-slate-500">Unanswered</span>
                    </div>
                    <div>
                      <span className="block font-bold text-indigo-600">{formatTime(item.durationSeconds)}</span>
                      <span className="text-[10px] text-slate-500">Time</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      ID: {item.id ? item.id.slice(0, 12) : ''}
                    </span>
                    <button
                      onClick={() => onSelectAttempt(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-semibold transition cursor-pointer"
                    >
                      <span>View Solutions</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
