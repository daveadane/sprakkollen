import { Outlet } from "react-router-dom";
import PublicTopbar from "../components/nav/PublicTopbar";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicTopbar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Outlet />
      </main>
    </div>
  );
}

