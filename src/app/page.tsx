"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Fish, Pencil, Play, Plus, Trash2, X } from "lucide-react";
import { PixelFish, PixelPlant } from "@/components/game/PixelCreatures";
import { ConfirmProvider, useConfirm } from "@/components/game/ConfirmProvider";
import { requestAppFullscreen } from "@/hooks/useFullscreen";
import { useAudioStore } from "@/store/audioStore";
import {
  createSlot,
  deleteSlot,
  listSaves,
  migrateLegacy,
  renameSlot,
  setActiveId,
  type SaveMeta,
} from "@/store/saveManager";

export default function HomePage() {
  // Try to start ambient + music the moment the lobby opens. Browsers block
  // audio before a user gesture (autoplay policy), so this only succeeds where
  // allowed (e.g. returning visitors); otherwise the first interaction anywhere
  // kicks it off. SPA nav keeps the same document, so the sound carries into
  // /game.
  useEffect(() => {
    const unlock = () => useAudioStore.getState().unlock();
    unlock(); // best-effort autoplay on load
    const opts = { once: true } as const;
    window.addEventListener("pointerdown", unlock, opts);
    window.addEventListener("keydown", unlock, opts);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  return (
    <ConfirmProvider>
      <main className="lobby game-shell relative w-screen flex flex-col items-center justify-center px-6 crt-scanlines overflow-hidden">
        <LobbyBackground />

        <div className="relative z-10 flex flex-col items-center text-center w-full max-w-md">
          <div className="title-eyebrow mb-4">PIXEL AQUARIUM SIM</div>
          <h1
            className="font-display text-4xl sm:text-6xl md:text-7xl leading-tight mb-8 lobby-title"
            data-testid="landing-title"
          >
            <span className="text-cyan-300">AQUA</span>
            <span className="text-amber-300">SIM</span>
          </h1>

          <SaveManager />
        </div>
      </main>
    </ConfirmProvider>
  );
}

/** Lobby save-slot picker: create / load / rename / delete aquariums. */
function SaveManager() {
  const router = useRouter();
  const confirm = useConfirm();
  const [saves, setSaves] = useState<SaveMeta[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const refresh = useCallback(() => setSaves(listSaves()), []);

  // Build the registry (migrating any pre-#16 tank) and load the list. Runs
  // client-side only — localStorage isn't available during SSR.
  useEffect(() => {
    migrateLegacy();
    refresh();
    setLoaded(true);
  }, [refresh]);

  // Fire the same user-gesture side-effects the old single button did, then
  // SPA-navigate so audio + fullscreen carry into /game.
  const enterGame = useCallback(() => {
    void requestAppFullscreen();
    useAudioStore.getState().unlock();
    router.push("/game");
  }, [router]);

  const handleCreate = useCallback(() => {
    const name =
      newName.trim() ||
      `Akuarium ${listSaves().length + 1}`;
    createSlot(name); // also marks it active
    enterGame();
  }, [newName, enterGame]);

  const handleLoad = useCallback(
    (id: string) => {
      setActiveId(id);
      enterGame();
    },
    [enterGame]
  );

  const handleDelete = useCallback(
    async (slot: SaveMeta) => {
      const ok = await confirm({
        title: "Hapus akuarium?",
        message: `"${slot.name}" akan dihapus permanen beserta semua progresnya. Tindakan ini tidak bisa dibatalkan.`,
        confirmLabel: "Hapus",
        cancelLabel: "Batal",
        tone: "danger",
      });
      if (!ok) return;
      deleteSlot(slot.id);
      refresh();
    },
    [confirm, refresh]
  );

  const startCreate = () => {
    setNewName(`Akuarium ${saves.length + 1}`);
    setCreating(true);
  };

  // Avoid a hydration flash: render nothing data-dependent until client-loaded.
  if (!loaded) {
    return <div className="lobby-hint mt-2">▸ Memuat akuarium…</div>;
  }

  const empty = saves.length === 0;

  return (
    <div className="w-full flex flex-col items-stretch gap-3">
      {empty && !creating && (
        <div className="panel px-5 py-6 flex flex-col items-center gap-3 text-center">
          <Fish size={28} className="text-cyan-400" />
          <p className="text-sm text-slate-300">
            Belum ada akuarium. Buat yang pertama buat mulai memelihara ikan!
          </p>
          <button className="btn-play" onClick={startCreate} data-testid="enter-tank-button">
            <Plus size={20} />
            Buat Akuarium
          </button>
        </div>
      )}

      {!empty && (
        <ul className="flex flex-col gap-2 text-left">
          {saves.map((slot) => (
            <SaveCard
              key={slot.id}
              slot={slot}
              onLoad={() => handleLoad(slot.id)}
              onRename={(name) => {
                renameSlot(slot.id, name);
                refresh();
              }}
              onDelete={() => handleDelete(slot)}
            />
          ))}
        </ul>
      )}

      {creating ? (
        <div className="panel px-4 py-3 flex flex-col gap-2 text-left">
          <label className="text-[10px] uppercase tracking-widest text-cyan-300">
            Nama akuarium
          </label>
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={newName}
              maxLength={30}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                else if (e.key === "Escape") setCreating(false);
              }}
              placeholder="Akuarium Saya"
              data-testid="new-save-name-input"
              className="flex-1 min-w-0 bg-slate-900/60 border border-cyan-400/40 rounded px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-cyan-300"
            />
            <button
              className="btn btn-emerald shrink-0"
              onClick={handleCreate}
              data-testid="confirm-create-save"
            >
              <Play size={16} fill="currentColor" />
              Mulai
            </button>
            <button
              className="btn btn-ghost shrink-0"
              onClick={() => setCreating(false)}
              aria-label="Batal buat akuarium"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        !empty && (
          <button className="btn shrink-0 justify-center" onClick={startCreate}>
            <Plus size={16} />
            Buat akuarium baru
          </button>
        )
      )}
    </div>
  );
}

/** One saved aquarium: click to play, with inline rename + delete. */
function SaveCard({
  slot,
  onLoad,
  onRename,
  onDelete,
}: {
  slot: SaveMeta;
  onLoad: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(slot.name);

  const commit = () => {
    onRename(draft);
    setEditing(false);
  };
  const cancel = () => {
    setDraft(slot.name);
    setEditing(false);
  };

  if (editing) {
    return (
      <li className="panel px-3 py-2.5 flex items-center gap-2">
        <input
          autoFocus
          value={draft}
          maxLength={30}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            else if (e.key === "Escape") cancel();
          }}
          onBlur={commit}
          data-testid={`rename-input-${slot.id}`}
          className="flex-1 min-w-0 bg-slate-900/60 border border-cyan-400/40 rounded px-2 py-1 text-sm text-slate-100 outline-none focus:border-cyan-300"
        />
        {/* onMouseDown (not onClick) so it fires before the input's onBlur commit. */}
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            commit();
          }}
          aria-label="Simpan nama"
          className="text-emerald-400 hover:text-emerald-300"
        >
          <Check size={16} />
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            cancel();
          }}
          aria-label="Batal ganti nama"
          className="text-slate-500 hover:text-slate-300"
        >
          <X size={16} />
        </button>
      </li>
    );
  }

  return (
    <li className="panel pl-3 pr-2 py-2 flex items-center gap-2">
      <button
        onClick={onLoad}
        data-testid={`load-save-${slot.id}`}
        className="flex-1 min-w-0 flex items-center gap-3 text-left group"
      >
        <span className="grid place-items-center w-8 h-8 rounded bg-cyan-500/10 text-cyan-300 shrink-0">
          <Fish size={16} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm text-slate-100 group-hover:text-cyan-200">
            {slot.name}
          </span>
          <span className="block text-[10px] text-slate-400">
            {slot.fishCount} ikan · {timeAgo(slot.updatedAt)}
          </span>
        </span>
      </button>
      <button
        onClick={() => {
          setDraft(slot.name);
          setEditing(true);
        }}
        aria-label={`Ganti nama ${slot.name}`}
        className="p-1.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-white/5"
      >
        <Pencil size={15} />
      </button>
      <button
        onClick={onDelete}
        aria-label={`Hapus ${slot.name}`}
        data-testid={`delete-save-${slot.id}`}
        className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10"
      >
        <Trash2 size={15} />
      </button>
    </li>
  );
}

