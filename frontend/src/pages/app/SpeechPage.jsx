import { useState, useRef } from "react";

const WORDS = [
  { word: "hund", hint: "dog" },
  { word: "katt", hint: "cat" },
  { word: "hus", hint: "house" },
  { word: "bil", hint: "car" },
  { word: "bok", hint: "book" },
  { word: "mat", hint: "food" },
  { word: "vatten", hint: "water" },
  { word: "skola", hint: "school" },
  { word: "arbete", hint: "work" },
  { word: "familj", hint: "family" },
  { word: "vänner", hint: "friends" },
  { word: "Sverige", hint: "Sweden" },
];

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

function normalize(str) {
  return str.trim().toLowerCase().replace(/[.,!?]/g, "");
}

export default function SpeechPage() {
  const [current, setCurrent] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | listening | done
  const [heard, setHeard] = useState("");
  const [correct, setCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const recogRef = useRef(null);

  const supported = !!SpeechRecognition;
  const word = WORDS[current];

  function speak(text) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "sv-SE";
    utter.rate = 0.85;
    window.speechSynthesis.speak(utter);
  }

  function startListening() {
    if (!SpeechRecognition) return;
    setHeard("");
    setCorrect(null);
    setStatus("listening");

    const recog = new SpeechRecognition();
    recog.lang = "sv-SE";
    recog.interimResults = false;
    recog.maxAlternatives = 3;
    recogRef.current = recog;

    recog.onresult = (e) => {
      const results = Array.from(e.results[0]).map((r) => normalize(r.transcript));
      const target = normalize(word.word);
      const isCorrect = results.some((r) => r === target);
      const best = e.results[0][0].transcript;
      setHeard(best);
      setCorrect(isCorrect);
      if (isCorrect) setScore((s) => s + 1);
      setStatus("done");
    };

    recog.onerror = () => {
      setStatus("done");
      setHeard("(could not hear)");
      setCorrect(false);
    };

    recog.start();
  }

  function stopListening() {
    recogRef.current?.stop();
  }

  function handleNext() {
    if (current + 1 >= WORDS.length) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setStatus("idle");
      setHeard("");
      setCorrect(null);
    }
  }

  function handleRestart() {
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

  if (finished) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <h1 className="text-3xl font-black tracking-tight">Speech Exercise</h1>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8 text-center space-y-2">
          <p className="text-4xl font-black">{score}/{WORDS.length}</p>
          <p className="text-slate-600">{Math.round((score / WORDS.length) * 100)}% correct</p>
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
        <h1 className="text-3xl font-black tracking-tight">Speech Exercise</h1>
        <p className="mt-2 text-slate-600">
          Say the Swedish word out loud. The microphone will check your pronunciation.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-slate-200">
          <div
            className="h-2 rounded-full bg-blue-500 transition-all"
            style={{ width: `${(current / WORDS.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-slate-500">{current + 1}/{WORDS.length}</span>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6 text-center">
        <div>
          <p className="text-5xl font-black tracking-tight">{word.word}</p>
          <p className="text-slate-400 mt-1 text-sm">({word.hint})</p>
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
              <span className="inline-block rounded-full bg-red-500 w-20 h-20 text-3xl text-white flex items-center justify-center animate-pulse">
                🎤
              </span>
            </div>
            <p className="text-sm text-slate-500">Listening... speak now</p>
            <button
              onClick={stopListening}
              className="rounded-xl border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Stop
            </button>
          </div>
        )}

        {status === "done" && (
          <div className="space-y-2">
            <p className="text-sm text-slate-500">
              You said: <span className="font-semibold text-slate-700">"{heard}"</span>
            </p>
            <p className={`font-bold text-lg ${correct ? "text-green-600" : "text-red-600"}`}>
              {correct ? "Correct ✓" : `Try again — say "${word.word}"`}
            </p>
          </div>
        )}
      </div>

      {status === "done" && (
        <button
          onClick={handleNext}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700"
        >
          {current + 1 >= WORDS.length ? "See results" : "Next →"}
        </button>
      )}
    </div>
  );
}
