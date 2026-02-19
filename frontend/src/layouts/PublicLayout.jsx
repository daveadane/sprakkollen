import { Outlet } from "react-router-dom";
import PublicTopbar from "../components/nav/PublicTopbar";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicTopbar />

      <main>
        <Outlet />
      </main>
    </div>
  );
}

