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
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [teacherCode, setTeacherCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      error('Barcha maydonlarni to\'ldiring');
      return;
    }

    if (role === 'teacher' && !teacherCode) {
      error(t('auth.teacherSecretCode') + ' kiritilishi shart');
      return;
    }

    setIsLoading(true);
    const res = await register({
      name,
      email,
      password,
      role,
      teacherCode,
      preferredLanguage: lang as Language,
    });
    setIsLoading(false);

    if (res.success) {
      success('Ro\'yxatdan muvaffaqiyatli o\'tdingiz!');
      navigate(role === 'teacher' ? '/teacher' : '/');
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
            Tarix by Muhammad Ayubxon ta'lim tizimiga qo'shiling
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-8 shadow-xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Role Selector Tabs */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2">
                {t('auth.role')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-3 rounded-2xl border flex items-center justify-center gap-2.5 text-sm font-bold transition-all ${
                    role === 'student'
                      ? 'border-amber-600 bg-amber-500/10 text-amber-800 dark:text-amber-300 shadow-sm'
                      : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                  }`}
                >
                  <GraduationCap className="w-5 h-5 text-amber-600" />
                  <span>{t('auth.roleStudent')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`p-3 rounded-2xl border flex items-center justify-center gap-2.5 text-sm font-bold transition-all ${
                    role === 'teacher'
                      ? 'border-amber-600 bg-amber-500/10 text-amber-800 dark:text-amber-300 shadow-sm'
                      : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                  }`}
                >
                  <Shield className="w-5 h-5 text-amber-600" />
                  <span>{t('auth.roleTeacher')}</span>
                </button>
              </div>
            </div>

            {/* If Teacher, secret code field */}
            {role === 'teacher' && (
              <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>{t('auth.teacherSecretCode')}</span>
                </div>
                <input
                  type="text"
                  required
                  value={teacherCode}
                  onChange={e => setTeacherCode(e.target.value)}
                  placeholder="AYUBXON_USTOZ_2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-500/40 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80">
                  {t('auth.teacherCodeHelp')} (kod: <code className="font-bold underline cursor-pointer" onClick={() => setTeacherCode('AYUBXON_USTOZ_2026')}>AYUBXON_USTOZ_2026</code>)
                </p>
              </div>
            )}

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
