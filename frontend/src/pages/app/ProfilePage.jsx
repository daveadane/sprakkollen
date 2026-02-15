import { useAuth } from "../../state/useAuth";

export default function ProfilePage() {
  const { token, logout } = useAuth();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black tracking-tight">Profile</h1>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <p><strong>Status:</strong> {token ? "Logged in" : "Guest"}</p>
        <p><strong>XP:</strong> 120</p>
        <p><strong>Current streak:</strong> 3 days</p>

        <button
          onClick={logout}
          className="rounded-xl bg-red-600 px-4 py-2 text-white font-semibold"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
