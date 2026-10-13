import { Router, Response } from 'express';
import crypto from 'crypto';
import { getDb, queryAll, queryOne, execute } from '../db.js';
import { requireAuth, requireTeacher, AuthenticatedRequest } from '../auth.js';
import { createRateLimiter } from '../rateLimit.js';
import { computeRaschModel } from '../rasch.js';

const router = Router();

// Rate limiter for test code entry: max 15 requests per 3 minutes
const codeCheckLimiter = createRateLimiter({
  windowMs: 3 * 60 * 1000,
  max: 15,
  message: 'Kod tekshirish urinishlari chegarasiga yetildi. Iltimos, 3 daqiqa kuting.'
});

const CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateRandomCode(): string {
  let result = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = crypto.randomInt(0, CODE_CHARS.length);
    result += CODE_CHARS[randomIndex];
  }
  return result;
}

async function generateUniqueCode(db: any): Promise<string> {
  let code = '';
  let exists = true;
  let attempts = 0;
  while (exists && attempts < 50) {
    code = generateRandomCode();
    const row = queryOne(db, 'SELECT id FROM tests WHERE access_code = ?', [code]);
    if (!row) {
      exists = false;
    }
    attempts++;
  }
  return code || ('TR' + Math.floor(1000 + Math.random() * 9000));
}

// GET /api/tests - List tests
// For teacher: all tests created by teachers with attempt counts
// For student: list of available active tests with status
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const isTeacher = req.user?.role === 'teacher';
    const userId = req.user!.id;

    if (isTeacher) {
      const tests = queryAll(db, `
        SELECT 
          t.*,
          (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) as question_count,
          (SELECT COUNT(*) FROM test_attempts ta WHERE ta.test_id = t.id) as attempt_count,
          (SELECT AVG(ta.percent) FROM test_attempts ta WHERE ta.test_id = t.id) as average_percent
        FROM tests t
        ORDER BY t.created_at DESC
      `);
      return res.json({ success: true, tests });
    } else {
      // Student: list active tests they can see, without secret access code
      const tests = queryAll(db, `
        SELECT 
          t.id, t.title, t.description, t.time_limit_minutes,
          t.passing_score, t.is_active, t.allow_retakes, t.content_language,
          t.start_date, t.end_date,
          (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) as question_count,
          (SELECT COUNT(*) FROM test_attempts ta WHERE ta.test_id = t.id AND ta.user_id = ?) as user_attempt_count,
          (SELECT MAX(ta.percent) FROM test_attempts ta WHERE ta.test_id = t.id AND ta.user_id = ?) as user_best_score
        FROM tests t
        WHERE t.is_active = 1
        ORDER BY t.created_at DESC
      `, [userId, userId]);
      return res.json({ success: true, tests });
    }
  } catch (err) {
    console.error('Error fetching tests:', err);
    return res.status(500).json({ success: false, error: 'Testlarni yuklashda xatolik yuz berdi' });
  }
});

// GET /api/tests/verify-code/:code - Check code validity without revealing answers
router.get('/verify-code/:code', requireAuth, codeCheckLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawCode = (req.params.code || '').trim().toUpperCase();
    if (!rawCode || rawCode.length !== 6) {
      return res.status(400).json({ success: false, error: 'Test kodi 6 ta belgidan iborat bo\'lishi kerak' });
    }

    const db = await getDb();
    const test = queryOne(db, `
      SELECT id, title, description, access_code, time_limit_minutes, passing_score,
             is_active, allow_retakes, start_date, end_date, content_language
      FROM tests WHERE access_code = ?
    `, [rawCode]);

    if (!test) {
      return res.status(404).json({ success: false, error: 'Ushbu kodga mos test topilmadi. Kodni qayta tekshirib ko\'ring.' });
    }

    if (test.is_active !== 1) {
      return res.status(400).json({ success: false, error: 'Ushbu test hozirda faol emas (o\'qituvchi tomonidan to\'xtatilgan).' });
    }

    const nowIso = new Date().toISOString();
    if (test.start_date && nowIso < test.start_date) {
      return res.status(400).json({ success: false, error: 'Test topshirish vaqti hali boshlanmadi.' });
    }
    if (test.end_date && nowIso > test.end_date) {
      return res.status(400).json({ success: false, error: 'Test topshirish muddati yakunlangan.' });
    }

    // Check retake restriction for student
    const existingAttempt = queryOne(db, `
      SELECT id, percent, passed, completed_at FROM test_attempts 
      WHERE test_id = ? AND user_id = ?
      ORDER BY completed_at DESC LIMIT 1
    `, [test.id, req.user!.id]);

    if (existingAttempt && test.allow_retakes === 0) {
      return res.status(403).json({
        success: false,
        error: 'Siz bu testni topshirgansiz. O\'qituvchi qayta topshirishga ruxsat bermagan.',
        lastAttempt: existingAttempt
      });
    }

    const qCount = queryOne(db, 'SELECT COUNT(*) as count FROM questions WHERE test_id = ?', [test.id])?.count || 0;

    return res.json({
      success: true,
      test: {
        ...test,
        question_count: qCount,
        has_previous_attempt: !!existingAttempt,
      }
    });
  } catch (err) {
    console.error('Error verifying code:', err);
    return res.status(500).json({ success: false, error: 'Kodni tekshirishda xatolik yuz berdi' });
  }
});

