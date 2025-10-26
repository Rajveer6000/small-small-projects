/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";

export default function NoteForm({ mode, initial, onCancel, onSubmit }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [content, setContent] = useState(initial?.content || "");

  useEffect(() => {
    setTitle(initial?.title || "");
    setContent(initial?.content || "");
  }, [initial]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          ...(initial || {}),
          title: title.trim(),
          content: content.trim(),
          timestamp: Date.now(),
        });
        setTitle("");
        setContent("");
      }}
      className="w-full max-w-xl space-y-3"
    >
      <h2 className="text-lg font-semibold">
        {mode === "edit" ? "Edit Note" : "Write a Note"}
      </h2>

      <input
        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <textarea
        className="w-full min-h-28 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        placeholder="Write your content…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="rounded-xl bg-black px-4 py-2 text-white hover:opacity-90"
        >
          {mode === "edit" ? "Save Changes" : "Add Note"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl bg-gray-200 px-4 py-2 hover:bg-gray-300"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
