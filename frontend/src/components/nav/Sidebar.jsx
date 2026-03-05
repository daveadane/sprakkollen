import { NavLink } from "react-router-dom";
import useAuth from "../../state/useAuth"; // adjust path if needed

const linkBase = "block rounded-lg px-3 py-2 text-sm font-semibold transition";
const active = "bg-blue-600 text-white";
const inactive = "text-slate-700 hover:bg-slate-100";

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="w-64 shrink-0 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-6 text-xl font-black">Språkkollen</div>

      <nav className="space-y-2">
        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/checker"
          className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
        >
          Checker
        </NavLink>

        <NavLink
          to="/practice"
          className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
        >
          Practice
        </NavLink>

        <NavLink
          to="/vocabulary"
          className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
        >
          Vocabulary
        </NavLink>

        <NavLink
          to="/progress"
          className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
        >
          Progress
        </NavLink>

        <NavLink
          to="/grammar"
          className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
        >
          Grammar
        </NavLink>

        <NavLink
          to="/books"
          className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
        >
          Reading
        </NavLink>

        <NavLink
          to="/audio"
          className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
        >
          Audio
        </NavLink>

        <NavLink
          to="/speech"
          className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
        >
          Speech
        </NavLink>

        <NavLink
          to="/test"
          className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
        >
          Mixed Test
        </NavLink>

        <NavLink
          to="/dictation"
          className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
        >
          Dictation
        </NavLink>

        <NavLink
          to="/image-quiz"
          className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
        >
          Image Quiz
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
        >
          Profile
        </NavLink>

        {/* ✅ Only show Admin if user is admin */}
        {user?.is_admin && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
          >
            Admin
          </NavLink>
        )}
      </nav>
    </aside>
  );
}