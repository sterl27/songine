"use client";

import Link from "next/link";
import MusaixProApp from "../../src/app/App";

export default function Home() {
  return (
    <div className="relative">
      <div className="absolute right-4 top-4 z-50">
        <Link
          href="/release-form"
          className="rounded-md border border-cyan-500/40 bg-black/50 px-3 py-1.5 text-xs font-medium text-cyan-300 backdrop-blur hover:text-cyan-200"
        >
          Open release form
        </Link>
      </div>
      <MusaixProApp />
    </div>
  );
}