// GET /api/tests/take/:code - Retrieve questions for taking the test (STRICTLY NO CORRECT ANSWERS!)
router.get('/take/:code', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawCode = (req.params.code || '').trim().toUpperCase();
    const db = await getDb();

    const test = queryOne(db, `
      SELECT * FROM tests WHERE access_code = ?
    `, [rawCode]);

    if (!test) {
      return res.status(404).json({ success: false, error: 'Test topilmadi' });
    }

    if (test.is_active !== 1) {
      return res.status(400).json({ success: false, error: 'Test faol emas' });
    }

    // Retake check
    if (req.user!.role !== 'teacher') {
      const priorAttempt = queryOne(db, 'SELECT id FROM test_attempts WHERE test_id = ? AND user_id = ?', [test.id, req.user!.id]);
      if (priorAttempt && test.allow_retakes === 0) {
        return res.status(403).json({ success: false, error: 'Qayta topshirishga ruxsat yo\'q' });
      }
    }

    // Fetch questions
    let questions = queryAll(db, `
      SELECT id, test_id, question_text, question_type, options_json, points, order_index
      FROM questions
      WHERE test_id = ?
      ORDER BY order_index ASC
    `, [test.id]);

    // Parse options and sanitize options (strip any potential answer leak)
    let processedQuestions = questions.map(q => {
      let parsedOptions: any[] = [];
      try {
        parsedOptions = JSON.parse(q.options_json);
      } catch {
        parsedOptions = [];
      }

      // Shuffle options if shuffle_questions enabled and question is single or multiple
      if (test.shuffle_questions === 1 && (q.question_type === 'single' || q.question_type === 'multiple')) {
        parsedOptions = [...parsedOptions].sort(() => Math.random() - 0.5);
      }

      return {
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: parsedOptions,
        points: q.points,
      };
    });

    if (test.shuffle_questions === 1) {
      processedQuestions = processedQuestions.sort(() => Math.random() - 0.5);
    }

    return res.json({
      success: true,
      test: {
        id: test.id,
        title: test.title,
        description: test.description,
        access_code: test.access_code,
        time_limit_minutes: test.time_limit_minutes,
        passing_score: test.passing_score,
        questions: processedQuestions
      }
    });
  } catch (err) {
    console.error('Error starting test:', err);
    return res.status(500).json({ success: false, error: 'Test savollarini olishda xatolik yuz berdi' });
  }
});

