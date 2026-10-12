import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Download, 
  Search, 
  FileCheck2, 
  Award, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  BarChart3,
  Users,
  Copy,
  Check
} from 'lucide-react';
import { useI18n } from '../i18n/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';

interface TeacherTestResultsProps {
  id: string; // testId
  navigate: (path: string) => void;
}

export const TeacherTestResults: React.FC<TeacherTestResultsProps> = ({ id, navigate }) => {
  const { t } = useI18n();
  const { isTeacher } = useAuth();
  const { error, success } = useToast();

  const [test, setTest] = useState<any | null>(null);
  const [stats, setStats] = useState<any>({ totalAttempts: 0, passedAttempts: 0, passRate: 0, averagePercent: 0 });
  const [questions, setQuestions] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (!isTeacher) {
      navigate('/');
      return;
    }
    fetchResults();
  }, [id, isTeacher]);

  const fetchResults = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('tarix_token');
      const res = await fetch(`/api/tests/${id}/results`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTest(data.test);
        setStats(data.stats);
        setQuestions(data.questions || []);
        setAttempts(data.attempts || []);
      } else {
        error(data.error || 'Natijalarni yuklab bo\'lmadi');
      }
    } catch {
      error('Xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('tarix_token');
      const res = await fetch(`/api/stats/export-csv/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Tarix_${test?.access_code}_Natijalar.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        success('CSV fayl yuklab olindi!');
      } else {
        error('Eksportda xatolik yuz berdi');
      }
    } catch {
      error('Xatolik yuz berdi');
    } finally {
      setIsExporting(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    success(`Kod nusxalandi: ${code}`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const filteredAttempts = attempts.filter(a => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (a.student_name && a.student_name.toLowerCase().includes(term)) ||
      (a.student_email && a.student_email.toLowerCase().includes(term))
    );
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 space-y-6 animate-pulse">
        <div className="h-10 bg-stone-200 dark:bg-stone-800 rounded w-1/3" />
        <div className="h-64 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <FileCheck2 className="w-12 h-12 text-stone-400 mx-auto" />
        <h2 className="font-serif text-2xl font-bold">Test topilmadi</h2>
        <button
          onClick={() => navigate('/teacher')}
          className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-bold"
        >
          Ustoz paneliga qaytish
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Top back bar and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-6">
        <button
          onClick={() => navigate('/teacher')}
          className="inline-flex items-center gap-2 text-sm font-bold text-stone-600 dark:text-stone-400 hover:text-amber-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Ustoz paneliga qaytish</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            disabled={isExporting || attempts.length === 0}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{t('teacher.exportCsv')}</span>
          </button>
        </div>
      </div>

      {/* Header Info */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="font-serif font-black text-3xl text-amber-950 dark:text-amber-100">
            {test.title}
          </span>
          <button
            onClick={() => copyCode(test.access_code)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20"
            title="Kodni nusxalash"
          >
            <span>Kod: {test.access_code}</span>
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-stone-600 dark:text-stone-400 text-sm max-w-2xl">
          {test.description}
        </p>
      </div>

      {/* Summary KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-1 shadow-sm">
          <span className="text-xs text-stone-500 font-semibold block">Jami Urinishlar</span>
          <span className="text-2xl font-serif font-black text-stone-900 dark:text-stone-100">
            {stats.totalAttempts}
          </span>
        </div>

        <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-1 shadow-sm">
          <span className="text-xs text-stone-500 font-semibold block">Muvaffaqiyatli topshirganlar</span>
          <span className="text-2xl font-serif font-black text-emerald-600">
            {stats.passedAttempts} ta
          </span>
        </div>

        <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-1 shadow-sm">
          <span className="text-xs text-stone-500 font-semibold block">O'tish Ko'rsatkichi</span>
          <span className="text-2xl font-serif font-black text-amber-700 dark:text-amber-400">
            {stats.passRate}%
          </span>
        </div>

        <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-1 shadow-sm">
          <span className="text-xs text-stone-500 font-semibold block">O'rtacha Natija</span>
          <span className="text-2xl font-serif font-black text-stone-900 dark:text-stone-100">
            {stats.averagePercent}%
          </span>
        </div>
      </div>

      {/* Per-Question Analytics */}
      {questions.length > 0 && (
        <div className="space-y-4">
          <div className="border-b border-stone-200 dark:border-stone-800 pb-3 flex items-center justify-between">
            <h3 className="font-serif text-xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-600" />
              <span>{t('teacher.questionAnalytics')}</span>
            </h3>
            <span className="text-xs text-stone-500">{questions.length} ta savol bo'yicha tahlil</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {questions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-stone-400">#{idx + 1}</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    To'g'rilik: {q.accuracyPercent}%
                  </span>
                </div>

                <p className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 line-clamp-2">
                  {q.question_text}
                </p>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${q.accuracyPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-stone-500 block">
                    {q.correctCount} / {q.attemptsCount} ta to'g'ri javob
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student Submissions Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-3">
          <h3 className="font-serif text-xl font-black text-stone-900 dark:text-stone-100">
            {t('teacher.studentAttempts')} ({filteredAttempts.length})
          </h3>

          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Talaba ismi yoki emaili..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs focus:outline-none"
            />
          </div>
        </div>

        {filteredAttempts.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-stone-300 dark:border-stone-800 text-stone-500">
            Mos keluvchi urinishlar topilmadi
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 dark:bg-stone-950/70 border-b border-stone-200 dark:border-stone-800 text-xs font-bold uppercase tracking-wider text-stone-500">
                  <tr>
                    <th className="px-6 py-4">Talaba Ismi</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Ball</th>
                    <th className="px-6 py-4">Foiz</th>
                    <th className="px-6 py-4">Holat</th>
                    <th className="px-6 py-4">Vaqt</th>
                    <th className="px-6 py-4">Sana</th>
                    <th className="px-6 py-4 text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {filteredAttempts.map(att => (
                    <tr key={att.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                      <td className="px-6 py-4 font-bold text-stone-900 dark:text-stone-100">
                        {att.student_name}
                      </td>
                      <td className="px-6 py-4 text-xs text-stone-500">
                        {att.student_email || att.email || '—'}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {att.score} / {att.total_points}
                      </td>
                      <td className="px-6 py-4 font-serif font-bold text-base">
                        <span className={att.passed === 1 ? 'text-emerald-600' : 'text-rose-600'}>
                          {att.percent}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          att.passed === 1
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                        }`}>
                          {att.passed === 1 ? 'O\'tdi' : 'O\'tmadi'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-stone-500">
                        {Math.round(att.time_spent_seconds / 60)} daqiqa
                      </td>
                      <td className="px-6 py-4 text-xs text-stone-500">
                        {new Date(att.completed_at).toLocaleString('uz-UZ')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/tests/result/${att.id}`)}
                          className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline"
                        >
                          Batafsil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
