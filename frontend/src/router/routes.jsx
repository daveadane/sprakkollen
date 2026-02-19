import { createBrowserRouter } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";


// public pages
import LandingPage from "../pages/public/LandingPage";
import AboutPage from "../pages/public/AboutPage";
import ContactPage from "../pages/public/ContactPage";
import LoginPage from "../pages/public/LoginPage";
import RegisterPage from "../pages/public/RegisterPage";
import GrammarPage from "../pages/app/GrammarPage";
import ProfilePage from "../pages/app/ProfilePage";
import SessionPage from "../pages/app/SessionPage";
import AdminPage from "../pages/app/AdminPage";




// “modules” pages (still pages, but NOT under /app)
import DashboardPage from "../pages/app/DashboardPage";
import CheckerPage from "../pages/app/CheckerPage";
import PracticePage from "../pages/app/PracticePage";
import VocabularyPage from "../pages/app/VocabularyPage";
import ProgressPage from "../pages/app/ProgressPage";


export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      // Website pages (top navbar)
      { path: "/", element: <LandingPage /> },
      { path: "/about", element: <AboutPage /> },
      { path: "/contact", element: <ContactPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },

      // Språkkollen modules (accessible from Home)
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/checker", element: <CheckerPage /> },
      { path: "/practice", element: <PracticePage /> },
      { path: "/practice/session/:id", element: <SessionPage /> },
      { path: "/vocabulary", element: <VocabularyPage /> },
      { path: "/grammar", element: <GrammarPage /> },
      { path: "/progress", element: <ProgressPage /> },
      { path: "/profile", element: <ProfilePage /> },
      { path: "/admin", element: <AdminPage /> },


    ],
  },
]);
