import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import FormField from "../../components/ui/FormField";
import { register as apiRegister } from "../../utils/authApi";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

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
      await apiRegister({ email: em, password, first_name: fn, last_name: ln });
      setDone(true);
    } catch (e) {
      if (e?.status === 409 || e?.message?.toLowerCase().includes("already registered")) {
        setError("This email is already registered. Try logging in.");
      } else {
        setError(e.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center space-y-4">
        <p className="text-4xl">📧</p>
        <h1 className="text-2xl font-black">Check your email</h1>
        <p className="text-sm text-slate-600">
          We sent a verification link to <strong>{email}</strong>.<br />
          Click the link to activate your account.
        </p>
        <p className="text-xs text-slate-400">Don't see it? Check your spam folder.</p>
        <p className="text-sm">
          <Link to="/login" className="text-blue-700 font-semibold hover:underline">
            ← Back to login
          </Link>
        </p>
      </div>
    );
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
