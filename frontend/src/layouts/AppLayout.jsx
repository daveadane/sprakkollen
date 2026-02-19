import { Outlet } from "react-router-dom";
import Sidebar from "../components/nav/Sidebar";
import Topbar from "../components/nav/Topbar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Topbar />

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-6 py-8">
        <Sidebar />

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

