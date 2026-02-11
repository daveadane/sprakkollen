export default function AnswerOptions({
  disabled,
  selected,
  correctAnswer,
  onAnswer,
}) {
  function getStyle(option) {
    if (!selected) return "border-slate-200 bg-white hover:bg-slate-50";

    if (option === correctAnswer)
      return "border-emerald-500 bg-emerald-100";

    if (option === selected)
      return "border-red-500 bg-red-100";

    return "border-slate-200 bg-white opacity-50";
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {["en", "ett"].map((option) => (
        <button
          key={option}
          disabled={disabled}
          onClick={() => onAnswer(option)}
          className={`rounded-2xl border py-4 text-lg font-bold transition-all ${getStyle(
            option
          )}`}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
