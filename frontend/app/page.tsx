"use client";

import Link from "next/link";
import MusaixProApp from "../../src/app/App";

export default function Home() {
  return (
    <div className="relative">
      <MusaixProApp />
      <div className="fixed bottom-6 left-4 z-[9999] sm:left-auto sm:right-6 sm:bottom-6">
        <Link
          href="/release-form"
          className="inline-flex items-center rounded-md border border-cyan-500/40 bg-black/50 px-3 py-1.5 text-xs font-medium text-cyan-300 shadow-lg shadow-black/30 backdrop-blur hover:text-cyan-200"
        >
          Open release form
        </Link>
      </div>
    </div>
  );
}
