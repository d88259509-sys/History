import React, { useState, useEffect } from 'react';
import { I18nProvider } from './i18n/index.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { AuthProvider } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';

// Pages
import { Home } from './pages/Home.js';
import { Login } from './pages/Login.js';
import { Register } from './pages/Register.js';
import { Lessons } from './pages/Lessons.js';
import { LessonDetail } from './pages/LessonDetail.js';
import { Tests } from './pages/Tests.js';
import { TakeTest } from './pages/TakeTest.js';
import { TestResult } from './pages/TestResult.js';
import { MyResults } from './pages/MyResults.js';
import { TeacherDashboard } from './pages/TeacherDashboard.js';
import { LessonEditor } from './pages/LessonEditor.js';
import { TestEditor } from './pages/TestEditor.js';
import { TeacherTestResults } from './pages/TeacherTestResults.js';
import { Profile } from './pages/Profile.js';
import { NotFound } from './pages/NotFound.js';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (path !== currentPath) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderCurrentPage = () => {
    const path = currentPath;

    // Home
    if (path === '/' || path === '') {
      return <Home navigate={navigate} />;
    }

    // Login & Register
    if (path.startsWith('/login')) {
      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get('redirect') || undefined;
      return <Login navigate={navigate} redirectUrl={redirect} />;
    }

    if (path === '/register') {
      return <Register navigate={navigate} />;
    }

    // Lessons
    if (path === '/lessons') {
      return <Lessons navigate={navigate} />;
    }

    // Lesson Detail: /lessons/:id
    const lessonDetailMatch = path.match(/^\/lessons\/([^/]+)$/);
    if (lessonDetailMatch) {
      return <LessonDetail id={lessonDetailMatch[1]} navigate={navigate} />;
    }

    // Tests List / Code Entry
    if (path === '/tests') {
      return <Tests navigate={navigate} />;
    }

    // Take Test: /tests/take/:code
    const takeTestMatch = path.match(/^\/tests\/take\/([^/]+)$/);
    if (takeTestMatch) {
      return <TakeTest code={takeTestMatch[1]} navigate={navigate} />;
    }

    // Test Result: /tests/result/:attemptId
    const testResultMatch = path.match(/^\/tests\/result\/([^/]+)$/);
    if (testResultMatch) {
      return <TestResult attemptId={testResultMatch[1]} navigate={navigate} />;
    }

    // My Results
    if (path === '/my-results') {
      return <MyResults navigate={navigate} />;
    }

    // Teacher Dashboard
    if (path === '/teacher') {
      return <TeacherDashboard navigate={navigate} />;
    }

    // Teacher Lesson Create: /teacher/lessons/new
    if (path === '/teacher/lessons/new') {
      return <LessonEditor navigate={navigate} />;
    }

    // Teacher Lesson Edit: /teacher/lessons/:id/edit
    const editLessonMatch = path.match(/^\/teacher\/lessons\/([^/]+)\/edit$/);
    if (editLessonMatch) {
      return <LessonEditor id={editLessonMatch[1]} navigate={navigate} />;
    }

    // Teacher Test Create: /teacher/tests/new
    if (path === '/teacher/tests/new') {
      return <TestEditor navigate={navigate} />;
    }

    // Teacher Test Edit: /teacher/tests/:id/edit
    const editTestMatch = path.match(/^\/teacher\/tests\/([^/]+)\/edit$/);
    if (editTestMatch) {
      return <TestEditor id={editTestMatch[1]} navigate={navigate} />;
    }

    // Teacher Test Results: /teacher/tests/:id/results
    const teacherResultsMatch = path.match(/^\/teacher\/tests\/([^/]+)\/results$/);
    if (teacherResultsMatch) {
      return <TeacherTestResults id={teacherResultsMatch[1]} navigate={navigate} />;
    }

    // Profile
    if (path === '/profile') {
      return <Profile navigate={navigate} />;
    }

    // 404
    return <NotFound navigate={navigate} />;
  };

  return (
    <I18nProvider>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <div className="min-h-screen flex flex-col font-sans selection:bg-amber-500 selection:text-white">
              <Navbar currentPath={currentPath} navigate={navigate} />
              <main className="flex-1">
                {renderCurrentPage()}
              </main>
              <Footer navigate={navigate} />
            </div>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
