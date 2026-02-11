export default function FeedbackPanel({ visible, correct, correctAnswer, onNext }) {
  if (!visible) return null;

  return (
    <div
      className={`rounded-2xl p-4 border ${
        correct ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-bold">
            {correct ? "Correct ✅" : "Wrong ❌"}
          </p>
          {!correct && (
            <p className="text-sm text-slate-700">
              Correct answer: <span className="font-bold">{correctAnswer.toUpperCase()}</span>
            </p>
          )}
        </div>

        <button
          onClick={onNext}
          className="rounded-xl bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700"
        >
          Next
        </button>
      </div>
    </div>
  );
}
