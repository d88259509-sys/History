import React, { useState } from 'react';
import { 
  BookOpen, 
  Sun, 
  Moon, 
  Globe, 
  Menu, 
  X, 
  GraduationCap, 
  FileCheck2, 
  LayoutDashboard, 
  LogOut, 
  User as UserIcon,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { useI18n } from '../i18n/index.js';
import { useTheme } from '../context/ThemeContext.js';
import { useAuth } from '../context/AuthContext.js';
import { Language } from '../types.js';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const { lang, setLang, t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, isTeacher, logout } = useAuth();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'uz', label: "O'zbek", flag: '🇺🇿' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  const handleNav = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-amber-900/10 dark:border-amber-500/20 bg-amber-50/80 dark:bg-stone-950/80 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo / Brand Name */}
        <div 
          onClick={() => handleNav('/')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 flex items-center justify-center text-amber-100 shadow-md shadow-amber-900/20 group-hover:scale-105 transition-transform">
            <BookOpen className="w-6 h-6 text-amber-200" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-black text-lg sm:text-xl tracking-tight text-amber-950 dark:text-amber-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              Tarix by Muhammad Ayubxon
            </span>
            <span className="text-[10px] uppercase tracking-widest text-amber-800/70 dark:text-amber-400/70 font-semibold hidden sm:inline">
              Akademik Tarix Portali
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => handleNav('/')}
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              currentPath === '/' 
                ? 'text-amber-900 dark:text-amber-300 bg-amber-600/10 dark:bg-amber-400/10' 
                : 'text-stone-700 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-stone-200/50 dark:hover:bg-stone-800/50'
            }`}
          >
            {t('nav.home')}
          </button>

          <button
            onClick={() => handleNav('/lessons')}
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
              currentPath.startsWith('/lessons') 
                ? 'text-amber-900 dark:text-amber-300 bg-amber-600/10 dark:bg-amber-400/10' 
                : 'text-stone-700 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-stone-200/50 dark:hover:bg-stone-800/50'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>{t('nav.lessons')}</span>
          </button>

          <button
            onClick={() => handleNav('/tests')}
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
              currentPath.startsWith('/tests') 
                ? 'text-amber-900 dark:text-amber-300 bg-amber-600/10 dark:bg-amber-400/10' 
                : 'text-stone-700 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-stone-200/50 dark:hover:bg-stone-800/50'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>{t('nav.tests')}</span>
          </button>

          {isAuthenticated && !isTeacher && (
            <button
              onClick={() => handleNav('/my-results')}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                currentPath === '/my-results' 
                  ? 'text-amber-900 dark:text-amber-300 bg-amber-600/10 dark:bg-amber-400/10' 
                  : 'text-stone-700 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-stone-200/50 dark:hover:bg-stone-800/50'
              }`}
            >
              {t('nav.myResults')}
            </button>
          )}

          {isAuthenticated && isTeacher ? (
            <button
              onClick={() => handleNav('/teacher')}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                currentPath.startsWith('/teacher') 
                  ? 'text-amber-900 dark:text-amber-300 bg-amber-600/10 dark:bg-amber-400/10 font-bold' 
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-600/10'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{t('nav.teacherDashboard')}</span>
            </button>
          ) : (
            <button
              onClick={() => handleNav('/login?role=teacher&redirect=/teacher')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 transition-colors flex items-center gap-1.5 border border-amber-600/20"
              title="Muhammad Ayubxon uchun ustoz paneli"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('nav.teacherDashboard')}</span>
            </button>
          )}
        </nav>

        {/* Right Tools: Language, Theme, Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Language Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-stone-300 dark:border-stone-800 bg-white/70 dark:bg-stone-900/80 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 shadow-sm transition-colors"
            >
              <Globe className="w-4 h-4 text-amber-600" />
              <span>{languages.find(l => l.code === lang)?.label}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>

            {langDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setLangDropdownOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-36 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xl py-1 z-40 animate-in fade-in zoom-in-95 duration-150">
                  {languages.map(l => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full px-3.5 py-2 text-left text-xs sm:text-sm flex items-center gap-2.5 transition-colors ${
                        lang === l.code
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold'
                          : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === 'dark' ? "Yorug' rejimga o'tish (Light mode)" : "Qorong'u rejimga o'tish (Dark mode)"}
            className="p-2.5 rounded-xl border border-stone-300 dark:border-stone-800 bg-white/80 dark:bg-stone-900/90 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-stone-700" />
            )}
          </button>

          {/* Auth Button or User Menu */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-amber-900/15 dark:border-amber-500/30 bg-amber-600/10 dark:bg-amber-500/10 hover:bg-amber-600/20 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-tight max-w-[120px] truncate">
                    {user?.name}
                  </span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold capitalize">
                    {user?.role === 'teacher' ? t('nav.teacher') : t('nav.student')}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-stone-500 hidden sm:inline" />
              </button>

              {userMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setUserMenuOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xl py-2 z-40 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-stone-100 dark:border-stone-800">
                      <p className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">{user?.name}</p>
                      <p className="text-xs text-stone-500 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400">
                        {user?.role === 'teacher' ? `👑 ${t('nav.teacher')}` : `🎓 ${t('nav.student')}`}
                      </span>
                    </div>

                    {isTeacher && (
                      <button
                        onClick={() => handleNav('/teacher')}
                        className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 text-stone-700 dark:text-stone-300 hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-amber-600" />
                        <span>{t('nav.teacherDashboard')}</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleNav('/profile')}
                      className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-stone-500" />
                      <span>{t('nav.profile')}</span>
                    </button>

                    <div className="border-t border-stone-100 dark:border-stone-800 my-1" />

                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                        handleNav('/');
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('nav.logout')}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNav('/login')}
                className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
              >
                {t('nav.login')}
              </button>
              <button
                onClick={() => handleNav('/register')}
                className="px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-sm shadow-amber-900/20 transition-all active:scale-95"
              >
                {t('nav.register')}
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 dark:border-stone-800 bg-amber-50 dark:bg-stone-950 px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-4 duration-200">
          <button
            onClick={() => handleNav('/')}
            className="w-full px-4 py-3 rounded-xl text-left text-base font-semibold text-stone-800 dark:text-stone-200 hover:bg-amber-600/10 flex items-center gap-3"
          >
            <span>{t('nav.home')}</span>
          </button>
          <button
            onClick={() => handleNav('/lessons')}
            className="w-full px-4 py-3 rounded-xl text-left text-base font-semibold text-stone-800 dark:text-stone-200 hover:bg-amber-600/10 flex items-center gap-3"
          >
            <GraduationCap className="w-5 h-5 text-amber-600" />
            <span>{t('nav.lessons')}</span>
          </button>
          <button
            onClick={() => handleNav('/tests')}
            className="w-full px-4 py-3 rounded-xl text-left text-base font-semibold text-stone-800 dark:text-stone-200 hover:bg-amber-600/10 flex items-center gap-3"
          >
            <FileCheck2 className="w-5 h-5 text-amber-600" />
            <span>{t('nav.tests')}</span>
          </button>
          {isAuthenticated && !isTeacher && (
            <button
              onClick={() => handleNav('/my-results')}
              className="w-full px-4 py-3 rounded-xl text-left text-base font-semibold text-stone-800 dark:text-stone-200 hover:bg-amber-600/10 flex items-center gap-3"
            >
              <span>{t('nav.myResults')}</span>
            </button>
          )}
          {isAuthenticated && isTeacher ? (
            <button
              onClick={() => handleNav('/teacher')}
              className="w-full px-4 py-3 rounded-xl text-left text-base font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 flex items-center gap-3"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>{t('nav.teacherDashboard')}</span>
            </button>
          ) : (
            <button
              onClick={() => handleNav('/login?role=teacher&redirect=/teacher')}
              className="w-full px-4 py-3 rounded-xl text-left text-base font-semibold text-amber-800 dark:text-amber-300 bg-amber-500/10 flex items-center gap-3 border border-amber-600/20"
            >
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <span>{t('nav.teacherDashboard')}</span>
            </button>
          )}

          {/* Mobile Language Switcher */}
          <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('common.language')}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {languages.map(l => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLang(l.code);
                    setMobileMenuOpen(false);
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    lang === l.code
                      ? 'border-amber-600 bg-amber-600 text-white shadow-sm'
                      : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Theme Toggle */}
          <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
            <button
              onClick={toggleTheme}
              className="w-full px-4 py-3 rounded-xl text-left text-sm font-semibold text-stone-800 dark:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-amber-400" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-600" />
                )}
                <span>{theme === 'dark' ? t('common.darkMode') : t('common.lightMode')}</span>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-600/20">
                {t('common.themeToggle')}
              </span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
