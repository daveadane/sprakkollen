import { useState } from "react";

const EXERCISES = [
  { id: 1, sentence: "Hunden springer i parken.", question: "Vad gör hunden?", correct: "Springer", choices: ["Sover", "Springer", "Äter", "Simmar"] },
  { id: 2, sentence: "Jag dricker kaffe varje morgon.", question: "När dricker personen kaffe?", correct: "Varje morgon", choices: ["På kvällen", "Varje morgon", "På lunchen", "Aldrig"] },
  { id: 3, sentence: "Det är kallt ute idag.", question: "Hur är vädret?", correct: "Kallt", choices: ["Varmt", "Blåsigt", "Kallt", "Regnigt"] },
  { id: 4, sentence: "Hon läser en bok i soffan.", question: "Var läser hon?", correct: "I soffan", choices: ["I sängen", "I köket", "I soffan", "I trädgården"] },
  { id: 5, sentence: "Barnen leker i skolan.", question: "Var leker barnen?", correct: "I skolan", choices: ["I parken", "Hemma", "I skolan", "På stranden"] },
  { id: 6, sentence: "Vi äter middag klockan sex.", question: "När äter de middag?", correct: "Klockan sex", choices: ["Klockan fem", "Klockan sex", "Klockan sju", "Klockan åtta"] },
  { id: 7, sentence: "Bilen är röd och ny.", question: "Vilken färg har bilen?", correct: "Röd", choices: ["Blå", "Grön", "Röd", "Gul"] },
  { id: 8, sentence: "Min mamma jobbar på ett sjukhus.", question: "Var jobbar mamman?", correct: "På ett sjukhus", choices: ["På en skola", "På ett sjukhus", "På ett kontor", "Hemma"] },
];

function speak(text) {
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "sv-SE";
  utter.rate = 0.85;
  window.speechSynthesis.speak(utter);
}

export default function AudioPage() {
  const [current, setCurrent] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const ex = EXERCISES[current];

  function handleChoice(choice) {
    if (revealed) return;
    setChosen(choice);
    setRevealed(true);
    if (choice === ex.correct) setScore((s) => s + 1);
  }

  function handleNext() {
    if (current + 1 >= EXERCISES.length) {
      setDone(true);
    } else {
      setCurrent((c) => c + 1);
      setChosen(null);
      setRevealed(false);
    }
  }

  function handleRestart() {
    setCurrent(0);
    setChosen(null);
    setScore(0);
    setDone(false);
    setRevealed(false);
  }

  if (done) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <h1 className="text-3xl font-black tracking-tight">Audio Exercise</h1>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8 text-center space-y-2">
          <p className="text-4xl font-black">{score}/{EXERCISES.length}</p>
          <p className="text-slate-600">{Math.round((score / EXERCISES.length) * 100)}% correct</p>
          <button
            onClick={handleRestart}
            className="mt-4 rounded-xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Audio Exercise</h1>
        <p className="mt-2 text-slate-600">
          Listen to the Swedish sentence, then answer the question.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-slate-200">
          <div
            className="h-2 rounded-full bg-blue-500 transition-all"
            style={{ width: `${((current) / EXERCISES.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-slate-500">{current + 1}/{EXERCISES.length}</span>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        {/* Listen button */}
        <div className="text-center">
          <button
            onClick={() => speak(ex.sentence)}
            className="rounded-2xl bg-blue-600 px-8 py-4 text-white font-bold text-lg hover:bg-blue-700 transition"
          >
            🔊 Listen
          </button>
          <p className="mt-3 text-xs text-slate-400">Click to hear the sentence in Swedish</p>
        </div>

        {/* Show sentence after answering */}
        {revealed && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-center">
            <p className="text-slate-700 italic">"{ex.sentence}"</p>
          </div>
        )}

        {/* Question */}
        <p className="font-semibold text-center">{ex.question}</p>

        {/* Choices */}
        <div className="grid grid-cols-2 gap-3">
          {ex.choices.map((c) => {
            let cls = "rounded-xl border px-4 py-3 text-sm font-semibold transition text-left ";
            if (!revealed) {
              cls += "border-slate-200 bg-slate-50 hover:border-blue-400 text-slate-700";
            } else if (c === ex.correct) {
              cls += "border-green-400 bg-green-50 text-green-800";
            } else if (c === chosen) {
              cls += "border-red-400 bg-red-50 text-red-700";
            } else {
              cls += "border-slate-200 bg-slate-50 text-slate-400";
            }
            return (
              <button key={c} className={cls} onClick={() => handleChoice(c)} disabled={revealed}>
                {c}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {revealed && (
          <p className={`text-sm font-semibold text-center ${chosen === ex.correct ? "text-green-600" : "text-red-600"}`}>
            {chosen === ex.correct ? "Correct ✓" : `Incorrect ✗ — correct: ${ex.correct}`}
          </p>
        )}
      </div>

      {revealed && (
        <button
          onClick={handleNext}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700"
        >
          {current + 1 >= EXERCISES.length ? "See results" : "Next →"}
        </button>
      )}
    </div>
  );
}
