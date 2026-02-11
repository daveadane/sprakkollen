export default function WordSearchInput({ value, onChange, onSubmit, disabled }) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-semibold text-slate-700">
        Swedish noun
      </label>

      <div className="flex gap-2">
        <input
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. hus, bok, barn..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
          }}
          disabled={disabled}
        />

        <button
          onClick={onSubmit}
          disabled={disabled}
          className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          Check
        </button>
      </div>
    </div>
  );
}
