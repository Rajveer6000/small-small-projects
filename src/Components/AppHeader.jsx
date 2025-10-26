import { LuPlus, LuSearch, LuFilter, LuInfo } from "react-icons/lu";

export const AppHeader = ({ onAdd, onHelp }) => {
  return (
    <div className="sticky top-0 z-20 w-full backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b border-gray-200">
      <div className="h-[2px] w-full bg-gradient-to-r from-cyan-500 via-violet-500 to-amber-500" />
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 shadow ring-1 ring-black/5 shrink-0" />
          <div className="flex flex-col leading-tight min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight truncate">
              Sticky Notes
            </h1>
            <span className="text-[11px] text-gray-500 hidden sm:block">
              Drag. Drop. Remember.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            title="Search notes"
            className="sm:hidden h-10 w-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white/80 text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition"
          >
            <LuSearch className="h-4 w-4" />
          </button>

          <div className="hidden sm:flex items-center">
            <label htmlFor="note-search" className="sr-only">
              Search notes
            </label>
            <div className="relative">
              <input
                id="note-search"
                type="search"
                placeholder="Search notes…"
                className="peer h-10 w-40 md:w-60 lg:w-72 rounded-xl border border-gray-200 bg-white/80 px-9 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent shadow-sm"
              />
              <LuSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 peer-focus:text-cyan-600" />
            </div>
          </div>

          <button
            type="button"
            title="Filters"
            className="inline-flex h-10 w-10 sm:w-auto items-center justify-center sm:gap-2 rounded-xl border border-gray-200 bg-white/80 sm:px-3 text-sm text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition"
          >
            <LuFilter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>

          <button
            title="How it works"
            onClick={onHelp}
            className="inline-flex h-10 w-10 sm:w-auto items-center justify-center sm:gap-2 rounded-xl border border-gray-200 bg-white/80 sm:px-3 text-sm text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition"
          >
            <LuInfo className="h-4 w-4" />
            <span className="hidden sm:inline">How it works</span>
          </button>

          <button
            title="Add new note"
            onClick={onAdd}
            className="inline-flex h-10 w-10 sm:w-auto items-center justify-center sm:gap-2 rounded-xl bg-cyan-600 sm:px-4 text-sm text-white hover:bg-cyan-700 active:scale-[0.98] transition shadow-sm"
          >
            <LuPlus className="h-5 w-5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline font-medium">New Note</span>
          </button>
        </div>
        {/* --- END RESPONSIVE BUTTONS --- */}
      </div>
    </div>
  );
};
