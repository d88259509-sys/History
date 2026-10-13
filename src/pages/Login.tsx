import React, { useState, useEffect } from 'react';
import { BookOpen, LogIn, ShieldCheck, GraduationCap, Lock, CheckCircle2 } from 'lucide-react';
import { useI18n } from '../i18n/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';

interface LoginProps {
  navigate: (path: string) => void;
  redirectUrl?: string;
}

export const Login: React.FC<LoginProps> = ({ navigate, redirectUrl }) => {
  const { t } = useI18n();
  const { login } = useAuth();
  const { success, error } = useToast();

  const [mode, setMode] = useState<'student' | 'teacher'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('role') === 'teacher' || redirectUrl?.includes('teacher')) {
      setMode('teacher');
      setEmail('muhammadayubxon');
      setPassword('ustoz_ma');
    }
  }, [redirectUrl]);

  const handleSelectMode = (newMode: 'student' | 'teacher') => {
    setMode(newMode);
    if (newMode === 'teacher') {
      setEmail('muhammadayubxon');
      setPassword('ustoz_ma');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      error('Login va parolni to\'ldiring');
      return;
    }

    setIsLoading(true);
    const res = await login(email.trim(), password);
    setIsLoading(false);

    if (res.success) {
      success('Tizimga muvaffaqiyatli kirdingiz!');
      if (res.user?.role === 'teacher') {
        navigate('/teacher');
      } else if (redirectUrl) {
        navigate(redirectUrl);
      } else {
        navigate('/');
      }
    } else {
      error(res.error || 'Kirishda xatolik yuz berdi');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 items-center justify-center text-amber-100 shadow-xl mx-auto mb-2">
            <BookOpen className="w-7 h-7 text-amber-200" />
          </div>
          <h2 className="font-serif text-3xl font-black text-amber-950 dark:text-amber-100">
            {mode === 'teacher' ? "Ustoz Paneli Kirishi" : t('auth.loginTitle')}
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            {mode === 'teacher' 
              ? "Muhammad Ayubxon uchun maxsus boshqaruv tizimi" 
              : "Tarix by Muhammad Ayubxon platformasiga xush kelibsiz"}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="p-1 rounded-2xl bg-stone-200/80 dark:bg-stone-800/80 flex gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleSelectMode('student')}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mode === 'student'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-amber-600" />
            <span>Talaba Kirishi</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectMode('teacher')}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mode === 'teacher'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Ustoz (Muhammad Ayubxon)</span>
          </button>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-8 shadow-xl space-y-6">
          {mode === 'teacher' && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-900 dark:text-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Ustoz paneli yagona login va parol bilan himoyalangan:</span>
              </div>
              <p className="text-[11px] text-stone-600 dark:text-stone-400">
                Login: <strong className="font-mono text-amber-700 dark:text-amber-400">muhammadayubxon</strong> | 
                Parol: <strong className="font-mono text-amber-700 dark:text-amber-400">ustoz_ma</strong>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                {mode === 'teacher' ? 'Ustoz Logini' : 'Login / Elektron pochta'}
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={mode === 'teacher' ? 'muhammadayubxon' : 'namuna@tarix.uz'}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                {mode === 'teacher' ? 'Ustoz Paroli' : t('auth.password')}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'teacher' ? 'ustoz_ma' : '••••••••'}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-900/10 disabled:opacity-60"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? t('auth.loggingIn') : (mode === 'teacher' ? "Ustoz Paneliga Kirish" : t('auth.loginBtn'))}</span>
            </button>
          </form>
        </div>

        {/* Register prompt for students only */}
        {mode === 'student' && (
          <div className="text-center text-sm text-stone-600 dark:text-stone-400">
            <span>{t('auth.noAccount')} </span>
            <button
              onClick={() => navigate('/register')}
              className="font-bold text-amber-700 dark:text-amber-400 hover:underline"
            >
              {t('auth.registerBtn')}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
