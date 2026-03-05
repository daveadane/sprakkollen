// src/pages/app/OnboardingPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../state/useAuth";

const STEPS = [
  {
    emoji: "🇸🇪",
    title: "Welcome to SpråkKollen!",
    body: "Your personal Swedish language learning companion. We'll help you master en/ett, grammar, reading, and more.",
    cta: "Let's go",
  },
  {
    emoji: "🎯",
    title: "What can you do here?",
    features: [
      { icon: "🔍", label: "Checker", desc: "Look up whether any noun is en or ett instantly." },
      { icon: "🎯", label: "Practice", desc: "Drill en/ett with randomised word quizzes." },
      { icon: "📝", label: "Grammar", desc: "Test your knowledge of Swedish grammar rules." },
      { icon: "📚", label: "Reading", desc: "Read Swedish texts and answer comprehension questions." },
      { icon: "🔊", label: "Audio", desc: "Listen to words and identify them." },
      { icon: "🎤", label: "Speech", desc: "Speak Swedish words and get instant feedback." },
    ],
    cta: "Sounds great!",
  },
  {
    emoji: "🔥",
    title: "Build your streak",
    body: "Practice a little every day to keep your streak alive. You earn XP for every correct answer and level up over time.",
    cta: "Go to Dashboard",
  },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const firstName = user?.first_name || "";

  function next() {
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

        {/* Body or feature list */}
        {current.body && (
          <p className="mt-3 text-center text-slate-600">{current.body}</p>
        )}

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
          className="mt-6 w-full rounded-2xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700"
        >
          {current.cta}
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
