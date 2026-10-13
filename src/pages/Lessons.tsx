import React, { useState, useEffect } from 'react';
import { 
  Search, 
  BookOpen, 
  CheckCircle2, 
  Circle, 
  Filter, 
  Plus, 
  ArrowRight, 
  Youtube, 
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';
import { useI18n } from '../i18n/index.js';
import { useAuth } from '../context/AuthContext.js';
import { Lesson } from '../types.js';

interface LessonsProps {
  navigate: (path: string) => void;
}

export const Lessons: React.FC<LessonsProps> = ({ navigate }) => {
  const { lang, t } = useI18n();
  const { user, isTeacher } = useAuth();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [progress, setProgress] = useState<{ completed: number; total: number; percent: number }>({
    completed: 0,
    total: 0,
    percent: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const translateCategory = (cat: string) => {
    if (!cat) return '';
    if (cat.includes('Qadimgi') || cat.includes('Древн') || cat.includes('Ancient')) return t('categories.ancient');
    if (cat.includes("O'rta") || cat.includes('Orta') || cat.includes('Средн') || cat.includes('Middle')) return t('categories.middleAges');
    if (cat.includes('Yangi Davr') || cat.includes('Нового') || cat.includes('Modern')) return t('categories.modern');
    if (cat.includes('Eng Yangi') || cat.includes('Новейш') || cat.includes('Contemporary')) return t('categories.contemporary');
    if (cat.includes("O'zbekiston") || cat.includes('Узбекистан') || cat.includes('Uzbekistan')) return t('categories.uzbekistan');
    return cat;
  };

  const fetchLessons = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('tarix_token');
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (selectedLanguage !== 'all') params.set('language', selectedLanguage);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      params.set('active_lang', lang);

      const res = await fetch(`/api/lessons?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setLessons(data.lessons);
        setCategories(data.categories || []);
        if (data.progress) {
          setProgress(data.progress);
        }
      }
    } catch (err) {
      console.error('Failed to fetch lessons:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, [selectedCategory, selectedLanguage, lang]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLessons();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200 dark:border-stone-800 pb-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t('lessons.subtitle')}</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-black text-amber-950 dark:text-amber-100">
            {t('lessons.title')}
          </h1>
          <p className="text-stone-600 dark:text-stone-400 text-sm max-w-xl">
            Tarix fanining asosiy davrlari, muhim sana va voqealar, xalqaro munosabatlar va madaniy taraqqiyot darslari.
          </p>
        </div>

        {isTeacher && (
          <button
            onClick={() => navigate('/teacher/lessons/new')}
            className="shrink-0 px-5 py-3 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 transition-all flex items-center gap-2 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>{t('lessons.addLesson')}</span>
          </button>
        )}
      </div>

      {/* Progress Bar for Students */}
      {user && !isTeacher && progress.total > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl border border-amber-900/15 dark:border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>{t('lessons.progressLabel')}</span>
            </span>
            <span className="font-serif font-black text-amber-800 dark:text-amber-400 text-base">
              {progress.completed} / {progress.total} ({progress.percent}%)
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-700 rounded-full transition-all duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={t('lessons.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </form>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Chapter Category Filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            <option value="all">{t('lessons.allCategories')}</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {translateCategory(cat)}
              </option>
            ))}
          </select>

          {/* Language Filter */}
          <select
            value={selectedLanguage}
            onChange={e => setSelectedLanguage(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            <option value="all">{t('lessons.allLanguages')}</option>
            <option value="uz">🇺🇿 O'zbekcha</option>
            <option value="ru">🇷🇺 Русский</option>
            <option value="en">🇬🇧 English</option>
          </select>
        </div>

      </div>

      {/* Lessons List Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 rounded-2xl bg-stone-200/60 dark:bg-stone-800/60" />
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 space-y-3">
          <BookOpen className="w-12 h-12 text-stone-400 mx-auto" />
          <h3 className="font-serif text-xl font-bold text-stone-800 dark:text-stone-200">
            {t('lessons.empty')}
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson, idx) => (
            <div
              key={lesson.id}
              onClick={() => navigate(`/lessons/${lesson.id}`)}
              className="group cursor-pointer rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 p-6 flex flex-col justify-between hover:border-amber-500/50 hover:shadow-xl transition-all duration-200 relative overflow-hidden"
            >
              {/* Order indicator */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                  {translateCategory(lesson.category)}
                </span>

                {user && (
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      lesson.is_completed === 1
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-stone-500/10 text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    {lesson.is_completed === 1 ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>{t('lessons.completed')}</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-3 h-3 text-stone-400" />
                        <span>{t('lessons.notCompleted')}</span>
                      </>
                    )}
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-6">
                <h3 className="font-serif font-black text-xl text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                  {lesson.title}
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-3 leading-relaxed">
                  {lesson.short_description}
                </p>
              </div>

              {/* Card Footer */}
              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-stone-500">
                  {lesson.youtube_video_id && (
                    <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold" title="Video dars">
                      <Youtube className="w-3.5 h-3.5" />
                      <span>Video</span>
                    </span>
                  )}
                  {lesson.attachment_url && (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold" title="PDF biriktirilgan">
                      <FileText className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </span>
                  )}
                </div>

                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
                  <span>{t('lessons.readLesson')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
