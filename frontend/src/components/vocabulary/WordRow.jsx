import Button from "../ui/Button";

export default function WordRow({ item, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div>
        <p className="text-sm text-slate-500">{item.article.toUpperCase()}</p>
        <p className="text-xl font-black">{item.word}</p>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => onEdit(item)}>
          Edit
        </Button>
        <Button variant="danger" onClick={() => onDelete(item.id)}>
          Delete
        </Button>
      </div>
    </div>
  );
}
