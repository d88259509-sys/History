import { Router, Response, Request } from 'express';
import crypto from 'crypto';
import { getDb, queryAll, queryOne, execute } from '../db.js';
import { requireAuth, requireTeacher, optionalAuth, AuthenticatedRequest } from '../auth.js';
import { getOrTranslateLesson, translateText } from '../services/translator.js';

const router = Router();

// GET /api/lessons - Browse all published lessons (or all if teacher) with completion status for logged in student
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const isTeacher = req.user?.role === 'teacher';
    const userId = req.user?.id;
    const { category, search, language, active_lang } = req.query;
    const targetLang = typeof active_lang === 'string' && ['uz', 'ru', 'en'].includes(active_lang) ? active_lang : null;

    let query = `
      SELECT 
        l.id, 
        ${targetLang && targetLang !== 'uz' ? 'COALESCE(lt.title, l.title)' : 'l.title'} as title, 
        ${targetLang && targetLang !== 'uz' ? 'COALESCE(lt.short_description, l.short_description)' : 'l.short_description'} as short_description, 
        ${targetLang && targetLang !== 'uz' ? 'COALESCE(lt.category, l.category)' : 'l.category'} as category, 
        l.attachment_name, 
        l.attachment_url, l.youtube_video_id, l.order_index, l.is_published, 
        l.content_language, l.created_at, l.updated_at
        ${userId ? `, (CASE WHEN lc.id IS NOT NULL THEN 1 ELSE 0 END) as is_completed` : `, 0 as is_completed`}
        ${targetLang && targetLang !== 'uz' ? `, (CASE WHEN lt.id IS NOT NULL THEN 1 ELSE 0 END) as is_translated` : `, 0 as is_translated`}
      FROM lessons l
      ${targetLang && targetLang !== 'uz' ? `LEFT JOIN lesson_translations lt ON lt.lesson_id = l.id AND lt.language = '${targetLang}'` : ''}
      ${userId ? `LEFT JOIN lesson_completions lc ON lc.lesson_id = l.id AND lc.user_id = '${userId}'` : ''}
      WHERE 1=1
    `;

    const params: any[] = [];

    if (!isTeacher) {
      query += ` AND l.is_published = 1`;
    }

    if (category && typeof category === 'string' && category !== 'all') {
      query += ` AND l.category = ?`;
      params.push(category);
    }

    if (language && typeof language === 'string' && language !== 'all') {
      query += ` AND l.content_language = ?`;
      params.push(language);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      query += ` AND (LOWER(l.title) LIKE ? OR LOWER(l.short_description) LIKE ?)`;
      const term = `%${search.trim().toLowerCase()}%`;
      params.push(term, term);
    }

    query += ` ORDER BY l.order_index ASC, l.created_at DESC`;

    const lessons = queryAll(db, query, params);

    // Get categories summary
    const categories = queryAll(db, `
      SELECT DISTINCT category FROM lessons WHERE is_published = 1 OR ? = 1 ORDER BY category ASC
    `, [isTeacher ? 1 : 0]).map((r: any) => r.category);

    // Calculate progress if user logged in
    let progress = { completed: 0, total: 0, percent: 0 };
    if (userId) {
      const totalCount = queryOne(db, 'SELECT COUNT(*) as count FROM lessons WHERE is_published = 1')?.count || 0;
      const completedCount = queryOne(db, `
        SELECT COUNT(DISTINCT lc.lesson_id) as count 
        FROM lesson_completions lc 
        JOIN lessons l ON l.id = lc.lesson_id 
        WHERE lc.user_id = ? AND l.is_published = 1
      `, [userId])?.count || 0;

      progress = {
        completed: completedCount,
        total: totalCount,
        percent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
      };
    }

    return res.json({ success: true, lessons, categories, progress });
  } catch (err) {
    console.error('Error fetching lessons:', err);
    return res.status(500).json({ success: false, error: 'Darsliklarni yuklashda xatolik yuz berdi' });
  }
});

