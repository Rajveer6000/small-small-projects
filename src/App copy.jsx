import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "./hook/useLocalStorage";
import NoteForm from "./Components/NoteForm";
import { WelcomeModal } from "./Components/WelcomeModal";
import { Modal } from "./Components/Modal";
import { AppHeader } from "./Components/AppHeader";
import NoteCard from "./Components/NoteCard";

const PALETTE = [
  "#06b6d4",
  "#f97316",
  "#22c55e",
  "#8b5cf6",
  "#ef4444",
  "#eab308",
];

const FALLBACK_NOTE_SIZE = { width: 280, height: 280 };
const EDGE_PADDING = 8;

const BOUNDARY_INSET = { top: 24, right: 24, bottom: 24, left: 24 };
const CARD_GAP = 0.1;

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

  // Container + boundary
  const containerRef = useRef(null);
  const [containerBox, setContainerBox] = useState({ width: 0, height: 0 });
  const [boundaryRect, setBoundaryRect] = useState({ x: 0, y: 0, w: 0, h: 0 });

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const update = () => {
      const rect = node.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      console.log("Width:", width, "Height:", height);
      setContainerBox({ width, height });
      
      const x = BOUNDARY_INSET.left;
      const y = BOUNDARY_INSET.top;
      console.log("X:", x, "Y:", y);
      const w = Math.max(
        0,
        width - (BOUNDARY_INSET.left + BOUNDARY_INSET.right)
      );
      const h = Math.max(
        0,
        height - (BOUNDARY_INSET.top + BOUNDARY_INSET.bottom)
      );
      
      console.log("Boundary Width:", BOUNDARY_INSET.top, "Boundary Height:", BOUNDARY_INSET.bottom);
      console.log("W:", w, "H:", h);
      setBoundaryRect({ x, y, w, h });
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

  // Clamp a position so the note stays fully inside the red boundary
  const clampToBoundary = (pos, size = FALLBACK_NOTE_SIZE) => {
    const { x: bx, y: by, w, h } = boundaryRect;
    if (w === 0 || h === 0) return pos; // not ready yet
    console.log("x",pos);
    const minX = bx + EDGE_PADDING;
    const minY = by + EDGE_PADDING;
    const maxX = bx + w - size.width - EDGE_PADDING;
    const maxY = by + h - size.height - EDGE_PADDING;
    console.log("x ", minX, "y ", minY);
    console.log("xmax ", maxX, "ymax ", maxY);
    return {
      x: Math.min(Math.max(pos.x, minX), Math.max(minX, maxX)),
      y: Math.min(Math.max(pos.y, minY), Math.max(minY, maxY)),
    };
  };

  const rectsOverlap = (a, b) => {
    const xOverlap = a.x < b.x + b.w + CARD_GAP && a.x + a.w + CARD_GAP > b.x;
    const yOverlap = a.y < b.y + b.h + CARD_GAP && a.y + a.h + CARD_GAP > b.y;
    return xOverlap && yOverlap;
  };

  const makesOverlap = (id, pos, size) => {
    const rectA = { x: pos.x, y: pos.y, w: size.width, h: size.height };
    for (const n of notes) {
      if (n.id === id) continue;
      const rectB = {
        x: n.position.x,
        y: n.position.y,
        w: n.size?.width || FALLBACK_NOTE_SIZE.width,
        h: n.size?.height || FALLBACK_NOTE_SIZE.height,
      };
      if (rectsOverlap(rectA, rectB)) return true;
    }
    return false;
  };

  const approvePosition = (id, desiredPos, size = FALLBACK_NOTE_SIZE) => {
    const clamped = clampToBoundary(desiredPos, size);
    // if (makesOverlap(id, clamped, size)) {
    //   return null;
    // }
    return clamped;
  };

  const createDemoNote = () => {
    const id = Date.now();
    const color = PALETTE[(notes.length + 1) % PALETTE.length];
    const pos =
      approvePosition(
        id,
        { x: boundaryRect.x + 48, y: boundaryRect.y + 96 },
        FALLBACK_NOTE_SIZE
      ) ||
      clampToBoundary(
        { x: boundaryRect.x + 48, y: boundaryRect.y + 96 },
        FALLBACK_NOTE_SIZE
      );
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
      x: boundaryRect.x + 24 + notes.length * 16,
      y: boundaryRect.y + 24 + notes.length * 16,
    };

    const approved =
      approvePosition(id, desiredPos, FALLBACK_NOTE_SIZE) ||
      clampToBoundary(desiredPos, FALLBACK_NOTE_SIZE); // as close as possible

    upsertNote({
      ...payload,
      id,
      color,
      position: approved,
      size: FALLBACK_NOTE_SIZE,
      timestamp: Date.now(),
    });
    closeModal();
  };

  const handleEditSave = (payload) => {
    if (!perms.canEdit) return;
    const size = editing?.size || payload.size || FALLBACK_NOTE_SIZE;

    let update = { ...payload, size };
    if (payload.position) {
      const approved = approvePosition(payload.id, payload.position, size);
      if (approved) update.position = approved; // only commit if valid
    }

    upsertNote(update);
    closeModal();
  };

  // on-drag position approval (returns the accepted pos or last)
  const handleDrag = (id, desiredPos, size = FALLBACK_NOTE_SIZE) => {
    const approved = approvePosition(id, desiredPos, size);
    if (approved) {
      upsertNote({ id, position: approved, size });
      return approved;
    }
    return null;
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100">
      <AppHeader onAdd={openCreateModal} onHelp={() => setShowIntro(true)} />

      <div
        ref={containerRef}
        className="relative mx-auto max-w-[1600px] h-[calc(100vh-64px)] w-full overflow-hidden"
      >
        <div
          className="absolute pointer-events-none rounded-xl b"
          style={{
            left: boundaryRect.x,
            top: boundaryRect.y,
            width: boundaryRect.w,
            height: boundaryRect.h,
            border: "2px dashed red",
            boxShadow: "inset 0 0 0 1px rgba(255,0,0,0.15)",
          }}
        />

        <div className="absolute inset-0 touch-none border">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              perms={perms}
              onEdit={openEditModal}
              onDelete={(id) =>
                setNotes((prev) => prev.filter((n) => n.id !== id))
              }
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
          onClose={() => setShowIntro(false)}
          onDontShowAgain={(checked) => setFirstRunSeen(!!checked)}
          onCreateDemo={() => createDemoNote()}
        />
      )}
    </div>
  );
};

export default App;
