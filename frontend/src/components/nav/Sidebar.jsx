import { NavLink } from "react-router-dom";

const linkBase =
  "block rounded-lg px-3 py-2 text-sm font-semibold transition";
const active =
  "bg-blue-600 text-white";
const inactive =
  "text-slate-700 hover:bg-slate-100";

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-slate-200 bg-white p-4">
      <div className="mb-6 text-xl font-black">Språkkollen</div>

      <nav className="space-y-2">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/checker"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`
          }
        >
          Checker
        </NavLink>

        <NavLink
          to="/practice"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`
          }
        >
          Practice
        </NavLink>

        <NavLink
          to="/vocabulary"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`
          }
        >
          Vocabulary
        </NavLink>

        <NavLink
          to="/progress"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`
          }
        >
          Progress
        </NavLink>

        <NavLink
          to="/admin"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`
          }
        >
          Admin
        </NavLink>

      </nav>
    </aside>
  );
}

