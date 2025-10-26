import {
  LuInfo,
  LuMousePointer2,
  LuMove,
  LuPenLine,
  LuPlus,
  LuTrash2,
} from "react-icons/lu";
import { Modal } from "./Modal";

export const WelcomeModal = ({ onClose, onDontShowAgain, onCreateDemo }) => {
  return (
    <Modal title="Welcome" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white shadow shrink-0">
            <LuInfo size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Welcome to Sticky Notes
            </h3>
            <p className="text-sm text-gray-600">
              Lightweight, offline-friendly sticky notes. Drag them around, edit
              quickly, and everything stays in your browser.
            </p>
          </div>
        </div>

        <ul className="text-sm text-gray-700 space-y-2">
          <li className="flex items-start gap-2">
            <LuMousePointer2 className="mt-0.5 shrink-0" />
            <span>
              <strong>Drag anywhere:</strong> press and move on the note card to
              reposition.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <LuPenLine className="mt-0.5 shrink-0" />
            <span>
              <strong>Edit fast:</strong> tap the pencil on a card or
              double-click the text.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <LuPlus className="mt-0.5 shrink-0" />
            <span>
              <strong>Add notes:</strong> use the <em>+</em> button in the
              top-right.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <LuTrash2 className="mt-0.5 shrink-0" />
            <span>
              <strong>Delete safely:</strong> use the trash icon on a card.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <LuMove className="mt-0.5 shrink-0" />
            <span>
              <strong>Works on mobile & tablet:</strong> just drag — scrolling
              won’t interfere.
            </span>
          </li>
        </ul>

        {/* --- RESPONSIVE FOOTER --- */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between pt-2 gap-4 sm:gap-2">
          <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
              onChange={(e) => onDontShowAgain?.(e.target.checked)}
            />
            Don’t show this again
          </label>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <button
              className="px-3 h-9 w-full sm:w-auto rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
              onClick={onCreateDemo}
            >
              Create a demo note
            </button>
            <button
              className="px-3 h-9 w-full sm:w-auto rounded-lg bg-cyan-600 text-white text-sm hover:bg-cyan-700"
              onClick={onClose}
            >
              Got it
            </button>
          </div>
        </div>
        {/* --- END RESPONSIVE FOOTER --- */}

      </div>
    </Modal>
  );
};