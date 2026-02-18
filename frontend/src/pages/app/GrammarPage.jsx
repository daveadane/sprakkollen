import { useMemo, useState } from "react";
import { recordGrammarQuiz } from "../../utils/progressStorage";

export default function GrammarPage() {
  const questions = useMemo(
    () => [
      {
        prompt: "Choose correct: ___ bok",
        options: ["en", "ett"],
        answer: "en",
        explain: "‘bok’ is an en-word: en bok.",
      },
      {
        prompt: "Choose correct: ___ hus",
        options: ["en", "ett"],
        answer: "ett",
        explain: "‘hus’ is an ett-word: ett hus.",
      },
      {
        prompt: "Plural of ‘en bil’ is…",
        options: ["bilar", "bilor", "bilarna"],
        answer: "bilar",
        explain: "Indefinite plural: bilar.",
      },
      {
        prompt: "Definite form of ‘ett äpple’ is…",
        options: ["äpplet", "äppeln", "äpple"],
        answer: "äpplet",
        explain: "Ett-word definite: -et → äpplet.",
      },
      {
        prompt: "Which is correct word order?",
        options: ["Jag inte förstår.", "Jag förstår inte.", "Inte jag förstår."],
        answer: "Jag förstår inte.",
        explain: "Standard: subject + verb + inte.",
      },
    ],
    []
  );

  const total = questions.length;

  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);

  const [picked, setPicked] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const q = questions[i];

  function start() {
    setStarted(true);
    setI(0);
    setScore(0);
    setPicked(null);
    setShowFeedback(false);
  }

  function choose(option) {
    if (!q || showFeedback) return; // prevents double answering

    setPicked(option);
    setShowFeedback(true);

    if (option === q.answer) {
      setScore((s) => s + 1);
    }
  }

  function next() {
    // If not showing feedback, ignore
    if (!showFeedback) return;

    // compute the score that should be recorded if we're finishing
    const answeredCorrect = picked === q.answer;
    const finalScore = answeredCorrect ? score : score; // score already updated in choose()

    const nextIndex = i + 1;

    // reset UI for next question
    setPicked(null);
    setShowFeedback(false);

    if (nextIndex >= total) {
      // IMPORTANT: record quiz using a safe score.
      // Because setScore is async, use current `score` which is already correct due to choose() guard.
      recordGrammarQuiz({ score: finalScore, total });
      setI(total);
      return;
    }

    setI(nextIndex);
  }

  // end screen
  if (started && i >= total) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <h1 className="text-3xl font-black tracking-tight">Grammar Quiz Complete</h1>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-slate-600">Your score</p>
          <p className="mt-2 text-5xl font-black">
            {score} / {total}
          </p>
          <p className="mt-2 text-sm text-slate-500">Saved to progress + XP awarded.</p>
        </div>

        <button
          onClick={start}
          className="w-full rounded-2xl bg-blue-600 py-4 font-bold text-white hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // start screen
  if (!started) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Grammar</h1>
          <p className="mt-2 text-slate-600">
            Quick quiz: rules + examples. Results are saved in your progress.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-2">
          <p className="font-semibold">Quiz length: {total} questions</p>
          <p className="text-sm text-slate-600">Later: questions can be personalized.</p>
        </div>

        <button
          onClick={start}
          className="w-full rounded-2xl bg-blue-600 py-4 font-bold text-white hover:bg-blue-700"
        >
          Start Grammar Quiz
        </button>
      </div>
    );
  }

  // quiz screen
  const correct = picked === q.answer;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Grammar Quiz</h1>
        <p className="mt-2 text-slate-600">Choose the best answer.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">
          Question {i + 1} / {total}
        </p>

        <p className="mt-4 text-2xl font-black">{q.prompt}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {q.options.map((opt) => (
            <button
              key={opt}
              onClick={() => choose(opt)}
              disabled={showFeedback}
              className={`rounded-2xl border px-4 py-4 font-bold transition
                ${
                  showFeedback
                    ? opt === q.answer
                      ? "border-green-200 bg-green-50 text-green-800"
                      : opt === picked
                      ? "border-red-200 bg-red-50 text-red-800"
                      : "border-slate-200 bg-white text-slate-900 opacity-70"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
            >
              {opt}
            </button>
          ))}
        </div>

        {showFeedback && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className={`font-bold ${correct ? "text-green-700" : "text-red-700"}`}>
              {correct ? "Correct ✅" : "Not quite ❌"}
            </p>
            <p className="mt-2 text-sm text-slate-700">{q.explain}</p>

            <button
              onClick={next}
              className="mt-4 w-full rounded-2xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700"
            >
              {i + 1 === total ? "Finish" : "Next"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


