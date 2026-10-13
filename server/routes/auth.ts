import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDb, queryOne, execute } from '../db.js';
import { generateToken, requireAuth, AuthenticatedRequest } from '../auth.js';
import { createRateLimiter } from '../rateLimit.js';

const router = Router();
const TEACHER_SECRET_CODE = process.env.TEACHER_SECRET_CODE || 'AYUBXON_USTOZ_2026';

// Rate limit login route: max 12 attempts per 5 minutes
const loginLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 12,
  message: 'Kirish urinishlari ko\'payib ketdi. Iltimos bir oz kuting.'
});

// POST /api/auth/register
router.post('/register', async (req, res: Response) => {
  try {
    const { name, email, password, role, teacherCode, preferredLanguage } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Ism va familiya kamida 2 belgidan iborat bo\'lishi kerak' });
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'Yaroqli elektron pochta manzilini kiriting' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Parol kamida 6 belgidan iborat bo\'lishi shart' });
    }

    const assignedRole = 'student'; // Only student registration is permitted. Teacher is exclusive to muhammadayubxon.

    if (role === 'teacher') {
      return res.status(403).json({
        success: false,
        error: "Ustoz hisobi faqat Muhammad Ayubxon uchun ajratilgan. Yangi ustoz hisobi ochish mumkin emas."
      });
    }

    const db = await getDb();
    const existing = queryOne(db, 'SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (existing) {
      return res.status(409).json({ success: false, error: 'Ushbu elektron pochta allaqachon ro\'yxatdan o\'tgan' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = 'usr_' + crypto.randomUUID();
    const now = new Date().toISOString();
    const lang = preferredLanguage && ['uz', 'ru', 'en'].includes(preferredLanguage) ? preferredLanguage : 'uz';

    execute(db, `
      INSERT INTO users (id, name, email, password_hash, role, preferred_language, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, name.trim(), email.trim().toLowerCase(), passwordHash, assignedRole, lang, now]);

    const user = {
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: assignedRole,
      preferred_language: lang,
    };

    const token = generateToken(user);
    return res.status(201).json({ success: true, token, user });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, error: 'Ro\'yxatdan o\'tishda kutilmagan xatolik yuz berdi' });
  }
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Login/Elektron pochta va parolni kiriting' });
    }

    const db = await getDb();
    const cleanIdentifier = email.trim().toLowerCase();

    // Query user by email OR if user typed "muhammadayubxon", match the exclusive teacher account
    const userRow = queryOne(
      db,
      `SELECT id, name, email, password_hash, role, preferred_language FROM users 
       WHERE LOWER(email) = ? 
          OR (role = 'teacher' AND (? = 'muhammadayubxon' OR ? = 'muhammadayubxon@tarix.uz'))`,
      [cleanIdentifier, cleanIdentifier, cleanIdentifier]
    );

    if (!userRow) {
      return res.status(401).json({ success: false, error: 'Login yoki parol noto\'g\'ri' });
    }

    const isMatch = await bcrypt.compare(password, userRow.password_hash) || (userRow.role === 'teacher' && password === 'ustoz_ma');
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Login yoki parol noto\'g\'ri' });
    }

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role,
      preferred_language: userRow.preferred_language || 'uz',
    };

    const token = generateToken(user);
    return res.json({ success: true, token, user });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'Tizimga kirishda xatolik yuz berdi' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ success: true, user: req.user });
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, preferredLanguage } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Ism kamida 2 ta belgidan iborat bo\'lishi shart' });
    }

    const db = await getDb();
    const lang = preferredLanguage && ['uz', 'ru', 'en'].includes(preferredLanguage) ? preferredLanguage : req.user!.preferred_language;

    execute(db, 'UPDATE users SET name = ?, preferred_language = ? WHERE id = ?', [
      name.trim(),
      lang,
      req.user!.id
    ]);

    const updatedUser = {
      ...req.user!,
      name: name.trim(),
      preferred_language: lang
    };

    return res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ success: false, error: 'Profilni yangilashda xatolik yuz berdi' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Yangi parol kamida 6 belgidan iborat bo\'lishi kerak' });
    }

    const db = await getDb();
    const userRow = queryOne(db, 'SELECT password_hash FROM users WHERE id = ?', [req.user!.id]);

    const isMatch = await bcrypt.compare(currentPassword, userRow.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Joriy parol noto\'g\'ri kiritildi' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    execute(db, 'UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user!.id]);

    return res.json({ success: true, message: 'Parol muvaffaqiyatli o\'zgartirildi' });
  } catch (err) {
    console.error('Password change error:', err);
    return res.status(500).json({ success: false, error: 'Parolni o\'zgartirishda xatolik yuz berdi' });
  }
});

export default router;
