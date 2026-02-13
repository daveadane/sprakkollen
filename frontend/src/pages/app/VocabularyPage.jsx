import { useState } from "react";
import AddWordForm from "../../components/vocabulary/AddWordForm";
import WordList from "../../components/vocabulary/WordList";

const seed = [
  { id: 1, word: "hus", article: "ett" },
  { id: 2, word: "bok", article: "en" },
];

export default function VocabularyPage() {
  const [items, setItems] = useState(seed);

  function addWord(newItem) {
    setItems((prev) => [
      { id: Date.now(), ...newItem },
      ...prev,
    ]);
  }

  function editWord(item) {
    const nextArticle = item.article === "en" ? "ett" : "en";
    setItems((prev) =>
      prev.map((x) => (x.id === item.id ? { ...x, article: nextArticle } : x))
    );
  }

  function deleteWord(id) {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Vocabulary</h1>
        <p className="mt-2 text-slate-600">
          Save words and practice them later. (CRUD-ready)
        </p>
      </div>

      <AddWordForm onAdd={addWord} />
      <WordList items={items} onEdit={editWord} onDelete={deleteWord} />
    </div>
  );
}
