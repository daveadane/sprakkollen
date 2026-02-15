export default function GrammarPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Grammar</h1>
        <p className="mt-2 text-slate-600">
          Learn Swedish grammar concepts with examples and exercises.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold">Noun Gender (En / Ett)</h2>
        <p className="mt-2 text-slate-600">
          In Swedish, nouns have two genders: common (en) and neuter (ett).
        </p>

        <ul className="mt-4 list-disc pl-6 text-slate-700">
          <li>en bok (a book)</li>
          <li>ett hus (a house)</li>
        </ul>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-slate-500">
        AI explanation and interactive grammar exercises coming soon.
      </div>
    </div>
  );
}
