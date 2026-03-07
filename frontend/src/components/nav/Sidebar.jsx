import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import useAuth from "../../state/useAuth";

const topLink =
  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition";
const subLink =
  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition pl-7";
const activeClass = "bg-blue-600 text-white";
const inactiveClass = "text-slate-700 hover:bg-slate-100";

function NavGroup({ label, icon, paths, children, onNav }) {
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

function SidebarNav({ user, onNav }) {
  return (
    <nav className="space-y-0.5 flex-1">
      <NavLink
        to="/dashboard"
        end
        onClick={onNav}
        className={({ isActive }) =>
          `${topLink} ${isActive ? activeClass : inactiveClass}`
        }
      >
        <span>🏠</span> Dashboard
      </NavLink>

      <NavGroup label="Skills" icon="✏️" paths={["/checker", "/practice", "/vocabulary"]} onNav={onNav}>
        <NavLink to="/checker" onClick={onNav} className={({ isActive }) => `${subLink} ${isActive ? activeClass : inactiveClass}`}>Checker</NavLink>
        <NavLink to="/practice" onClick={onNav} className={({ isActive }) => `${subLink} ${isActive ? activeClass : inactiveClass}`}>Practice</NavLink>
        <NavLink to="/vocabulary" onClick={onNav} className={({ isActive }) => `${subLink} ${isActive ? activeClass : inactiveClass}`}>Vocabulary</NavLink>
      </NavGroup>

      <NavLink to="/grammar" onClick={onNav} className={({ isActive }) => `${topLink} ${isActive ? activeClass : inactiveClass}`}>
        <span>📝</span> Grammar
      </NavLink>

      <NavLink to="/test" onClick={onNav} className={({ isActive }) => `${topLink} ${isActive ? activeClass : inactiveClass}`}>
        <span>🧩</span> Mixed Test
      </NavLink>

      <NavLink to="/image-quiz" onClick={onNav} className={({ isActive }) => `${topLink} ${isActive ? activeClass : inactiveClass}`}>
        <span>🖼️</span> Image Quiz
      </NavLink>

      <NavGroup label="Read" icon="📖" paths={["/books", "/book-reader"]} onNav={onNav}>
        <NavLink to="/books" onClick={onNav} className={({ isActive }) => `${subLink} ${isActive ? activeClass : inactiveClass}`}>Short Texts</NavLink>
        <NavLink to="/book-reader" onClick={onNav} className={({ isActive }) => `${subLink} ${isActive ? activeClass : inactiveClass}`}>Books</NavLink>
      </NavGroup>

      <NavGroup label="Media" icon="🎧" paths={["/podcasts", "/audio", "/speech", "/dictation"]} onNav={onNav}>
        <NavLink to="/podcasts" onClick={onNav} className={({ isActive }) => `${subLink} ${isActive ? activeClass : inactiveClass}`}>Podcasts</NavLink>
        <NavLink to="/audio" onClick={onNav} className={({ isActive }) => `${subLink} ${isActive ? activeClass : inactiveClass}`}>Audio</NavLink>
        <NavLink to="/speech" onClick={onNav} className={({ isActive }) => `${subLink} ${isActive ? activeClass : inactiveClass}`}>Speech</NavLink>
        <NavLink to="/dictation" onClick={onNav} className={({ isActive }) => `${subLink} ${isActive ? activeClass : inactiveClass}`}>Dictation</NavLink>
      </NavGroup>

      <NavLink to="/speaking-challenge" onClick={onNav} className={({ isActive }) => `${topLink} ${isActive ? activeClass : inactiveClass}`}>
        <span>🎤</span> Speaking Challenge
      </NavLink>

      <NavLink to="/progress" onClick={onNav} className={({ isActive }) => `${topLink} ${isActive ? activeClass : inactiveClass}`}>
        <span>📊</span> Progress
      </NavLink>

      <NavLink to="/profile" onClick={onNav} className={({ isActive }) => `${topLink} ${isActive ? activeClass : inactiveClass}`}>
        <span>👤</span> Profile
      </NavLink>

      {user?.is_admin && (
        <NavLink to="/admin" onClick={onNav} className={({ isActive }) => `${topLink} ${isActive ? activeClass : inactiveClass}`}>
          <span>⚙️</span> Admin
        </NavLink>
      )}
    </nav>
  );
}

export default function Sidebar({ mobileOpen, onClose }) {
  const { user } = useAuth();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 rounded-2xl border border-slate-200 bg-white p-3 flex-col self-start sticky top-24">
        <div className="mb-5 px-2 text-xl font-black text-slate-800">
          Språkkollen
        </div>
        <SidebarNav user={user} />
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          {/* Drawer */}
          <aside className="relative z-50 w-64 bg-white h-full overflow-y-auto p-3 shadow-xl flex flex-col">
            <div className="mb-5 flex items-center justify-between px-2">
              <span className="text-xl font-black text-slate-800">Språkkollen</span>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Close menu"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SidebarNav user={user} onNav={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
