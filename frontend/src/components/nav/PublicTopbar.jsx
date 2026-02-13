import { NavLink, Link } from "react-router-dom";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "px-3 py-2 rounded-xl text-sm font-semibold transition",
          "text-slate-200 hover:text-white hover:bg-white/10",
          isActive ? "bg-white/15 text-white" : "",
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
    <header className="w-full bg-slate-900 text-white">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <Link to="/" className="font-black tracking-tight text-lg">
            Språkkollen
          </Link>

          {/* Links */}
          <nav className="flex items-center gap-2">
            <NavItem to="/">Home</NavItem>
            <NavItem to="/about">About</NavItem>
            <NavItem to="/contact">Contact</NavItem>
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold hover:bg-indigo-700 transition"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="rounded-xl border border-white/70 px-4 py-2 text-sm font-bold hover:bg-white/10 transition"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
