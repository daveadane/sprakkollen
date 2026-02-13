export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-3xl font-black tracking-tight">About Språkkollen</h1>

      <p className="text-slate-600">
        Språkkollen is a Swedish learning platform focused on noun gender (ett/en),
        vocabulary practice, and beginner-friendly explanations.
      </p>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold">UX Principle</h2>
        <p className="mt-2 text-slate-600">
          The app never lies: every answer shows confidence and source (local DB, external dictionary, or AI prediction).
        </p>
      </div>
    </div>
  );
}