// GET /api/lessons/:id - Get lesson details with previous and next lesson ids, supports ?lang=
router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const isTeacher = req.user?.role === 'teacher';
    const userId = req.user?.id;
    const targetLang = typeof req.query.lang === 'string' && ['uz', 'ru', 'en'].includes(req.query.lang)
      ? req.query.lang
      : null;

    const lesson = queryOne(db, `
      SELECT l.* ${userId ? `, (CASE WHEN lc.id IS NOT NULL THEN 1 ELSE 0 END) as is_completed` : `, 0 as is_completed`}
      FROM lessons l
      ${userId ? `LEFT JOIN lesson_completions lc ON lc.lesson_id = l.id AND lc.user_id = '${userId}'` : ''}
      WHERE l.id = ?
    `, [id]);

    if (!lesson) {
      return res.status(404).json({ success: false, error: 'Darslik topilmadi' });
    }

    if (!isTeacher && lesson.is_published !== 1) {
      return res.status(403).json({ success: false, error: 'Ushbu darslik hali chop etilmagan' });
    }

    let displayLesson = { ...lesson };
    let isTranslated = false;

    if (targetLang && targetLang !== (lesson.content_language || 'uz')) {
      const transResult = await getOrTranslateLesson(db, lesson, targetLang);
      displayLesson = {
        ...displayLesson,
        title: transResult.title,
        short_description: transResult.short_description,
        category: transResult.category,
        content: transResult.content,
      };
      isTranslated = transResult.is_translated;
    }

    // Get previous and next lessons for navigation
    const allLessons = queryAll(db, `
      SELECT id, title, order_index FROM lessons 
      WHERE is_published = 1 
      ORDER BY order_index ASC, created_at DESC
    `);

    const currentIndex = allLessons.findIndex(item => item.id === lesson.id);
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    return res.json({
      success: true,
      lesson: displayLesson,
      original: {
        title: lesson.title,
        short_description: lesson.short_description,
        category: lesson.category,
        content: lesson.content,
        content_language: lesson.content_language || 'uz',
      },
      is_translated: isTranslated,
      active_language: targetLang || lesson.content_language || 'uz',
      original_language: lesson.content_language || 'uz',
      navigation: {
        prev: prevLesson,
        next: nextLesson
      }
    });
  } catch (err) {
    console.error('Error fetching lesson:', err);
    return res.status(500).json({ success: false, error: 'Darslikni yuklashda xatolik yuz berdi' });
  }
});

// POST /api/lessons/:id/translate - Translate lesson to target language (cached)
router.post('/:id/translate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { target_language, force } = req.body;
    if (!target_language || !['uz', 'ru', 'en'].includes(target_language)) {
      return res.status(400).json({ success: false, error: 'Til noto\'g\'ri ko\'rsatilgan (uz, ru, en bo\'lishi shart)' });
    }

    const db = await getDb();
    const lesson = queryOne(db, 'SELECT * FROM lessons WHERE id = ?', [id]);
    if (!lesson) {
      return res.status(404).json({ success: false, error: 'Darslik topilmadi' });
    }

    const result = await getOrTranslateLesson(db, lesson, target_language, force === true);
    return res.json({ success: true, translation: result });
  } catch (err: any) {
    console.error('Translation endpoint error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Tarjima qilishda xatolik yuz berdi' });
  }
});

// POST /api/lessons/:id/translate-all - Generate translations for all supported languages
router.post('/:id/translate-all', requireAuth, requireTeacher, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const lesson = queryOne(db, 'SELECT * FROM lessons WHERE id = ?', [id]);
    if (!lesson) {
      return res.status(404).json({ success: false, error: 'Darslik topilmadi' });
    }

    const targets = (['uz', 'ru', 'en'] as const).filter(l => l !== (lesson.content_language || 'uz'));
    const results: Record<string, any> = {};

    for (const t of targets) {
      results[t] = await getOrTranslateLesson(db, lesson, t, true);
    }

    return res.json({ success: true, translations: results });
  } catch (err: any) {
    console.error('Batch translation error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Tarjima qilishda xatolik yuz berdi' });
  }
});