/** Tiny relative-time formatter ("baru saja", "5 menit lalu", …). */
function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (s < 60) return "baru saja";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  return `${d} hari lalu`;
}

function LobbyBackground() {
  return (
    <div className="lobby-bg" aria-hidden="true">
      {/* sunbeams / water tint */}
      <div className="lobby-water" />

      {/* swimming fish */}
      <PixelFish className="lobby-fish lobby-fish--1" color="#f5b461" belly="#fb7185" />
      <PixelFish className="lobby-fish lobby-fish--2" color="#22d3ee" belly="#a5f3fc" />
      <PixelFish className="lobby-fish lobby-fish--3" color="#a3e635" belly="#ecfeff" />
      <PixelFish className="lobby-fish lobby-fish--4" color="#38bdf8" belly="#a5f3fc" />

      {/* rising bubbles */}
      <span className="lobby-bubble lobby-bubble--1" />
      <span className="lobby-bubble lobby-bubble--2" />
      <span className="lobby-bubble lobby-bubble--3" />
      <span className="lobby-bubble lobby-bubble--4" />
      <span className="lobby-bubble lobby-bubble--5" />
      <span className="lobby-bubble lobby-bubble--6" />

      {/* swaying plants + substrate */}
      <div className="lobby-floor">
        <PixelPlant className="lobby-plant lobby-plant--1" />
        <PixelPlant className="lobby-plant lobby-plant--2" />
        <PixelPlant className="lobby-plant lobby-plant--3" />
        <PixelPlant className="lobby-plant lobby-plant--4" />
      </div>
    </div>
  );
}
