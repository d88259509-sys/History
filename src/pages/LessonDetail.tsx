import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Circle, 
  Edit3, 
  Share2, 
  BookOpen, 
  Bookmark,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useI18n } from '../i18n/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { RichContent } from '../components/RichContent.js';
import { Lesson } from '../types.js';

interface LessonDetailProps {
  id: string;
  navigate: (path: string) => void;
}

export const LessonDetail: React.FC<LessonDetailProps> = ({ id, navigate }) => {
  const { t } = useI18n();
  const { user, isTeacher } = useAuth();
  const { success, error, info } = useToast();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [navigation, setNavigation] = useState<{ prev: any; next: any }>({ prev: null, next: null });
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isToggling, setIsToggling] = useState<boolean>(false);

  useEffect(() => {
    fetchLesson();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const fetchLesson = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('tarix_token');
      const res = await fetch(`/api/lessons/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setLesson(data.lesson);
        setIsCompleted(data.lesson.is_completed === 1);
        setNavigation(data.navigation || { prev: null, next: null });
      } else {
        error(data.error || 'Darslik topilmadi');
      }
    } catch {
      error('Darslikni yuklashda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
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
      success('Havola nusxalandi!');
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
        <h2 className="font-serif text-2xl font-bold">Darslik topilmadi</h2>
        <button
          onClick={() => navigate('/lessons')}
          className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-bold"
        >
          Darsliklarga qaytish
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Top back bar and controls */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/lessons')}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-stone-600 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Barcha darsliklarga qaytish</span>
        </button>

        <div className="flex items-center gap-2">
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
            title="Ulashish"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lesson Hero Header */}
      <div className="space-y-4 border-b border-stone-200 dark:border-stone-800 pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-600/10 text-amber-800 dark:text-amber-300 uppercase tracking-wider">
            {lesson.category}
          </span>
          <span className="text-xs text-stone-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(lesson.created_at).toLocaleDateString('uz-UZ')}</span>
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-amber-950 dark:text-amber-100 leading-tight">
          {lesson.title}
        </h1>

        <p className="text-stone-600 dark:text-stone-400 text-base sm:text-lg leading-relaxed font-sans">
          {lesson.short_description}
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
                <span>{t('lessons.markUncompleted')} (O'zlashtirildi ✓)</span>
              </>
            ) : (
              <>
                <Circle className="w-4 h-4 text-amber-600" />
                <span>{t('lessons.markCompleted')}</span>
              </>
            )}
          </button>

          <span className="text-xs text-stone-500 italic">
            Muallif: Muhammad Ayubxon (Ustoz)
          </span>
        </div>
      </div>

      {/* Main Rich Content & Media */}
      <article className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white/60 dark:bg-stone-900/60 p-6 sm:p-10 shadow-sm backdrop-blur-sm">
        <RichContent
          content={lesson.content || ''}
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
              Darsni to'liq o'qib chiqdingizmi?
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              O'zlashtirish foizingizni oshirish uchun darsni yakunlangan deb belgilang.
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
          {isCompleted ? '✓ O\'zlashtirildi' : t('lessons.markCompleted')}
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
