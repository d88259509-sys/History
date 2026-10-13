import React, { useState } from 'react';
import { BookOpen, UserPlus, Shield, GraduationCap, KeyRound, AlertCircle } from 'lucide-react';
import { useI18n } from '../i18n/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Language } from '../types.js';

interface RegisterProps {
  navigate: (path: string) => void;
}

export const Register: React.FC<RegisterProps> = ({ navigate }) => {
  const { lang, t } = useI18n();
  const { register } = useAuth();
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      error('Barcha maydonlarni to\'ldiring');
      return;
    }

    setIsLoading(true);
    const res = await register({
      name,
      email,
      password,
      role: 'student',
      preferredLanguage: lang as Language,
    });
    setIsLoading(false);

    if (res.success) {
      success('Ro\'yxatdan muvaffaqiyatli o\'tdingiz!');
      navigate('/');
    } else {
      error(res.error || 'Ro\'yxatdan o\'tishda xatolik yuz berdi');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-900 items-center justify-center text-amber-100 shadow-md mx-auto mb-2">
            <BookOpen className="w-6 h-6 text-amber-200" />
          </div>
          <h2 className="font-serif text-3xl font-black text-amber-950 dark:text-amber-100">
            {t('auth.registerTitle')}
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Talabalar uchun tarix ta'lim tizimiga qo'shilish
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-8 shadow-xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Account Role Notice */}
            <div className="p-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200 font-bold">
                <GraduationCap className="w-4 h-4 text-amber-600" />
                <span>Talaba hisobi</span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-amber-700 dark:text-amber-400 hover:underline font-semibold"
              >
                Ustoz paneli uchun kirish &rarr;
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                {t('auth.name')}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Alisher Qodirov"
                className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

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
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Kamida 6 ta belgi"
                className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-900/10 disabled:opacity-60"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isLoading ? t('auth.registering') : t('auth.registerBtn')}</span>
            </button>
          </form>
        </div>

        {/* Login prompt */}
        <div className="text-center text-sm text-stone-600 dark:text-stone-400">
          <span>{t('auth.haveAccount')} </span>
          <button
            onClick={() => navigate('/login')}
            className="font-bold text-amber-700 dark:text-amber-400 hover:underline"
          >
            {t('auth.loginBtn')}
          </button>
        </div>

      </div>
    </div>
  );
};
