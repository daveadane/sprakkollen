export default function QuestionCard({ word }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">What is the correct article?</p>
      <h2 className="mt-2 text-4xl font-black tracking-tight">{word}</h2>
    </div>
  );
}

