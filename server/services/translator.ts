import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';
import { Database } from 'sql.js';
import { queryOne, execute, saveDb } from '../db.js';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export const LANGUAGE_NAMES: Record<string, { uz: string; ru: string; en: string }> = {
  uz: { uz: "O'zbekcha", ru: 'Узбекский', en: 'Uzbek' },
  ru: { uz: 'Ruscha', ru: 'Русский', en: 'Russian' },
  en: { uz: 'Inglizcha', ru: 'Английский', en: 'English' },
};

export interface LessonTranslationResult {
  title: string;
  short_description: string;
  category: string;
  content: string;
  is_translated: boolean;
  language: string;
  source_language: string;
}

/**
 * Translates a complete lesson (title, short_description, category, markdown content)
 * into the target language using gemini-3.8-flash, with SQLite caching.
 */
export async function getOrTranslateLesson(
  db: Database,
  lesson: {
    id: string;
    title: string;
    short_description: string;
    category: string;
    content: string;
    content_language?: string;
    updated_at?: string;
  },
  targetLang: string,
  forceRefresh = false
): Promise<LessonTranslationResult> {
  const sourceLang = lesson.content_language || 'uz';

  // If target language matches source language, return original
  if (targetLang === sourceLang) {
    return {
      title: lesson.title,
      short_description: lesson.short_description,
      category: lesson.category,
      content: lesson.content,
      is_translated: false,
      language: sourceLang,
      source_language: sourceLang,
    };
  }

  // Check SQLite cache
  if (!forceRefresh) {
    try {
      const cached = queryOne(
        db,
        `SELECT * FROM lesson_translations WHERE lesson_id = ? AND language = ?`,
        [lesson.id, targetLang]
      );

      if (cached && cached.content) {
        // If translation is newer or equal to lesson updated_at, return cached
        if (!lesson.updated_at || cached.updated_at >= lesson.updated_at) {
          return {
            title: cached.title,
            short_description: cached.short_description,
            category: cached.category || lesson.category,
            content: cached.content,
            is_translated: true,
            language: targetLang,
            source_language: sourceLang,
          };
        }
      }
    } catch (cacheErr) {
      console.warn('Error reading translation cache:', cacheErr);
    }
  }

  // Prepare Gemini translation prompt
  const targetLanguageName = targetLang === 'ru' ? 'Russian' : targetLang === 'en' ? 'English' : 'Uzbek';
  const sourceLanguageName = sourceLang === 'ru' ? 'Russian' : sourceLang === 'en' ? 'English' : 'Uzbek';

  try {
    const ai = getAiClient();
    const prompt = `You are a professional academic historical translator and educator.
Translate the following history lesson materials from ${sourceLanguageName} into ${targetLanguageName}.

Guidelines:
1. Preserve historical accuracy, proper names (e.g. Amir Temur, Bobur, Jaloliddin Manguberdi, Samarkand, etc.), dates, and academic tone.
2. Keep all Markdown formatting exactly intact (headers #, ##, bold **, bullet points -, quotes >, code/blockquotes).
3. Translate category appropriately (e.g. "Qadimgi Dunyo Tarixi" -> "История Древнего мира" or "Ancient World History").
4. Return ONLY a valid JSON object with the exact keys: "title", "short_description", "category", and "content".
Do NOT include markdown code blocks around the JSON (e.g. do not output \`\`\`json ... \`\`\`), output raw JSON text only.

JSON Input to translate:
${JSON.stringify({
  title: lesson.title,
  short_description: lesson.short_description,
  category: lesson.category,
  content: lesson.content,
})}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text?.trim() || '';
    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // In case wrapped in markdown code fence
      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      parsed = JSON.parse(cleaned);
    }

    const translatedTitle = parsed.title || lesson.title;
    const translatedDesc = parsed.short_description || lesson.short_description;
    const translatedCategory = parsed.category || lesson.category;
    const translatedContent = parsed.content || lesson.content;
    const now = new Date().toISOString();

    // Cache in SQLite
    try {
      const transId = 'tr_' + crypto.randomUUID();
      execute(
        db,
        `
        INSERT INTO lesson_translations (id, lesson_id, language, title, short_description, category, content, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(lesson_id, language) DO UPDATE SET
          title = excluded.title,
          short_description = excluded.short_description,
          category = excluded.category,
          content = excluded.content,
          updated_at = excluded.updated_at
      `,
        [transId, lesson.id, targetLang, translatedTitle, translatedDesc, translatedCategory, translatedContent, now]
      );
      saveDb(db);
    } catch (saveErr) {
      console.warn('Failed to save lesson translation cache:', saveErr);
    }

    return {
      title: translatedTitle,
      short_description: translatedDesc,
      category: translatedCategory,
      content: translatedContent,
      is_translated: true,
      language: targetLang,
      source_language: sourceLang,
    };
  } catch (err: any) {
    console.error(`Gemini translation error for lesson ${lesson.id} to ${targetLang}:`, err?.message || err);
    // Graceful fallback to original content if API fails
    return {
      title: lesson.title,
      short_description: lesson.short_description,
      category: lesson.category,
      content: lesson.content,
      is_translated: false,
      language: sourceLang,
      source_language: sourceLang,
    };
  }
}

/**
 * Translates general text or array of texts into target language
 */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang = 'uz'
): Promise<string> {
  if (!text || !text.trim() || targetLang === sourceLang) {
    return text;
  }

  const targetLanguageName = targetLang === 'ru' ? 'Russian' : targetLang === 'en' ? 'English' : 'Uzbek';

  try {
    const ai = getAiClient();
    const prompt = `Translate the following text into ${targetLanguageName}. Keep formatting, names, dates, and historical terms authentic. Return ONLY the translated text, no explanations.\n\nText:\n${text}`;
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });
    return response.text?.trim() || text;
  } catch (err: any) {
    console.error('Translation error:', err?.message || err);
    return text;
  }
}
