import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

/**
 * AIFeedback — shows a Claude-generated feedback blurb after an exercise.
 *
 * Props:
 *   exerciseType  "practice" | "grammar" | "dictation" | "image_quiz" | "test"
 *   score         number
 *   total         number
 *   wrongAnswers  [{ word, typed }]   (optional)
 */
export default function AIFeedback({ exerciseType, score, total, wrongAnswers = [] }) {
  const [state, setState] = useState("idle"); // idle | loading | done | error | unavailable
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let cancelled = false;
    setState("loading");

    apiFetch("/ai-feedback", {
      method: "POST",
      body: {
        exercise_type: exerciseType,
        score,
        total,
        wrong_answers: wrongAnswers.map((w) => ({ word: w.word, typed: w.typed || "" })),
      },
    })
      .then((data) => {
        if (cancelled) return;
        if (data?.available === false) {
          setState("unavailable");
        } else {
          setFeedback(data.feedback);
          setState("done");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        // 503 = not configured → hide silently
        if (err?.status === 503 || String(err?.message).includes("503")) {
          setState("unavailable");
        } else {
          setState("error");
        }
      });

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (state === "unavailable" || state === "idle") return null;

  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-violet-600 text-lg">🤖</span>
        <h3 className="font-black text-violet-800 text-sm uppercase tracking-wide">
          AI Tutor Feedback
        </h3>
      </div>

      {state === "loading" && (
        <div className="flex items-center gap-2 text-violet-500 text-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600" />
          <span>Generating feedback…</span>
        </div>
      )}

      {state === "done" && (
        <p className="text-slate-700 text-sm leading-relaxed">{feedback}</p>
      )}

      {state === "error" && (
        <p className="text-red-600 text-sm">Could not load AI feedback right now.</p>
      )}
    </div>
  );
}
