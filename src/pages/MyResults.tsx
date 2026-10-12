import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCcw, 
  Calendar,
  FileCheck2,
  KeyRound
} from 'lucide-react';
import { useI18n } from '../i18n/index.js';
import { useAuth } from '../context/AuthContext.js';
import { AttemptHistoryItem } from '../types.js';

interface MyResultsProps {
  navigate: (path: string) => void;
}

export const MyResults: React.FC<MyResultsProps> = ({ navigate }) => {
  const { t } = useI18n();
  const { user } = useAuth();

  const [attempts, setAttempts] = useState<AttemptHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchMyAttempts();
  }, []);

  const fetchMyAttempts = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('tarix_token');
      if (!token) {
        navigate('/login?redirect=/my-results');
        return;
      }

      const res = await fetch('/api/tests/attempts/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAttempts(data.attempts || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const formatMinutes = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300">
          <Award className="w-3.5 h-3.5" />
          <span>{t('myResults.subtitle')}</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-black text-amber-950 dark:text-amber-100">
          {t('myResults.title')}
        </h1>
        <p className="text-stone-600 dark:text-stone-400 text-sm">
          Siz topshirgan barcha testlar natijalari, foizlar va o'zlashtirish darajasi.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
          ))}
        </div>
      ) : attempts.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 space-y-4">
          <FileCheck2 className="w-12 h-12 text-stone-400 mx-auto" />
          <h3 className="font-serif text-xl font-bold text-stone-800 dark:text-stone-200">
            {t('myResults.empty')}
          </h3>
          <p className="text-sm text-stone-500 max-w-sm mx-auto">
            Test kodini kiritib yoki mavjud testlar ro'yxatidan birini tanlab bilimingizni sinab ko'ring!
          </p>
          <button
            onClick={() => navigate('/tests')}
            className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md"
          >
            Testlarga o'tish
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 dark:bg-stone-950/70 border-b border-stone-200 dark:border-stone-800 text-xs font-bold uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="px-6 py-4">{t('myResults.testName')}</th>
                  <th className="px-6 py-4">{t('myResults.code')}</th>
                  <th className="px-6 py-4">{t('myResults.score')}</th>
                  <th className="px-6 py-4">{t('myResults.percent')}</th>
                  <th className="px-6 py-4">{t('myResults.status')}</th>
                  <th className="px-6 py-4">Vaqt</th>
                  <th className="px-6 py-4">{t('myResults.date')}</th>
                  <th className="px-6 py-4 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {attempts.map(att => {
                  const passed = att.passed === 1;
                  return (
                    <tr key={att.id} className="hover:bg-amber-500/5 transition-colors">
                      <td className="px-6 py-4 font-serif font-bold text-stone-900 dark:text-stone-100">
                        {att.test_title}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-stone-100 dark:bg-stone-800 text-amber-700 dark:text-amber-400">
                          {att.access_code}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-stone-700 dark:text-stone-300">
                        {att.score} / {att.total_points}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold font-serif text-base ${passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {att.percent}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          passed
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                        }`}>
                          {passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          <span>{passed ? 'O\'tdi' : 'O\'tmadi'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-stone-500">
                        {formatMinutes(att.time_spent_seconds)}
                      </td>
                      <td className="px-6 py-4 text-xs text-stone-500">
                        {new Date(att.completed_at).toLocaleDateString('uz-UZ')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/tests/result/${att.id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
                        >
                          <span>{t('myResults.details')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
