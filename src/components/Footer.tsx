import React from 'react';
import { BookOpen, ShieldCheck, Award, Heart } from 'lucide-react';
import { useI18n } from '../i18n/index.js';

interface FooterProps {
  navigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  const { t } = useI18n();

  return (
    <footer className="w-full border-t border-amber-900/10 dark:border-amber-500/20 bg-stone-100/90 dark:bg-stone-950 text-stone-700 dark:text-stone-300 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-900 flex items-center justify-center text-amber-100 shadow-md">
                <BookOpen className="w-5 h-5 text-amber-200" />
              </div>
              <span className="font-serif font-black text-xl text-amber-950 dark:text-amber-100">
                Tarix by Muhammad Ayubxon
              </span>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-400 max-w-md leading-relaxed">
              O'zbekiston va jahon tarixining eng yorqin sahifalari, qadimiy tamaddunlar va buyuk allomalar merosini chuqur o'rganish uchun yaratilgan zamonaviy ta'lim maskani.
            </p>
            <div className="pt-2 flex items-center gap-3 text-xs text-amber-800 dark:text-amber-400 font-semibold">
              <Award className="w-4 h-4" />
              <span>Muallif: Muhammad Ayubxon (Tarix fani ustozi)</span>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-sm uppercase tracking-wider text-amber-950 dark:text-amber-200">
              Bo'limlar
            </h4>
            <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
              <li>
                <button onClick={() => navigate('/')} className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                  {t('nav.home')}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/lessons')} className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                  {t('nav.lessons')}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/tests')} className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                  {t('nav.tests')}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/register')} className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                  {t('nav.register')}
                </button>
              </li>
            </ul>
          </div>

          {/* Historical quote */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-sm uppercase tracking-wider text-amber-950 dark:text-amber-200">
              Hikmat
            </h4>
            <blockquote className="p-4 rounded-xl border border-amber-900/10 dark:border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/20 text-xs italic text-stone-700 dark:text-stone-300 leading-relaxed font-serif">
              "Davlat agar adolat qonunlari ustiga qurilmasa, u uzoq yashay olmaydi. Kuch — adolatdadir!"
              <span className="block mt-2 font-bold not-italic text-amber-800 dark:text-amber-400">— Amir Temur</span>
            </blockquote>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 dark:text-stone-500">
          <div>
            © {new Date().getFullYear()} Tarix by Muhammad Ayubxon. Barcha huquqlar himoyalangan.
          </div>
          <div className="flex items-center gap-1">
            <span>Ilm va ma'rifat ulashuvchi platforma</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
