export default function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  className = "",
}) {
  const base =
    "rounded-2xl px-4 py-2 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed";

  const styles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-slate-200 text-slate-800 hover:bg-slate-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
