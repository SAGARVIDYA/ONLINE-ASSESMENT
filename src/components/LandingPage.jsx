import React, { useState } from 'react';
import { 
  BookOpen, 
  Clock, 
  Award, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  History, 
  ShieldAlert,
  HelpCircle,
  Sparkles
} from 'lucide-react';

export default function LandingPage({ onStartAssessment, onViewHistory, defaultName = '', defaultRoll = '' }) {
  const [fullName, setFullName] = useState(defaultName);
  const [rollNumber, setRollNumber] = useState(defaultRoll);
  const [errors, setErrors] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!fullName.trim()) {
      errs.fullName = 'Full Name is required.';
    } else if (fullName.trim().length < 2) {
      errs.fullName = 'Please enter at least 2 characters.';
    }

    if (!rollNumber.trim()) {
      errs.rollNumber = 'Roll Number is required.';
    } else if (rollNumber.trim().length < 2) {
      errs.rollNumber = 'Please enter a valid Roll Number.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmStart = async () => {
    setLoading(true);
    try {
      await onStartAssessment({
        fullName: fullName.trim(),
        rollNumber: rollNumber.trim().toUpperCase()
      });
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-100 flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-slate-700/60 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30">
              NA
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
                NUMERICAL APTITUDE
              </h1>
              <p className="text-xs text-indigo-300 font-medium tracking-wide uppercase">
                Online Assessment Portal
              </p>
            </div>
          </div>
          <button
            onClick={onViewHistory}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition"
          >
            <History className="w-4 h-4 text-indigo-400" />
            <span>Attempt History</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12 flex-1 w-full flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Info & Details */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Standardized Computer-Based Test (CBT)
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200">Numerical Aptitude</span>
              </h2>
              <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-xl">
                Comprehensive 200-question timed assessment testing mathematical reasoning, arithmetic, algebra, percentages, speed-distance-time, ratios, and number systems.
              </p>
            </div>

            {/* Test Specification Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 flex flex-col">
                <span className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  Questions
                </span>
                <span className="text-2xl font-bold text-white mt-1">200</span>
                <span className="text-[11px] text-slate-400">Multiple Choice</span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 flex flex-col">
                <span className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Duration
                </span>
                <span className="text-2xl font-bold text-white mt-1">120 Min</span>
                <span className="text-[11px] text-slate-400">2 hrs 00 mins</span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 flex flex-col">
                <span className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  Max Marks
                </span>
                <span className="text-2xl font-bold text-white mt-1">200</span>
                <span className="text-[11px] text-slate-400">+1 per correct</span>
              </div>

              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 flex flex-col">
                <span className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                  Negative
                </span>
                <span className="text-2xl font-bold text-emerald-400 mt-1">No</span>
                <span className="text-[11px] text-slate-400">0 for wrong</span>
              </div>
            </div>

            {/* Assessment Rules */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 text-xs text-slate-300 space-y-2">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5 text-sm">
                <AlertCircle className="w-4 h-4 text-indigo-400" />
                Key Examination Guidelines
              </div>
              <ul className="list-disc pl-5 space-y-1 text-slate-300">
                <li>Questions appear in randomized order for every attempt.</li>
                <li>You can navigate questions freely using the Question Palette.</li>
                <li>Mark questions for review to revisit before submission.</li>
                <li>The exam will automatically submit when the 120-minute timer expires.</li>
                <li>Unlimited retakes are permitted; all attempts are saved in your history.</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Student Details Card */}
          <div className="lg:col-span-5">
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white">Student Registration</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Enter your credentials to initiate your assessment session.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-1.5">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors(prev => ({ ...prev, fullName: null }));
                    }}
                    placeholder="e.g. Alex Morgan"
                    className={`w-full px-4 py-2.5 rounded-lg bg-slate-900 border text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition ${
                      errors.fullName 
                        ? 'border-rose-500 focus:ring-rose-500' 
                        : 'border-slate-700 focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="rollNumber" className="block text-sm font-medium text-slate-300 mb-1.5">
                    Roll Number / Student ID <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="rollNumber"
                    type="text"
                    value={rollNumber}
                    onChange={(e) => {
                      setRollNumber(e.target.value.toUpperCase());
                      if (errors.rollNumber) setErrors(prev => ({ ...prev, rollNumber: null }));
                    }}
                    placeholder="e.g. CS2026-042"
                    className={`w-full px-4 py-2.5 rounded-lg bg-slate-900 border text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 transition ${
                      errors.rollNumber 
                        ? 'border-rose-500 focus:ring-rose-500' 
                        : 'border-slate-700 focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
                  />
                  {errors.rollNumber && (
                    <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.rollNumber}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Used to track multiple attempts in your history.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition duration-150 cursor-pointer"
                  >
                    <span>Start Assessment</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-700/60 text-center">
                <button
                  type="button"
                  onClick={onViewHistory}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 transition"
                >
                  <History className="w-3.5 h-3.5" />
                  View previously completed attempts
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-indigo-400 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-950 border border-indigo-700/60 flex items-center justify-center">
                <Clock className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Start Exam Confirmation</h3>
                <p className="text-xs text-slate-400">Please confirm your details</p>
              </div>
            </div>

            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700/60 mb-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Candidate Name:</span>
                <span className="font-semibold text-white">{fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Roll Number:</span>
                <span className="font-mono font-semibold text-indigo-300">{rollNumber.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Duration:</span>
                <span className="text-amber-300 font-medium">120 Minutes (2:00:00)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Questions:</span>
                <span className="text-white font-medium">200 Questions</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Once you click <strong>Confirm & Begin</strong>, your timer of 120 minutes will commence immediately. Are you ready to begin?
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmStart}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {loading ? 'Initializing...' : 'Confirm & Begin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-4 text-center text-xs text-slate-500">
        <p>NUMERICAL APTITUDE · Examination System · 200 Questions · All Rights Reserved</p>
      </footer>
    </div>
  );
}
