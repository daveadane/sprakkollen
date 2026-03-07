const FEATURES = [
  { icon: "✏️", title: "En/ett Practice", desc: "Duolingo-style drills on Swedish noun gender with instant feedback and streak tracking." },
  { icon: "📝", title: "Grammar Quiz", desc: "124+ questions on verb tenses, prepositions, adjectives and more. Choose Easy, Medium, or Hard." },
  { icon: "📖", title: "Short Texts", desc: "Curated Swedish reading passages with comprehension questions to build reading fluency." },
  { icon: "📚", title: "Book Reader", desc: "1,000+ classic Swedish books from Project Gutenberg with AI-generated comprehension quizzes." },
  { icon: "🎧", title: "Podcasts", desc: "Real Swedish radio episodes from Sveriges Radio with listening comprehension questions." },
  { icon: "🖼️", title: "Image Quiz", desc: "See a photo, type the Swedish word. 500+ everyday nouns across 18 categories." },
  { icon: "🎤", title: "Speaking Challenge", desc: "30-day speaking streak. Record yourself and get AI-powered feedback from Claude." },
  { icon: "📈", title: "Progress", desc: "Track your streak, XP, accuracy, and session history over time." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10 px-6 py-12">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">About Språkkollen</h1>
        <p className="mt-4 text-slate-600 leading-relaxed text-lg">
          Språkkollen is a Swedish language learning platform that combines interactive exercises,
          real Swedish media, AI feedback, and classic literature — everything you need to go
          from beginner to fluent.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-black text-slate-800 mb-5">What's inside</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-xl">
                {f.icon}
              </div>
              <p className="font-black text-slate-800">{f.title}</p>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
        <h2 className="text-lg font-black text-blue-900">Design principle</h2>
        <p className="mt-2 text-blue-800 leading-relaxed">
          Every feature is built around active recall and real Swedish content — no made-up
          sentences, no artificial examples. You practice with real words, real books, and
          real radio.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black text-slate-800 mb-2">Built with</h2>
        <p className="text-sm text-slate-500">
          FastAPI · PostgreSQL · React 19 · Tailwind CSS · Claude AI (Anthropic)
        </p>
        <p className="mt-3 text-sm text-slate-500">
          This is a student project developed as part of a web development course. The vocabulary
          database contains 8,700+ Swedish nouns sourced from Wiktionary open data.
        </p>
      </div>
    </div>
  );
}
