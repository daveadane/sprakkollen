import { useMemo, useState } from "react";
import ProgressBar from "../../components/practice/ProgressBar";
import QuestionCard from "../../components/practice/QuestionCard";
import AnswerOptions from "../../components/practice/AnswerOptions";
import FeedbackPanel from "../../components/practice/FeedbackPanel";

export default function PracticePage() {
  // Mock question set (later comes from backend)
  const questions = useMemo(
    () => [
      { word: "hus", answer: "ett" },
      { word: "bok", answer: "en" },
      { word: "barn", answer: "ett" },
      { word: "bil", answer: "en" },
      { word: "bord", answer: "ett" },
    ],
    []
  );

  const total = questions.length;

  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);


  const [showFeedback, setShowFeedback] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const currentQ = index < total ? questions[index] : null;

  function startSession() {
    setStarted(true);
    setIndex(0);
    setScore(0);
    setShowFeedback(false);
    setLastCorrect(false);
    setSelectedAnswer(null);
  }

  function handleAnswer(choice) {
    if (!currentQ || showFeedback) return;

    setSelectedAnswer(choice);

    const correct = choice === currentQ.answer;
    setLastCorrect(correct);

      if (correct) {
    setScore((s) => s + 1);
    setXp((prev) => prev + 10); // +10 XP per correct answer
    }


    setShowFeedback(true);
  }

  function nextQuestion() {
    setSelectedAnswer(null);
    setShowFeedback(false);

    const next = index + 1;

    if (next >= total) {
      setIndex(total); // triggers end screen
      return;
    }

    setIndex(next);
  }

  // End screen
  if (started && index >= total) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <h1 className="text-3xl font-black tracking-tight">Practice Complete</h1>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-600">Your score</p>
          <p className="mt-2 text-5xl font-black">
            {score} / {total}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Accuracy: {Math.round((score / total) * 100)}%
          </p>
          <p className="mt-2 text-lg font-semibold text-blue-600">
            XP earned: {xp}
          </p>

        </div>

        <button
          onClick={startSession}
          className="w-full rounded-2xl bg-blue-600 py-4 font-bold text-white hover:bg-blue-700"
        >
          Practice Again
        </button>
      </div>
    );
  }

  // Start screen
  if (!started) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Practice</h1>
          <p className="mt-2 text-slate-600">
            Quick session: choose EN or ETT. Instant feedback. Track your score.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 shadow-sm">
          <p className="font-semibold">Session length: {total} questions</p>
          <p className="text-sm text-slate-600">
            Later: this will use your saved vocabulary + weak words.
          </p>
        </div>

        <button
          onClick={startSession}
          className="w-full rounded-2xl bg-blue-600 py-4 font-bold text-white hover:bg-blue-700"
        >
          Start Practice
        </button>
      </div>
    );
  }

  // Session screen
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Practice Session</h1>
        <p className="mt-2 text-slate-600">Choose the correct article.</p>
      </div>
          <div className="flex justify-between text-sm font-semibold text-slate-600">
        <span>Score: {score}</span>
        <span>XP: {xp}</span>
      </div>
      <ProgressBar current={index + 1} total={total} />

      <QuestionCard word={currentQ.word} />

      <AnswerOptions
        disabled={showFeedback}
        selected={selectedAnswer}
        correctAnswer={currentQ.answer}
        onAnswer={handleAnswer}
      />

      <FeedbackPanel
        visible={showFeedback}
        correct={lastCorrect}
        correctAnswer={currentQ.answer}
        onNext={nextQuestion}
      />
    </div>
  );
}
