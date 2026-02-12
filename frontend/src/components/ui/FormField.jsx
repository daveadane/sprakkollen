export default function FormField({ label, children, hint }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
