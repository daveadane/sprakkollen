export default function Topbar() {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <h1 className="text-xl font-bold tracking-tight">
        Språkkollen App
      </h1>

      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500">XP: 120</span>
        <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
          U
        </div>
      </div>
    </header>
  );
}
