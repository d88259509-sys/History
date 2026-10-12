import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  FileCheck2, 
  Clock, 
  Award, 
  ArrowRight, 
  Plus, 
  ShieldCheck, 
  Sparkles,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import { useI18n } from '../i18n/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Test } from '../types.js';

interface TestsProps {
  navigate: (path: string) => void;
}

export const Tests: React.FC<TestsProps> = ({ navigate }) => {
  const { t } = useI18n();
  const { user, isTeacher } = useAuth();
  const { success, error, info } = useToast();

  const [inputCode, setInputCode] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('tarix_token');
      const res = await fetch('/api/tests', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setTests(data.tests);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent, codeToTest?: string) => {
    if (e) e.preventDefault();
    const raw = (codeToTest || inputCode).trim().toUpperCase();

    if (!raw) {
      error(t('tests.codeRequired'));
      return;
    }
    if (raw.length !== 6) {
      error(t('tests.codeLengthError'));
      return;
    }

    if (!localStorage.getItem('tarix_token')) {
      info('Test topshirish uchun avval tizimga kiring');
      navigate('/login?redirect=/tests/take/' + raw);
      return;
    }

    setIsChecking(true);
    try {
      const token = localStorage.getItem('tarix_token');
      const res = await fetch(`/api/tests/verify-code/${raw}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        error(data.error || 'Test kodi topilmadi');
      } else {
        navigate(`/tests/take/${raw}`);
      }
    } catch {
      error('Xatolik yuz berdi');
    } finally {
      setIsChecking(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    success(`Kod ${code} nusxalandi!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200 dark:border-stone-800 pb-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300">
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>{t('tests.subtitle')}</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-black text-amber-950 dark:text-amber-100">
            {t('tests.title')}
          </h1>
          <p className="text-stone-600 dark:text-stone-400 text-sm max-w-xl">
            Tarix bo'yicha mustahkam bilimlaringizni sinovdan o'tkazing. Maxsus kod orqali testlarni boshlang.
          </p>
        </div>

        {isTeacher && (
          <button
            onClick={() => navigate('/teacher/tests/new')}
            className="shrink-0 px-5 py-3 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 transition-all flex items-center gap-2 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>{t('teacher.createTest')}</span>
          </button>
        )}
      </div>

      {/* Code Entry Hero Card */}
      <div className="rounded-3xl border border-amber-900/15 dark:border-amber-500/20 bg-gradient-to-br from-amber-50/90 via-stone-50/90 to-amber-100/50 dark:from-stone-900/90 dark:via-stone-900/90 dark:to-amber-950/20 p-8 sm:p-12 shadow-xl backdrop-blur-md">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-600/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <KeyRound className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-100">
              {t('tests.enterCodeTitle')}
            </h2>
            <p className="text-stone-600 dark:text-stone-400 text-sm">
              {t('tests.enterCodeSubtitle')}
            </p>
          </div>

          <form onSubmit={e => handleVerifyCode(e)} className="max-w-md mx-auto space-y-4">
            <input
              type="text"
              maxLength={6}
              value={inputCode}
              onChange={e => setInputCode(e.target.value.toUpperCase())}
              placeholder="TEMUR1"
              className="w-full text-center text-3xl font-mono font-black tracking-widest px-4 py-4 rounded-2xl border-2 border-amber-500/40 bg-white dark:bg-stone-950 text-amber-950 dark:text-amber-200 focus:outline-none focus:border-amber-600 shadow-inner uppercase"
            />

            <button
              type="submit"
              disabled={isChecking}
              className="w-full py-4 rounded-2xl font-bold text-base text-white bg-amber-600 hover:bg-amber-700 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 disabled:opacity-60"
            >
              <span>{isChecking ? t('tests.checking') : t('tests.checkCode')}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <p className="text-xs text-stone-500">
            Kodni bilmaysizmi? Quyidagi ochiq dars testlaridan birini tanlab, kodini bosing.
          </p>
        </div>
      </div>

      {/* Available Tests Catalog */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl font-black text-amber-950 dark:text-amber-100">
            {t('tests.availableTests')}
          </h3>
          <span className="text-xs font-semibold text-stone-500">
            Jami: {tests.length} ta test
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 rounded-2xl bg-stone-200 dark:bg-stone-800" />
            ))}
          </div>
        ) : tests.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-stone-300 dark:border-stone-800 text-stone-500">
            Hozircha ochiq testlar mavjud emas
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tests.map(test => (
              <div
                key={test.id}
                className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 flex flex-col justify-between shadow-sm hover:border-amber-500/40 hover:shadow-lg transition-all"
              >
                <div className="space-y-4">
                  {/* Top code badge */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => copyCode(test.access_code)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                      title="Kodni nusxalash"
                    >
                      <span>Kod: {test.access_code}</span>
                      {copiedCode === test.access_code ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 opacity-60" />
                      )}
                    </button>

                    {test.user_attempt_count && test.user_attempt_count > 0 ? (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        Topshirilgan ({test.user_best_score}%)
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <h4 className="font-serif font-black text-lg text-stone-900 dark:text-stone-100 line-clamp-2 leading-snug">
                      {test.title}
                    </h4>
                    <p className="mt-2 text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                      {test.description}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-stone-500 pt-2 border-t border-stone-100 dark:border-stone-800">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>{test.time_limit_minutes} daqiqa</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span>O'tish: {test.passing_score}%</span>
                    </span>
                  </div>
                </div>

                {/* Card CTA */}
                <div className="pt-6 mt-6 border-t border-stone-100 dark:border-stone-800">
                  <button
                    onClick={e => handleVerifyCode(e, test.access_code)}
                    className="w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <span>{t('tests.startTest')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
