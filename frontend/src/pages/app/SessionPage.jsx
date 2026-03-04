// src/pages/app/SessionPage.jsx
import { useEffect, useReducer, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ProgressBar from "../../components/practice/ProgressBar";
import QuestionCard from "../../components/practice/QuestionCard";
import AnswerOptions from "../../components/practice/AnswerOptions";
import FeedbackPanel from "../../components/practice/FeedbackPanel";

import { apiFetch } from "../../utils/api";

const initialState = {
  index: 0,
  score: 0,
  showFeedback: false,
  lastCorrect: false,
  answers: [], // { word, chosen }
};

function reducer(state, action) {
  switch (action.type) {
    case "RESET":
      return initialState;

    case "ANSWER": {
      if (state.showFeedback) return state;

      const { word, choice, correctAnswer } = action;
      const correct = choice === correctAnswer;

      // upsert answer for this word (safe)
      const nextAnswers = state.answers.filter((a) => a.word !== word);
      nextAnswers.push({ word, chosen: choice });

      return {
        ...state,
        lastCorrect: correct,
        score: correct ? state.score + 1 : state.score,
        showFeedback: true,
        answers: nextAnswers,
      };
    }

    case "NEXT":
      return { ...state, index: state.index + 1, showFeedback: false };

    default:
      return state;
  }
}

export default function SessionPage() {
  const { id } = useParams(); // practice session id from backend
  const navigate = useNavigate();

  const [state, dispatch] = useReducer(reducer, initialState);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // questions from backend: [{ word }]
  const [questions, setQuestions] = useState([]);

  // local map of correct answers ONLY for feedback:
  // Since backend response doesn't include correct_article, we can’t know it here.
  // So we’ll show feedback based on backend later OR you must also return correct_article.
  //
  // QUICK FIX: return correct_article from backend for this endpoint (recommended).
  // If you don't want that, you can still run a session but feedback will be "pending".
  const [correctMap, setCorrectMap] = useState({}); // { [word]: "en"|"ett" }

  // Load session questions when id changes
  useEffect(() => {
    if (!id) return;

    dispatch({ type: "RESET" });
    setLoading(true);
    setErr("");

    (async () => {
      try {
        const data = await apiFetch(`/practice/sessions/${id}`, { method: "GET" });

        const qs = data?.questions || [];
        setQuestions(qs);

        // If backend includes correct_article (recommended), fill correctMap:
        // expected: questions: [{ word, correct_article }]
        const map = {};
        for (const q of qs) {
          if (q.correct_article) map[q.word] = q.correct_article;
        }
        setCorrectMap(map);
      } catch (e) {
        setErr(e?.message || "Failed to load practice session");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const total = questions.length;
  const currentQ = questions[state.index];

  // Answer handler
  function handleAnswer(choice) {
    if (!currentQ) return;

    const word = currentQ.word;

    // For instant feedback we need the correct answer.
    // If backend didn’t send it, we’ll treat feedback as unknown.
    const correctAnswer = correctMap[word] || null;

    // If we DON'T have correctAnswer, we still store the choice and allow next,
    // but feedback will be generic.
    dispatch({
      type: "ANSWER",
      word,
      choice,
      correctAnswer: correctAnswer ?? "__UNKNOWN__",
    });
  }

  async function submitToBackend() {
    // Send all chosen answers
    // Expected by backend: { answers: [{ word, chosen }] }
    return apiFetch(`/practice/sessions/${id}/submit`, {
      method: "POST",
      body: { answers: state.answers },
    });
  }

  async function nextQuestion() {
    const next = state.index + 1;

    if (next >= total) {
      // submit at end
      try {
        setErr("");
        await submitToBackend();
      } catch (e) {
        // still show end screen, but show error
        setErr(e?.message || "Submit failed");
      }

      dispatch({ type: "NEXT" }); // move beyond total => show end screen
      return;
    }

    dispatch({ type: "NEXT" });
  }

  async function practiceAgain() {
    try {
      setErr("");
      const data = await apiFetch("/practice/sessions", { method: "POST" });
      if (!data?.id) throw new Error("Backend did not return session id");
      navigate(`/practice/session/${data.id}`);
    } catch (e) {
      setErr(e?.message || "Failed to create new session");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <h1 className="text-3xl font-black tracking-tight">Practice Session</h1>
        <p className="text-slate-600">Loading session {id}…</p>
      </div>
    );
  }

  if (err && total === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <h1 className="text-3xl font-black tracking-tight">Practice Session</h1>
        <p className="text-red-600 font-semibold">{err}</p>
        <button
          onClick={() => navigate("/practice")}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-bold hover:bg-slate-50"
        >
          Back
        </button>
      </div>
    );
  }

  // End screen
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

          {err ? (
            <p className="mt-4 text-sm font-semibold text-red-600">
              Submit warning: {err}
            </p>
          ) : null}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate("/practice")}
            className="flex-1 rounded-2xl border border-slate-200 bg-white py-4 font-bold text-slate-900 hover:bg-slate-50"
          >
            Back
          </button>

          <button
            onClick={practiceAgain}
            className="flex-1 rounded-2xl bg-blue-600 py-4 font-bold text-white hover:bg-blue-700"
          >
            Practice Again
          </button>
        </div>
      </div>
    );
  }

  // Feedback values
  const word = currentQ?.word;
  const correctAnswer = correctMap[word] || null;

  // If we don’t have correctAnswer, we can’t show correct/incorrect reliably.
  // We'll still show panel, but with a neutral message.
  const canJudge = Boolean(correctAnswer);
  const shownCorrect = canJudge ? state.lastCorrect : true;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Practice Session</h1>
        <p className="mt-2 text-slate-600">Choose the correct article.</p>
        <p className="mt-1 text-xs text-slate-400">Session: {id}</p>
        {err ? <p className="mt-2 text-sm font-semibold text-red-600">{err}</p> : null}
      </div>

      <ProgressBar current={state.index + 1} total={total} />
      <QuestionCard word={word} />
      <AnswerOptions disabled={state.showFeedback} onAnswer={handleAnswer} />

      <FeedbackPanel
        visible={state.showFeedback}
        correct={shownCorrect}
        correctAnswer={correctAnswer || "—"}
        onNext={nextQuestion}
        // Optional: if your FeedbackPanel supports custom message, add prop
        // message={!canJudge ? "Answer saved. Result will be computed on submit." : undefined}
      />

      {!canJudge ? (
        <p className="text-xs text-slate-500">
          Note: backend isn’t sending correct answers, so instant feedback is limited.
          Best fix: include <code>correct_article</code> in the GET session response.
        </p>
      ) : null}
    </div>
  );
}
