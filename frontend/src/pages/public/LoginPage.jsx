import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../state/useAuth";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import FormField from "../../components/ui/FormField";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const newUser = params.get("onboarding") === "1";
  const mustLogin = location.state?.reason === "auth";
  const from = location.state?.from || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setErr("");
    setLoading(true);
    try {
      const u = await login(email, password);
      // New users (coming from registration) go to onboarding if not seen yet
      if (newUser && !localStorage.getItem("sprak_onboarded")) {
        nav("/onboarding", { replace: true });
      } else if (u?.is_admin) {
        // Admins go straight to the admin panel
        nav("/admin", { replace: true });
      } else {
        nav(from, { replace: true });
      }
    } catch (e) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-black">
        {newUser ? "Almost there! Log in to continue" : "Log in"}
      </h1>

      {mustLogin && (
        <p className="mt-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
          Please log in to continue.
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <FormField label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </FormField>

        <FormField label="Password">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </FormField>

        <div className="text-right -mt-2">
          <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
            Forgot password?
          </Link>
        </div>

        {err && (
          <p className="text-sm text-red-600">
            {err}
            {err.toLowerCase().includes("verify your email") && (
              <span className="block mt-1">
                <Link to="/forgot-password" className="text-blue-600 hover:underline font-medium">
                  Resend verification email?
                </Link>
              </span>
            )}
          </p>
        )}

        <Button className="w-full py-3" type="submit" disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
        </Button>
        {loading && (
          <p className="text-center text-xs text-slate-400">
            This may take a moment on first load…
          </p>
        )}

        <p className="text-sm text-slate-600">
          Don't have an account?{" "}
          <Link className="font-semibold text-blue-700 hover:underline" to="/register">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
