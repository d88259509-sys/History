import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Code, 
  BookOpen, 
  Youtube, 
  FileText, 
  Globe,
  Sparkles,
  Loader2,
  Languages
} from 'lucide-react';
import { useI18n } from '../i18n/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { RichContent } from '../components/RichContent.js';
import { Language } from '../types.js';

interface LessonEditorProps {
  id?: string; // If provided, edit mode
  navigate: (path: string) => void;
}

export const LessonEditor: React.FC<LessonEditorProps> = ({ id, navigate }) => {
  const { t } = useI18n();
  const { isTeacher } = useAuth();
  const { success, error } = useToast();

  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [category, setCategory] = useState('Temuriylar Davri');
  const [content, setContent] = useState('');
  const [youtubeVideoId, setYoutubeVideoId] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [orderIndex, setOrderIndex] = useState(1);
  const [isPublished, setIsPublished] = useState(true);
  const [contentLanguage, setContentLanguage] = useState<Language>('uz');

  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!isTeacher) {
      navigate('/');
      return;
    }

    if (id) {
      fetchExistingLesson();
    }
  }, [id, isTeacher]);

  const fetchExistingLesson = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('tarix_token');
      const res = await fetch(`/api/lessons/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.lesson) {
        const l = data.lesson;
        setTitle(l.title);
        setShortDescription(l.short_description);
        setCategory(l.category);
        setContent(l.content || '');
        setYoutubeVideoId(l.youtube_video_id || '');
        setAttachmentName(l.attachment_name || '');
        setAttachmentUrl(l.attachment_url || '');
        setOrderIndex(l.order_index || 1);
        setIsPublished(l.is_published === 1);
        setContentLanguage(l.content_language || 'uz');
      } else {
        error(data.error || 'Darslik topilmadi');
      }
    } catch {
      error('Xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !shortDescription.trim() || !content.trim()) {
      error('Sarlavha, qisqacha tavsif va darslik matni to\'ldirilishi shart');
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('tarix_token');
      const payload = {
        title: title.trim(),
        short_description: shortDescription.trim(),
        category: category.trim(),
        content,
        youtube_video_id: youtubeVideoId.trim() || null,
        attachment_name: attachmentName.trim() || null,
        attachment_url: attachmentUrl.trim() || null,
        order_index: Number(orderIndex) || 0,
        is_published: isPublished ? 1 : 0,
        content_language: contentLanguage,
      };

      const url = id ? `/api/lessons/${id}` : '/api/lessons';
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        success('Darslik muvaffaqiyatli saqlandi!');
        navigate('/teacher');
      } else {
        error(data.error || 'Saqlashda xatolik yuz berdi');
      }
    } catch {
      error('Xatolik yuz berdi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateTranslations = async () => {
    if (!title.trim() || !shortDescription.trim() || !content.trim()) {
      error('Tarjima qilish uchun avval darslik sarlavhasi, tavsifi va matnini to‘ldiring');
      return;
    }

    setIsTranslating(true);
    try {
      const token = localStorage.getItem('tarix_token');
      let targetId = id;

      // If new lesson, save first
      if (!targetId) {
        const payload = {
          title: title.trim(),
          short_description: shortDescription.trim(),
          category: category.trim(),
          content,
          youtube_video_id: youtubeVideoId.trim() || null,
          attachment_name: attachmentName.trim() || null,
          attachment_url: attachmentUrl.trim() || null,
          order_index: Number(orderIndex) || 0,
          is_published: isPublished ? 1 : 0,
          content_language: contentLanguage,
        };

        const resSave = await fetch('/api/lessons', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        const dataSave = await resSave.json();
        if (dataSave.success && dataSave.lesson) {
          targetId = dataSave.lesson.id;
        } else {
          throw new Error(dataSave.error || 'Darslikni saqlab bo‘lmadi');
        }
      }

      const res = await fetch(`/api/lessons/${targetId}/translate-all`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        success(t('teacher.translationsReady'));
      } else {
        error(data.error || 'Tarjima qilishda xatolik yuz berdi');
      }
    } catch (err: any) {
      error(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsTranslating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 animate-pulse space-y-6">
        <div className="h-10 bg-stone-200 dark:bg-stone-800 rounded w-1/3" />
        <div className="h-64 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top back bar */}
      <div className="flex items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-6">
        <button
          onClick={() => navigate('/teacher')}
          className="inline-flex items-center gap-2 text-sm font-bold text-stone-600 dark:text-stone-400 hover:text-amber-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Ustoz paneliga qaytish</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-1.5 transition-colors"
          >
            {isPreview ? <Code className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{isPreview ? 'Tahrirlash rejimiga qaytish' : 'Oldindan ko\'rish (Preview)'}</span>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="font-serif text-3xl font-black text-amber-950 dark:text-amber-100">
          {id ? 'Darslikni tahrirlash' : 'Yangi darslik yaratish'}
        </h1>
        <p className="text-stone-600 dark:text-stone-400 text-sm">
          Akademik ma'lumotlar, video leksiyalar va qo'shimcha o'quv qo'llanmalarini kiriting.
        </p>
      </div>

      {isPreview ? (
        <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-8 shadow-md space-y-6">
          <div className="space-y-2 border-b border-stone-200 dark:border-stone-800 pb-6">
            <span className="text-xs font-bold uppercase text-amber-700 dark:text-amber-400">
              {category} • {contentLanguage.toUpperCase()}
            </span>
            <h2 className="font-serif text-3xl font-black">{title || 'Darslik sarlavhasi'}</h2>
            <p className="text-stone-600 dark:text-stone-400">{shortDescription || 'Qisqacha tavsif'}</p>
          </div>

          <RichContent
            content={content || '<p>Darslik matni bo\'sh...</p>'}
            youtubeVideoId={youtubeVideoId}
            attachmentName={attachmentName}
            attachmentUrl={attachmentUrl}
          />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-sm space-y-6">
            
            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Darslik Sarlavhasi *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Masalan: Amir Temur va Temuriylar davlati yuksalishi"
                className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-serif font-bold text-base focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            {/* Short description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Qisqacha Tavsif (1-2 gap) *
              </label>
              <textarea
                required
                rows={2}
                value={shortDescription}
                onChange={e => setShortDescription(e.target.value)}
                placeholder="Dars mavzusi va o'rganiladigan asosiy nuqtalar haqida qisqacha ma'lumot"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            {/* Row: Category, Language, Order */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  Bo'lim / Davr (Kategoriya)
                </label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="Temuriylar Davri"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  Kontent Tili
                </label>
                <select
                  value={contentLanguage}
                  onChange={e => setContentLanguage(e.target.value as Language)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="uz">🇺🇿 O'zbekcha</option>
                  <option value="ru">🇷🇺 Русский</option>
                  <option value="en">🇬🇧 English</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  Tartib Raqami (#)
                </label>
                <input
                  type="number"
                  value={orderIndex}
                  onChange={e => setOrderIndex(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </div>

            {/* Media: YouTube Video ID & Attachments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100 dark:border-stone-800">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5 flex items-center gap-1.5">
                  <Youtube className="w-4 h-4 text-rose-500" />
                  <span>YouTube Video ID (Ixtiyoriy)</span>
                </label>
                <input
                  type="text"
                  value={youtubeVideoId}
                  onChange={e => setYoutubeVideoId(e.target.value)}
                  placeholder="e_rO9Yw-fS8"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span>Biriktirilgan PDF fayl nomi</span>
                </label>
                <input
                  type="text"
                  value={attachmentName}
                  onChange={e => setAttachmentName(e.target.value)}
                  placeholder="Qadimgi_Tarix_Xarita.pdf"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </div>

            {/* Rich Content Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Darslikning to'liq matni (HTML / Boyitilgan matn) *
                </label>
                <span className="text-[11px] text-stone-500">
                  HTML teglari qo'llab-quvvatlanadi: &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;blockquote&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;
                </span>
              </div>
              <textarea
                required
                rows={12}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="<h2>Mavzu kirish qismi...</h2><p>Tarixiy manbalar guvohlik berishicha...</p>"
                className="w-full font-mono text-xs sm:text-sm px-4 py-3 rounded-2xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 leading-relaxed"
              />
            </div>

            {/* Publish Toggle */}
            <div className="pt-2 flex items-center gap-3">
              <input
                type="checkbox"
                id="publishCheckbox"
                checked={isPublished}
                onChange={e => setIsPublished(e.target.checked)}
                className="w-5 h-5 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="publishCheckbox" className="text-sm font-bold text-stone-800 dark:text-stone-200 cursor-pointer">
                Darslikni darhol chop etish (Talabalar ko'rishi mumkin)
              </label>
            </div>

          </div>

          {/* Form Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              disabled={isTranslating || isSaving}
              onClick={handleGenerateTranslations}
              className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm border border-amber-600/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 transition-colors flex items-center gap-2 disabled:opacity-60"
              title="Darslikni AI orqali Rus va Ingliz tillariga avtomatik tarjima qilish"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                  <span>{t('teacher.translating')}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>{t('teacher.translateToAll')}</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/teacher')}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-800"
              >
                {t('common.cancel')}
              </button>

              <button
                type="submit"
                disabled={isSaving || isTranslating}
                className="px-7 py-3 rounded-xl font-bold text-sm text-white bg-amber-600 hover:bg-amber-700 active:scale-95 shadow-md flex items-center gap-2 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? t('common.loading') : t('common.save')}</span>
              </button>
            </div>
          </div>
        </form>
      )}

    </div>
  );
};
