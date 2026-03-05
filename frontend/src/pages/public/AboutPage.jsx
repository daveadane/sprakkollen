export default function AboutPage() {
  const features = [
    {
      icon: "🔍",
      title: "Article Checker",
      desc: "Look up any Swedish noun and instantly get its gender (en/ett) with confidence level and source.",
    },
    {
      icon: "📚",
      title: "Vocabulary",
      desc: "Build your personal word list. Save words from the checker and review them anytime.",
    },
    {
      icon: "🎯",
      title: "Practice",
      desc: "Flashcard-style quizzes drawn from 8,700+ Swedish nouns to reinforce what you know.",
    },
    {
      icon: "✏️",
      title: "Grammar",
      desc: "Fill-in-the-blank exercises that train your intuition for Swedish noun genders.",
    },
    {
      icon: "📈",
      title: "Progress",
      desc: "Track your streak, XP, level, and session history over time.",
    },
    {
      icon: "💡",
      title: "Word of the Day",
      desc: "A new Swedish word every day to keep you learning consistently.",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight">About Språkkollen</h1>
        <p className="mt-3 text-slate-600 leading-relaxed">
          Språkkollen is a Swedish language learning platform built to help learners master
          noun gender — one of the trickiest parts of Swedish. Whether you're a complete
          beginner or brushing up your skills, Språkkollen gives you the tools to practice,
          track progress, and build confidence step by step.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-2xl mb-2">{f.icon}</div>
              <p className="font-semibold text-slate-800">{f.title}</p>
              <p className="mt-1 text-sm text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
        <h2 className="text-lg font-bold text-blue-900">Design Principle</h2>
        <p className="mt-2 text-blue-800">
          The app never lies — every answer shows confidence and source (local DB, external
          dictionary, or AI prediction). You always know how reliable an answer is.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold mb-1">Built with</h2>
        <p className="text-sm text-slate-500">
          FastAPI · PostgreSQL · React 19 · Tailwind CSS · Wiktionary open data
        </p>
        <p className="mt-3 text-sm text-slate-500">
          This is a student project developed as part of a web development course. The word
          database is sourced from Wiktionary and contains 8,700+ Swedish nouns with their
          correct articles.
        </p>
      </div>
    </div>
  );
}
