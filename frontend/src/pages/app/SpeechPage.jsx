import { useState, useRef, useEffect } from "react";
import { apiFetch } from "../../utils/api";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

// Fallback word list if user has no saved vocab
const FALLBACK_WORDS = [
  { word: "hund", hint: "en" }, { word: "katt", hint: "en" },
  { word: "hus", hint: "ett" }, { word: "bil", hint: "en" },
  { word: "bok", hint: "en" }, { word: "mat", hint: "en" },
  { word: "vatten", hint: "ett" }, { word: "skola", hint: "en" },
  { word: "arbete", hint: "ett" }, { word: "familj", hint: "en" },
  { word: "vänner", hint: "plural" }, { word: "Sverige", hint: "—" },
  { word: "dag", hint: "en" }, { word: "natt", hint: "en" },
  { word: "stad", hint: "en" }, { word: "land", hint: "ett" },
  { word: "barn", hint: "ett" }, { word: "flicka", hint: "en" },
  { word: "pojke", hint: "en" }, { word: "man", hint: "en" },
];

function normalize(str) {
  return str.trim().toLowerCase().replace(/[.,!?]/g, "");
}

function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export default function SpeechPage() {
  const [words, setWords] = useState([]);
  const [loadingWords, setLoadingWords] = useState(true);
  const [fetchErr] = useState("");

  const [current, setCurrent] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | listening | done
  const [heard, setHeard] = useState("");
  const [correct, setCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const recogRef = useRef(null);

  const supported = !!SpeechRecognition;
  const word = words[current];

  useEffect(() => {
    let cancelled = false;
    apiFetch("/vocab/all")
      .then((data) => {
        if (cancelled) return;
        const all = Array.isArray(data) ? data : [];
        const mapped = all
          .filter((w) => w.word)
          .map((w) => ({ word: w.word, hint: w.article || "—" }));
        const source = mapped.length >= 5 ? mapped : FALLBACK_WORDS;
        setWords(pickRandom(source, 12));
      })
      .catch(() => {
        if (!cancelled) setWords(pickRandom(FALLBACK_WORDS, 12));
      })
      .finally(() => { if (!cancelled) setLoadingWords(false); });
    return () => { cancelled = true; };
  }, []);

  function speak(text) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "sv-SE";
    utter.rate = 0.85;
    window.speechSynthesis.speak(utter);
  }

  function startListening() {
    if (!SpeechRecognition || !word) return;
    setHeard("");
    setCorrect(null);
    setStatus("listening");

    const recog = new SpeechRecognition();
    recog.lang = "sv-SE";
    recog.interimResults = false;
    recog.maxAlternatives = 5;
    recogRef.current = recog;

    let gotResult = false;

    recog.onresult = (e) => {
      gotResult = true;
      const results = Array.from(e.results[0]).map((r) => normalize(r.transcript));
      const target = normalize(word.word);
      // Accept if any alternative matches or contains the target word
      const isCorrect = results.some(
        (r) => r === target || r.includes(target) || target.includes(r)
      );
      const best = e.results[0][0].transcript;
      setHeard(best);
      setCorrect(isCorrect);
      if (isCorrect) setScore((s) => s + 1);
      setStatus("done");
    };

    recog.onerror = (e) => {
      gotResult = true;
      setStatus("done");
      setHeard(e.error === "no-speech" ? "(nothing heard)" : "(mic error)");
      setCorrect(false);
    };

    // Critical: handle end so Stop button always works
    recog.onend = () => {
      if (!gotResult) {
        setStatus("done");
        setHeard("(nothing heard)");
        setCorrect(false);
      }
    };

    recog.start();
  }

  function stopListening() {
    recogRef.current?.stop();
  }

  function handleNext() {
    window.speechSynthesis.cancel();
    if (current + 1 >= words.length) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setStatus("idle");
      setHeard("");
      setCorrect(null);
    }
  }

  function handleRestart() {
    setLoadingWords(true);
    apiFetch("/vocab/all")
      .then((data) => {
        const all = Array.isArray(data) ? data : [];
        const mapped = all
          .filter((w) => w.word)
          .map((w) => ({ word: w.word, hint: w.article || "—" }));
        const source = mapped.length >= 5 ? mapped : FALLBACK_WORDS;
        setWords(pickRandom(source, 12));
      })
      .catch(() => setWords(pickRandom(FALLBACK_WORDS, 12)))
      .finally(() => setLoadingWords(false));

    setCurrent(0);
    setStatus("idle");
    setHeard("");
    setCorrect(null);
    setScore(0);
    setFinished(false);
  }

  if (!supported) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <h1 className="text-3xl font-black tracking-tight">Speech Exercise</h1>
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6">
          <p className="font-semibold text-orange-700">
            Speech recognition is not supported in your browser.
          </p>
          <p className="text-sm text-orange-600 mt-1">
            Please use Google Chrome for this feature.
          </p>
        </div>
      </div>
    );
  }

  if (loadingWords) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-500">Loading words…</p>
      </div>
    );
  }

  if (fetchErr) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <h1 className="text-3xl font-black tracking-tight">Speech Exercise</h1>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-700">{fetchErr}</p>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <h1 className="text-3xl font-black tracking-tight">Speech Exercise</h1>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8 text-center space-y-2">
          <p className="text-4xl font-black">{score}/{words.length}</p>
          <p className="text-slate-600">{Math.round((score / words.length) * 100)}% correct</p>
          <button
            onClick={handleRestart}
            className="mt-4 rounded-xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Try again with new words
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="rounded-2xl p-6 text-white" style={{ background: "linear-gradient(135deg,#006AA7,#004f80)" }}>
        <h1 className="text-3xl font-black tracking-tight">🗣️ Speech Exercise</h1>
        <p className="mt-2 text-blue-100">
          Say the Swedish word out loud. The microphone will check your pronunciation.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-slate-200">
          <div
            className="h-2 rounded-full bg-blue-500 transition-all"
            style={{ width: `${(current / words.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-slate-500">{current + 1}/{words.length}</span>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6 text-center">
        <div>
          <p className="text-5xl font-black tracking-tight">{word?.word}</p>
          <p className="text-slate-400 mt-1 text-sm">({word?.hint})</p>
        </div>

        {/* Hear button */}
        <button
          onClick={() => speak(word.word)}
          className="rounded-xl border border-slate-200 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          🔊 Hear example
        </button>

        {/* Mic button */}
        {status === "idle" && (
          <button
            onClick={startListening}
            className="block mx-auto rounded-full bg-blue-600 w-20 h-20 text-3xl text-white hover:bg-blue-700 shadow-lg transition"
          >
            🎤
          </button>
        )}

        {status === "listening" && (
          <div className="space-y-3">
            <div className="flex justify-center">
              <span className="inline-flex items-center justify-center rounded-full bg-red-500 w-20 h-20 text-3xl text-white animate-pulse">
                🎤
              </span>
            </div>
            <p className="text-sm text-slate-500">Listening… speak now</p>
            <button
              onClick={stopListening}
              className="rounded-xl bg-slate-800 text-white px-5 py-2 text-sm font-semibold hover:bg-slate-700 transition"
            >
              ⏹ Stop
            </button>
          </div>
        )}

        {status === "done" && (
          <div className="space-y-2">
            <p className="text-sm text-slate-500">
              You said: <span className="font-semibold text-slate-700">"{heard}"</span>
            </p>
            <p className={`font-bold text-lg ${correct ? "text-green-600" : "text-red-600"}`}>
              {correct ? "Correct ✓" : `Not quite — the word is "${word?.word}"`}
            </p>
          </div>
        )}
      </div>

      {status === "done" && (
        <button
          onClick={handleNext}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700"
        >
          {current + 1 >= words.length ? "See results" : "Next →"}
        </button>
      )}
    </div>
  );
}
