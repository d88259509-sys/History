import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Send, 
  Sparkles,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';
import { useI18n } from '../i18n/index.js';
import { useToast } from '../context/ToastContext.js';
import { ConfirmModal } from '../components/ConfirmModal.js';
import { Test, Question } from '../types.js';

interface TakeTestProps {
  code: string;
  navigate: (path: string) => void;
}

export const TakeTest: React.FC<TakeTestProps> = ({ code, navigate }) => {
  const { t } = useI18n();
  const { error, success, info } = useToast();

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [totalTimeSeconds, setTotalTimeSeconds] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasAutoSubmittedRef = useRef<boolean>(false);

  useEffect(() => {
    fetchTestSession();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [code]);

  const fetchTestSession = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('tarix_token');
      if (!token) {
        navigate(`/login?redirect=/tests/take/${code}`);
        return;
      }

      const res = await fetch(`/api/tests/take/${code}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        error(data.error || 'Testni boshlashda xatolik yuz berdi');
        navigate('/tests');
        return;
      }

      setTest(data.test);
      setQuestions(data.test.questions || []);

      const durationSec = (data.test.time_limit_minutes || 20) * 60;
      setTotalTimeSeconds(durationSec);
      setSecondsRemaining(durationSec);
    } catch {
      error('Xatolik yuz berdi');
      navigate('/tests');
    } finally {
      setIsLoading(false);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (secondsRemaining <= 0 || !test) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          if (!hasAutoSubmittedRef.current) {
            handleAutoSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [test, secondsRemaining]);

  const handleAutoSubmit = () => {
    hasAutoSubmittedRef.current = true;
    info(t('tests.timeUpDesc'));
    submitTestAnswers();
  };

  const handleAnswerChange = (questionId: string, val: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: val,
    }));
  };

  const handleMultipleSelect = (questionId: string, optionId: string) => {
    const current = (answers[questionId] as string[]) || [];
    let updated: string[];
    if (current.includes(optionId)) {
      updated = current.filter(id => id !== optionId);
    } else {
      updated = [...current, optionId];
    }
    handleAnswerChange(questionId, updated);
  };

  const submitTestAnswers = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      const token = localStorage.getItem('tarix_token');
      const timeSpent = totalTimeSeconds - secondsRemaining;

      const res = await fetch(`/api/tests/${code}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          answers,
          timeSpentSeconds: timeSpent
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        success('Test natijasi muvaffaqiyatli hisoblandi!');
        navigate(`/tests/result/${data.result.attemptId}`);
      } else {
        error(data.error || 'Natijani yuborishda xatolik yuz berdi');
        setIsSubmitting(false);
      }
    } catch {
      error('Server bilan bog\'lanishda xatolik');
      setIsSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-stone-200 dark:bg-stone-800 rounded" />
        <div className="h-64 bg-stone-200 dark:bg-stone-800 rounded-3xl" />
      </div>
    );
  }

  if (!test || questions.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="font-serif text-2xl font-bold">Test savollari topilmadi</h2>
        <button
          onClick={() => navigate('/tests')}
          className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-bold"
        >
          Testlarga qaytish
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isTimeCritical = secondsRemaining <= 120; // less than 2 minutes

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Sticky Header with Progress & Timer */}
      <div className="sticky top-20 z-30 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur-md rounded-2xl border border-stone-200 dark:border-stone-800 p-4 sm:p-5 shadow-md flex items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-black text-lg sm:text-xl text-stone-900 dark:text-stone-100 truncate max-w-sm sm:max-w-md">
            {test.title}
          </h2>
          <span className="text-xs text-stone-500">
            {t('tests.questionNum', { current: currentIndex + 1, total: questions.length })}
          </span>
        </div>

        {/* Countdown Timer */}
        <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-mono font-bold text-base sm:text-lg transition-colors ${
          isTimeCritical
            ? 'border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse'
            : 'border-amber-600/30 bg-amber-500/10 text-amber-900 dark:text-amber-300'
        }`}>
          <Clock className={`w-5 h-5 ${isTimeCritical ? 'text-rose-500' : 'text-amber-600'}`} />
          <span>{formatTime(secondsRemaining)}</span>
        </div>
      </div>

      {/* Question Jump Palette */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {questions.map((q, idx) => {
          const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '' && (Array.isArray(answers[q.id]) ? answers[q.id].length > 0 : true);
          const isCurrent = idx === currentIndex;
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                isCurrent
                  ? 'bg-amber-600 text-white ring-2 ring-amber-600/40 ring-offset-2 dark:ring-offset-stone-950 scale-105'
                  : isAnswered
                  ? 'bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/30'
                  : 'bg-stone-200/60 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-300 dark:hover:bg-stone-700'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Main Question Card */}
      <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-10 shadow-lg space-y-8">
        
        {/* Question Type and Points */}
        <div className="flex items-center justify-between text-xs font-semibold text-stone-500 border-b border-stone-100 dark:border-stone-800 pb-4">
          <span className="uppercase tracking-wider">
            {currentQ.question_type === 'single' && t('tests.typeSingle')}
            {currentQ.question_type === 'multiple' && t('tests.typeMultiple')}
            {currentQ.question_type === 'true_false' && t('tests.typeTrueFalse')}
            {currentQ.question_type === 'text' && t('tests.typeText')}
          </span>
          <span className="text-amber-700 dark:text-amber-400 font-bold">
            {currentQ.points} ball
          </span>
        </div>

        {/* Question Text */}
        <h3 className="font-serif font-black text-xl sm:text-2xl text-stone-900 dark:text-stone-100 leading-snug">
          {currentQ.question_text}
        </h3>

        {/* Options / Input based on question type */}
        <div className="space-y-3 pt-2">
          
          {/* 1. Single Choice */}
          {currentQ.question_type === 'single' && (
            <div className="space-y-3">
              {currentQ.options.map(opt => {
                const isSelected = answers[currentQ.id] === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleAnswerChange(currentQ.id, opt.id)}
                    className={`cursor-pointer p-4 rounded-2xl border-2 flex items-center gap-3.5 transition-all ${
                      isSelected
                        ? 'border-amber-600 bg-amber-500/10 text-stone-900 dark:text-stone-100 shadow-sm'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 text-stone-700 dark:text-stone-300 hover:border-amber-500/30 hover:bg-stone-100/50 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-amber-600 bg-amber-600 text-white' : 'border-stone-400'
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm sm:text-base font-medium leading-relaxed">
                      {opt.text}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. Multiple Choice */}
          {currentQ.question_type === 'multiple' && (
            <div className="space-y-3">
              {currentQ.options.map(opt => {
                const isSelected = ((answers[currentQ.id] as string[]) || []).includes(opt.id);
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleMultipleSelect(currentQ.id, opt.id)}
                    className={`cursor-pointer p-4 rounded-2xl border-2 flex items-center gap-3.5 transition-all ${
                      isSelected
                        ? 'border-amber-600 bg-amber-500/10 text-stone-900 dark:text-stone-100 shadow-sm'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 text-stone-700 dark:text-stone-300 hover:border-amber-500/30 hover:bg-stone-100/50 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-amber-600 bg-amber-600 text-white' : 'border-stone-400'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-sm sm:text-base font-medium leading-relaxed">
                      {opt.text}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. True / False */}
          {currentQ.question_type === 'true_false' && (
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleAnswerChange(currentQ.id, 'true')}
                className={`p-5 rounded-2xl border-2 font-bold text-base transition-all ${
                  answers[currentQ.id] === 'true'
                    ? 'border-emerald-600 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                    : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 text-stone-700 dark:text-stone-300 hover:border-stone-400'
                }`}
              >
                ✓ To'g'ri (Haqiqat)
              </button>

              <button
                type="button"
                onClick={() => handleAnswerChange(currentQ.id, 'false')}
                className={`p-5 rounded-2xl border-2 font-bold text-base transition-all ${
                  answers[currentQ.id] === 'false'
                    ? 'border-rose-600 bg-rose-500/10 text-rose-800 dark:text-rose-300'
                    : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 text-stone-700 dark:text-stone-300 hover:border-stone-400'
                }`}
              >
                ✕ Noto'g'ri (Yolg'on)
              </button>
            </div>
          )}

          {/* 4. Short Text Answer */}
          {currentQ.question_type === 'text' && (
            <div className="space-y-2">
              <input
                type="text"
                value={answers[currentQ.id] || ''}
                onChange={e => handleAnswerChange(currentQ.id, e.target.value)}
                placeholder={t('tests.textAnswerPlaceholder')}
                className="w-full px-5 py-4 rounded-2xl border-2 border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-base focus:outline-none focus:border-amber-600 shadow-inner"
              />
              <p className="text-xs text-stone-500">
                Imlo qoidalariga rioya qiling. Katta/kichik harflar ahamiyatga ega emas.
              </p>
            </div>
          )}

        </div>

        {/* Navigation buttons */}
        <div className="pt-6 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold text-sm hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Oldingi</span>
          </button>

          {isLastQuestion ? (
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-md flex items-center gap-2 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? t('tests.submitting') : t('tests.submitTest')}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-sm shadow-md flex items-center gap-1.5 transition-all"
            >
              <span>Keyingi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>

      {/* Finish test early button */}
      {!isLastQuestion && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="text-xs font-bold text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 underline underline-offset-4"
          >
            {t('tests.submitTest')} (Barcha savollarni tekshirishga yuborish)
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title={t('tests.confirmSubmitTitle')}
        description={t('tests.confirmSubmitDesc')}
        confirmLabel={t('tests.submitTest')}
        cancelLabel={t('common.cancel')}
        isDestructive={false}
        isLoading={isSubmitting}
        onConfirm={submitTestAnswers}
        onClose={() => setShowConfirmModal(false)}
      />

    </div>
  );
};
