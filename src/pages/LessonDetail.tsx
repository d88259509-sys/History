import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Circle, 
  Edit3, 
  Share2, 
  BookOpen, 
  Calendar,
  Sparkles,
  Globe,
  Loader2,
  Languages
} from 'lucide-react';
import { useI18n } from '../i18n/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { RichContent } from '../components/RichContent.js';
import { Lesson, Language } from '../types.js';

interface LessonDetailProps {
  id: string;
  navigate: (path: string) => void;
}

export const LessonDetail: React.FC<LessonDetailProps> = ({ id, navigate }) => {
  const { lang, setLang, t } = useI18n();
  const { user, isTeacher } = useAuth();
  const { success, error, info } = useToast();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [originalLesson, setOriginalLesson] = useState<any>(null);
  const [isTranslated, setIsTranslated] = useState<boolean>(false);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [navigation, setNavigation] = useState<{ prev: any; next: any }>({ prev: null, next: null });
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isToggling, setIsToggling] = useState<boolean>(false);

  useEffect(() => {
    fetchLesson(lang);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id, lang]);

  const fetchLesson = async (targetLang: Language) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('tarix_token');
      const res = await fetch(`/api/lessons/${id}?lang=${targetLang}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setLesson(data.lesson);
        setOriginalLesson(data.original || data.lesson);
        setIsTranslated(data.is_translated === true);
        setShowOriginal(false);
        setIsCompleted(data.lesson.is_completed === 1);
        setNavigation(data.navigation || { prev: null, next: null });
      } else {
        error(data.error || t('lessons.lessonNotFound'));
      }
    } catch {
      error('Darslikni yuklashda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualTranslate = async (targetLanguage: Language) => {
    setIsTranslating(true);
    try {
      setLang(targetLanguage);
      const res = await fetch(`/api/lessons/${id}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_language: targetLanguage, force: true }),
      });
      const data = await res.json();
      if (data.success && data.translation) {
        setLesson((prev: any) => ({
          ...prev,
          title: data.translation.title,
          short_description: data.translation.short_description,
          category: data.translation.category,
          content: data.translation.content,
        }));
        setIsTranslated(true);
        setShowOriginal(false);
        success(t('teacher.translationsReady'));
      }
    } catch {
      error('Tarjima qilishda xatolik yuz berdi');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleToggleCompletion = async () => {
    if (!user) {
      info('Darslikni o\'zlashtirganlik holatini saqlash uchun tizimga kiring');
      navigate('/login?redirect=/lessons/' + id);
      return;
    }

    setIsToggling(true);
    try {
      const token = localStorage.getItem('tarix_token');
      const res = await fetch(`/api/lessons/${id}/toggle-completion`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setIsCompleted(data.is_completed === 1);
        if (data.is_completed === 1) {
          success('Barakalla! Dars o\'zlashtirilgan deb belgilandi.');
        } else {
          info('Dars holati yangilandi');
        }
      }
    } catch {
      error('Xatolik yuz berdi');
    } finally {
      setIsToggling(false);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      success(t('lessons.copiedLink'));
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-stone-200 dark:bg-stone-800 rounded" />
        <div className="h-12 w-3/4 bg-stone-200 dark:bg-stone-800 rounded" />
        <div className="h-64 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
        <BookOpen className="w-12 h-12 text-stone-400 mx-auto" />
        <h2 className="font-serif text-2xl font-bold">{t('lessons.lessonNotFound')}</h2>
        <button
          onClick={() => navigate('/lessons')}
          className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-bold"
        >
          {t('lessons.allLessonsBack')}
        </button>
      </div>
    );
  }

  const activeContent = showOriginal && originalLesson ? originalLesson : lesson;
  const langLabels: Record<string, string> = {
    uz: "O'zbekcha",
    ru: 'Русский',
    en: 'English'
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top back bar and controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate('/lessons')}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-stone-600 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('lessons.allLessonsBack')}</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Language quick switcher pills for this lesson */}
          <div className="flex items-center bg-stone-100 dark:bg-stone-800/80 p-1 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold">
            <span className="px-2 text-stone-500 hidden sm:inline flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-amber-600" />
            </span>
            {(['uz', 'ru', 'en'] as Language[]).map(lCode => (
              <button
                key={lCode}
                disabled={isTranslating}
                onClick={() => {
                  setLang(lCode);
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  lang === lCode
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-700'
                }`}
              >
                {lCode === 'uz' ? '🇺🇿 UZ' : lCode === 'ru' ? '🇷🇺 RU' : '🇬🇧 EN'}
              </button>
            ))}
          </div>

          {isTeacher && (
            <button
              onClick={() => navigate(`/teacher/lessons/${lesson.id}/edit`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-600/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{t('lessons.editLesson')}</span>
            </button>
          )}

          <button
            onClick={handleShare}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title={t('lessons.share')}
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AI Translation Notice Banner */}
      {isTranslated && (
        <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-amber-500/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {t('lessons.translatedNotice', { lang: langLabels[lang] || lang })}
            </span>
          </div>
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="px-3 py-1 rounded-lg font-bold bg-white dark:bg-stone-900 border border-amber-500/30 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-stone-800 transition-colors"
          >
            {showOriginal
              ? t('lessons.viewTranslated', { lang: lang.toUpperCase() })
              : t('lessons.viewOriginal', { lang: (originalLesson?.content_language || 'UZ').toUpperCase() })}
          </button>
        </div>
      )}

      {/* Translating Indicator */}
      {isTranslating && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
          <span>{t('lessons.translating')}</span>
        </div>
      )}

      {/* Lesson Hero Header */}
      <div className="space-y-4 border-b border-stone-200 dark:border-stone-800 pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-600/10 text-amber-800 dark:text-amber-300 uppercase tracking-wider">
            {activeContent.category}
          </span>
          <span className="text-xs text-stone-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(lesson.created_at).toLocaleDateString()}</span>
          </span>
          {showOriginal && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
              Asl nusxa ({originalLesson?.content_language?.toUpperCase() || 'UZ'})
            </span>
          )}
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-amber-950 dark:text-amber-100 leading-tight">
          {activeContent.title}
        </h1>

        <p className="text-stone-600 dark:text-stone-400 text-base sm:text-lg leading-relaxed font-sans">
          {activeContent.short_description}
        </p>

        {/* Completion status bar */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={handleToggleCompletion}
            disabled={isToggling}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all duration-200 active:scale-95 ${
              isCompleted
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/10'
                : 'border border-amber-600/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-300'
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>{t('lessons.markUncompleted')} (✓)</span>
              </>
            ) : (
              <>
                <Circle className="w-4 h-4 text-amber-600" />
                <span>{t('lessons.markCompleted')}</span>
              </>
            )}
          </button>

          <span className="text-xs text-stone-500 italic">
            {t('lessons.author')}
          </span>
        </div>
      </div>

      {/* Main Rich Content & Media */}
      <article className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white/60 dark:bg-stone-900/60 p-6 sm:p-10 shadow-sm backdrop-blur-sm">
        <RichContent
          content={activeContent.content || ''}
          youtubeVideoId={lesson.youtube_video_id}
          attachmentName={lesson.attachment_name}
          attachmentUrl={lesson.attachment_url}
        />
      </article>

      {/* Post-reading completion CTA banner */}
      <div className="p-6 rounded-2xl border border-amber-900/15 dark:border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-amber-700/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-600 text-white shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-base">
              {t('lessons.finishedReading')}
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              {t('lessons.finishedReadingDesc')}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleCompletion}
          disabled={isToggling}
          className={`shrink-0 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow transition-all ${
            isCompleted
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-amber-600 text-white hover:bg-amber-700'
          }`}
        >
          {isCompleted ? '✓ ' + t('lessons.completed') : t('lessons.markCompleted')}
        </button>
      </div>

      {/* Previous and Next Lesson Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-stone-200 dark:border-stone-800">
        {navigation.prev ? (
          <button
            onClick={() => navigate(`/lessons/${navigation.prev.id}`)}
            className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 hover:border-amber-500/40 text-left space-y-1 transition-all group"
          >
            <div className="text-[11px] font-bold text-stone-500 flex items-center gap-1 group-hover:text-amber-600">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('lessons.previousLesson')}</span>
            </div>
            <div className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
              {navigation.prev.title}
            </div>
          </button>
        ) : (
          <div className="hidden sm:block" />
        )}

        {navigation.next && (
          <button
            onClick={() => navigate(`/lessons/${navigation.next.id}`)}
            className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 hover:border-amber-500/40 text-right space-y-1 transition-all group sm:col-start-2"
          >
            <div className="text-[11px] font-bold text-stone-500 flex items-center justify-end gap-1 group-hover:text-amber-600">
              <span>{t('lessons.nextLesson')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
            <div className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
              {navigation.next.title}
            </div>
          </button>
        )}
      </div>

    </div>
  );
};