// POST /api/tests/:code/submit - Grade answers strictly on the server and store attempt
router.post('/:code/submit', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawCode = (req.params.code || '').trim().toUpperCase();
    const { answers, timeSpentSeconds } = req.body; // answers is { [questionId]: value }
    const db = await getDb();

    const test = queryOne(db, 'SELECT * FROM tests WHERE access_code = ?', [rawCode]);
    if (!test) {
      return res.status(404).json({ success: false, error: 'Test topilmadi' });
    }

    const questions = queryAll(db, 'SELECT * FROM questions WHERE test_id = ? ORDER BY order_index ASC', [test.id]);
    if (questions.length === 0) {
      return res.status(400).json({ success: false, error: 'Testda savollar mavjud emas' });
    }

    let totalPoints = 0;
    let earnedPoints = 0;
    const questionResults: any[] = [];

    for (const q of questions) {
      const qMaxPoints = Number(q.points) || 1;
      totalPoints += qMaxPoints;

      let parsedOptions = [];
      try { parsedOptions = JSON.parse(q.options_json); } catch {}

      let correctAnswers: any[] = [];
      try { correctAnswers = JSON.parse(q.correct_answers_json); } catch {}

      const studentAnswer = answers ? answers[q.id] : undefined;
      let isCorrect = false;
      let pointsAwarded = 0;

      if (q.question_type === 'single') {
        const correctSingle = correctAnswers[0];
        if (studentAnswer && studentAnswer === correctSingle) {
          isCorrect = true;
          pointsAwarded = qMaxPoints;
        }
      } else if (q.question_type === 'multiple') {
        const studentArr = Array.isArray(studentAnswer) ? studentAnswer : (studentAnswer ? [studentAnswer] : []);
        const correctSet = new Set(correctAnswers);
        const studentSet = new Set(studentArr);

        // Check exact match of chosen answers
        if (correctSet.size === studentSet.size && [...correctSet].every(item => studentSet.has(item))) {
          isCorrect = true;
          pointsAwarded = qMaxPoints;
        } else {
          // Partial credit: award proportional if no incorrect options selected
          let correctCount = 0;
          let wrongCount = 0;
          for (const s of studentArr) {
            if (correctSet.has(s)) correctCount++;
            else wrongCount++;
          }
          if (wrongCount === 0 && correctCount > 0) {
            pointsAwarded = Math.round((correctCount / correctSet.size) * qMaxPoints * 10) / 10;
            if (correctCount === correctSet.size) isCorrect = true;
          }
        }
      } else if (q.question_type === 'true_false') {
        const correctVal = String(correctAnswers[0]).toLowerCase();
        const studentVal = String(studentAnswer || '').toLowerCase();
        if (studentVal === correctVal) {
          isCorrect = true;
          pointsAwarded = qMaxPoints;
        }
      } else if (q.question_type === 'text') {
        const studentStr = String(studentAnswer || '').trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
        const matches = correctAnswers.some((ans: string) => {
          const normAns = String(ans).trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
          return studentStr === normAns;
        });
        if (matches) {
          isCorrect = true;
          pointsAwarded = qMaxPoints;
        }
      }

      earnedPoints += pointsAwarded;

      questionResults.push({
        questionId: q.id,
        questionText: q.question_text,
        questionType: q.question_type,
        options: parsedOptions,
        studentAnswer: studentAnswer ?? null,
        correctAnswers: test.show_explanations === 1 || req.user!.role === 'teacher' ? correctAnswers : null,
        isCorrect,
        pointsAwarded,
        maxPoints: qMaxPoints,
        explanation: test.show_explanations === 1 || req.user!.role === 'teacher' ? q.explanation : null
      });
    }

    const percent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = percent >= test.passing_score ? 1 : 0;
    const attemptId = 'att_' + crypto.randomUUID();
    const now = new Date().toISOString();

    execute(db, `
      INSERT INTO test_attempts (
        id, test_id, user_id, student_name, score, total_points, percent, passed,
        time_spent_seconds, student_answers_json, question_results_json, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      attemptId,
      test.id,
      req.user!.id,
      req.user!.name,
      earnedPoints,
      totalPoints,
      percent,
      passed,
      Number(timeSpentSeconds) || 0,
      JSON.stringify(answers || {}),
      JSON.stringify(questionResults),
      now
    ]);

    return res.status(201).json({
      success: true,
      result: {
        attemptId,
        testId: test.id,
        testTitle: test.title,
        score: earnedPoints,
        totalPoints,
        percent,
        passed: passed === 1,
        passingScore: test.passing_score,
        timeSpentSeconds: Number(timeSpentSeconds) || 0,
        completedAt: now,
        showExplanations: test.show_explanations === 1,
        questionResults
      }
    });
  } catch (err) {
    console.error('Error submitting test:', err);
    return res.status(500).json({ success: false, error: 'Test natijasini hisoblashda xatolik yuz berdi' });
  }
});

// GET /api/tests/attempts/my - Student's own test history
router.get('/attempts/my', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const attempts = queryAll(db, `
      SELECT 
        ta.id, ta.test_id, ta.score, ta.total_points, ta.percent, ta.passed,
        ta.time_spent_seconds, ta.completed_at,
        t.title as test_title, t.access_code, t.passing_score
      FROM test_attempts ta
      JOIN tests t ON t.id = ta.test_id
      WHERE ta.user_id = ?
      ORDER BY ta.completed_at DESC
    `, [req.user!.id]);

    return res.json({ success: true, attempts });
  } catch (err) {
    console.error('Error fetching student attempts:', err);
    return res.status(500).json({ success: false, error: 'Natijalar tarixini yuklashda xatolik yuz berdi' });
  }
});

// GET /api/tests/attempts/:attemptId - View specific attempt details
router.get('/attempts/:attemptId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { attemptId } = req.params;
    const db = await getDb();
    const attempt = queryOne(db, `
      SELECT ta.*, t.title as test_title, t.passing_score, t.show_explanations, t.is_active as test_is_active
      FROM test_attempts ta
      JOIN tests t ON t.id = ta.test_id
      WHERE ta.id = ?
    `, [attemptId]);

    if (!attempt) {
      return res.status(404).json({ success: false, error: 'Natija topilmadi' });
    }

    if (req.user!.role !== 'teacher' && attempt.user_id !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'Ruxsat etilmagan' });
    }

    return res.json({
      success: true,
      attempt: {
        ...attempt,
        student_answers: JSON.parse(attempt.student_answers_json || '{}'),
        question_results: JSON.parse(attempt.question_results_json || '[]')
      }
    });
  } catch (err) {
    console.error('Error getting attempt:', err);
    return res.status(500).json({ success: false, error: 'Natijani yuklashda xatolik yuz berdi' });
  }
});

// GET /api/tests/:id/teacher-details - Teacher view with all questions and answers
router.get('/:id/teacher-details', requireAuth, requireTeacher, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const test = queryOne(db, 'SELECT * FROM tests WHERE id = ?', [id]);
    if (!test) {
      return res.status(404).json({ success: false, error: 'Test topilmadi' });
    }

    const questions = queryAll(db, 'SELECT * FROM questions WHERE test_id = ? ORDER BY order_index ASC', [id]).map(q => ({
      ...q,
      options: JSON.parse(q.options_json || '[]'),
      correct_answers: JSON.parse(q.correct_answers_json || '[]')
    }));

    return res.json({ success: true, test, questions });
  } catch (err) {
    console.error('Error fetching test for edit:', err);
    return res.status(500).json({ success: false, error: 'Testni yuklashda xatolik yuz berdi' });
  }
});

// POST /api/tests - Create new test with questions (Teacher only)
router.post('/', requireAuth, requireTeacher, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      description,
      time_limit_minutes,
      passing_score,
      is_active,
      allow_retakes,
      shuffle_questions,
      show_explanations,
      content_language,
      start_date,
      end_date,
      questions
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, error: 'Test nomi va tavsifi to\'ldirilishi shart' });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, error: 'Testda kamida bitta savol bo\'lishi kerak' });
    }

    const db = await getDb();
    const testId = 'tst_' + crypto.randomUUID();
    const accessCode = await generateUniqueCode(db);
    const now = new Date().toISOString();

    execute(db, `
      INSERT INTO tests (
        id, title, description, access_code, time_limit_minutes, passing_score,
        is_active, allow_retakes, shuffle_questions, show_explanations,
        content_language, start_date, end_date, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      testId,
      title.trim(),
      description.trim(),
      accessCode,
      Number(time_limit_minutes) || 20,
      Number(passing_score) || 60,
      is_active === false || is_active === 0 ? 0 : 1,
      allow_retakes === false || allow_retakes === 0 ? 0 : 1,
      shuffle_questions === false || shuffle_questions === 0 ? 0 : 1,
      show_explanations === false || show_explanations === 0 ? 0 : 1,
      content_language || 'uz',
      start_date || null,
      end_date || null,
      req.user!.id,
      now,
      now
    ]);

    let idx = 0;
    for (const q of questions) {
      const qId = 'q_' + crypto.randomUUID();
      execute(db, `
        INSERT INTO questions (
          id, test_id, question_text, question_type, options_json, correct_answers_json,
          points, explanation, order_index
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        qId,
        testId,
        q.question_text || 'Savol',
        q.question_type || 'single',
        JSON.stringify(q.options || []),
        JSON.stringify(q.correct_answers || []),
        Number(q.points) || 1,
        q.explanation || '',
        idx++
      ]);
    }

    const created = queryOne(db, 'SELECT * FROM tests WHERE id = ?', [testId]);
    return res.status(201).json({ success: true, test: created, access_code: accessCode });
  } catch (err) {
    console.error('Error creating test:', err);
    return res.status(500).json({ success: false, error: 'Testni saqlashda xatolik yuz berdi' });
  }
});

// PUT /api/tests/:id - Update test & questions (Teacher only)
router.put('/:id', requireAuth, requireTeacher, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      time_limit_minutes,
      passing_score,
      is_active,
      allow_retakes,
      shuffle_questions,
      show_explanations,
      content_language,
      start_date,
      end_date,
      questions
    } = req.body;

    const db = await getDb();
    const existing = queryOne(db, 'SELECT * FROM tests WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Test topilmadi' });
    }

    const now = new Date().toISOString();
    execute(db, `
      UPDATE tests SET
        title = ?,
        description = ?,
        time_limit_minutes = ?,
        passing_score = ?,
        is_active = ?,
        allow_retakes = ?,
        shuffle_questions = ?,
        show_explanations = ?,
        content_language = ?,
        start_date = ?,
        end_date = ?,
        updated_at = ?
      WHERE id = ?
    `, [
      title.trim(),
      description.trim(),
      Number(time_limit_minutes) || 20,
      Number(passing_score) || 60,
      is_active === false || is_active === 0 ? 0 : 1,
      allow_retakes === false || allow_retakes === 0 ? 0 : 1,
      shuffle_questions === false || shuffle_questions === 0 ? 0 : 1,
      show_explanations === false || show_explanations === 0 ? 0 : 1,
      content_language || 'uz',
      start_date || null,
      end_date || null,
      now,
      id
    ]);

    if (Array.isArray(questions)) {
      execute(db, 'DELETE FROM questions WHERE test_id = ?', [id]);
      let idx = 0;
      for (const q of questions) {
        const qId = q.id || ('q_' + crypto.randomUUID());
        execute(db, `
          INSERT INTO questions (
            id, test_id, question_text, question_type, options_json, correct_answers_json,
            points, explanation, order_index
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          qId,
          id,
          q.question_text || 'Savol',
          q.question_type || 'single',
          JSON.stringify(q.options || []),
          JSON.stringify(q.correct_answers || []),
          Number(q.points) || 1,
          q.explanation || '',
          idx++
        ]);
      }
    }

    const updated = queryOne(db, 'SELECT * FROM tests WHERE id = ?', [id]);
    return res.json({ success: true, test: updated });
  } catch (err) {
    console.error('Error updating test:', err);
    return res.status(500).json({ success: false, error: 'Testni yangilashda xatolik yuz berdi' });
  }
});

