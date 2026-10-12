export type Language = 'uz' | 'en' | 'ru';

export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  preferred_language: Language;
}

export interface Lesson {
  id: string;
  title: string;
  short_description: string;
  category: string;
  content?: string;
  attachment_name?: string | null;
  attachment_url?: string | null;
  youtube_video_id?: string | null;
  order_index: number;
  is_published: number;
  content_language: Language;
  created_at: string;
  updated_at: string;
  is_completed?: number;
}

export type QuestionType = 'single' | 'multiple' | 'true_false' | 'text';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  test_id?: string;
  question_text: string;
  question_type: QuestionType;
  options: QuestionOption[];
  points: number;
  correct_answers?: string[]; // only returned to teacher or in post-submission review
  explanation?: string;
  order_index?: number;
}

export interface Test {
  id: string;
  title: string;
  description: string;
  access_code: string;
  time_limit_minutes: number;
  passing_score: number;
  is_active: number;
  allow_retakes: number;
  shuffle_questions: number;
  show_explanations: number;
  content_language: Language;
  start_date?: string | null;
  end_date?: string | null;
  created_by?: string;
  created_at: string;
  updated_at: string;
  question_count?: number;
  attempt_count?: number;
  average_percent?: number;
  user_attempt_count?: number;
  user_best_score?: number;
  questions?: Question[];
}

export interface QuestionResult {
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  options: QuestionOption[];
  studentAnswer: any;
  correctAnswers: string[] | null;
  isCorrect: boolean;
  pointsAwarded: number;
  maxPoints: number;
  explanation: string | null;
}

export interface TestAttemptResult {
  attemptId: string;
  testId: string;
  testTitle: string;
  score: number;
  totalPoints: number;
  percent: number;
  passed: boolean;
  passingScore: number;
  timeSpentSeconds: number;
  completedAt: string;
  showExplanations: boolean;
  questionResults: QuestionResult[];
}

export interface AttemptHistoryItem {
  id: string;
  test_id: string;
  score: number;
  total_points: number;
  percent: number;
  passed: number;
  time_spent_seconds: number;
  completed_at: string;
  test_title: string;
  access_code: string;
  passing_score: number;
  student_name?: string;
  student_email?: string;
}
