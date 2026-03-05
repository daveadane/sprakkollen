import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";

// ---- Speech Recognition helper ----
function useSpeechRecognition(onResult) {
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);

  function start() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return false;
    const rec = new SR();
    rec.lang = "sv-SE";
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript.trim();
      onResult(transcript);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
    return true;
  }

  function stop() {
    recRef.current?.stop();
    setListening(false);
  }

  return { listening, start, stop };
}

export default function ImageQuizPage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [phase, setPhase] = useState("start"); // start | loading | quiz | result
  const [sessionId, setSessionId] = useState(null);
  const [words, setWords] = useState([]);
  const [images, setImages] = useState({}); // word → image_url
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [lightbox, setLightbox] = useState(false);

  const { listening, start: startSpeech } = useSpeechRecognition((transcript) => {
    setTyped(transcript);
  });

  const word = words[i];
  const total = words.length;
  const isLast = i + 1 === total;
  // undefined = not fetched yet, null = fetched but no image, string = has image
  const imageEntry = word ? images[word] : undefined;
  const imageLoading = imageEntry === undefined;
  const imageUrl = typeof imageEntry === "string" ? imageEntry : null;

  // Prefetch images for all words after session starts
  useEffect(() => {
    if (phase !== "quiz" || words.length === 0) return;
    words.forEach((w) => {
      if (images[w] !== undefined) return; // already resolved
      // Mark as "in flight" with a sentinel so we don't double-fetch
      setImages((prev) => (w in prev ? prev : { ...prev, [w]: undefined }));
      apiFetch(`/word-image?word=${encodeURIComponent(w)}`)
        .then((img) => setImages((prev) => ({ ...prev, [w]: img?.image_url || null })))
        .catch(() => setImages((prev) => ({ ...prev, [w]: null })));
    });
  }, [phase, words]); // eslint-disable-line react-hooks/exhaustive-deps

  async function startSession() {
    setPhase("loading");
    setErr("");
    try {
      const data = await apiFetch("/image-quiz/sessions", { method: "POST" });
      setSessionId(data.id);
      setWords(data.words);
      setImages({});
      setI(0);
      setAnswers([]);
      setTyped("");
      setShowFeedback(false);
      setPhase("quiz");
    } catch (e) {
      setErr(typeof e?.message === "string" ? e.message : "Failed to start");
      setPhase("start");
    }
  }

  function handleCheck() {
    if (!typed.trim()) return;
    setShowFeedback(true);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      if (!showFeedback) handleCheck();
      else handleNext();
    }
  }

  async function handleNext() {
    const newAnswers = [...answers, typed.trim()];
    setAnswers(newAnswers);

    if (!isLast) {
      setI(i + 1);
      setTyped("");
      setShowFeedback(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      try {
        const data = await apiFetch(`/image-quiz/sessions/${sessionId}/submit`, {
          method: "POST",
          body: { answers: newAnswers },
        });
        setResult(data);
        setPhase("result");
      } catch (e) {
        setErr(typeof e?.message === "string" ? e.message : "Failed to submit");
      }
    }
  }

  const isCorrect = showFeedback && typed.trim().toLowerCase() === word?.toLowerCase();

  // ---- START ----
  if (phase === "start") {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Image Quiz</h1>
          <p className="mt-2 text-slate-600">
            Look at the image and type (or speak) the Swedish word. 8 words per session.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🖼️</span>
            <p className="text-slate-700">An image appears — what Swedish word does it show?</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">⌨️</span>
            <p className="text-slate-700">Type the word, or use the mic to speak it</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <p className="text-slate-700">Results are saved to your progress</p>
          </div>
        </div>

        {err && <p className="text-sm font-semibold text-red-600">{err}</p>}

        <button
          onClick={startSession}
          className="w-full rounded-2xl bg-slate-900 py-4 text-lg font-black text-white hover:bg-slate-700"
        >
          Start Image Quiz →
        </button>
      </div>
    );
  }

  // ---- LOADING ----
  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  // ---- QUIZ ----
  if (phase === "quiz") {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Word {i + 1} of {total}</span>
            <span className="font-semibold text-violet-600">Image Quiz</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-violet-600 transition-all"
              style={{ width: `${((i + 1) / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
          {/* Image thumbnail */}
          <div className="flex justify-center">
            <div className="relative w-44 h-44 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Guess this word"
                  className="w-full h-full object-cover cursor-zoom-in"
                  onDoubleClick={() => setLightbox(true)}
                  title="Double-click to enlarge"
                />
              ) : imageLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-300 border-t-violet-600" />
                  <p className="text-slate-400 text-xs">Loading…</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-slate-400 px-3 text-center">
                  <span className="text-3xl">🖼️</span>
                  <p className="text-xs">No image</p>
                  <p className="text-xs">Starts with <strong className="text-slate-500">{word?.[0]?.toUpperCase()}</strong></p>
                </div>
              )}
              {/* Feedback overlay */}
              {showFeedback && (
                <div className={`absolute inset-0 flex items-end p-2 ${isCorrect ? "bg-green-900/40" : "bg-red-900/40"}`}>
                  <div className={`w-full rounded-lg px-2 py-1 text-center font-black text-sm ${isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {isCorrect ? `✓ ${word}` : `✗ ${word}`}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Input row */}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={showFeedback}
                autoFocus
                placeholder="Type the Swedish word…"
                className={`flex-1 rounded-xl border-2 px-4 py-3 text-lg font-semibold outline-none transition
                  ${showFeedback
                    ? isCorrect
                      ? "border-green-400 bg-green-50 text-green-800"
                      : "border-red-400 bg-red-50 text-red-700"
                    : "border-slate-200 bg-white focus:border-violet-400"
                  }`}
              />
              {/* Mic button */}
              {!showFeedback && (window.SpeechRecognition || window.webkitSpeechRecognition) && (
                <button
                  onClick={() => startSpeech()}
                  className={`rounded-xl px-4 py-3 text-xl transition ${
                    listening
                      ? "bg-red-100 text-red-600 animate-pulse"
                      : "bg-slate-100 text-slate-600 hover:bg-violet-100 hover:text-violet-700"
                  }`}
                  title="Speak the word"
                >
                  🎤
                </button>
              )}
            </div>

            {listening && (
              <p className="text-xs text-center text-violet-600 animate-pulse">Listening…</p>
            )}
          </div>
        </div>

        {/* Action button */}
        {!showFeedback ? (
          <button
            onClick={handleCheck}
            disabled={!typed.trim()}
            className="w-full rounded-2xl bg-violet-600 py-3 font-black text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Check
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full rounded-2xl bg-slate-900 py-3 font-black text-white hover:bg-slate-700"
          >
            {isLast ? "Finish →" : "Next →"}
          </button>
        )}

        {err && <p className="text-sm text-red-600 font-semibold">{err}</p>}

        {/* Lightbox */}
        {lightbox && imageUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={() => setLightbox(false)}
          >
            <img
              src={imageUrl}
              alt="Enlarged"
              className="max-w-[90vw] max-h-[85vh] rounded-2xl shadow-2xl object-contain"
            />
            <button
              className="absolute top-4 right-4 text-white text-3xl font-black leading-none"
              onClick={() => setLightbox(false)}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    );
  }

  // ---- RESULT ----
  if (phase === "result" && result) {
    const pct = result.accuracy;
    const medal = pct >= 90 ? "🏆" : pct >= 70 ? "⭐" : pct >= 50 ? "👍" : "📚";

    return (
      <div className="mx-auto max-w-xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3">
          <p className="text-6xl">{medal}</p>
          <h2 className="text-3xl font-black">{result.score} / {result.total}</h2>
          <p className="text-xl font-bold text-slate-600">{pct}% correct</p>
        </div>

        <div className="space-y-3">
          <h3 className="font-black text-slate-700">Breakdown</h3>
          {result.feedback.map((f, idx) => (
            <div
              key={idx}
              className={`rounded-xl border overflow-hidden ${f.correct ? "border-green-200" : "border-red-200"}`}
            >
              <div className="flex gap-3 p-3 items-center">
                <span className="text-lg">{f.correct ? "✓" : "✗"}</span>
                {f.image_url && (
                  <img
                    src={f.image_url}
                    alt={f.word}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{f.word}</p>
                  {!f.correct && (
                    <p className="text-xs text-red-700">You typed: <strong>{f.typed || "—"}</strong></p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setPhase("start"); setResult(null); }}
            className="rounded-2xl border border-slate-300 py-3 font-bold text-slate-700 hover:bg-slate-50"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-2xl bg-slate-900 py-3 font-bold text-white hover:bg-slate-700"
          >
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
}
