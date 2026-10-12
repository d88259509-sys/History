import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  ArrowRight, 
  KeyRound, 
  CheckCircle2, 
  Compass, 
  ShieldCheck, 
  Sparkles, 
  GraduationCap, 
  Award, 
  Clock, 
  ChevronRight,
  Flame
} from 'lucide-react';
import { useI18n } from '../i18n/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Lesson, Test } from '../types.js';

interface HomeProps {
  navigate: (path: string) => void;
}

export const Home: React.FC<HomeProps> = ({ navigate }) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { error } = useToast();

  const [testCode, setTestCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [featuredLessons, setFeaturedLessons] = useState<Lesson[]>([]);
  const [availableTests, setAvailableTests] = useState<Test[]>([]);
  const [stats, setStats] = useState({ lessonsCount: 6, testsCount: 3, studentsCount: 15 });

  useEffect(() => {
    // Fetch featured lessons
    fetch('/api/lessons')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.lessons) {
          setFeaturedLessons(data.lessons.slice(0, 3));
          setStats(prev => ({ ...prev, lessonsCount: data.lessons.length }));
        }
      })
      .catch(() => {});

    // Fetch tests
    fetch('/api/tests', {
      headers: localStorage.getItem('tarix_token') ? { Authorization: `Bearer ${localStorage.getItem('tarix_token')}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.tests) {
          setAvailableTests(data.tests.slice(0, 3));
          setStats(prev => ({ ...prev, testsCount: data.tests.length }));
        }
      })
      .catch(() => {});
  }, []);

  const handleStartWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = testCode.trim().toUpperCase();
    if (!cleanCode) {
      error(t('tests.codeRequired'));
      return;
    }
    if (cleanCode.length !== 6) {
      error(t('tests.codeLengthError'));
      return;
    }

    if (!localStorage.getItem('tarix_token')) {
      navigate('/login?redirect=/tests/take/' + cleanCode);
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch(`/api/tests/verify-code/${cleanCode}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('tarix_token')}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        error(data.error || 'Test kodi noto\'g\'ri');
      } else {
        navigate(`/tests/take/${cleanCode}`);
      }
    } catch {
      error('Xatolik yuz berdi');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-24 pb-20">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:pb-24">
        {/* Subtle decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-amber-500/10 dark:bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Headlines & CTA */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('hero.badge')}</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black text-amber-950 dark:text-amber-100 leading-[1.15] tracking-tight">
                {t('hero.titlePrefix')}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 dark:from-amber-400 dark:to-amber-200 underline decoration-amber-500/30 underline-offset-8">
                  {t('hero.titleHighlight')}
                </span>
              </h1>

              <p className="text-base sm:text-lg text-stone-700 dark:text-stone-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-sans">
                {t('hero.subtitle')}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={() => navigate('/lessons')}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-900 shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-95 text-base"
                >
                  <BookOpen className="w-5 h-5 text-amber-200" />
                  <span>{t('hero.startLearning')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => navigate('/tests')}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-stone-800 dark:text-stone-200 bg-white/80 dark:bg-stone-900/80 border border-stone-300 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-center gap-2.5 shadow-sm transition-all duration-200 text-base"
                >
                  <KeyRound className="w-5 h-5 text-amber-600" />
                  <span>{t('hero.enterTestCode')}</span>
                </button>
              </div>

              {/* Quick statistics row */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-amber-900/10 dark:border-amber-500/20 max-w-lg mx-auto lg:mx-0 text-center sm:text-left">
                <div>
                  <div className="text-2xl sm:text-3xl font-black font-serif text-amber-900 dark:text-amber-300">
                    {stats.lessonsCount}+
                  </div>
                  <div className="text-xs font-semibold text-stone-600 dark:text-stone-400">
                    {t('hero.statsLessons')}
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black font-serif text-amber-900 dark:text-amber-300">
                    {stats.testsCount}+
                  </div>
                  <div className="text-xs font-semibold text-stone-600 dark:text-stone-400">
                    {t('hero.statsTests')}
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black font-serif text-amber-900 dark:text-amber-300">
                    96%
                  </div>
                  <div className="text-xs font-semibold text-stone-600 dark:text-stone-400">
                    {t('hero.statsSuccess')}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Code Entry Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl border border-amber-900/15 dark:border-amber-500/20 bg-stone-50/90 dark:bg-stone-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-sm space-y-6">
                
                <div className="flex items-center gap-3 border-b border-stone-200 dark:border-stone-800 pb-4">
                  <div className="p-3 rounded-2xl bg-amber-600/10 text-amber-600 dark:text-amber-400 shrink-0">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-serif font-black text-lg text-stone-900 dark:text-stone-100">
                      {t('tests.enterCodeTitle')}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Ustozingiz bergan kod bilan sinovni boshlang
                    </p>
                  </div>
                </div>

                <form onSubmit={handleStartWithCode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-2">
                      6 xonali unikal test kodi
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        value={testCode}
                        onChange={e => setTestCode(e.target.value.toUpperCase())}
                        placeholder="TEMUR1"
                        className="w-full text-center text-2xl font-mono font-black tracking-widest px-4 py-3.5 rounded-xl border-2 border-amber-500/30 dark:border-amber-500/40 bg-white dark:bg-stone-950 text-amber-900 dark:text-amber-200 focus:outline-none focus:border-amber-600 shadow-inner uppercase"
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-stone-500 text-center">
                      Misol uchun mavjud kodlar: <span className="font-mono font-bold text-amber-700 dark:text-amber-400">TEMUR1</span>, <span className="font-mono font-bold text-amber-700 dark:text-amber-400">IPAK99</span>, <span className="font-mono font-bold text-amber-700 dark:text-amber-400">TARIX7</span>
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
                  >
                    <span>{isVerifying ? t('tests.checking') : t('tests.checkCode')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    Test natijalari va ballar serverda xolisona hisoblanadi. Vaqt yakunlanganda avtomatik yuboriladi.
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <h2 className="font-serif text-3xl sm:text-4xl font-black text-amber-950 dark:text-amber-100">
            {t('features.title')}
          </h2>
          <p className="text-stone-600 dark:text-stone-400 text-base leading-relaxed">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 shadow-sm space-y-3 hover:border-amber-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-600/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
              {t('features.f1Title')}
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              {t('features.f1Desc')}
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 shadow-sm space-y-3 hover:border-amber-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-600/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
              {t('features.f2Title')}
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              {t('features.f2Desc')}
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 shadow-sm space-y-3 hover:border-amber-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-600/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
              {t('features.f3Title')}
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              {t('features.f3Desc')}
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 shadow-sm space-y-3 hover:border-amber-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-600/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
              {t('features.f4Title')}
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              {t('features.f4Desc')}
            </p>
          </div>
        </div>
      </section>

      {/* Featured Lessons Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              Ilmiy dastur
            </span>
            <h2 className="font-serif text-3xl font-black text-amber-950 dark:text-amber-100 mt-1">
              Saralangan Darsliklar
            </h2>
          </div>
          <button
            onClick={() => navigate('/lessons')}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-700 dark:text-amber-400 hover:underline"
          >
            <span>Barcha darslarni ko'rish</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredLessons.map(lesson => (
            <div
              key={lesson.id}
              onClick={() => navigate(`/lessons/${lesson.id}`)}
              className="group cursor-pointer rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 p-6 flex flex-col justify-between hover:border-amber-500/50 hover:shadow-xl transition-all duration-200"
            >
              <div className="space-y-3">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-600/10 text-amber-800 dark:text-amber-300">
                  {lesson.category}
                </span>
                <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
                  {lesson.title}
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-3 leading-relaxed">
                  {lesson.short_description}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400">
                <span>Darsni o'qish</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Author & Teacher Bio Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-amber-900/15 dark:border-amber-500/20 bg-gradient-to-br from-amber-950 via-stone-900 to-amber-950 text-white p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
              <Award className="w-4 h-4" />
              <span>Platforma Asoschisi va Muallifi</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl font-black text-amber-100">
              Muhammad Ayubxon
            </h2>

            <p className="text-amber-100/90 text-base sm:text-lg leading-relaxed font-sans">
              "Tarix — bu shunchaki o'tgan yillar va sanalar ro'yxati emas. Bu ajdodlarimizning xatolari, g'alabalari, madaniyati va ruhiyati ifodasidir. Ushbu platforma har bir talabaga tariximizni zerikarli yodlashdan xalos bo'lib, chin dildan his qilish va teran tushunish imkonini beradi."
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4 text-xs sm:text-sm font-semibold text-amber-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Akademik manbalar asosida tuzilgan darslar</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Interaktiv testlar va xolis baholash</span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
