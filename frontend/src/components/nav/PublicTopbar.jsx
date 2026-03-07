import { NavLink, Link } from "react-router-dom";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "px-4 py-2.5 rounded-xl text-base font-bold transition",
          isActive
            ? "text-amber-600 bg-amber-50"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
        ].join(" ")
      }
      end
    >
      {children}
    </NavLink>
  );
}

export default function PublicTopbar() {
  return (
    <header className="w-full bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex h-20 items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 font-black tracking-tight text-2xl text-slate-900">
            <span className="text-2xl">🇸🇪</span>
            <span>Språkkollen</span>
          </Link>

          {/* Links */}
          <nav className="flex items-center gap-1">
            <NavItem to="/">Home</NavItem>
            <NavItem to="/about">About</NavItem>
            <NavItem to="/contact">Contact</NavItem>
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-xl border-2 border-slate-200 px-5 py-2.5 text-base font-bold text-slate-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 transition"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-linear-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-base font-black text-white shadow-md hover:from-amber-600 hover:to-orange-600 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
