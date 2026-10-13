import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCcw, 
  FileText, 
  Sparkles, 
  BookOpen,
  ArrowRight,
  HelpCircle,
  Check,
  X
} from 'lucide-react';
import { useI18n } from '../i18n/index.js';
import { useToast } from '../context/ToastContext.js';
import { TestAttemptResult } from '../types.js';

interface TestResultProps {
  attemptId: string;
  navigate: (path: string) => void;
}

export const TestResult: React.FC<TestResultProps> = ({ attemptId, navigate }) => {
  const { lang, t } = useI18n();
  const { error } = useToast();

  const [result, setResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchResult();
  }, [attemptId]);

  const fetchResult = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('tarix_token');
      const res = await fetch(`/api/tests/attempts/${attemptId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success && data.attempt) {
        setResult(data.attempt);
        if (data.attempt.passed === 1) {
          triggerConfetti();
        }
      } else {
        error(data.error || 'Natijani yuklab bo\'lmadi');
      }
    } catch {
      error('Xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#d97706', '#b45309', '#f59e0b', '#10b981'],
      });
    } catch {}
  };

  const formatMinutes = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (lang === 'ru') return `${m} мин ${s} сек`;
    if (lang === 'en') return `${m} min ${s} sec`;
    return `${m} daq ${s} soniya`;
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 space-y-6 animate-pulse">
        <div className="h-48 bg-stone-200 dark:bg-stone-800 rounded-3xl" />
        <div className="h-64 bg-stone-200 dark:bg-stone-800 rounded-3xl" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <Award className="w-12 h-12 text-stone-400 mx-auto" />
        <h2 className="font-serif text-2xl font-bold">{t('common.notFoundTitle')}</h2>
        <button
          onClick={() => navigate('/tests')}
          className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-bold"
        >
          {t('results.backToTests')}
        </button>
      </div>
    );
  }

  const isPassed = result.passed === 1;
  const questionResults = result.question_results || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Result Hero Score Card */}
      <div className={`rounded-3xl border p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl backdrop-blur-md ${
        isPassed
          ? 'border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 via-stone-50/90 to-emerald-500/5 dark:from-emerald-950/40 dark:via-stone-900/90 dark:to-stone-950'
          : 'border-rose-500/30 bg-gradient-to-b from-rose-500/10 via-stone-50/90 to-rose-500/5 dark:from-rose-950/40 dark:via-stone-900/90 dark:to-stone-950'
      }`}>
        <div className="max-w-xl mx-auto space-y-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider shadow-sm">
            {isPassed ? (
              <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 px-4 py-1 rounded-full">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('results.passedBadge')}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 bg-rose-500/20 px-4 py-1 rounded-full">
                <XCircle className="w-4 h-4" />
                <span>{t('results.failedBadge')}</span>
              </span>
            )}
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-black text-amber-950 dark:text-amber-100">
            {result.test_title}
          </h1>

          {/* Percentage Circle / Giant Score */}
          <div className="py-2">
            <div className={`text-6xl sm:text-7xl font-serif font-black tracking-tight ${
              isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {result.percent}%
            </div>
            <div className="mt-2 text-sm font-semibold text-stone-600 dark:text-stone-400">
              {t('results.scoreEarned')}: <span className="font-bold text-stone-900 dark:text-stone-100">{result.score} / {result.total_points} ball</span>
            </div>
          </div>

          {/* Rasch Model Ability Score Badge */}
          {(() => {
            const rawP = result.total_points > 0 ? result.score / result.total_points : 0.5;
            const p = Math.max(0.05, Math.min(0.95, rawP));
            const logit = Number(Math.log(p / (1 - p)).toFixed(2));
            const raschScore = Math.min(100, Math.max(0, Math.round(50 + logit * 18)));
            const isFinalized = result.test_is_active === 0;

            return (
              <div className="space-y-3">
                {isFinalized && (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-600/15 via-amber-700/15 to-amber-900/15 border border-amber-600/30 text-xs text-amber-950 dark:text-amber-200 flex items-center gap-2.5 font-semibold text-left">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Ushbu test ustoz Muhammad Ayubxon tomonidan yakunlangan va <strong>Rash modeli (Item Response Theory)</strong> bo'yicha ilmiy tekshirilib, rasmiy baholangan.
                    </span>
                  </div>
                )}

                <div className="p-3.5 rounded-2xl border border-amber-500/25 bg-amber-500/5 text-xs text-stone-700 dark:text-stone-300 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold">
                      &beta; Rash
                    </span>
                    <span className="text-left">
                      <span className="font-bold text-stone-900 dark:text-stone-100 block">Rash Qobiliyat Logiti</span>
                      <span className="text-stone-500">Psixometrik o'lchov (IRT)</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-base text-amber-800 dark:text-amber-400 block">
                      {logit > 0 ? `+${logit}` : logit} logit
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Kalibrlangan ball: <strong className="text-stone-900 dark:text-stone-100">{raschScore}/100</strong>
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Key metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-stone-200 dark:border-stone-800 text-xs">
            <div>
              <span className="text-stone-500 block">{t('results.passingScoreRequired')}</span>
              <span className="font-bold text-stone-800 dark:text-stone-200 text-sm">
                {result.passing_score}%
              </span>
            </div>
            <div>
              <span className="text-stone-500 block">{t('results.timeSpent')}</span>
              <span className="font-bold text-stone-800 dark:text-stone-200 text-sm">
                {formatMinutes(result.time_spent_seconds)}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-stone-500 block">Sana</span>
              <span className="font-bold text-stone-800 dark:text-stone-200 text-sm">
                {new Date(result.completed_at).toLocaleDateString('uz-UZ')}
              </span>
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('/tests')}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors"
            >
              {t('results.backToTests')}
            </button>

            <button
              onClick={() => navigate('/my-results')}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-amber-600 hover:bg-amber-700 text-white shadow-md transition-colors"
            >
              {t('results.viewMyResults')}
            </button>
          </div>

        </div>
      </div>

      {/* Question by Question Review */}
      {questionResults.length > 0 && (
        <div className="space-y-6">
          <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
            <h3 className="font-serif text-2xl font-black text-amber-950 dark:text-amber-100 flex items-center gap-2">
              <FileText className="w-6 h-6 text-amber-600" />
              <span>{t('results.myAnswersReview')}</span>
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Savollardagi to'g'ri va xato javoblar hamda ularning ilmiy asoslari
            </p>
          </div>

          <div className="space-y-4">
            {questionResults.map((qr: any, idx: number) => (
              <div
                key={qr.questionId || idx}
                className={`rounded-2xl border p-6 space-y-4 bg-white dark:bg-stone-900 transition-all ${
                  qr.isCorrect
                    ? 'border-emerald-500/30'
                    : 'border-rose-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-stone-500">
                      Savol {idx + 1} ({qr.pointsAwarded} / {qr.maxPoints} ball)
                    </span>
                    <h4 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100">
                      {qr.questionText}
                    </h4>
                  </div>
                  <div className={`p-1.5 rounded-xl shrink-0 ${
                    qr.isCorrect ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                  }`}>
                    {qr.isCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                  </div>
                </div>

                {/* Display Answers */}
                <div className="space-y-2 text-xs sm:text-sm pt-2 border-t border-stone-100 dark:border-stone-800">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-stone-500 shrink-0">{t('results.yourAnswer')}:</span>
                    <span className={`font-medium ${qr.isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                      {Array.isArray(qr.studentAnswer)
                        ? qr.studentAnswer.join(', ') || '(javob berilmagan)'
                        : qr.studentAnswer || '(javob berilmagan)'}
                    </span>
                  </div>

                  {qr.correctAnswers && (
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-stone-500 shrink-0">{t('results.correctAnswer')}:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {Array.isArray(qr.correctAnswers) ? qr.correctAnswers.join(', ') : qr.correctAnswers}
                      </span>
                    </div>
                  )}
                </div>

                {/* Scholarly Explanation if available */}
                {qr.explanation && (
                  <div className="p-3.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-xs text-stone-700 dark:text-stone-300 space-y-1">
                    <span className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{t('results.explanation')}:</span>
                    </span>
                    <p className="leading-relaxed font-sans">{qr.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
