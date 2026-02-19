import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import FormField from "../../components/ui/FormField";
import { useAuth } from "../../state/auth.store";

export default function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.includes("@")) return setError("Please enter a valid email.");
    if (!password) return setError("Password is required.");

    const storedUser = JSON.parse(localStorage.getItem("sprakkollen_user"));

    if (!storedUser) {
      return setError("No account found. Please register first.");
    }

    if (storedUser.email !== email.trim()) {
      return setError("Email does not match registered account.");
    }

    // Fake login success
    login("demo-token");
    localStorage.setItem("sprakkollen_token", "demo-token");

    nav("/dashboard");   // ✅ correct route
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-black">Login</h1>
      <p className="mt-1 text-sm text-slate-600">
        Access your practice and progress.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <FormField label="Email">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </FormField>

        <FormField label="Password">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            autoComplete="current-password"
          />
        </FormField>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button className="w-full py-3" type="submit">
          Login
        </Button>

        <p className="text-sm text-slate-600">
          No account?{" "}
          <Link
            className="font-semibold text-blue-700 hover:underline"
            to="/register"
          >
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}

