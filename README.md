# RS Notes

[![Vercel Deploy](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://rs-notes.vercel.app/)
[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB)](#-tech-stack)

**Live App:** https://rs-notes.vercel.app/

RS Notes is a fast, minimalist, and responsive note-taking web app. It focuses on quick capture, distraction-free editing, and instant retrieval—perfect for personal notes, tasks, and lightweight knowledge bases.

---

## ✨ Features

- **Instant CRUD:** Create, edit, pin, and delete notes in a snap.
- **Auto-Save:** Your changes persist automatically.
- **Search & Filters:** Find notes by title/content; filter by pinned.
- **Dark / Light Mode:** Remembers your preference.
- **Responsive UI:** Works great on desktop, tablet, and mobile.
- **Zero-Config Hosting:** Optimized for Vercel with best-practice headers.

> Optional (if you wire a backend): user auth, cloud sync, and shareable links.

---

## 🧰 Tech Stack

- **Frontend:** React (+ Vite)
- **Styling:** Tailwind CSS (or CSS Modules)
- **State:** React Hooks + Context
- **Storage:** LocalStorage (upgrade path: IndexedDB/Firebase)
- **Deploy:** Vercel

> If your stack differs, update this section to match your repo.

---

## 📦 Getting Started (Local)

```bash
# 1) Clone
git clone https://github.com/Rajveer6000/small-small-projects.git
cd small-small-projects

# 2) Install
npm install

# 3) Run dev server
npm run dev
# Vite default: http://localhost:5173