// POST /api/lessons - Create new lesson (Teacher only)
router.post('/', requireAuth, requireTeacher, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      short_description,
      category,
      content,
      attachment_name,
      attachment_url,
      youtube_video_id,
      order_index,
      is_published,
      content_language
    } = req.body;

    if (!title || !short_description || !category || !content) {
      return res.status(400).json({
        success: false,
        error: 'Sarlavha, qisqacha tavsif, bo\'lim (kategoriya) va darslik matni to\'ldirilishi shart'
      });
    }

    const db = await getDb();
    const lessonId = 'lsn_' + crypto.randomUUID();
    const now = new Date().toISOString();

    execute(db, `
      INSERT INTO lessons (
        id, title, short_description, category, content, attachment_name,
        attachment_url, youtube_video_id, order_index, is_published, content_language,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      lessonId,
      title.trim(),
      short_description.trim(),
      category.trim(),
      content,
      attachment_name || null,
      attachment_url || null,
      youtube_video_id || null,
      Number(order_index) || 0,
      is_published === false || is_published === 0 ? 0 : 1,
      content_language || 'uz',
      now,
      now
    ]);

    const created = queryOne(db, 'SELECT * FROM lessons WHERE id = ?', [lessonId]);
    return res.status(201).json({ success: true, lesson: created });
  } catch (err) {
    console.error('Error creating lesson:', err);
    return res.status(500).json({ success: false, error: 'Darslikni saqlashda xatolik yuz berdi' });
  }
});

// PUT /api/lessons/:id - Update lesson (Teacher only)
router.put('/:id', requireAuth, requireTeacher, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      short_description,
      category,
      content,
      attachment_name,
      attachment_url,
      youtube_video_id,
      order_index,
      is_published,
      content_language
    } = req.body;

    const db = await getDb();
    const existing = queryOne(db, 'SELECT id FROM lessons WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Darslik topilmadi' });
    }

    const now = new Date().toISOString();
    execute(db, `
      UPDATE lessons SET
        title = ?,
        short_description = ?,
        category = ?,
        content = ?,
        attachment_name = ?,
        attachment_url = ?,
        youtube_video_id = ?,
        order_index = ?,
        is_published = ?,
        content_language = ?,
        updated_at = ?
      WHERE id = ?
    `, [
      title.trim(),
      short_description.trim(),
      category.trim(),
      content,
      attachment_name || null,
      attachment_url || null,
      youtube_video_id || null,
      Number(order_index) || 0,
      is_published === false || is_published === 0 ? 0 : 1,
      content_language || 'uz',
      now,
      id
    ]);

    const updated = queryOne(db, 'SELECT * FROM lessons WHERE id = ?', [id]);
    return res.json({ success: true, lesson: updated });
  } catch (err) {
    console.error('Error updating lesson:', err);
    return res.status(500).json({ success: false, error: 'Darslikni yangilashda xatolik yuz berdi' });
  }
});

// DELETE /api/lessons/:id - Delete lesson (Teacher only)
router.delete('/:id', requireAuth, requireTeacher, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const existing = queryOne(db, 'SELECT id FROM lessons WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Darslik topilmadi' });
    }

    execute(db, 'DELETE FROM lessons WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Darslik muvaffaqiyatli o\'chirildi' });
  } catch (err) {
    console.error('Error deleting lesson:', err);
    return res.status(500).json({ success: false, error: 'Darslikni o\'chirishda xatolik yuz berdi' });
  }
});

// POST /api/lessons/:id/toggle-completion - Mark lesson as completed / uncompleted (Student)
router.post('/:id/toggle-completion', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const db = await getDb();

    const lesson = queryOne(db, 'SELECT id FROM lessons WHERE id = ?', [id]);
    if (!lesson) {
      return res.status(404).json({ success: false, error: 'Darslik topilmadi' });
    }

    const existing = queryOne(db, 'SELECT id FROM lesson_completions WHERE user_id = ? AND lesson_id = ?', [userId, id]);

    let isCompleted = false;
    if (existing) {
      execute(db, 'DELETE FROM lesson_completions WHERE id = ?', [existing.id]);
      isCompleted = false;
    } else {
      execute(db, `
        INSERT INTO lesson_completions (id, user_id, lesson_id, completed_at)
        VALUES (?, ?, ?, ?)
      `, ['comp_' + crypto.randomUUID(), userId, id, new Date().toISOString()]);
      isCompleted = true;
    }

    // Recalculate progress
    const totalCount = queryOne(db, 'SELECT COUNT(*) as count FROM lessons WHERE is_published = 1')?.count || 0;
    const completedCount = queryOne(db, `
      SELECT COUNT(DISTINCT lc.lesson_id) as count 
      FROM lesson_completions lc 
      JOIN lessons l ON l.id = lc.lesson_id 
      WHERE lc.user_id = ? AND l.is_published = 1
    `, [userId])?.count || 0;

    return res.json({
      success: true,
      is_completed: isCompleted ? 1 : 0,
      progress: {
        completed: completedCount,
        total: totalCount,
        percent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
      }
    });
  } catch (err) {
    console.error('Error toggling lesson completion:', err);
    return res.status(500).json({ success: false, error: 'Holatni yangilashda xatolik yuz berdi' });
  }
});

// POST /api/lessons/reorder - Batch reorder lessons (Teacher only)
router.post('/reorder', requireAuth, requireTeacher, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items } = req.body; // Array of { id, order_index }
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'Noto\'g\'ri format' });
    }

    const db = await getDb();
    for (const item of items) {
      execute(db, 'UPDATE lessons SET order_index = ? WHERE id = ?', [item.order_index, item.id]);
    }

    return res.json({ success: true, message: 'Darsliklar tartibi saqlandi' });
  } catch (err) {
    console.error('Error reordering lessons:', err);
    return res.status(500).json({ success: false, error: 'Tartibni saqlashda xatolik yuz berdi' });
  }
});

export default router;
