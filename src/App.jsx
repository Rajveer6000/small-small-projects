import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "./hook/useLocalStorage";
import NoteForm from "./Components/NoteForm";
import NoteCard from "./Components/NoteCard";

const PALETTE = [
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
  "#22c55e", // green-500
  "#8b5cf6", // violet-500
  "#ef4444", // red-500
  "#eab308", // yellow-500
];

// Fallback size used when NoteCard doesn't report its width/height
const FALLBACK_NOTE_SIZE = { width: 280, height: 200 };
// Margin to keep notes away from absolute edges on tiny screens
const EDGE_PADDING = 8;

export default function App() {
  const [notes, setNotes] = useLocalStorage("notes.v1", [
    {
      id: 1,
      title: "Title",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      timestamp: Date.now(),
      position: { x: 24, y: 24 },
      color: PALETTE[0],
      // Optional: if your NoteCard can measure itself and report size,
      // we'll keep it here to clamp precisely
      size: FALLBACK_NOTE_SIZE,
    },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // when set -> modal is edit mode

  const perms = { canCreate: true, canEdit: true, canDelete: true };

  // Container ref to compute safe drag bounds
  const containerRef = useRef(null);
  const [containerBox, setContainerBox] = useState({
    width: 0,
    height: 0,
  });

  // Track container size responsively
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const update = () => {
      const rect = node.getBoundingClientRect();
      setContainerBox({ width: rect.width, height: rect.height });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const upsertNote = (newNote) => {
    setNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === newNote.id);
      if (idx === -1) return [newNote, ...prev];
      const copy = [...prev];
      copy[idx] = { ...prev[idx], ...newNote };
      return copy;
    });
  };

  // Clamp a position so the note stays fully inside the container
  const clampPosition = (pos, size = FALLBACK_NOTE_SIZE) => {
    const cw = containerBox.width || window.innerWidth;
    const ch = containerBox.height || window.innerHeight;

    const maxX = Math.max(EDGE_PADDING, cw - size.width - EDGE_PADDING);
    const maxY = Math.max(EDGE_PADDING, ch - size.height - EDGE_PADDING);

    return {
      x: Math.min(Math.max(pos.x, EDGE_PADDING), maxX),
      y: Math.min(Math.max(pos.y, EDGE_PADDING), maxY),
    };
  };

  const openCreateModal = () => {
    if (!perms.canCreate) return;
    setEditing(null);
    setModalOpen(true);
  };

  const openEditModal = (note) => {
    if (!perms.canEdit) return;
    setEditing(note);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleCreate = (payload) => {
    if (!perms.canCreate) return;
    const id = Date.now();
    const color = PALETTE[(notes.length + 1) % PALETTE.length];

    // Start near top-left, but stagger slightly; clamp to viewport
    const desiredPos = payload.position || {
      x: 24 + notes.length * 16,
      y: 24 + notes.length * 16,
    };
    const pos = clampPosition(desiredPos, FALLBACK_NOTE_SIZE);

    upsertNote({
      ...payload,
      id,
      color,
      position: pos,
      size: FALLBACK_NOTE_SIZE,
      timestamp: Date.now(),
    });
    closeModal();
  };

  const handleEditSave = (payload) => {
    if (!perms.canEdit) return;
    // If user changed position or content; re-clamp if position present
    const size =
      editing?.size || payload.size || FALLBACK_NOTE_SIZE;
    const position = payload.position
      ? clampPosition(payload.position, size)
      : undefined;

    upsertNote({ ...payload, ...(position ? { position } : {}), size });
    closeModal();
  };

  const handleDelete = (id) => {
    if (!perms.canDelete) return;
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleDrag = (id, position, size = FALLBACK_NOTE_SIZE) => {
    const clamped = clampPosition(position, size);
    upsertNote({ id, position: clamped, size });
  };

  return (
    <div className="min-h-screen w-full bg-gray-100">
      {/* App Bar */}
      <div className="sticky top-0 z-20 w-full bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">
            Sticky Notes
          </h1>

          {/* (Optional) future filters/actions go here */}
        </div>
      </div>

      {/* Workspace */}
      <div
        ref={containerRef}
        className="relative mx-auto max-w-[1600px] h-[calc(100vh-56px)] w-full overflow-hidden"
      >
        {/* Notes Layer */}
        <div className="absolute inset-0">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              perms={perms}
              onEdit={openEditModal}
              onDelete={handleDelete}
              onDrag={(id, position) => handleDrag(id, position, note.size)}
            />
          ))}
        </div>

        {/* Floating Add Button */}
        {perms.canCreate && (
          <button
            onClick={openCreateModal}
            className="fixed sm:absolute right-4 bottom-4 sm:right-6 sm:bottom-6 z-30 inline-flex items-center justify-center rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 h-14 w-14 bg-cyan-600 hover:bg-cyan-700 text-white"
            aria-label="Add note"
            title="Add note"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        )}
      </div>

      {/* Modal (Create/Edit) */}
      {modalOpen && (
        <Modal onClose={closeModal}>
          {!editing ? (
            <NoteForm
              mode="create"
              onSubmit={handleCreate}
              onCancel={closeModal}
            />
          ) : (
            <NoteForm
              mode="edit"
              initial={editing}
              onSubmit={handleEditSave}
              onCancel={closeModal}
            />
          )}
        </Modal>
      )}
    </div>
  );
}

/**
 * Minimal accessible modal that centers content and locks background scroll.
 * Tailwind-only, no external deps.
 */
function Modal({ children, onClose }) {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        // close when clicking the dimmed backdrop
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
      <div className="relative z-10 w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-100">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">
              {/** Title handled by NoteForm; keep this minimal or slot a prop */}
              Note
            </h2>
            <button
              onClick={onClose}
              className="h-9 w-9 inline-flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              aria-label="Close"
              title="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <div className="px-4 sm:px-5 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
