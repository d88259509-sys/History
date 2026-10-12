import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  HelpCircle, 
  CheckCircle2, 
  Sparkles,
  KeyRound,
  FileCheck2,
  Clock,
  Award
} from 'lucide-react';
import { useI18n } from '../i18n/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { QuestionType, Language } from '../types.js';

interface TestEditorProps {
  id?: string;
  navigate: (path: string) => void;
}

interface EditableQuestion {
  id: string;
  question_text: string;
  question_type: QuestionType;
  options: { id: string; text: string }[];
  correct_answers: string[];
  points: number;
  explanation: string;
}

export const TestEditor: React.FC<TestEditorProps> = ({ id, navigate }) => {
  const { t } = useI18n();
  const { isTeacher } = useAuth();
  const { success, error } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(20);
  const [passingScore, setPassingScore] = useState(60);
  const [isActive, setIsActive] = useState(true);
  const [allowRetakes, setAllowRetakes] = useState(true);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [showExplanations, setShowExplanations] = useState(true);
  const [contentLanguage, setContentLanguage] = useState<Language>('uz');

  const [questions, setQuestions] = useState<EditableQuestion[]>([
    {
      id: 'q_' + Math.random().toString(36).substring(2, 8),
      question_text: '',
      question_type: 'single',
      options: [
        { id: 'opt_1', text: '' },
        { id: 'opt_2', text: '' },
        { id: 'opt_3', text: '' },
        { id: 'opt_4', text: '' },
      ],
      correct_answers: ['opt_1'],
      points: 5,
      explanation: '',
    }
  ]);

  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isTeacher) {
      navigate('/');
      return;
    }
    if (id) {
      fetchExistingTest();
    }
  }, [id, isTeacher]);

  const fetchExistingTest = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('tarix_token');
      const res = await fetch(`/api/tests/${id}/teacher-details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.test) {
        const tObj = data.test;
        setTitle(tObj.title);
        setDescription(tObj.description);
        setTimeLimitMinutes(tObj.time_limit_minutes || 20);
        setPassingScore(tObj.passing_score || 60);
        setIsActive(tObj.is_active === 1);
        setAllowRetakes(tObj.allow_retakes === 1);
        setShuffleQuestions(tObj.shuffle_questions === 1);
        setShowExplanations(tObj.show_explanations === 1);
        setContentLanguage(tObj.content_language || 'uz');

        if (Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions.map((q: any) => ({
            id: q.id,
            question_text: q.question_text,
            question_type: q.question_type,
            options: q.options || [],
            correct_answers: q.correct_answers || [],
            points: q.points || 5,
            explanation: q.explanation || '',
          })));
        }
      }
    } catch {
      error('Testni yuklashda xatolik');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddQuestion = () => {
    const newQ: EditableQuestion = {
      id: 'q_' + Math.random().toString(36).substring(2, 8),
      question_text: '',
      question_type: 'single',
      options: [
        { id: 'opt_1', text: '' },
        { id: 'opt_2', text: '' },
        { id: 'opt_3', text: '' },
        { id: 'opt_4', text: '' },
      ],
      correct_answers: ['opt_1'],
      points: 5,
      explanation: '',
    };
    setQuestions(prev => [...prev, newQ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) {
      error('Testda kamida bitta savol bo\'lishi kerak');
      return;
    }
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, patch: Partial<EditableQuestion>) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, ...patch } : q));
  };

  const updateOptionText = (qIdx: number, optIdx: number, text: string) => {
    setQuestions(prev => {
      const q = prev[qIdx];
      const newOpts = [...q.options];
      newOpts[optIdx] = { ...newOpts[optIdx], text };
      return prev.map((item, i) => i === qIdx ? { ...item, options: newOpts } : item);
    });
  };

  const addOption = (qIdx: number) => {
    setQuestions(prev => {
      const q = prev[qIdx];
      const newOptId = 'opt_' + (q.options.length + 1);
      return prev.map((item, i) => i === qIdx ? {
        ...item,
        options: [...item.options, { id: newOptId, text: '' }]
      } : item);
    });
  };

  const removeOption = (qIdx: number, optIdx: number) => {
    setQuestions(prev => {
      const q = prev[qIdx];
      if (q.options.length <= 2) {
        error('Kamida 2 ta javob varianti bo\'lishi shart');
        return prev;
      }
      const removedId = q.options[optIdx].id;
      const newOpts = q.options.filter((_, i) => i !== optIdx);
      const newCorrect = q.correct_answers.filter(id => id !== removedId);
      return prev.map((item, i) => i === qIdx ? {
        ...item,
        options: newOpts,
        correct_answers: newCorrect.length > 0 ? newCorrect : [newOpts[0].id]
      } : item);
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      error('Test nomi va tavsifi to\'ldirilishi kerak');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        error(`${i + 1}-savolning matni kiritilmagan`);
        return;
      }
      if (q.question_type === 'single' || q.question_type === 'multiple') {
        const emptyOpts = q.options.some(o => !o.text.trim());
        if (emptyOpts) {
          error(`${i + 1}-savoldagi barcha variantlar matni to'ldirilishi kerak`);
          return;
        }
        if (q.correct_answers.length === 0) {
          error(`${i + 1}-savolda to'g'ri javob belgilanmagan`);
          return;
        }
      } else if (q.question_type === 'text') {
        if (q.correct_answers.length === 0 || !q.correct_answers[0].trim()) {
          error(`${i + 1}-savolda to'g'ri yozma javob kiritilmagan`);
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('tarix_token');
      const payload = {
        title: title.trim(),
        description: description.trim(),
        time_limit_minutes: Number(timeLimitMinutes) || 20,
        passing_score: Number(passingScore) || 60,
        is_active: isActive ? 1 : 0,
        allow_retakes: allowRetakes ? 1 : 0,
        shuffle_questions: shuffleQuestions ? 1 : 0,
        show_explanations: showExplanations ? 1 : 0,
        content_language: contentLanguage,
        questions,
      };

      const url = id ? `/api/tests/${id}` : '/api/tests';
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        success(id ? 'Test yangilandi!' : `Test yaratildi! Maxsus Kod: ${data.access_code}`);
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

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 space-y-6 animate-pulse">
        <div className="h-10 bg-stone-200 dark:bg-stone-800 rounded w-1/3" />
        <div className="h-64 bg-stone-200 dark:bg-stone-800 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top back bar */}
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-6">
        <button
          onClick={() => navigate('/teacher')}
          className="inline-flex items-center gap-2 text-sm font-bold text-stone-600 dark:text-stone-400 hover:text-amber-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Ustoz paneliga qaytish</span>
        </button>

        <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
          Savollar soni: {questions.length} ta
        </span>
      </div>

      <div className="space-y-2">
        <h1 className="font-serif text-3xl font-black text-amber-950 dark:text-amber-100">
          {id ? 'Testni tahrirlash' : 'Yangi test yaratish'}
        </h1>
        <p className="text-stone-600 dark:text-stone-400 text-sm">
          Testni saqlaganingizda tizim avtomatik ravishda unikal 6 xonali maxfiy kod yaratadi.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Test Settings Card */}
        <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="font-serif font-black text-lg text-stone-900 dark:text-stone-100 border-b border-stone-100 dark:border-stone-800 pb-3">
            Asosiy Parametrlar
          </h3>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
              Test Nomi *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Masalan: Amir Temur davri va Temuriylar saltanati testi"
              className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-serif font-bold text-base focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
              Tavsif (Test haqida yo'riqnoma) *
            </label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ushbu test orqali Sohibqiron Amir Temurning hayoti va harbiy san'ati bo'yicha bilimlar tekshiriladi."
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {/* Row: Time, Pass score, Language */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Vaqt (Daqiqa)</span>
              </label>
              <input
                type="number"
                min={1}
                max={180}
                required
                value={timeLimitMinutes}
                onChange={e => setTimeLimitMinutes(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>O'tish Bali (%)</span>
              </label>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={passingScore}
                onChange={e => setPassingScore(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Til
              </label>
              <select
                value={contentLanguage}
                onChange={e => setContentLanguage(e.target.value as Language)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="uz">🇺🇿 O'zbekcha</option>
                <option value="ru">🇷🇺 Русский</option>
                <option value="en">🇬🇧 English</option>
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs sm:text-sm font-semibold">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Test faol (talabalar kod orqali kira oladi)</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={allowRetakes}
                onChange={e => setAllowRetakes(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Qayta topshirishga ruxsat berish</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={e => setShuffleQuestions(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Savol va variantlar tartibini aralashtirish</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showExplanations}
                onChange={e => setShowExplanations(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Javoblardan so'ng tahlil & izohlarni ko'rsatish</span>
            </label>
          </div>
        </div>

        {/* Question Builder Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-black text-2xl text-stone-900 dark:text-stone-100">
              Savollar Ro'yxati
            </h3>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi savol qo'shish</span>
            </button>
          </div>

          <div className="space-y-6">
            {questions.map((q, qIdx) => (
              <div
                key={q.id || qIdx}
                className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-sm space-y-6 relative"
              >
                {/* Question Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
                  <span className="font-serif font-black text-lg text-amber-900 dark:text-amber-300">
                    Savol {qIdx + 1}
                  </span>

                  <div className="flex items-center gap-3">
                    {/* Type selection */}
                    <select
                      value={q.question_type}
                      onChange={e => {
                        const newType = e.target.value as QuestionType;
                        let defOpts = q.options;
                        let defCorrect = q.correct_answers;
                        if (newType === 'true_false') {
                          defOpts = [];
                          defCorrect = ['true'];
                        } else if (newType === 'text') {
                          defOpts = [];
                          defCorrect = [''];
                        } else if (defOpts.length === 0) {
                          defOpts = [
                            { id: 'opt_1', text: '' },
                            { id: 'opt_2', text: '' },
                            { id: 'opt_3', text: '' },
                            { id: 'opt_4', text: '' },
                          ];
                          defCorrect = ['opt_1'];
                        }
                        updateQuestion(qIdx, { question_type: newType, options: defOpts, correct_answers: defCorrect });
                      }}
                      className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-xs font-bold focus:outline-none"
                    >
                      <option value="single">Bitta to'g'ri javob</option>
                      <option value="multiple">Bir nechta to'g'ri javob</option>
                      <option value="true_false">To'g'ri / Noto'g'ri</option>
                      <option value="text">Qisqa yozma javob</option>
                    </select>

                    {/* Points */}
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <span>Ball:</span>
                      <input
                        type="number"
                        min={1}
                        value={q.points}
                        onChange={e => updateQuestion(qIdx, { points: Number(e.target.value) || 1 })}
                        className="w-14 px-2 py-1 rounded-lg border border-stone-300 dark:border-stone-700 text-center font-bold"
                      />
                    </div>

                    {/* Delete Question */}
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10"
                      title="Savolni o'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                    Savol Matni *
                  </label>
                  <input
                    type="text"
                    required
                    value={q.question_text}
                    onChange={e => updateQuestion(qIdx, { question_text: e.target.value })}
                    placeholder="Masalan: Amir Temurning davlat boshqaruvidagi bosh shiori qaysi edi?"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-serif font-bold text-base focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                {/* Question Options Builder based on type */}
                <div className="space-y-3 pt-2">
                  
                  {/* Single Choice Options */}
                  {q.question_type === 'single' && (
                    <div className="space-y-2.5">
                      <span className="text-xs font-bold text-stone-500 block">
                        Variantlar (To'g'ri javobni tanlash uchun chapdagi doirachani bosing):
                      </span>
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = q.correct_answers.includes(opt.id);
                        return (
                          <div key={opt.id} className="flex items-center gap-3">
                            <input
                              type="radio"
                              name={`single_correct_${q.id}`}
                              checked={isCorrect}
                              onChange={() => updateQuestion(qIdx, { correct_answers: [opt.id] })}
                              className="w-4 h-4 text-amber-600 focus:ring-amber-500 cursor-pointer"
                              title="To'g'ri javob sifatida belgilash"
                            />
                            <input
                              type="text"
                              required
                              value={opt.text}
                              onChange={e => updateOptionText(qIdx, oIdx, e.target.value)}
                              placeholder={`Variant ${oIdx + 1}`}
                              className={`flex-1 px-3.5 py-2 rounded-xl border text-sm focus:outline-none ${
                                isCorrect
                                  ? 'border-emerald-500 bg-emerald-500/5 font-semibold text-emerald-950 dark:text-emerald-100'
                                  : 'border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950'
                              }`}
                            />
                            {q.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeOption(qIdx, oIdx)}
                                className="p-1 rounded text-stone-400 hover:text-rose-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => addOption(qIdx)}
                        className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1 pt-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Variant qo'shish</span>
                      </button>
                    </div>
                  )}

                  {/* Multiple Choice Options */}
                  {q.question_type === 'multiple' && (
                    <div className="space-y-2.5">
                      <span className="text-xs font-bold text-stone-500 block">
                        Variantlar (Barcha to'g'ri javob variantlarini katakcha orqali belgilang):
                      </span>
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = q.correct_answers.includes(opt.id);
                        return (
                          <div key={opt.id} className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isCorrect}
                              onChange={e => {
                                const checked = e.target.checked;
                                let newCorrect = [...q.correct_answers];
                                if (checked && !newCorrect.includes(opt.id)) {
                                  newCorrect.push(opt.id);
                                } else if (!checked) {
                                  newCorrect = newCorrect.filter(id => id !== opt.id);
                                }
                                updateQuestion(qIdx, { correct_answers: newCorrect });
                              }}
                              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                            <input
                              type="text"
                              required
                              value={opt.text}
                              onChange={e => updateOptionText(qIdx, oIdx, e.target.value)}
                              placeholder={`Variant ${oIdx + 1}`}
                              className={`flex-1 px-3.5 py-2 rounded-xl border text-sm focus:outline-none ${
                                isCorrect
                                  ? 'border-emerald-500 bg-emerald-500/5 font-semibold text-emerald-950 dark:text-emerald-100'
                                  : 'border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950'
                              }`}
                            />
                            {q.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeOption(qIdx, oIdx)}
                                className="p-1 rounded text-stone-400 hover:text-rose-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => addOption(qIdx)}
                        className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1 pt-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Variant qo'shish</span>
                      </button>
                    </div>
                  )}

                  {/* True / False Selection */}
                  {q.question_type === 'true_false' && (
                    <div className="flex items-center gap-4 pt-2">
                      <span className="text-xs font-bold text-stone-500">To'g'ri javob:</span>
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-bold">
                        <input
                          type="radio"
                          name={`tf_correct_${q.id}`}
                          checked={q.correct_answers[0] === 'true'}
                          onChange={() => updateQuestion(qIdx, { correct_answers: ['true'] })}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>To'g'ri (Haqiqat)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-bold">
                        <input
                          type="radio"
                          name={`tf_correct_${q.id}`}
                          checked={q.correct_answers[0] === 'false'}
                          onChange={() => updateQuestion(qIdx, { correct_answers: ['false'] })}
                          className="w-4 h-4 text-rose-600 focus:ring-rose-500"
                        />
                        <span>Noto'g'ri (Yolg'on)</span>
                      </label>
                    </div>
                  )}

                  {/* Text short answer */}
                  {q.question_type === 'text' && (
                    <div className="space-y-1.5 pt-2">
                      <label className="block text-xs font-bold text-stone-500">
                        Qabul qilinadigan to'g'ri javob (vergul bilan bir nechta sinonim variantlar kiritish mumkin):
                      </label>
                      <input
                        type="text"
                        required
                        value={q.correct_answers.join(', ')}
                        onChange={e => updateQuestion(qIdx, {
                          correct_answers: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        })}
                        placeholder="Masalan: Samarqand, Samarqand shahri, Samarkand"
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                    </div>
                  )}

                </div>

                {/* Explanation */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Ilmiy Izoh va Tushuntirish (Ixtiyoriy)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={q.explanation}
                    onChange={e => updateQuestion(qIdx, { explanation: e.target.value })}
                    placeholder="Talaba test yakunida ushbu savol nega bunday ekanligini tushunishi uchun ilmiy manbalarga asoslangan izoh..."
                    className="w-full px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddQuestion}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-amber-500/40 hover:border-amber-600 bg-amber-500/5 hover:bg-amber-500/10 font-bold text-sm text-amber-900 dark:text-amber-300 flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Yana bir savol qo'shish</span>
          </button>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-stone-200 dark:border-stone-800">
          <button
            type="button"
            onClick={() => navigate('/teacher')}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-800"
          >
            Bekor qilish
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 rounded-xl font-bold text-sm text-white bg-amber-600 hover:bg-amber-700 active:scale-95 shadow-md flex items-center gap-2 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saqlanmoqda...' : 'Testni saqlash va kod yaratish'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};
