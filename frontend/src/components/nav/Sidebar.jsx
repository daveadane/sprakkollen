import { NavLink } from "react-router-dom";

const linkClasses =
  "block rounded-xl px-4 py-2 font-medium transition hover:bg-slate-100";

const activeClasses = "bg-blue-100 text-blue-700";

export default function Sidebar() {
  return (
    <aside className="w-60 border-r border-slate-200 bg-white p-4 space-y-2">
      <h2 className="mb-4 text-lg font-bold">Språkkollen</h2>

      <NavLink
        to="/app"
        end
        className={({ isActive }) =>
          `${linkClasses} ${isActive ? activeClasses : ""}`
        }
      >
        Dashboard
      </NavLink>

      <NavLink
        to="/app/checker"
        className={({ isActive }) =>
          `${linkClasses} ${isActive ? activeClasses : ""}`
        }
      >
        Checker
      </NavLink>

      <NavLink
        to="/app/practice"
        className={({ isActive }) =>
          `${linkClasses} ${isActive ? activeClasses : ""}`
        }
      >
        Practice
      </NavLink>

      <NavLink
        to="/app/vocabulary"
        className={({ isActive }) =>
          `${linkClasses} ${isActive ? activeClasses : ""}`
        }
      >
        Vocabulary
      </NavLink>

      <NavLink
        to="/app/progress"
        className={({ isActive }) =>
          `${linkClasses} ${isActive ? activeClasses : ""}`
        }
      >
        Progress
      </NavLink>
    </aside>
  );
}
