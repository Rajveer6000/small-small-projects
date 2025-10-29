import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "./hook/useLocalStorage";
import NoteForm from "./Components/NoteForm";
import { WelcomeModal } from "./Components/WelcomeModal";
import { Modal } from "./Components/Modal";
import { AppHeader } from "./Components/AppHeader";
import NoteCard from "./Components/NoteCard";
import LeanPage from "./Components/Lean";

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
  return (
    <LeanPage/>
  );
};

export default App;
