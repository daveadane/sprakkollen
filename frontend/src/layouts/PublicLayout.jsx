import { Outlet } from "react-router-dom";
import PublicTopbar from "../components/nav/PublicTopbar";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-white">
      <PublicTopbar />

      <main>
        <Outlet />
      </main>
    </div>
  );
}

