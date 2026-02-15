import { useParams } from "react-router-dom";

export default function SessionPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black tracking-tight">
        Practice Session
      </h1>

      <p className="text-slate-600">
        Session ID: {id}
      </p>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        Session logic will be loaded from backend here.
      </div>
    </div>
  );
}
