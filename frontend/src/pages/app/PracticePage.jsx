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

  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);

  const [showFeedback, setShowFeedback] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);

  const total = questions.length;
  const currentQ = questions[index];

  function startSession() {
    setStarted(true);
    setIndex(0);
    setScore(0);
    setShowFeedback(false);
  }

  function handleAnswer(choice) {
    if (!currentQ || showFeedback) return;

    const correct = choice === currentQ.answer;
    setLastCorrect(correct);
    if (correct) setScore((s) => s + 1);
    setShowFeedback(true);
  }

  function nextQuestion() {
    const next = index + 1;
    setShowFeedback(false);

    if (next >= total) {
      // finished
      setIndex(total); // push beyond last question
      return;
    }

    setIndex(next);
  }

  // End screen
  if (started && index >= total) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <h1 className="text-3xl font-black tracking-tight">Practice Complete</h1>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-slate-600">Your score</p>
          <p className="mt-2 text-5xl font-black">
            {score} / {total}
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

        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
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

      <ProgressBar current={index + 1} total={total} />

      <QuestionCard word={currentQ.word} />

      <AnswerOptions disabled={showFeedback} onAnswer={handleAnswer} />

      <FeedbackPanel
        visible={showFeedback}
        correct={lastCorrect}
        correctAnswer={currentQ.answer}
        onNext={nextQuestion}
      />
    </div>
  );
}

