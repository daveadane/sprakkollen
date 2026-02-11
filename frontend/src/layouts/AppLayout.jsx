import { Outlet, Link } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="px-6 py-4 flex items-center justify-between border-b bg-white">
        <Link to="/app" className="font-black text-lg">
          Språkkollen App
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link to="/app/checker" className="hover:underline">Checker</Link>
          <Link to="/app/practice" className="hover:underline">Practice</Link>
          <Link to="/app/vocabulary" className="hover:underline">Vocabulary</Link>
          <Link to="/app/progress" className="hover:underline">Progress</Link>
        </nav>
      </header>

      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
