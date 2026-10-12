import { Router, Response } from 'express';
import { getDb, queryAll, queryOne } from '../db.js';
import { requireAuth, requireTeacher, AuthenticatedRequest } from '../auth.js';

const router = Router();

// GET /api/stats/dashboard - Teacher dashboard overview
router.get('/dashboard', requireAuth, requireTeacher, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();

    const lessonCount = queryOne(db, 'SELECT COUNT(*) as count FROM lessons')?.count || 0;
    const testCount = queryOne(db, 'SELECT COUNT(*) as count FROM tests')?.count || 0;
    const studentCount = queryOne(db, "SELECT COUNT(*) as count FROM users WHERE role = 'student'")?.count || 0;
    const attemptsSummary = queryOne(db, `
      SELECT 
        COUNT(*) as total_attempts,
        SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) as passed_attempts,
        AVG(percent) as avg_percent
      FROM test_attempts
    `) || { total_attempts: 0, passed_attempts: 0, avg_percent: 0 };

    const recentAttempts = queryAll(db, `
      SELECT 
        ta.id, ta.test_id, ta.student_name, ta.score, ta.total_points,
        ta.percent, ta.passed, ta.time_spent_seconds, ta.completed_at,
        t.title as test_title, t.access_code
      FROM test_attempts ta
      JOIN tests t ON t.id = ta.test_id
      ORDER BY ta.completed_at DESC
      LIMIT 8
    `);

    const topStudents = queryAll(db, `
      SELECT 
        u.id, u.name, u.email,
        COUNT(ta.id) as attempts_count,
        AVG(ta.percent) as avg_percent,
        (SELECT COUNT(*) FROM lesson_completions lc WHERE lc.user_id = u.id) as completed_lessons_count
      FROM users u
      LEFT JOIN test_attempts ta ON ta.user_id = u.id
      WHERE u.role = 'student'
      GROUP BY u.id
      ORDER BY avg_percent DESC, completed_lessons_count DESC
      LIMIT 5
    `);

    return res.json({
      success: true,
      stats: {
        totalLessons: lessonCount,
        totalTests: testCount,
        totalStudents: studentCount,
        totalAttempts: attemptsSummary.total_attempts || 0,
        averagePercent: Math.round(attemptsSummary.avg_percent || 0),
        passRate: attemptsSummary.total_attempts > 0
          ? Math.round(((attemptsSummary.passed_attempts || 0) / attemptsSummary.total_attempts) * 100)
          : 0,
      },
      recentAttempts,
      topStudents
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    return res.status(500).json({ success: false, error: 'Statistikani yuklashda xatolik yuz berdi' });
  }
});

// GET /api/stats/export-csv/:testId - Export test attempts as Excel-compatible CSV (UTF-8 BOM)
router.get('/export-csv/:testId', requireAuth, requireTeacher, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { testId } = req.params;
    const db = await getDb();

    const test = queryOne(db, 'SELECT title, access_code FROM tests WHERE id = ?', [testId]);
    if (!test) {
      return res.status(404).send('Test topilmadi');
    }

    const attempts = queryAll(db, `
      SELECT 
        ta.student_name, u.email, ta.score, ta.total_points,
        ta.percent, ta.passed, ta.time_spent_seconds, ta.completed_at
      FROM test_attempts ta
      LEFT JOIN users u ON u.id = ta.user_id
      WHERE ta.test_id = ?
      ORDER BY ta.completed_at DESC
    `, [testId]);

    // Format CSV
    const headers = ['Talaba Ismi', 'Email', 'Ball', 'Maksimal Ball', 'Foiz (%)', 'Natija', 'Ketgan Vaqt (daq)', 'Sana va Vaqt'];
    const rows = attempts.map(a => {
      const minutesSpent = Math.round((a.time_spent_seconds / 60) * 10) / 10;
      const status = a.passed === 1 ? 'O\'tdi' : 'O\'tmadi';
      const dateStr = new Date(a.completed_at).toLocaleString('uz-UZ');
      
      const escape = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
      return [
        escape(a.student_name),
        escape(a.email),
        escape(a.score),
        escape(a.total_points),
        escape(`${a.percent}%`),
        escape(status),
        escape(minutesSpent),
        escape(dateStr)
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const safeTitle = test.title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
    const filename = `Tarix_${safeTitle}_${test.access_code}_Natijalar.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvContent);
  } catch (err) {
    console.error('Error exporting CSV:', err);
    return res.status(500).send('CSV eksport qilishda xatolik yuz berdi');
  }
});

export default router;
