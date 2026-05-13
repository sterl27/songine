"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type RemixType = "remix" | "cover" | "original";
type LyricsType = "yes" | "no";
type IsrcType = "yes" | "generate";

type ReleaseFormState = {
  trackTitle: string;
  version: string;
  contentRatingExplicit: boolean;
  remixType: RemixType;
  mainArtists: string;
  composer: string;
  writerOwnership: boolean;
  hasLyrics: LyricsType;
  lyricsLanguage: string;
  hasIsrc: IsrcType;
  isrcCode: string;
  youtubeContentId: boolean;
  youtubeAgreement: boolean;
  previewStartMinute: string;
  previewStartSecond: string;
};

const initialState: ReleaseFormState = {
  trackTitle: "Clips of Vision",
  version: "",
  contentRatingExplicit: true,
  remixType: "original",
  mainArtists: "S73RL, Blak Pearl",
  composer: "G. Sterling Atkinson",
  writerOwnership: true,
  hasLyrics: "yes",
  lyricsLanguage: "English",
  hasIsrc: "generate",
  isrcCode: "",
  youtubeContentId: false,
  youtubeAgreement: false,
  previewStartMinute: "00",
  previewStartSecond: "00",
};

export default function ReleaseFormPage() {
  const [form, setForm] = useState<ReleaseFormState>(initialState);
  const [saved, setSaved] = useState(false);

  const isValid = useMemo(() => {
    if (!form.trackTitle.trim()) return false;
    if (!form.mainArtists.trim()) return false;
    if (!form.composer.trim()) return false;
    if (form.hasLyrics === "yes" && !form.lyricsLanguage.trim()) return false;
    if (form.hasIsrc === "yes" && !form.isrcCode.trim()) return false;
    if (form.youtubeContentId && !form.youtubeAgreement) return false;
    return true;
  }, [form]);

  function update<K extends keyof ReleaseFormState>(key: K, value: ReleaseFormState[K]) {
    setSaved(false);
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isValid) return;
    setSaved(true);
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Track Release Form</h1>
          <Link href="/" className="text-sm text-cyan-300 hover:text-cyan-200 underline underline-offset-4">
            Back to app
          </Link>
        </div>

        <p className="mb-8 text-sm text-neutral-400">
          This info will only go to the streaming services you select later.
        </p>

        <form onSubmit={onSubmit} className="space-y-8 rounded-xl border border-neutral-800 bg-neutral-900/60 p-6">
          <section className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm font-medium">Track title *</span>
              <input
                value={form.trackTitle}
                onChange={(e) => update("trackTitle", e.target.value)}
                className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-cyan-500"
                placeholder="Clips of Vision"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Version (optional)</span>
              <input
                value={form.version}
                onChange={(e) => update("version", e.target.value)}
                className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-cyan-500"
                placeholder="Acoustic, Extended, etc."
              />
            </label>

            <div className="grid gap-2">
              <span className="text-sm font-medium">Content rating *</span>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.contentRatingExplicit}
                  onChange={(e) => update("contentRatingExplicit", e.target.checked)}
                />
                Explicit
              </label>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <fieldset className="grid gap-2 sm:col-span-2">
              <legend className="text-sm font-medium mb-1">Is this track a remix or a cover? *</legend>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="remixType"
                  checked={form.remixType === "remix"}
                  onChange={() => update("remixType", "remix")}
                />
                Remix
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="remixType"
                  checked={form.remixType === "cover"}
                  onChange={() => update("remixType", "cover")}
                />
                Cover
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="remixType"
                  checked={form.remixType === "original"}
                  onChange={() => update("remixType", "original")}
                />
                No, this is an original composition
              </label>
            </fieldset>

            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm font-medium">Main Artist(s) *</span>
              <input
                value={form.mainArtists}
                onChange={(e) => update("mainArtists", e.target.value)}
                className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-cyan-500"
                placeholder="S73RL, Blak Pearl"
              />
            </label>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium">Composer *</span>
              <input
                value={form.composer}
                onChange={(e) => update("composer", e.target.value)}
                className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-cyan-500"
                placeholder="G. Sterling Atkinson"
              />
            </label>

            <label className="inline-flex items-center gap-2 text-sm mt-7">
              <input
                type="checkbox"
                checked={form.writerOwnership}
                onChange={(e) => update("writerOwnership", e.target.checked)}
              />
              I wrote this song / represent the writer(s)
            </label>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium mb-1">Does this track have lyrics? *</legend>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="lyrics"
                  checked={form.hasLyrics === "yes"}
                  onChange={() => update("hasLyrics", "yes")}
                />
                Yes
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="lyrics"
                  checked={form.hasLyrics === "no"}
                  onChange={() => update("hasLyrics", "no")}
                />
                No
              </label>
            </fieldset>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Language of lyrics *</span>
              <input
                value={form.lyricsLanguage}
                onChange={(e) => update("lyricsLanguage", e.target.value)}
                disabled={form.hasLyrics === "no"}
                className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-cyan-500 disabled:opacity-50"
                placeholder="English"
              />
            </label>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <fieldset className="grid gap-2 sm:col-span-2">
              <legend className="text-sm font-medium mb-1">Do you have an ISRC for this track? *</legend>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="isrc"
                  checked={form.hasIsrc === "yes"}
                  onChange={() => update("hasIsrc", "yes")}
                />
                Yes
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="isrc"
                  checked={form.hasIsrc === "generate"}
                  onChange={() => update("hasIsrc", "generate")}
                />
                No, generate one for me
              </label>
            </fieldset>

            <label className="grid gap-2 sm:col-span-2">
              <span className="text-sm font-medium">ISRC</span>
              <input
                value={form.isrcCode}
                onChange={(e) => update("isrcCode", e.target.value.toUpperCase())}
                disabled={form.hasIsrc === "generate"}
                className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-cyan-500 disabled:opacity-50"
                placeholder={form.hasIsrc === "generate" ? "Automatically generated" : "US-XXX-00-00000"}
              />
            </label>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <span className="text-sm font-medium">Audio preview start time</span>
              <div className="flex items-center gap-2">
                <input
                  value={form.previewStartMinute}
                  onChange={(e) => update("previewStartMinute", e.target.value.replace(/\D/g, "").slice(0, 2))}
                  className="w-16 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-center"
                />
                <span>:</span>
                <input
                  value={form.previewStartSecond}
                  onChange={(e) => update("previewStartSecond", e.target.value.replace(/\D/g, "").slice(0, 2))}
                  className="w-16 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-center"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-medium">YouTube Content ID</span>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.youtubeContentId}
                  onChange={(e) => update("youtubeContentId", e.target.checked)}
                />
                Enable this track for YouTube Content ID
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.youtubeAgreement}
                  disabled={!form.youtubeContentId}
                  onChange={(e) => update("youtubeAgreement", e.target.checked)}
                />
                I understand and agree to these rules
              </label>
            </div>
          </section>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!isValid}
              className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setForm(initialState);
                setSaved(false);
              }}
              className="rounded-md border border-neutral-700 px-4 py-2 text-sm"
            >
              Cancel
            </button>
            {saved && <span className="text-sm text-emerald-400">Saved successfully.</span>}
          </div>
        </form>
      </div>
    </main>
  );
}
