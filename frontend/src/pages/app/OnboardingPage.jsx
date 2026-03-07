// src/pages/app/OnboardingPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../state/useAuth";
import { apiFetch } from "../../utils/api";

const LEVELS = [
  { value: "beginner", label: "Beginner", desc: "A1–A2 · Just starting out", emoji: "🌱" },
  { value: "intermediate", label: "Intermediate", desc: "B1–B2 · Conversational", emoji: "🌿" },
  { value: "advanced", label: "Advanced", desc: "C1+ · Near-fluent", emoji: "🌳" },
];

const STEPS = [
  {
    key: "welcome",
    emoji: "🇸🇪",
    title: "Welcome to SpråkKollen!",
    body: "Your personal Swedish language learning companion. We'll help you master en/ett, grammar, reading, and more.",
    cta: "Let's go",
  },
  {
    key: "level",
    emoji: "🎯",
    title: "What's your Swedish level?",
    body: "We'll adjust quiz difficulty and content to match where you are. You can always change this in your Profile.",
    cta: "Continue",
  },
  {
    key: "features",
    emoji: "✨",
    title: "What can you do here?",
    features: [
      { icon: "🔍", label: "Checker", desc: "Look up whether any noun is en or ett instantly." },
      { icon: "🎯", label: "Practice", desc: "Drill en/ett with randomised word quizzes." },
      { icon: "📝", label: "Grammar", desc: "Test your knowledge of Swedish grammar rules." },
      { icon: "📚", label: "Books", desc: "Read classic Swedish literature with AI comprehension quizzes." },
      { icon: "🎙️", label: "Podcasts", desc: "Listen to Swedish radio and answer questions." },
      { icon: "🎤", label: "Speaking", desc: "30-day speaking challenge with AI feedback." },
    ],
    cta: "Sounds great!",
  },
  {
    key: "streak",
    emoji: "🔥",
    title: "Build your streak",
    body: "Practice a little every day. Every feature adapts to your level as you improve.",
    cta: "Go to Dashboard",
  },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState("beginner");
  const [saving, setSaving] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const firstName = user?.first_name || "";

  async function next() {
    if (current.key === "level") {
      // Save level before moving on
      setSaving(true);
      try {
        await apiFetch("/auth/me", { method: "PATCH", body: { level: selectedLevel } });
      } catch {
        // non-fatal — continue anyway
      } finally {
        setSaving(false);
      }
    }

    if (isLast) {
      localStorage.setItem("sprak_onboarded", "1");
      navigate("/dashboard");
    } else {
      setStep((s) => s + 1);
    }
  }

  function skip() {
    localStorage.setItem("sprak_onboarded", "1");
    navigate("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

        {/* Progress dots */}
        <div className="mb-6 flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${i === step ? "w-6 bg-blue-600" : "w-2 bg-slate-200"}`}
            />
          ))}
        </div>

        {/* Emoji */}
        <div className="text-center text-5xl">{current.emoji}</div>

        {/* Title */}
        <h1 className="mt-4 text-center text-2xl font-black text-slate-900">
          {step === 0 && firstName ? `${current.title.replace("!", ",")} ${firstName}!` : current.title}
        </h1>

        {/* Body */}
        {current.body && (
          <p className="mt-3 text-center text-slate-600">{current.body}</p>
        )}

        {/* Level picker */}
        {current.key === "level" && (
          <div className="mt-5 space-y-3">
            {LEVELS.map((lvl) => {
              const isActive = selectedLevel === lvl.value;
              return (
                <button
                  key={lvl.value}
                  onClick={() => setSelectedLevel(lvl.value)}
                  className={[
                    "w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition",
                    isActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300",
                  ].join(" ")}
                >
                  <span className="text-2xl">{lvl.emoji}</span>
                  <div>
                    <p className={`font-bold ${isActive ? "text-blue-700" : "text-slate-800"}`}>
                      {lvl.label}
                    </p>
                    <p className="text-sm text-slate-500">{lvl.desc}</p>
                  </div>
                  {isActive && <span className="ml-auto text-blue-500 font-black">✓</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Feature list */}
        {current.features && (
          <ul className="mt-5 space-y-3">
            {current.features.map((f) => (
              <li key={f.label} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="font-bold text-slate-800">{f.label}</p>
                  <p className="text-sm text-slate-500">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* CTA */}
        <button
          onClick={next}
          disabled={saving}
          className="mt-6 w-full rounded-2xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving…" : current.cta}
        </button>

        {/* Skip */}
        {!isLast && (
          <button
            onClick={skip}
            className="mt-3 w-full text-sm text-slate-400 hover:text-slate-600"
          >
            Skip intro
          </button>
        )}
      </div>
    </div>
  );
}
