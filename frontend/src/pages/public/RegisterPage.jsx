import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import FormField from "../../components/ui/FormField";

export default function RegisterPage() {
  const nav = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const fn = firstName.trim();
    const ln = lastName.trim();
    const em = email.trim();

    if (!fn) return setError("Please enter your first name.");
    if (!ln) return setError("Please enter your last name.");

    // Allow letters + spaces + hyphen + apostrophe
    const nameOk = (s) => /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(s);
    if (!nameOk(fn) || !nameOk(ln)) {
      return setError("Names can only contain letters, spaces, hyphens, and apostrophes.");
    }

    if (!em.includes("@")) return setError("Please enter a valid email.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    // Frontend-only register: store fake user in localStorage
    localStorage.setItem(
      "sprakkollen_user",
      JSON.stringify({ email: em, firstName: fn, lastName: ln })
    );

    nav("/login");
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-black">Create account</h1>
      <p className="mt-1 text-sm text-slate-600">
        Register to track progress and practice sessions.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="First name">
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              autoComplete="given-name"
            />
          </FormField>

          <FormField label="Last name">
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              autoComplete="family-name"
            />
          </FormField>
        </div>

        <FormField label="Email">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </FormField>

        <FormField label="Password" hint="Minimum 6 characters">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            autoComplete="new-password"
          />
        </FormField>

        <FormField label="Confirm password">
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••"
            autoComplete="new-password"
          />
        </FormField>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button className="w-full py-3" type="submit">
          Register
        </Button>

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

