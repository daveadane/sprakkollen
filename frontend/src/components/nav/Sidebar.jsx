import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import useAuth from "../../state/useAuth";

const topLink =
  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition";
const subLink =
  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition pl-7";
const activeClass = "bg-blue-600 text-white";
const inactiveClass = "text-slate-700 hover:bg-slate-100";

function NavGroup({ label, icon, paths, children }) {
  const { pathname } = useLocation();
  const isAnyActive = paths.some((p) => pathname.startsWith(p));
  const [open, setOpen] = useState(isAnyActive);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition ${
          isAnyActive
            ? "text-blue-700 bg-blue-50"
            : "text-slate-700 hover:bg-slate-100"
        }`}
      >
        <span className="flex items-center gap-2.5">
          <span>{icon}</span>
          <span>{label}</span>
        </span>
        <span
          className="text-[9px] text-slate-400 transition-transform duration-200 inline-block"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ▶
        </span>
      </button>
      {open && (
        <div className="mt-0.5 ml-3 border-l-2 border-slate-100 pl-2 space-y-0.5">
          {children}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="w-56 shrink-0 rounded-2xl border border-slate-200 bg-white p-3 flex flex-col">
      <div className="mb-5 px-2 text-xl font-black text-slate-800">
        Språkkollen
      </div>

      <nav className="space-y-0.5 flex-1">
        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) =>
            `${topLink} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <span>🏠</span> Dashboard
        </NavLink>

        <NavGroup
          label="Skills"
          icon="✏️"
          paths={["/checker", "/practice", "/vocabulary"]}
        >
          <NavLink
            to="/checker"
            className={({ isActive }) =>
              `${subLink} ${isActive ? activeClass : inactiveClass}`
            }
          >
            Checker
          </NavLink>
          <NavLink
            to="/practice"
            className={({ isActive }) =>
              `${subLink} ${isActive ? activeClass : inactiveClass}`
            }
          >
            Practice
          </NavLink>
          <NavLink
            to="/vocabulary"
            className={({ isActive }) =>
              `${subLink} ${isActive ? activeClass : inactiveClass}`
            }
          >
            Vocabulary
          </NavLink>
        </NavGroup>

        <NavLink
          to="/grammar"
          className={({ isActive }) =>
            `${topLink} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <span>📝</span> Grammar
        </NavLink>

        <NavLink
          to="/test"
          className={({ isActive }) =>
            `${topLink} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <span>🧩</span> Mixed Test
        </NavLink>

        <NavLink
          to="/image-quiz"
          className={({ isActive }) =>
            `${topLink} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <span>🖼️</span> Image Quiz
        </NavLink>

        <NavGroup label="Read" icon="📖" paths={["/books", "/book-reader"]}>
          <NavLink
            to="/books"
            className={({ isActive }) =>
              `${subLink} ${isActive ? activeClass : inactiveClass}`
            }
          >
            Short Texts
          </NavLink>
          <NavLink
            to="/book-reader"
            className={({ isActive }) =>
              `${subLink} ${isActive ? activeClass : inactiveClass}`
            }
          >
            Books
          </NavLink>
        </NavGroup>

        <NavGroup
          label="Media"
          icon="🎧"
          paths={["/podcasts", "/audio", "/speech", "/dictation"]}
        >
          <NavLink
            to="/podcasts"
            className={({ isActive }) =>
              `${subLink} ${isActive ? activeClass : inactiveClass}`
            }
          >
            Podcasts
          </NavLink>
          <NavLink
            to="/audio"
            className={({ isActive }) =>
              `${subLink} ${isActive ? activeClass : inactiveClass}`
            }
          >
            Audio
          </NavLink>
          <NavLink
            to="/speech"
            className={({ isActive }) =>
              `${subLink} ${isActive ? activeClass : inactiveClass}`
            }
          >
            Speech
          </NavLink>
          <NavLink
            to="/dictation"
            className={({ isActive }) =>
              `${subLink} ${isActive ? activeClass : inactiveClass}`
            }
          >
            Dictation
          </NavLink>
        </NavGroup>

        <NavLink
          to="/speaking-challenge"
          className={({ isActive }) =>
            `${topLink} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <span>🎤</span> Speaking Challenge
        </NavLink>

        <NavLink
          to="/progress"
          className={({ isActive }) =>
            `${topLink} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <span>📊</span> Progress
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `${topLink} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <span>👤</span> Profile
        </NavLink>

        {user?.is_admin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `${topLink} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <span>⚙️</span> Admin
          </NavLink>
        )}
      </nav>
    </aside>
  );
}
