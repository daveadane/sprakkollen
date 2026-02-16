import { useMemo, useReducer } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ProgressBar from "../../components/practice/ProgressBar";
import QuestionCard from "../../components/practice/QuestionCard";
import AnswerOptions from "../../components/practice/AnswerOptions";
import FeedbackPanel from "../../components/practice/FeedbackPanel";
import { recordPractice } from "../../utils/progressStorage";

const initialState = {
  index: 0,
  score: 0,
  showFeedback: false,
  lastCorrect: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "RESET":
      return initialState;

    case "ANSWER": {
      if (state.showFeedback) return state;
      const correct = action.choice === action.correctAnswer;
      return {
        ...state,
        lastCorrect: correct,
        score: correct ? state.score + 1 : state.score,
        showFeedback: true,
      };
    }

    case "NEXT":
      return { ...state, index: state.index + 1, showFeedback: false };

    default:
      return state;
  }
}

export default function SessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();

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
  const [state, dispatch] = useReducer(reducer, initialState);

  // 🔥 reset whenever session id changes
  useMemo(() => {
    dispatch({ type: "RESET" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const currentQ = questions[state.index];

  function handleAnswer(choice) {
    if (!currentQ) return;
    dispatch({ type: "ANSWER", choice, correctAnswer: currentQ.answer });
  }

  function nextQuestion() {
    const next = state.index + 1;

    if (next >= total) {
      recordPractice({ score: state.score, total });
      dispatch({ type: "NEXT" }); // moves index beyond total
      return;
    }

    dispatch({ type: "NEXT" });
  }

  if (state.index >= total) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <h1 className="text-3xl font-black tracking-tight">Practice Complete</h1>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-slate-600">Session ID</p>
          <p className="mt-1 font-mono text-sm text-slate-500">{id}</p>

          <p className="mt-6 text-slate-600">Your score</p>
          <p className="mt-2 text-5xl font-black">
            {state.score} / {total}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate("/practice")}
            className="flex-1 rounded-2xl border border-slate-200 bg-white py-4 font-bold text-slate-900 hover:bg-slate-50"
          >
            Back
          </button>

          <button
            onClick={() => navigate(`/practice/session/${crypto.randomUUID?.() ?? Date.now()}`)}
            className="flex-1 rounded-2xl bg-blue-600 py-4 font-bold text-white hover:bg-blue-700"
          >
            Practice Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Practice Session</h1>
        <p className="mt-2 text-slate-600">Choose the correct article.</p>
        <p className="mt-1 text-xs text-slate-400">Session: {id}</p>
      </div>

      <ProgressBar current={state.index + 1} total={total} />
      <QuestionCard word={currentQ.word} />
      <AnswerOptions disabled={state.showFeedback} onAnswer={handleAnswer} />
      <FeedbackPanel
        visible={state.showFeedback}
        correct={state.lastCorrect}
        correctAnswer={currentQ.answer}
        onNext={nextQuestion}
      />
    </div>
  );
}
