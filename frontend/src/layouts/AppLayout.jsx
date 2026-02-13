import { Outlet } from "react-router-dom";
import Sidebar from "../components/nav/Sidebar";
import Topbar from "../components/nav/Topbar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Topbar />

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        {/* Left */}
        <div className="shrink-0">
          <Sidebar />
        </div>

        {/* Right */}
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

