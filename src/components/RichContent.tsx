import React from 'react';
import { Download, FileText, Youtube } from 'lucide-react';
import { useI18n } from '../i18n/index.js';

interface RichContentProps {
  content: string;
  youtubeVideoId?: string | null;
  attachmentName?: string | null;
  attachmentUrl?: string | null;
}

export const RichContent: React.FC<RichContentProps> = ({
  content,
  youtubeVideoId,
  attachmentName,
  attachmentUrl,
}) => {
  const { t } = useI18n();

  return (
    <div className="space-y-8">
      {/* YouTube Embedded Video */}
      {youtubeVideoId && (
        <div className="rounded-2xl overflow-hidden border border-amber-900/10 dark:border-amber-500/20 shadow-lg bg-stone-900">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 border-b border-stone-800 text-xs font-semibold text-amber-400">
            <Youtube className="w-4 h-4 text-rose-500" />
            <span>{t('lessons.videoLecture')}</span>
          </div>
          <div className="aspect-video w-full">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}`}
              title="YouTube video lecture"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Rich Text Body */}
      <div
        className="prose prose-stone dark:prose-invert max-w-none text-stone-800 dark:text-stone-200 leading-relaxed font-sans
        prose-headings:font-serif prose-headings:font-bold prose-headings:text-amber-950 dark:prose-headings:text-amber-200
        prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-amber-900/10 dark:prose-h2:border-amber-500/20 prose-h2:pb-2
        prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
        prose-blockquote:border-l-4 prose-blockquote:border-amber-500 prose-blockquote:bg-amber-50/50 dark:prose-blockquote:bg-amber-950/20 prose-blockquote:p-4 prose-blockquote:rounded-r-xl prose-blockquote:italic
        prose-ul:list-disc prose-ul:pl-6 prose-li:my-1.5
        prose-ol:list-decimal prose-ol:pl-6 prose-li:my-1.5
        prose-strong:text-amber-900 dark:prose-strong:text-amber-300
        prose-p:my-3"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* Attachment download */}
      {attachmentUrl && (
        <div className="mt-8 p-4 rounded-xl border border-amber-900/15 dark:border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-lg bg-amber-600/10 text-amber-700 dark:text-amber-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                {t('lessons.materials')}
              </div>
              <div className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                {attachmentName || 'Material.pdf'}
              </div>
            </div>
          </div>
          <a
            href={attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{t('lessons.downloadPdf')}</span>
          </a>
        </div>
      )}
    </div>
  );
};
