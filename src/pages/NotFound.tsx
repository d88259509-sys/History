import React from 'react';
import { BookOpen, Compass, ArrowLeft } from 'lucide-react';
import { useI18n } from '../i18n/index.js';

interface NotFoundProps {
  navigate: (path: string) => void;
}

export const NotFound: React.FC<NotFoundProps> = ({ navigate }) => {
  const { t } = useI18n();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-amber-600/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
          <Compass className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <span className="font-mono font-black text-6xl text-amber-800 dark:text-amber-400 block">
            404
          </span>
          <h1 className="font-serif text-3xl font-black text-stone-900 dark:text-stone-100">
            {t('common.notFoundTitle')}
          </h1>
          <p className="text-stone-600 dark:text-stone-400 text-sm">
            {t('common.notFoundDesc')}
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-xl font-bold text-sm bg-amber-600 hover:bg-amber-700 text-white shadow-md inline-flex items-center gap-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.backHome')}</span>
        </button>
      </div>
    </div>
  );
};
