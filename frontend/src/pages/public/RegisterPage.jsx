import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import FormField from "../../components/ui/FormField";
import { register as apiRegister } from "../../utils/authApi";

export default function RegisterPage() {
  const nav = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setError("");

    const fn = firstName.trim();
    const ln = lastName.trim();
    const em = email.trim().toLowerCase();

    if (!fn) return setError("Please enter your first name.");
    if (!ln) return setError("Please enter your last name.");
    if (!em.includes("@")) return setError("Please enter a valid email.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setLoading(true);
    try {
      await apiRegister({
        email: em,
        password,
        first_name: fn,
        last_name: ln,
      });
      nav("/login?onboarding=1");
    } catch (e) {
      // 409 means the account was actually created (likely a double-submit on slow connection)
      // Just send them to login instead of showing a confusing error
      if (e?.status === 409 || e?.message?.toLowerCase().includes("already registered")) {
        nav(`/login?onboarding=1&email=${encodeURIComponent(em)}`);
      } else {
        setError(e.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-black">Create account</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="First name">
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </FormField>

          <FormField label="Last name">
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </FormField>
        </div>

        <FormField label="Email">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} />
        </FormField>

        <FormField label="Password">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </FormField>

        <FormField label="Confirm password">
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </FormField>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button className="w-full py-3" type="submit" disabled={loading}>
          {loading ? "Creating account…" : "Register"}
        </Button>
        {loading && (
          <p className="text-center text-xs text-slate-400">
            This may take a moment on first load…
          </p>
        )}

        <p className="text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="font-semibold text-blue-700 hover:underline" to="/login">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
