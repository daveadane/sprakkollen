import { createBrowserRouter } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import AppLayout from "../layouts/AppLayout";

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

  // APP (internal)
  {
    element: <AppLayout />,
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
    ],
  },
]);
