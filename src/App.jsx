import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "./hook/useLocalStorage";
import NoteForm from "./Components/NoteForm";
import { WelcomeModal } from "./Components/WelcomeModal";
import { Modal } from "./Components/Modal";
import { AppHeader } from "./Components/AppHeader";
import NoteCard from "./Components/NoteCard";

const PALETTE = [
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
  "#22c55e", // green-500
  "#8b5cf6", // violet-500
  "#ef4444", // red-500
  "#eab308", // yellow-500
];

const FALLBACK_NOTE_SIZE = { width: 280, height: 200 };
const EDGE_PADDING = 8;

const App = () => {
  const [notes, setNotes] = useLocalStorage("notes.v1", [
    {
      id: 1,
      title: "Title",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      timestamp: Date.now(),
      position: { x: 24, y: 24 },
      color: PALETTE[0],
      size: FALLBACK_NOTE_SIZE,
    },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const perms = { canCreate: true, canEdit: true, canDelete: true };

  // First-run onboarding
  const [firstRunSeen, setFirstRunSeen] = useLocalStorage(
    "notes.firstRunSeen",
    false
  );
  const [showIntro, setShowIntro] = useState(false);
  useEffect(() => {
    if (!firstRunSeen) setShowIntro(true);
  }, [firstRunSeen]);

  // Container ref to compute safe drag bounds
  const containerRef = useRef(null);
  const [containerBox, setContainerBox] = useState({ width: 0, height: 0 });

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

  const createDemoNote = () => {
    const id = Date.now();
    const color = PALETTE[(notes.length + 1) % PALETTE.length];
    const pos = clampPosition({ x: 48, y: 96 }, FALLBACK_NOTE_SIZE);
    upsertNote({
      id,
      title: "Welcome 👋",
      content:
        "Drag me around. Tap the pencil to edit. Press + to add more notes.\nAll notes are saved in your browser.",
      timestamp: Date.now(),
      position: pos,
      color,
      size: FALLBACK_NOTE_SIZE,
    });
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
    const size = editing?.size || payload.size || FALLBACK_NOTE_SIZE;
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
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100">
      <AppHeader onAdd={openCreateModal} onHelp={() => setShowIntro(true)} />

      <div
        ref={containerRef}
        className="relative mx-auto max-w-[1600px] h-[calc(100vh-64px)] w-full overflow-hidden"
      >
        <div className="absolute inset-0 touch-none">
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
      </div>

      {/* Modal (Create/Edit) */}
      {modalOpen && (
        <Modal title={editing ? "Edit note" : "New note"} onClose={closeModal}>
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

      {showIntro && (
        <WelcomeModal
          onClose={() => {
            setShowIntro(false);
          }}
          onDontShowAgain={(checked) => {
            if (checked) setFirstRunSeen(true);
            else setFirstRunSeen(false);
          }}
          onCreateDemo={() => {
            createDemoNote();
          }}
        />
      )}
    </div>
  );
};

export default App;
