import React, { useState } from 'react';
import { BookOpen, LogIn, KeyRound, Sparkles, UserCheck, Shield } from 'lucide-react';
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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      error('Elektron pochta va parolni to\'ldiring');
      return;
    }

    setIsLoading(true);
    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      success('Tizimga muvaffaqiyatli kirdingiz!');
      if (redirectUrl) {
        navigate(redirectUrl);
      } else {
        navigate('/');
      }
    } else {
      error(res.error || 'Kirishda xatolik yuz berdi');
    }
  };

  const fillCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-900 items-center justify-center text-amber-100 shadow-md mx-auto mb-2">
            <BookOpen className="w-6 h-6 text-amber-200" />
          </div>
          <h2 className="font-serif text-3xl font-black text-amber-950 dark:text-amber-100">
            {t('auth.loginTitle')}
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Tarix by Muhammad Ayubxon platformasiga xush kelibsiz
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-8 shadow-xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                {t('auth.email')}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="namuna@tarix.uz"
                className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                {t('auth.password')}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-900/10 disabled:opacity-60"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? t('auth.loggingIn') : t('auth.loginBtn')}</span>
            </button>
          </form>

          {/* Quick Demo Logins Box */}
          <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-2.5">
            <span className="block text-xs font-bold text-stone-500 uppercase tracking-wider text-center">
              Tezkor sinov hisoblari
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('teacher@tarix.uz', 'TarixTeacher2026!')}
                className="p-2.5 rounded-xl text-xs font-semibold border border-amber-600/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-900 dark:text-amber-300 flex items-center justify-center gap-1.5 transition-colors text-center"
              >
                <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Ustoz (Admin)</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('student@tarix.uz', 'TarixStudent2026!')}
                className="p-2.5 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 flex items-center justify-center gap-1.5 transition-colors text-center"
              >
                <UserCheck className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400 shrink-0" />
                <span>Talaba</span>
              </button>
            </div>
          </div>
        </div>

        {/* Register prompt */}
        <div className="text-center text-sm text-stone-600 dark:text-stone-400">
          <span>{t('auth.noAccount')} </span>
          <button
            onClick={() => navigate('/register')}
            className="font-bold text-amber-700 dark:text-amber-400 hover:underline"
          >
            {t('auth.registerBtn')}
          </button>
        </div>

      </div>
    </div>
  );
};
