import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Globe, 
  Lock, 
  Moon, 
  Sun, 
  Save, 
  ShieldCheck, 
  GraduationCap,
  LogOut
} from 'lucide-react';
import { useI18n } from '../i18n/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { useToast } from '../context/ToastContext.js';
import { Language } from '../types.js';

interface ProfileProps {
  navigate: (path: string) => void;
}

export const Profile: React.FC<ProfileProps> = ({ navigate }) => {
  const { lang, setLang, t } = useI18n();
  const { user, isTeacher, updateProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { success, error } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [preferredLang, setPreferredLang] = useState<Language>(user?.preferred_language || (lang as Language));
  const [isUpdating, setIsUpdating] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Ism kiritilishi shart');
      return;
    }

    setIsUpdating(true);
    const res = await updateProfile(name.trim(), preferredLang);
    setIsUpdating(false);

    if (res.success) {
      setLang(preferredLang);
      success('Profil ma\'lumotlari saqlandi!');
    } else {
      error(res.error || 'Xatolik yuz berdi');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      error('Barcha parol maydonlarini to\'ldiring');
      return;
    }
    if (newPassword.length < 6) {
      error('Yangi parol kamida 6 belgidan iborat bo\'lishi kerak');
      return;
    }
    if (newPassword !== confirmPassword) {
      error('Yangi parollar mos kelmadi');
      return;
    }

    setIsChangingPass(true);
    try {
      const token = localStorage.getItem('tarix_token');
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        success('Parol muvaffaqiyatli o\'zgartirildi!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        error(data.error || 'Parolni o\'zgartirishda xatolik');
      }
    } catch {
      error('Xatolik yuz berdi');
    } finally {
      setIsChangingPass(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-6 space-y-2">
        <h1 className="font-serif text-3xl font-black text-amber-950 dark:text-amber-100">
          {t('nav.profile')}
        </h1>
        <p className="text-stone-600 dark:text-stone-400 text-sm">
          Shaxsiy hisob ma'lumotlari, til va xavfsizlik sozlamalari
        </p>
      </div>

      {/* Profile Info Form */}
      <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4 border-b border-stone-100 dark:border-stone-800 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold text-2xl uppercase shadow-md">
            {user.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-serif font-black text-xl text-stone-900 dark:text-stone-100">
              {user.name}
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 mt-1">
              {isTeacher ? <ShieldCheck className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
              <span>{isTeacher ? 'Ustoz (O\'qituvchi)' : 'Talaba / O\'quvchi'}</span>
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
              Ism va Familiya
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
              Elektron pochta manzili
            </label>
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-800 text-stone-500 text-sm cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Afzal ko'rilgan til
              </label>
              <select
                value={preferredLang}
                onChange={e => setPreferredLang(e.target.value as Language)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-sm font-semibold focus:outline-none"
              >
                <option value="uz">🇺🇿 O'zbekcha</option>
                <option value="ru">🇷🇺 Русский</option>
                <option value="en">🇬🇧 English</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Mavzu (Theme)
              </label>
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-sm font-bold flex items-center justify-between"
              >
                <span>{theme === 'dark' ? 'Qorong\'u rejim (Dark)' : 'Yorug\' rejim (Light)'}</span>
                {theme === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-600" />}
              </button>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isUpdating}
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 shadow-sm disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{isUpdating ? 'Saqlanmoqda...' : 'O\'zgarishlarni saqlash'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-stone-100 dark:border-stone-800 pb-3 flex items-center gap-2">
          <Lock className="w-5 h-5 text-amber-600" />
          <h3 className="font-serif font-black text-lg text-stone-900 dark:text-stone-100">
            Parolni o'zgartirish
          </h3>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
              Joriy parol
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Yangi parol
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Kamida 6 belgi"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Yangi parolni tasdiqlang
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Qayta kiriting"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isChangingPass}
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-white flex items-center gap-2 shadow-sm disabled:opacity-60"
            >
              <Lock className="w-4 h-4" />
              <span>{isChangingPass ? 'O\'zgartirilmoqda...' : 'Yangi parolni o\'rnatish'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Logout button */}
      <div className="text-center pt-2">
        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('nav.logout')}</span>
        </button>
      </div>

    </div>
  );
};