// POST /api/tests/:id/regenerate-code - Regenerate access code (Teacher only)
router.post('/:id/regenerate-code', requireAuth, requireTeacher, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const existing = queryOne(db, 'SELECT id FROM tests WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Test topilmadi' });
    }

    const newCode = await generateUniqueCode(db);
    execute(db, 'UPDATE tests SET access_code = ? WHERE id = ?', [newCode, id]);

    return res.json({ success: true, access_code: newCode });
  } catch (err) {
    console.error('Error regenerating code:', err);
    return res.status(500).json({ success: false, error: 'Kodni yangilashda xatolik yuz berdi' });
  }
});

// DELETE /api/tests/:id - Delete test (Teacher only)
router.delete('/:id', requireAuth, requireTeacher, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const existing = queryOne(db, 'SELECT id FROM tests WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Test topilmadi' });
    }

    execute(db, 'DELETE FROM tests WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Test o\'chirildi' });
  } catch (err) {
    console.error('Error deleting test:', err);
    return res.status(500).json({ success: false, error: 'Testni o\'chirishda xatolik yuz berdi' });
  }
});

// GET /api/tests/:id/results - Teacher view of all attempts with per-question statistics and CSV download data
router.get('/:id/results', requireAuth, requireTeacher, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const test = queryOne(db, 'SELECT * FROM tests WHERE id = ?', [id]);
    if (!test) {
      return res.status(404).json({ success: false, error: 'Test topilmadi' });
    }

    const attempts = queryAll(db, `
      SELECT 
        ta.id, ta.user_id, ta.student_name, ta.score, ta.total_points,
        ta.percent, ta.passed, ta.time_spent_seconds, ta.completed_at,
        u.email as student_email
      FROM test_attempts ta
      LEFT JOIN users u ON u.id = ta.user_id
      WHERE ta.test_id = ?
      ORDER BY ta.completed_at DESC
    `, [id]);

    const questions = queryAll(db, 'SELECT * FROM questions WHERE test_id = ? ORDER BY order_index ASC', [id]);

    // Calculate per-question statistics from all attempts
    const allAttemptDetails = queryAll(db, 'SELECT question_results_json FROM test_attempts WHERE test_id = ?', [id]);
    const questionStats: Record<string, { total: number; correctCount: number; accuracy: number }> = {};

    questions.forEach(q => {
      questionStats[q.id] = { total: 0, correctCount: 0, accuracy: 0 };
    });

    for (const att of allAttemptDetails) {
      try {
        const qResults = JSON.parse(att.question_results_json || '[]');
        for (const qr of qResults) {
          if (questionStats[qr.questionId]) {
            questionStats[qr.questionId].total++;
            if (qr.isCorrect) {
              questionStats[qr.questionId].correctCount++;
            }
          }
        }
      } catch {}
    }

    const questionsWithStats = questions.map(q => {
      const stat = questionStats[q.id] || { total: 0, correctCount: 0, accuracy: 0 };
      const accuracy = stat.total > 0 ? Math.round((stat.correctCount / stat.total) * 100) : 0;
      return {
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        points: q.points,
        attemptsCount: stat.total,
        correctCount: stat.correctCount,
        accuracyPercent: accuracy
      };
    });

    const totalAttempts = attempts.length;
    const passedAttempts = attempts.filter(a => a.passed === 1).length;
    const avgPercent = totalAttempts > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.percent, 0) / totalAttempts)
      : 0;

    // Psychometric Rasch Model Computation
    const raschReport = computeRaschModel(test, questions, attempts);

    return res.json({
      success: true,
      test,
      stats: {
        totalAttempts,
        passedAttempts,
        passRate: totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0,
        averagePercent: avgPercent,
      },
      questions: questionsWithStats,
      attempts,
      raschReport,
    });
  } catch (err) {
    console.error('Error fetching test results:', err);
    return res.status(500).json({ success: false, error: 'Natijalarni yuklashda xatolik yuz berdi' });
  }
});

