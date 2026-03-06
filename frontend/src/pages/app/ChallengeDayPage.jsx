import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../../utils/api";

const RECORD_LIMIT = 60; // seconds
const MIN_SECONDS = 10;  // must speak at least 10s before submitting

export default function ChallengeDayPage() {
  const { day } = useParams();
  const navigate = useNavigate();
  const dayNum = parseInt(day, 10);

  const [phase, setPhase] = useState("loading"); // loading | prompt | unsupported | recording | processing | result | done
  const [dayData, setDayData] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const finalTranscriptRef = useRef("");

  // Load day data
  useEffect(() => {
    apiFetch(`/speaking-challenge/${dayNum}`)
      .then((data) => {
        setDayData(data);
        if (data.already_completed) {
          setPhase("done");
        } else {
          setPhase("prompt");
        }
      })
      .catch((err) => {
        setError(err?.message || "Could not load this day.");
        setPhase("prompt");
      });
  }, [dayNum]);

  function startRecording() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setPhase("unsupported");
      return;
    }

    finalTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setElapsed(0);

    const recog = new SpeechRecognition();
    recog.lang = "sv-SE";
    recog.continuous = true;
    recog.interimResults = true;
    recog.maxAlternatives = 1;

    recog.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalTranscriptRef.current += e.results[i][0].transcript + " ";
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscriptRef.current);
      setInterimTranscript(interim);
    };

    recog.onerror = (e) => {
      if (e.error !== "no-speech") {
        console.warn("Speech recognition error:", e.error);
      }
    };

    // Auto-restart if browser stops it before time is up
    recog.onend = () => {
      if (recognitionRef.current === recog && phase === "recording") {
        recog.start();
      }
    };

    recog.start();
    recognitionRef.current = recog;
    setPhase("recording");

    // Timer
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - start) / 1000);
      setElapsed(secs);
      if (secs >= RECORD_LIMIT) {
        stopAndSubmit(recog);
      }
    }, 500);
  }

  function stopAndSubmit(recogOverride) {
    const recog = recogOverride || recognitionRef.current;
    if (recog) {
      recog.onend = null; // prevent auto-restart
      recog.stop();
      recognitionRef.current = null;
    }
    clearInterval(timerRef.current);

    const final = finalTranscriptRef.current.trim();
    submitTranscript(final || "(no speech detected)");
  }

  async function submitTranscript(text) {
    setPhase("processing");
    try {
      const data = await apiFetch(`/speaking-challenge/${dayNum}/submit`, {
        method: "POST",
        body: { transcript: text },
      });
      setResult(data);
      setPhase("result");
    } catch (err) {
      setError(err?.message || "Submission failed.");
      setPhase("prompt");
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
      clearInterval(timerRef.current);
    };
  }, []);

  const remaining = Math.max(0, RECORD_LIMIT - elapsed);
  const canStop = elapsed >= MIN_SECONDS;

  // ── Render ──────────────────────────────────────────────────────────────

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        Loading day {dayNum}…
      </div>
    );
  }

  if (phase === "unsupported") {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center space-y-4">
        <p className="text-4xl">⚠️</p>
        <p className="font-black text-amber-800 text-lg">Browser not supported</p>
        <p className="text-amber-700 text-sm">
          Speech recognition requires <strong>Chrome</strong> or <strong>Edge</strong>.
          Please open this page in one of those browsers.
        </p>
        <button
          onClick={() => navigate("/speaking-challenge")}
          className="rounded-xl bg-amber-500 px-6 py-2 text-white font-bold text-sm hover:bg-amber-600 transition"
        >
          Back to Challenge
        </button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-green-200 bg-green-50 p-8 text-center space-y-4">
        <p className="text-4xl">✅</p>
        <p className="font-black text-green-800 text-lg">Day {dayNum} already completed!</p>
        <p className="text-green-700 text-sm">You already finished this day. Come back tomorrow!</p>
        <button
          onClick={() => navigate("/speaking-challenge")}
          className="rounded-xl bg-green-500 px-6 py-2 text-white font-bold text-sm hover:bg-green-600 transition"
        >
          Back to Challenge
        </button>
      </div>
    );
  }

  if (phase === "prompt" || phase === "recording") {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        {/* Day header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/speaking-challenge")}
            className="text-slate-400 hover:text-slate-600 text-sm"
          >
            ← Back
          </button>
          <span className="text-sm font-bold text-rose-500 uppercase tracking-wide">
            Day {dayNum} of 30
          </span>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-600 text-sm">
            {error}
          </p>
        )}

        {/* Prompt card */}
        {dayData && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 space-y-3">
            <p className="text-xs font-black text-rose-400 uppercase tracking-wide">Today's prompt</p>
            <p className="text-lg font-bold text-slate-800 leading-snug">{dayData.prompt}</p>
            <p className="text-sm text-slate-500 italic">💡 {dayData.tip}</p>
          </div>
        )}

        {/* Recording UI */}
        {phase === "recording" ? (
          <div className="space-y-4">
            {/* Timer */}
            <div className="flex items-center justify-between rounded-xl bg-slate-900 px-5 py-3 text-white">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-bold">Recording…</span>
              </div>
              <span className={`text-2xl font-black tabular-nums ${remaining <= 10 ? "text-red-400" : "text-white"}`}>
                {String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}
              </span>
            </div>

            {/* Live transcript */}
            <div className="min-h-24 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 leading-relaxed">
              {transcript || interimTranscript ? (
                <>
                  <span>{transcript}</span>
                  <span className="text-slate-400">{interimTranscript}</span>
                </>
              ) : (
                <span className="text-slate-300 italic">Start speaking in Swedish…</span>
              )}
            </div>

            <button
              onClick={() => stopAndSubmit()}
              disabled={!canStop}
              className={[
                "w-full rounded-xl py-3 font-black text-white transition",
                canStop
                  ? "bg-slate-800 hover:bg-slate-700"
                  : "bg-slate-300 cursor-not-allowed",
              ].join(" ")}
            >
              {canStop ? "Stop & Get Feedback" : `Speak for at least ${MIN_SECONDS - elapsed}s more…`}
            </button>
          </div>
        ) : (
          <button
            onClick={startRecording}
            className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 py-4 text-white font-black text-lg shadow hover:from-rose-600 hover:to-pink-600 transition"
          >
            🎤 Start Recording
          </button>
        )}
      </div>
    );
  }

  if (phase === "processing") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500" />
        <p className="text-sm text-slate-500">Getting your AI feedback…</p>
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        {/* Success header */}
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
          <p className="text-4xl mb-2">🎉</p>
          <p className="font-black text-green-800 text-xl">Day {result.day} Complete!</p>
          <p className="text-green-600 text-sm mt-1">Great job speaking Swedish today!</p>
        </div>

        {/* Transcript */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
          <p className="text-xs font-black text-slate-400 uppercase tracking-wide">What you said</p>
          <p className="text-sm text-slate-700 leading-relaxed italic">"{result.transcript}"</p>
        </div>

        {/* AI Feedback */}
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-violet-600 text-lg">🤖</span>
            <p className="text-xs font-black text-violet-800 uppercase tracking-wide">AI Tutor Feedback</p>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{result.feedback}</p>
        </div>

        <button
          onClick={() => navigate("/speaking-challenge")}
          className="w-full rounded-2xl bg-slate-800 py-3 text-white font-black hover:bg-slate-700 transition"
        >
          Back to Challenge
        </button>
      </div>
    );
  }

  return null;
}
