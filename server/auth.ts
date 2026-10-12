import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb, queryOne } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tarix_secret_jwt_key_ayubxon_2026';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student';
  preferred_language: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: { id: string; email: string; role: string; name: string }): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Kirish talab etiladi (Avtorizatsiya tokeni topilmadi)',
      code: 'UNAUTHORIZED'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const db = await getDb();
    const user = queryOne<AuthUser>(db, 'SELECT id, name, email, role, preferred_language FROM users WHERE id = ?', [decoded.id]);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Foydalanuvchi hisobi topilmadi',
        code: 'USER_NOT_FOUND'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Avtorizatsiya tokeni eskirgan yoki yaroqsiz',
      code: 'INVALID_TOKEN'
    });
  }
}

export function requireTeacher(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'teacher') {
    return res.status(403).json({
      success: false,
      error: 'Ushbu amal faqat ustoz (o\'qituvchi) hisobi uchun ruxsat etilgan',
      code: 'FORBIDDEN'
    });
  }
  next();
}

export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const db = await getDb();
    const user = queryOne<AuthUser>(db, 'SELECT id, name, email, role, preferred_language FROM users WHERE id = ?', [decoded.id]);
    if (user) {
      req.user = user;
    }
  } catch {
    // Ignore invalid token in optionalAuth
  }
  next();
}
