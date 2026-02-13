import { useState } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";

export default function AddWordForm({ onAdd }) {
  const [word, setWord] = useState("");
  const [article, setArticle] = useState("en");

  function submit(e) {
    e.preventDefault();
    const w = word.trim().toLowerCase();
    if (!w) return;

    onAdd({ word: w, article });
    setWord("");
    setArticle("en");
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
      <h3 className="font-bold">Add word</h3>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Input value={word} onChange={(e) => setWord(e.target.value)} placeholder="e.g. hus" />
        </div>

        <select
          value={article}
          onChange={(e) => setArticle(e.target.value)}
          className="rounded-2xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
        >
          <option value="en">EN</option>
          <option value="ett">ETT</option>
        </select>
      </div>

      <Button className="w-full py-3" type="submit">
        Add
      </Button>
    </form>
  );
}
