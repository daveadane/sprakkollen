export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-3xl font-black tracking-tight">Contact</h1>

      <p className="text-slate-600">
        This is a student project. Contact details can be added later.
      </p>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
        <div>
          <p className="text-sm font-semibold text-slate-700">Email</p>
          <p className="text-slate-600">placeholder@email.com</p>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-700">School</p>
          <p className="text-slate-600">SFI / SVA (example)</p>
        </div>
      </div>
    </div>
  );
}
