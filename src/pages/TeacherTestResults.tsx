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
  Check, 
  Sparkles, 
  Binary, 
  Lock, 
  Unlock, 
  Scale, 
  TrendingUp, 
  AlertTriangle,
  HelpCircle
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
  const { error, success, info } = useToast();

  const [test, setTest] = useState<any | null>(null);
  const [stats, setStats] = useState<any>({ totalAttempts: 0, passedAttempts: 0, passRate: 0, averagePercent: 0 });
  const [questions, setQuestions] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [raschReport, setRaschReport] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'standard' | 'rasch'>('standard');

  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
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
        setRaschReport(data.raschReport || null);
        if (data.test && data.test.is_active === 0) {
          setActiveTab('rasch');
        }
      } else {
        error(data.error || 'Natijalarni yuklab bo\'lmadi');
      }
    } catch {
      error('Xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalizeTest = async () => {
    setIsFinalizing(true);
    try {
      const token = localStorage.getItem('tarix_token');
      const res = await fetch(`/api/tests/${id}/finalize`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTest(data.test);
        setRaschReport(data.raschReport);
        setActiveTab('rasch');
        success('Test yakunlandi va Rasch modeli bo\'yicha tahlil qilindi!');
      } else {
        error(data.error || 'Xatolik yuz berdi');
      }
    } catch {
      error('Xatolik yuz berdi');
    } finally {
      setIsFinalizing(false);
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top back bar and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-6">
        <button
          onClick={() => navigate('/teacher')}
          className="inline-flex items-center gap-2 text-sm font-bold text-stone-600 dark:text-stone-400 hover:text-amber-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Ustoz paneliga qaytish</span>
        </button>

        <div className="flex flex-wrap items-center gap-3">
          {/* Finalize Test & Compute Rasch Model Button */}
          {test.is_active === 1 ? (
            <button
              onClick={handleFinalizeTest}
              disabled={isFinalizing}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-700 hover:bg-amber-800 text-white flex items-center gap-2 shadow-sm transition-all"
              title="Testni to'xtatish va Rasch modeli bo'yicha ilmiy tahlil qilish"
            >
              <Lock className="w-4 h-4" />
              <span>{isFinalizing ? 'Yakunlanmoqda...' : 'Testni yakunlash & Rasch modeli tahlili'}</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
              <Lock className="w-3.5 h-3.5" />
              <span>Test yakunlangan (Rasch modeli faol)</span>
            </div>
          )}

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
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-serif font-black text-3xl text-amber-950 dark:text-amber-100">
            {test.title}
          </h1>
          <button
            onClick={() => copyCode(test.access_code)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20"
            title="Kodni nusxalash"
          >
            <span>Kod: {test.access_code}</span>
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
            test.is_active === 1 ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-stone-500/10 text-stone-600'
          }`}>
            {test.is_active === 1 ? 'Faol sinov' : 'Yakunlangan sinov'}
          </span>
        </div>
        <p className="text-stone-600 dark:text-stone-400 text-sm max-w-2xl leading-relaxed">
          {test.description}
        </p>
      </div>

      {/* Primary Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-1">
        <button
          onClick={() => setActiveTab('standard')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 ${
            activeTab === 'standard'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Klassik Natijalar ({attempts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rasch')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 ${
            activeTab === 'rasch'
              ? 'bg-gradient-to-r from-amber-700 to-amber-900 text-white shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800'
          }`}
        >
          <Scale className="w-4 h-4 text-amber-400" />
          <span>Rasch Modeli Tahlili (IRT Psychometrics)</span>
        </button>
      </div>

      {/* TAB 1: STANDARD RESULTS */}
      {activeTab === 'standard' && (
        <div className="space-y-8 animate-in fade-in duration-150">
          {/* Summary KPI grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-1 shadow-sm">
              <span className="text-xs text-stone-500 font-semibold block">Jami Urinishlar</span>
              <span className="text-2xl font-serif font-black text-stone-900 dark:text-stone-100">
                {stats.totalAttempts}
              </span>
            </div>

            <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-1 shadow-sm">
              <span className="text-xs text-stone-500 font-semibold block">Muvaffaqiyatli</span>
              <span className="text-2xl font-serif font-black text-emerald-600">
                {stats.passedAttempts} ta
              </span>
            </div>

            <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-1 shadow-sm">
              <span className="text-xs text-stone-500 font-semibold block">O'tish Foizi</span>
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

          {/* Per-Question Accuracy */}
          {questions.length > 0 && (
            <div className="space-y-4">
              <div className="border-b border-stone-200 dark:border-stone-800 pb-3 flex items-center justify-between">
                <h3 className="font-serif text-xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-600" />
                  <span>{t('teacher.questionAnalytics')}</span>
                </h3>
                <span className="text-xs text-stone-500">{questions.length} ta savol</span>
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

          {/* Submissions Table */}
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
      )}

      {/* TAB 2: RASCH MEASUREMENT MODEL (IRT) */}
      {activeTab === 'rasch' && (
        <div className="space-y-10 animate-in fade-in duration-200">
          
          {/* Rasch Model Introduction Banner */}
          <div className="p-6 rounded-3xl border border-amber-900/15 dark:border-amber-500/20 bg-gradient-to-br from-amber-950 via-stone-900 to-amber-950 text-white space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest">
              <Scale className="w-4 h-4" />
              <span>Rasch O'lchov Modeli (Item Response Theory - 1PL IRT)</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-black text-amber-100">
              Ilmiy Psixometrik Tahlil
            </h2>
            <p className="text-amber-100/80 text-sm max-w-3xl leading-relaxed">
              Rasch modeli test savollarining qiyinligi (&delta;) va talabalarning qobiliyatini (&beta;) ob'ektiv logit shkalasida alohida o'lchaydi. Shuningdek, Infit/Outfit MNSQ orqali tasodifiy taxmin qilingan yoki shubhali javoblarni aniqlab beradi.
            </p>
            {raschReport?.targeting_assessment && (
              <div className="pt-2 text-xs font-semibold text-amber-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Xulosa: {raschReport.targeting_assessment}</span>
              </div>
            )}
          </div>

          {!raschReport || raschReport.persons.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border border-dashed border-stone-300 dark:border-stone-800 text-stone-500 space-y-3">
              <Scale className="w-12 h-12 text-stone-400 mx-auto" />
              <h3 className="font-serif text-lg font-bold">Rasch modeli tahlili uchun ma'lumotlar kam</h3>
              <p className="text-xs">Tahlil hisoblanishi uchun kamida bitta talaba testni topshirgan bo'lishi kerak.</p>
            </div>
          ) : (
            <>
              {/* Rasch Reliability KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-1 shadow-sm">
                  <span className="text-xs text-stone-500 font-semibold block">O'rtacha Qobiliyat (&beta;)</span>
                  <div className="text-2xl font-serif font-black text-amber-900 dark:text-amber-300">
                    {raschReport.mean_person_ability > 0 ? `+${raschReport.mean_person_ability}` : raschReport.mean_person_ability} logit
                  </div>
                  <span className="text-[11px] text-stone-400">Talabalar bilimi o'rtachasi</span>
                </div>

                <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-1 shadow-sm">
                  <span className="text-xs text-stone-500 font-semibold block">O'rtacha Qiyinlik (&delta;)</span>
                  <div className="text-2xl font-serif font-black text-stone-800 dark:text-stone-200">
                    0.00 logit
                  </div>
                  <span className="text-[11px] text-stone-400">Savollar bazaviy markazi</span>
                </div>

                <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-1 shadow-sm">
                  <span className="text-xs text-stone-500 font-semibold block">Rasch Ishonchliligi (Person Rel)</span>
                  <div className="text-2xl font-serif font-black text-emerald-600">
                    {raschReport.person_reliability}
                  </div>
                  <span className="text-[11px] text-stone-400">0.70 dan yuqori - a'lo daraja</span>
                </div>

                <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-1 shadow-sm">
                  <span className="text-xs text-stone-500 font-semibold block">Cronbach Alpha (&alpha;)</span>
                  <div className="text-2xl font-serif font-black text-emerald-600">
                    {raschReport.cronbach_alpha}
                  </div>
                  <span className="text-[11px] text-stone-400">Ichki mutanosiblik indeksi</span>
                </div>
              </div>

              {/* Wright Map (Item-Person Map) */}
              <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="border-b border-stone-100 dark:border-stone-800 pb-4">
                  <h3 className="font-serif font-black text-xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                    <span>Wright Map (Shaxs-Savol Taqsimot Xaritasi)</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Chap tomonda talabalar qobiliyati, o'ng tomonda savollar qiyinligi bir xil logit o'qida taqqoslanadi.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-12 text-xs font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 dark:border-stone-800 pb-2">
                    <span className="col-span-5 text-right pr-4">Talabalar Qobiliyati (&beta;)</span>
                    <span className="col-span-2 text-center font-mono text-stone-600 dark:text-stone-300">Logit</span>
                    <span className="col-span-5 pl-4">Savollar Qiyinligi (&delta;)</span>
                  </div>

                  {raschReport.wright_map?.map((bin: any, bIdx: number) => (
                    <div key={bIdx} className="grid grid-cols-12 items-center py-1.5 text-xs hover:bg-stone-50/50 dark:hover:bg-stone-800/40 rounded-lg">
                      {/* Left: Persons */}
                      <div className="col-span-5 flex items-center justify-end gap-1.5 pr-4 flex-wrap">
                        {bin.persons?.map((name: string, pIdx: number) => (
                          <span
                            key={pIdx}
                            title={name}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 truncate max-w-[120px]"
                          >
                            👤 {name.split(' ')[0]}
                          </span>
                        ))}
                      </div>

                      {/* Middle: Logit */}
                      <div className="col-span-2 text-center font-mono font-bold text-xs text-stone-500 bg-stone-100 dark:bg-stone-800/80 py-1 rounded">
                        {bin.logit_center > 0 ? `+${bin.logit_center.toFixed(1)}` : bin.logit_center.toFixed(1)}
                      </div>

                      {/* Right: Items */}
                      <div className="col-span-5 flex items-center gap-1.5 pl-4 flex-wrap">
                        {bin.items?.map((itemLabel: string, iIdx: number) => (
                          <span
                            key={iIdx}
                            className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                          >
                            📝 {itemLabel}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items Calibration Table */}
              <div className="space-y-4">
                <div className="border-b border-stone-200 dark:border-stone-800 pb-3 flex items-center justify-between">
                  <h3 className="font-serif text-xl font-black text-stone-900 dark:text-stone-100">
                    Savollarning Rasch Qiyinlik Darajasi (Item Calibration)
                  </h3>
                  <span className="text-xs text-stone-500">{raschReport.items.length} ta savol</span>
                </div>

                <div className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-stone-50 dark:bg-stone-950/70 border-b border-stone-200 dark:border-stone-800 text-xs font-bold uppercase tracking-wider text-stone-500">
                        <tr>
                          <th className="px-5 py-3.5">#</th>
                          <th className="px-5 py-3.5">Savol Matni</th>
                          <th className="px-5 py-3.5">To'g'ri / Jami</th>
                          <th className="px-5 py-3.5">Qiyinlik Logiti (&delta;)</th>
                          <th className="px-5 py-3.5">Xatolik (SE)</th>
                          <th className="px-5 py-3.5">Infit MNSQ</th>
                          <th className="px-5 py-3.5">Outfit MNSQ</th>
                          <th className="px-5 py-3.5">Qiyinlik Toifasi</th>
                          <th className="px-5 py-3.5">Moslik</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
                        {raschReport.items.map((item: any, idx: number) => (
                          <tr key={item.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                            <td className="px-5 py-3.5 font-bold text-stone-400">S{idx + 1}</td>
                            <td className="px-5 py-3.5 font-serif font-bold text-stone-900 dark:text-stone-100 max-w-xs truncate">
                              {item.question_text}
                            </td>
                            <td className="px-5 py-3.5 font-medium">
                              {item.correct_count} / {item.total_attempts} ({Math.round(item.proportion_correct * 100)}%)
                            </td>
                            <td className="px-5 py-3.5 font-mono font-bold text-stone-900 dark:text-stone-100">
                              {item.difficulty_logit > 0 ? `+${item.difficulty_logit}` : item.difficulty_logit}
                            </td>
                            <td className="px-5 py-3.5 font-mono text-stone-500">
                              &plusmn;{item.standard_error}
                            </td>
                            <td className="px-5 py-3.5 font-mono">
                              <span className={item.infit_mnsq > 1.3 ? 'text-rose-600 font-bold' : 'text-stone-700 dark:text-stone-300'}>
                                {item.infit_mnsq}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 font-mono">
                              <span className={item.outfit_mnsq > 1.3 ? 'text-rose-600 font-bold' : 'text-stone-700 dark:text-stone-300'}>
                                {item.outfit_mnsq}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 font-bold">
                              <span className={`px-2 py-0.5 rounded text-[11px] ${
                                item.difficulty_level === 'Juda oson' || item.difficulty_level === 'Oson'
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                  : item.difficulty_level === 'O\'rtacha'
                                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                              }`}>
                                {item.difficulty_level}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                item.fit_status === 'Normada'
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                              }`}>
                                {item.fit_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Persons Ability Table */}
              <div className="space-y-4">
                <div className="border-b border-stone-200 dark:border-stone-800 pb-3 flex items-center justify-between">
                  <h3 className="font-serif text-xl font-black text-stone-900 dark:text-stone-100">
                    Talabalarning Rasch Qobiliyati (Person Calibration)
                  </h3>
                  <span className="text-xs text-stone-500">{raschReport.persons.length} ta natija</span>
                </div>

                <div className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-stone-50 dark:bg-stone-950/70 border-b border-stone-200 dark:border-stone-800 text-xs font-bold uppercase tracking-wider text-stone-500">
                        <tr>
                          <th className="px-5 py-3.5">Talaba Ismi</th>
                          <th className="px-5 py-3.5">Xom Ball</th>
                          <th className="px-5 py-3.5">Foiz</th>
                          <th className="px-5 py-3.5">Rasch Logit (&beta;)</th>
                          <th className="px-5 py-3.5">Rasch Bali (0-100)</th>
                          <th className="px-5 py-3.5">Xatolik (SE)</th>
                          <th className="px-5 py-3.5">Infit MNSQ</th>
                          <th className="px-5 py-3.5">Outfit MNSQ</th>
                          <th className="px-5 py-3.5">Xulq-atvor Mosligi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
                        {raschReport.persons.map((person: any) => (
                          <tr key={person.attempt_id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                            <td className="px-5 py-3.5 font-bold text-stone-900 dark:text-stone-100">
                              {person.student_name}
                            </td>
                            <td className="px-5 py-3.5 font-medium">
                              {person.raw_score} / {person.max_score}
                            </td>
                            <td className="px-5 py-3.5 font-bold">
                              {person.percent}%
                            </td>
                            <td className="px-5 py-3.5 font-mono font-bold text-amber-700 dark:text-amber-400">
                              {person.ability_logit > 0 ? `+${person.ability_logit}` : person.ability_logit}
                            </td>
                            <td className="px-5 py-3.5 font-serif font-black text-sm text-stone-900 dark:text-stone-100">
                              {person.rasch_scaled_score}
                            </td>
                            <td className="px-5 py-3.5 font-mono text-stone-500">
                              &plusmn;{person.standard_error}
                            </td>
                            <td className="px-5 py-3.5 font-mono">
                              <span className={person.infit_mnsq > 1.3 ? 'text-rose-600 font-bold' : ''}>
                                {person.infit_mnsq}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 font-mono">
                              <span className={person.outfit_mnsq > 1.4 ? 'text-rose-600 font-bold' : ''}>
                                {person.outfit_mnsq}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                person.fit_status === 'Normada'
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                              }`}>
                                {person.fit_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      )}

    </div>
  );
};
