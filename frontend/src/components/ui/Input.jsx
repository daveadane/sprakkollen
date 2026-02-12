export default function Input({
  value,
  onChange,
  placeholder,
  className = "",
  ...props
}) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full rounded-2xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      {...props}
    />
  );
}
