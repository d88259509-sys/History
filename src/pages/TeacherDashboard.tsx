import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  FileCheck2, 
  Users, 
  Award, 
  Plus, 
  Edit3, 
  Trash2, 
  RotateCw, 
  Copy, 
  Check, 
  Eye, 
  ArrowRight,
  Download,
  KeyRound,
  ShieldCheck,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useI18n } from '../i18n/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { ConfirmModal } from '../components/ConfirmModal.js';
import { Lesson, Test } from '../types.js';

interface TeacherDashboardProps {
  navigate: (path: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ navigate }) => {
  const { t } = useI18n();
  const { user, isTeacher } = useAuth();
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'lessons' | 'tests'>('overview');
  const [stats, setStats] = useState<any>({
    totalLessons: 0,
    totalTests: 0,
    totalStudents: 0,
    totalAttempts: 0,
    averagePercent: 0,
    passRate: 0,
  });
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'lesson' | 'test';
    id: string;
    title: string;
  }>({ isOpen: false, type: 'lesson', id: '', title: '' });

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { login } = useAuth();
  const [loginUsername, setLoginUsername] = useState('muhammadayubxon');
  const [loginPassword, setLoginPassword] = useState('ustoz_ma');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [finalizeModal, setFinalizeModal] = useState<{
    isOpen: boolean;
    testId: string;
    testTitle: string;
  }>({ isOpen: false, testId: '', testTitle: '' });
  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    if (isTeacher) {
      loadAllData();
    } else {
      setIsLoading(false);
    }
  }, [isTeacher]);

  const handleTeacherDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    const res = await login(loginUsername.trim(), loginPassword);
    setIsLoggingIn(false);
    if (res.success && res.user?.role === 'teacher') {
      success('Muhammad Ayubxon ustoz paneliga xush kelibsiz!');
      loadAllData();
    } else {
      error(res.error || 'Login yoki parol noto\'g\'ri');
    }
  };

  const confirmFinalizeTest = async () => {
    if (!finalizeModal.testId) return;
    setIsFinalizing(true);
    const token = localStorage.getItem('tarix_token');
    try {
      const res = await fetch(`/api/tests/${finalizeModal.testId}/finalize`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        success('Test yakunlandi va Rash modeli bo\'yicha tahlil qilindi!');
        setFinalizeModal({ isOpen: false, testId: '', testTitle: '' });
        navigate(`/teacher/tests/${finalizeModal.testId}/results`);
      } else {
        error(data.error || 'Xatolik yuz berdi');
      }
    } catch {
      error('Xatolik yuz berdi');
    } finally {
      setIsFinalizing(false);
    }
  };

  const loadAllData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('tarix_token');
    try {
      const [statsRes, lessonsRes, testsRes] = await Promise.all([
        fetch('/api/stats/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/lessons', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/tests', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [statsData, lessonsData, testsData] = await Promise.all([
        statsRes.json(),
        lessonsRes.json(),
        testsRes.json(),
      ]);

      if (statsData.success) {
        setStats(statsData.stats);
        setRecentAttempts(statsData.recentAttempts || []);
      }
      if (lessonsData.success) setLessons(lessonsData.lessons || []);
      if (testsData.success) setTests(testsData.tests || []);
    } catch {
      error('Ma\'lumotlarni yuklashda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    success(`Kod ${code} nusxalandi!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleRegenerateCode = async (testId: string) => {
    const token = localStorage.getItem('tarix_token');
    try {
      const res = await fetch(`/api/tests/${testId}/regenerate-code`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        success(`Yangi kod hosil qilindi: ${data.access_code}`);
        setTests(prev => prev.map(t => t.id === testId ? { ...t, access_code: data.access_code } : t));
      } else {
        error(data.error || 'Xatolik');
      }
    } catch {
      error('Xatolik yuz berdi');
    }
  };

  const confirmDelete = async () => {
    const token = localStorage.getItem('tarix_token');
    try {
      const endpoint = deleteModal.type === 'lesson'
        ? `/api/lessons/${deleteModal.id}`
        : `/api/tests/${deleteModal.id}`;

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        success('Muvaffaqiyatli o\'chirildi');
        if (deleteModal.type === 'lesson') {
          setLessons(prev => prev.filter(l => l.id !== deleteModal.id));
        } else {
          setTests(prev => prev.filter(t => t.id !== deleteModal.id));
        }
      } else {
        error(data.error || 'O\'chirishda xatolik');
      }
    } catch {
      error('Xatolik yuz berdi');
    } finally {
      setDeleteModal({ isOpen: false, type: 'lesson', id: '', title: '' });
    }
  };

  if (!isTeacher) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-900 items-center justify-center text-amber-100 shadow-xl mx-auto mb-2">
              <ShieldCheck className="w-7 h-7 text-amber-200" />
            </div>
            <h2 className="font-serif text-3xl font-black text-amber-950 dark:text-amber-100">
              Muhammad Ayubxon Ustoz Paneli
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Ushbu sahifa faqat platforma ustozi uchun ajratilgan
            </p>
          </div>

          <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-8 shadow-xl space-y-6">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-900 dark:text-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                <span>Ustoz hisobi ma'lumotlari:</span>
              </div>
              <p className="text-[11px] text-stone-600 dark:text-stone-400">
                Login: <strong className="font-mono text-amber-700 dark:text-amber-400">muhammadayubxon</strong> | 
                Parol: <strong className="font-mono text-amber-700 dark:text-amber-400">ustoz_ma</strong>
              </p>
            </div>

            <form onSubmit={handleTeacherDirectLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  Ustoz Logini
                </label>
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  Ustoz Paroli
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-900/10 disabled:opacity-60"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isLoggingIn ? 'Tekshirilmoqda...' : 'Ustoz Paneliga Kirish'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-stone-200 dark:border-stone-800 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Ustoz / Admin Boshqaruvi</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-black text-amber-950 dark:text-amber-100 mt-2">
            {t('teacher.dashboardTitle')}
          </h1>
          <p className="text-stone-600 dark:text-stone-400 text-sm mt-1">
            {t('teacher.welcome', { name: user?.name || 'Ustoz' })}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/teacher/lessons/new')}
            className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-white flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t('teacher.createLesson')}</span>
          </button>

          <button
            onClick={() => navigate('/teacher/tests/new')}
            className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t('teacher.createTest')}</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>{t('teacher.statsLessons')}</span>
            <BookOpen className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-black text-stone-900 dark:text-stone-100">
            {stats.totalLessons}
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>{t('teacher.statsTests')}</span>
            <FileCheck2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-black text-stone-900 dark:text-stone-100">
            {stats.totalTests}
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>{t('teacher.statsStudents')}</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-black text-stone-900 dark:text-stone-100">
            {stats.totalStudents}
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>{t('teacher.statsAttempts')}</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-black text-stone-900 dark:text-stone-100">
            {stats.totalAttempts}
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-2 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>{t('teacher.statsAvgScore')}</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-black text-emerald-600">
            {stats.averagePercent}%
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${
            activeTab === 'overview'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800'
          }`}
        >
          {t('teacher.overviewTab')}
        </button>

        <button
          onClick={() => setActiveTab('lessons')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${
            activeTab === 'lessons'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800'
          }`}
        >
          {t('teacher.manageLessons')} ({lessons.length})
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${
            activeTab === 'tests'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800'
          }`}
        >
          {t('teacher.manageTests')} ({tests.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW & RECENT ATTEMPTS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl font-black text-stone-900 dark:text-stone-100">
              {t('teacher.recentAttempts')}
            </h3>
            <span className="text-xs text-stone-500">So'nggi 8 ta urinish</span>
          </div>

          {recentAttempts.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-dashed border-stone-300 dark:border-stone-800 text-stone-500">
              Hali talabalar tomonidan testlar topshirilmadi.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50 dark:bg-stone-950/70 border-b border-stone-200 dark:border-stone-800 text-xs font-bold uppercase tracking-wider text-stone-500">
                    <tr>
                      <th className="px-6 py-4">Talaba</th>
                      <th className="px-6 py-4">Test</th>
                      <th className="px-6 py-4">Kod</th>
                      <th className="px-6 py-4">Ball</th>
                      <th className="px-6 py-4">Foiz</th>
                      <th className="px-6 py-4">Holat</th>
                      <th className="px-6 py-4">Sana</th>
                      <th className="px-6 py-4 text-right">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {recentAttempts.map(att => (
                      <tr key={att.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                        <td className="px-6 py-4 font-bold text-stone-900 dark:text-stone-100">
                          {att.student_name}
                        </td>
                        <td className="px-6 py-4 font-serif text-stone-800 dark:text-stone-200">
                          {att.test_title}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-xs text-amber-700 dark:text-amber-400">
                          {att.access_code}
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {att.score} / {att.total_points}
                        </td>
                        <td className="px-6 py-4 font-bold font-serif">
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
                          {new Date(att.completed_at).toLocaleDateString('uz-UZ')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => navigate(`/teacher/tests/${att.test_id}/results`)}
                            className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline"
                          >
                            Barcha natijalar
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
      )}

      {/* TAB 2: MANAGE LESSONS */}
      {activeTab === 'lessons' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl font-black text-stone-900 dark:text-stone-100">
              {t('teacher.manageLessons')}
            </h3>
            <button
              onClick={() => navigate('/teacher/lessons/new')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('lessons.addLesson')}</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 dark:bg-stone-950/70 border-b border-stone-200 dark:border-stone-800 text-xs font-bold uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">Mavzu</th>
                  <th className="px-6 py-4">Bo'lim</th>
                  <th className="px-6 py-4">Til</th>
                  <th className="px-6 py-4">Holat</th>
                  <th className="px-6 py-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {lessons.map((lesson, idx) => (
                  <tr key={lesson.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                    <td className="px-6 py-4 font-bold text-stone-400">{lesson.order_index || idx + 1}</td>
                    <td className="px-6 py-4 font-serif font-bold text-stone-900 dark:text-stone-100">
                      {lesson.title}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-stone-600 dark:text-stone-400">
                      {lesson.category}
                    </td>
                    <td className="px-6 py-4 text-xs uppercase font-bold text-stone-500">
                      {lesson.content_language || 'uz'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        lesson.is_published === 1
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                      }`}>
                        {lesson.is_published === 1 ? 'Chop etilgan' : 'Qoralama'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => navigate(`/lessons/${lesson.id}`)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800"
                        title="Ko'rish"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/teacher/lessons/${lesson.id}/edit`)}
                        className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-500/10"
                        title="Tahrirlash"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModal({
                          isOpen: true,
                          type: 'lesson',
                          id: lesson.id,
                          title: lesson.title
                        })}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MANAGE TESTS */}
      {activeTab === 'tests' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl font-black text-stone-900 dark:text-stone-100">
              {t('teacher.manageTests')}
            </h3>
            <button
              onClick={() => navigate('/teacher/tests/new')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('teacher.createTest')}</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 dark:bg-stone-950/70 border-b border-stone-200 dark:border-stone-800 text-xs font-bold uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="px-6 py-4">Test Nomi</th>
                  <th className="px-6 py-4">Maxsus Kod</th>
                  <th className="px-6 py-4">Savollar</th>
                  <th className="px-6 py-4">Vaqt</th>
                  <th className="px-6 py-4">O'tish Bali</th>
                  <th className="px-6 py-4">Urinishlar</th>
                  <th className="px-6 py-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {tests.map(test => (
                  <tr key={test.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                    <td className="px-6 py-4 font-serif font-bold text-stone-900 dark:text-stone-100 max-w-xs truncate">
                      {test.title}
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                          {test.access_code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(test.access_code)}
                          className="p-1 rounded text-stone-400 hover:text-amber-600"
                          title="Nusxalash"
                        >
                          {copiedCode === test.access_code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleRegenerateCode(test.id)}
                          className="p-1 rounded text-stone-400 hover:text-amber-600"
                          title="Kodni yangilash"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-stone-700 dark:text-stone-300">
                      {test.question_count || 0} ta
                    </td>
                    <td className="px-6 py-4 text-xs text-stone-500">
                      {test.time_limit_minutes} daq
                    </td>
                    <td className="px-6 py-4 font-bold text-amber-700 dark:text-amber-400">
                      {test.passing_score}%
                    </td>
                    <td className="px-6 py-4 font-bold">
                      {test.attempt_count || 0} marta
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {test.is_active === 1 ? (
                        <button
                          onClick={() => setFinalizeModal({ isOpen: true, testId: test.id, testTitle: test.title })}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 shadow-sm transition-colors"
                          title="Testni yakunlash va Rash modeli bo'yicha hisoblash"
                        >
                          Yakunlash (Rash)
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/teacher/tests/${test.id}/results`)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 transition-colors"
                          title="Rash Modeli tahlili"
                        >
                          Rash Tahlili
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/teacher/tests/${test.id}/results`)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                        title="Natijalar"
                      >
                        Natijalar
                      </button>
                      <button
                        onClick={() => navigate(`/teacher/tests/${test.id}/edit`)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800"
                        title="Tahrirlash"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModal({
                          isOpen: true,
                          type: 'test',
                          id: test.id,
                          title: test.title
                        })}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Finalize Test & Compute Rasch Model Modal */}
      <ConfirmModal
        isOpen={finalizeModal.isOpen}
        title="Testni yakunlash va Rash modeli tahlilini hisoblash"
        description={`"${finalizeModal.testTitle}" testini yakunlab, barcha natijalarni Rash psixometrik modeli (Item Response Theory) bo'yicha tahlil qilishni tasdiqlaysizmi? Test yakunlangach, yangi talabalar test topshira olmaydi va ilmiy tahlil hisoboti chiqariladi.`}
        confirmLabel="Yakunlash va Tahlil qilish"
        onConfirm={confirmFinalizeTest}
        onClose={() => setFinalizeModal({ isOpen: false, testId: '', testTitle: '' })}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title={deleteModal.type === 'lesson' ? 'Darslikni o\'chirish' : 'Testni o\'chirish'}
        description={`"${deleteModal.title}" ni haqiqatan ham butunlay o'chirmoqchimisiz? Barcha unga bog'liq natijalar ham o'chib ketadi.`}
        confirmLabel="O'chirish"
        onConfirm={confirmDelete}
        onClose={() => setDeleteModal({ isOpen: false, type: 'lesson', id: '', title: '' })}
      />

    </div>
  );
};
