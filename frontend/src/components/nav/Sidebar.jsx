import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import useAuth from "../../state/useAuth";

const topLink =
  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150";
const subLink =
  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150 pl-8";
const activeClass = "bg-white/15 text-white shadow-sm";
const inactiveClass = "text-slate-300 hover:bg-white/10 hover:text-white";

function NavGroup({ label, icon, paths, children, onNav }) {
  const { pathname } = useLocation();
  const isAnyActive = paths.some((p) => pathname.startsWith(p));
  const [open, setOpen] = useState(isAnyActive);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 ${
          isAnyActive
            ? "bg-white/15 text-white"
            : "text-slate-300 hover:bg-white/10 hover:text-white"
        }`}
      >
        <span className="flex items-center gap-3">
          <span className="text-base">{icon}</span>
          <span>{label}</span>
        </span>
        <span
          className="text-[8px] text-slate-400 transition-transform duration-200 inline-block"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ▶
        </span>
      </button>
      {open && (
        <div className="mt-0.5 ml-2 border-l border-white/10 pl-2 space-y-0.5">
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
        <span className="text-base">🏠</span> Dashboard
      </NavLink>

      <NavGroup label="Skills" icon="✏️" paths={["/checker", "/practice", "/vocabulary"]} onNav={onNav}>
        <NavLink to="/checker" onClick={onNav} className={({ isActive }) => `${subLink} ${isActive ? activeClass : inactiveClass}`}>Checker</NavLink>
        <NavLink to="/practice" onClick={onNav} className={({ isActive }) => `${subLink} ${isActive ? activeClass : inactiveClass}`}>Practice</NavLink>
        <NavLink to="/vocabulary" onClick={onNav} className={({ isActive }) => `${subLink} ${isActive ? activeClass : inactiveClass}`}>Vocabulary</NavLink>
      </NavGroup>

      <NavLink to="/grammar" onClick={onNav} className={({ isActive }) => `${topLink} ${isActive ? activeClass : inactiveClass}`}>
        <span className="text-base">📝</span> Grammar
      </NavLink>

      <NavLink to="/test" onClick={onNav} className={({ isActive }) => `${topLink} ${isActive ? activeClass : inactiveClass}`}>
        <span className="text-base">🧩</span> Mixed Test
      </NavLink>

      <NavLink to="/image-quiz" onClick={onNav} className={({ isActive }) => `${topLink} ${isActive ? activeClass : inactiveClass}`}>
        <span className="text-base">🖼️</span> Image Quiz
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
        <span className="text-base">🎤</span> Speaking Challenge
      </NavLink>

      <NavLink to="/progress" onClick={onNav} className={({ isActive }) => `${topLink} ${isActive ? activeClass : inactiveClass}`}>
        <span className="text-base">📊</span> Progress
      </NavLink>

      <NavLink to="/profile" onClick={onNav} className={({ isActive }) => `${topLink} ${isActive ? activeClass : inactiveClass}`}>
        <span className="text-base">👤</span> Profile
      </NavLink>

      {user?.is_admin && (
        <NavLink to="/admin" onClick={onNav} className={({ isActive }) => `${topLink} ${isActive ? activeClass : inactiveClass}`}>
          <span className="text-base">⚙️</span> Admin
        </NavLink>
      )}
    </nav>
  );
}

function SidebarShell({ onClose, children }) {
  return (
    <aside
      className="flex w-60 shrink-0 flex-col rounded-2xl p-3"
      style={{
        background: "linear-gradient(180deg, #1a2744 0%, #0f1b35 100%)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
      }}
    >
      <div className="mb-5 flex items-center justify-between px-2 pt-1">
        <span className="text-lg font-black text-white tracking-tight">Språkkollen</span>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {children}
    </aside>
  );
}

export default function Sidebar({ mobileOpen, onClose }) {
  const { user } = useAuth();

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block self-start sticky top-24">
        <SidebarShell>
          <SidebarNav user={user} />
        </SidebarShell>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <div className="relative z-50 h-full overflow-y-auto">
            <SidebarShell onClose={onClose}>
              <SidebarNav user={user} onNav={onClose} />
            </SidebarShell>
          </div>
        </div>
      )}
    </>
  );
}
