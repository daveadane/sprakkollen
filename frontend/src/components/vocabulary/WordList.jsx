import WordRow from "./WordRow";

export default function WordList({ items, onEdit, onDelete }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
        No saved words yet. Add your first word.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <WordRow key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
