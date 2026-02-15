import { Link } from "react-router-dom";

const items = [
  { title: "Dashboard", desc: "Overview, goals, streak.", to: "/dashboard" },
  { title: "Checker", desc: "Check Swedish noun gender (ett/en).", to: "/checker" },
  { title: "Practice", desc: "Duolingo-style EN/ETT practice.", to: "/practice" },
  { title: "Vocabulary", desc: "Manage your word list (CRUD).", to: "/vocabulary" },
  { title: "Progress", desc: "Track results and weak words.", to: "/progress" },
  { title: "Grammar", desc: "Rules + examples.", to: "/grammar" },
  { title: "Profile", desc: "XP, settings, logout.", to: "/profile" },
];

export default function LandingPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-14">
      <h1 className="text-5xl font-black tracking-tight">Welcome to Språkkollen</h1>
      <p className="mt-3 text-slate-600">
        Swedish learning platform prototype. Choose a module to start.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {items.map((x) => (
          <Link
            key={x.to}
            to={x.to}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="text-xl font-extrabold">{x.title}</div>
            <div className="mt-2 text-sm text-slate-600">{x.desc}</div>
            <div className="mt-4 text-sm font-semibold text-blue-600">
              Open →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

