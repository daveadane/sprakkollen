import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/nav/Sidebar";
import Topbar from "../components/nav/Topbar";

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f0f4f8 0%, #e8edf5 100%)" }}>
      <Topbar onMenuOpen={() => setMobileOpen(true)} />

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-6 py-8">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

