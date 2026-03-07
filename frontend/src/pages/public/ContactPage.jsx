export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-12">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Contact</h1>
        <p className="mt-3 text-slate-600 leading-relaxed">
          Språkkollen is a student project. Have a question, found a bug, or want to suggest
          a word? Feel free to reach out.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 text-xl">✉️</div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Email</p>
            <a
              href="mailto:daveadane@gmail.com"
              className="text-blue-600 hover:underline"
            >
              daveadane@gmail.com
            </a>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="mt-0.5 text-xl">📝</div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Suggest a word</p>
            <p className="text-slate-600 text-sm">
              Missing a word in the checker? Log in and use the{" "}
              <span className="font-medium">Suggest a word</span> feature — the admin reviews
              and adds approved suggestions to the database.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="mt-0.5 text-xl">💻</div>
          <div>
            <p className="text-sm font-semibold text-slate-700">GitHub</p>
            <a
              href="https://github.com/daveadane"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              github.com/daveadane
            </a>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="mt-0.5 text-xl">🐛</div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Report a bug</p>
            <p className="text-slate-600 text-sm">
              If something isn't working as expected, send an email with a short description
              and I'll look into it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
