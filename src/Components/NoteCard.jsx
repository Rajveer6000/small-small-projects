import { useEffect, useRef, useState } from "react";

const NoteCard = ({ note, perms, onEdit, onDelete, onDrag }) => {
  const [pos, setPos] = useState(note.position || { x: 0, y: 0 });
  const dragging = useRef(false);
  const pointerIdRef = useRef(null);
  const drag = useRef({ sx: 0, sy: 0, ox: 0, oy: 0 });
  const [z, setZ] = useState(1);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!dragging.current) setPos(note.position || { x: 0, y: 0 });
  }, [note.position]);

  const onPointerDown = (e) => {
    // Only act on primary pointer (ignore additional/multi-touch)
    if (!e.isPrimary) return;

    // Prevent scroll/pinch from hijacking the gesture
    e.preventDefault();

    dragging.current = true;
    pointerIdRef.current = e.pointerId;
    setZ((p) => p + 1);

    // Record starting pointer + origin position
    drag.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };

    // Capture the pointer so we keep getting moves even if the finger
    // leaves the element bounds (iOS fix)
    try {
      cardRef.current?.setPointerCapture?.(e.pointerId);
    } catch {}

    // Add listeners on the element (not window) to avoid passive defaults
    cardRef.current?.addEventListener("pointermove", onPointerMove, { passive: false });
    cardRef.current?.addEventListener("pointerup", onPointerUp, { once: true });
    cardRef.current?.addEventListener("pointercancel", onPointerCancel, { once: true });
  };

  const onPointerMove = (e) => {
    if (!dragging.current || e.pointerId !== pointerIdRef.current) return;
    // Prevent scrolling while dragging
    e.preventDefault();

    const dx = e.clientX - drag.current.sx;
    const dy = e.clientY - drag.current.sy;
    const next = { x: drag.current.ox + dx, y: drag.current.oy + dy };
    setPos(next);
    onDrag?.(note.id, next);
  };

  const finish = () => {
    dragging.current = false;
    pointerIdRef.current = null;
    try {
      // Release capture (best effort)
      cardRef.current?.releasePointerCapture?.(pointerIdRef.current);
    } catch {}
    // Clean up listeners
    cardRef.current?.removeEventListener?.("pointermove", onPointerMove);
  };

  const onPointerUp = () => finish();
  const onPointerCancel = () => finish();

  return (
    <div
      className="absolute select-none"
      style={{ left: pos.x, top: pos.y, zIndex: z }}
    >
      <div
        ref={cardRef}
        // 👇 The two big fixes for mobile:
        // 1) touch-none => touch-action: none (stops browser pan/zoom)
        // 2) pointer capture (above) => keeps events flowing
        className="relative w-[260px] rounded-2xl bg-white shadow-lg p-4 cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={onPointerDown}
        // Extra safety for images/long-press behaviors
        style={{
          WebkitUserDrag: "none",
          userSelect: "none",
        }}
      >
        <div
          className="absolute left-3 top-4 h-6 w-1.5 rounded-full"
          style={{ backgroundColor: note.color || "#06b6d4" }}
        />
        <div className="pl-5 flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] text-gray-500 tracking-wide">
              {new Date(note.timestamp).toISOString().slice(0, 16).replace("T", " ")}
            </span>
            <h3 className="mt-1 text-xl font-semibold text-gray-900 leading-none">
              {note.title}
            </h3>
          </div>
          <div className="ml-2 flex items-center gap-2 shrink-0">
            {perms?.canEdit && (
              <button
                title="Edit"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onEdit?.(note);
                }}
                className="rounded-md p-1 hover:bg-gray-100"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                  <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                </svg>
              </button>
            )}
            {perms?.canDelete && (
              <button
                title="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onDelete?.(note.id);
                }}
                className="rounded-md p-1 hover:bg-gray-100"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5">
                  <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h2v9H7V9Zm5 0h2v9h-2V9Zm-5 0h2v9H7V9Zm8 0h2v9h-2V9Z" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <p className="mt-3 pl-5 text-[15px] leading-6 text-gray-700">{note.content}</p>
      </div>
    </div>
  );
};

export default NoteCard;
