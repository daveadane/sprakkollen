import { createBrowserRouter } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
import AppLayout from "../layouts/AppLayout";

import LandingPage from "../pages/public/LandingPage";
import LoginPage from "../pages/public/LoginPage";
import RegisterPage from "../pages/public/RegisterPage";

import DashboardPage from "../pages/app/DashboardPage";
import CheckerPage from "../pages/app/CheckerPage";
import PracticePage from "../pages/app/PracticePage";
import VocabularyPage from "../pages/app/VocabularyPage";
import ProgressPage from "../pages/app/ProgressPage";

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },
  {
    path: "/app",
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "checker", element: <CheckerPage /> },
      { path: "practice", element: <PracticePage /> },
      { path: "vocabulary", element: <VocabularyPage /> },
      { path: "progress", element: <ProgressPage /> },
    ],
  },
]);