// POST /api/tests/:id/finalize - Finalize/close test by teacher and generate Rasch Model assessment
router.post('/:id/finalize', requireAuth, requireTeacher, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const test = queryOne(db, 'SELECT * FROM tests WHERE id = ?', [id]);
    if (!test) {
      return res.status(404).json({ success: false, error: 'Test topilmadi' });
    }

    // Toggle active state to 0 (closed)
    const now = new Date().toISOString();
    execute(db, 'UPDATE tests SET is_active = 0, updated_at = ? WHERE id = ?', [now, id]);

    const questions = queryAll(db, 'SELECT * FROM questions WHERE test_id = ? ORDER BY order_index ASC', [id]);
    const attempts = queryAll(db, `
      SELECT ta.*, u.email as student_email
      FROM test_attempts ta
      LEFT JOIN users u ON u.id = ta.user_id
      WHERE ta.test_id = ?
      ORDER BY ta.completed_at DESC
    `, [id]);

    const raschReport = computeRaschModel(test, questions, attempts);

    return res.json({
      success: true,
      message: 'Test muvaffaqiyatli yakunlandi va Rasch modeli bo\'yicha tahlil qilindi',
      test: { ...test, is_active: 0 },
      raschReport
    });
  } catch (err) {
    console.error('Error finalizing test:', err);
    return res.status(500).json({ success: false, error: 'Testni yakunlashda xatolik yuz berdi' });
  }
});

// GET /api/tests/:id/rasch-analysis - Get psychometric Rasch Model analysis report
router.get('/:id/rasch-analysis', requireAuth, requireTeacher, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const test = queryOne(db, 'SELECT * FROM tests WHERE id = ?', [id]);
    if (!test) {
      return res.status(404).json({ success: false, error: 'Test topilmadi' });
    }

    const questions = queryAll(db, 'SELECT * FROM questions WHERE test_id = ? ORDER BY order_index ASC', [id]);
    const attempts = queryAll(db, `
      SELECT ta.*, u.email as student_email
      FROM test_attempts ta
      LEFT JOIN users u ON u.id = ta.user_id
      WHERE ta.test_id = ?
      ORDER BY ta.completed_at DESC
    `, [id]);

    const raschReport = computeRaschModel(test, questions, attempts);

    return res.json({
      success: true,
      test,
      raschReport
    });
  } catch (err) {
    console.error('Error computing Rasch model:', err);
    return res.status(500).json({ success: false, error: 'Rasch modelini hisoblashda xatolik yuz berdi' });
  }
});

export default router;
