import { Link } from "react-router-dom";

const FEATURES = [
  {
    icon: "✏️",
    title: "En/ett Practice",
    desc: "Master Swedish noun genders with Duolingo-style drills and instant feedback.",
  },
  {
    icon: "📝",
    title: "Grammar Quiz",
    desc: "100+ questions on verb tenses, prepositions, adjectives and more. Choose your difficulty.",
  },
  {
    icon: "📖",
    title: "Reading",
    desc: "Short Swedish texts with comprehension questions, plus 1000s of classic books from Project Gutenberg.",
  },
  {
    icon: "🎧",
    title: "Podcasts & Audio",
    desc: "Listen to real Swedish radio (Sveriges Radio) and test your listening comprehension.",
  },
  {
    icon: "🖼️",
    title: "Image Quiz",
    desc: "See a photo, type the Swedish word. 500+ everyday nouns across 18 categories.",
  },
  {
    icon: "🎤",
    title: "Speaking Challenge",
    desc: "30-day speaking streak challenge. Record yourself and get AI-powered feedback.",
  },
];

const STATS = [
  { value: "8,700+", label: "Vocabulary words" },
  { value: "500+", label: "Visual words" },
  { value: "124", label: "Grammar questions" },
  { value: "1000+", label: "Gutenberg books" },
  { value: "30", label: "Day challenge" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ backgroundColor: "#006AA7" }}>
        {/* Swedish flag yellow cross */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage: [
              "linear-gradient(transparent 38%, rgba(254,204,0,0.35) 38%, rgba(254,204,0,0.35) 62%, transparent 62%)",
              "linear-gradient(90deg, transparent 31%, rgba(254,204,0,0.35) 31%, rgba(254,204,0,0.35) 44%, transparent 44%)",
            ].join(", "),
          }}
        />

        <div className="relative mx-auto max-w-5xl px-6 py-28 text-center">
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold shadow-sm"
            style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#FECC00", border: "1px solid rgba(254,204,0,0.4)" }}
          >
            <span>🇸🇪</span> Swedish language learning platform
          </div>

          <h1 className="mt-4 text-6xl font-black tracking-tight leading-tight">
            <span style={{ color: "#006AA7", textShadow: "0 2px 8px rgba(255,255,255,0.6)" }}>Master Swedish</span>
            <br />
            <span style={{ color: "#FECC00", textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>the smart way</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed font-semibold" style={{ color: "#003d5c", textShadow: "0 1px 4px rgba(255,255,255,0.5)" }}>
            Språkkollen combines interactive exercises, real Swedish media, AI feedback,
            and classic literature — everything you need to go from beginner to fluent.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="rounded-2xl px-8 py-3.5 text-base font-black shadow-lg transition hover:opacity-90"
              style={{ backgroundColor: "#006AA7", color: "#ffffff", border: "2px solid rgba(255,255,255,0.4)" }}
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="rounded-2xl px-8 py-3.5 text-base font-black transition hover:opacity-90"
              style={{ backgroundColor: "#FECC00", color: "#004f80" }}
            >
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <section className="border-y border-slate-100 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-8 grid grid-cols-2 sm:grid-cols-5 gap-6 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-black text-amber-500">{s.value}</p>
              <p className="mt-0.5 text-sm text-slate-500 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features grid ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-slate-900">Everything you need</h2>
          <p className="mt-3 text-slate-500 text-lg">
            Six powerful modules, one platform.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-amber-200 transition"
            >
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-2xl">
                {f.icon}
              </div>
              <h3 className="font-black text-slate-800 text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ───────────────────────────────────────────────────── */}
      <section className="bg-linear-to-r from-amber-500 to-orange-500 mx-6 mb-16 rounded-3xl">
        <div className="mx-auto max-w-3xl px-8 py-14 text-center">
          <h2 className="text-4xl font-black text-white">
            Start learning Swedish today
          </h2>
          <p className="mt-3 text-amber-100 text-lg">
            Free to use. No credit card required.
          </p>
          <Link
            to="/register"
            className="mt-8 inline-block rounded-2xl bg-white px-10 py-3.5 text-base font-black text-amber-600 shadow-lg hover:bg-amber-50 transition"
          >
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
}
