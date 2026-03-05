// routes.jsx
import { createBrowserRouter } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import AppLayout from "../layouts/AppLayout";
import ProtectedRoute from "./ProtectedRoute"; // ✅ adjust path if needed

// public pages
import LandingPage from "../pages/public/LandingPage";
import AboutPage from "../pages/public/AboutPage";
import ContactPage from "../pages/public/ContactPage";
import LoginPage from "../pages/public/LoginPage";
import RegisterPage from "../pages/public/RegisterPage";

// app pages
import DashboardPage from "../pages/app/DashboardPage";
import CheckerPage from "../pages/app/CheckerPage";
import PracticePage from "../pages/app/PracticePage";
import SessionPage from "../pages/app/SessionPage";
import VocabularyPage from "../pages/app/VocabularyPage";
import ProgressPage from "../pages/app/ProgressPage";
import GrammarPage from "../pages/app/GrammarPage";
import ProfilePage from "../pages/app/ProfilePage";
import AdminPage from "../pages/app/AdminPage";
import BooksPage from "../pages/app/BooksPage";
import BookSessionPage from "../pages/app/BookSessionPage";
import AudioPage from "../pages/app/AudioPage";
import SpeechPage from "../pages/app/SpeechPage";
import OnboardingPage from "../pages/app/OnboardingPage";
import TestPage from "../pages/app/TestPage";
import DictationPage from "../pages/app/DictationPage";
import ImageQuizPage from "../pages/app/ImageQuizPage";

export const router = createBrowserRouter([
  // PUBLIC SITE
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/about", element: <AboutPage /> },
      { path: "/contact", element: <ContactPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },

  // ✅ PROTECTED APP
  {
    element: <ProtectedRoute />, // ✅ gate everything below
    children: [
      {
        element: <AppLayout />, // ✅ only reachable if logged in
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/checker", element: <CheckerPage /> },
          { path: "/practice", element: <PracticePage /> },
          { path: "/practice/session/:id", element: <SessionPage /> },
          { path: "/vocabulary", element: <VocabularyPage /> },
          { path: "/progress", element: <ProgressPage /> },
          { path: "/grammar", element: <GrammarPage /> },
          { path: "/profile", element: <ProfilePage /> },
          { path: "/admin", element: <AdminPage /> },
          { path: "/books", element: <BooksPage /> },
          { path: "/books/:id", element: <BookSessionPage /> },
          { path: "/audio", element: <AudioPage /> },
          { path: "/speech", element: <SpeechPage /> },
          { path: "/onboarding", element: <OnboardingPage /> },
          { path: "/test", element: <TestPage /> },
          { path: "/dictation", element: <DictationPage /> },
          { path: "/image-quiz", element: <ImageQuizPage /> },
        ],
      },
    ],
  },
]);