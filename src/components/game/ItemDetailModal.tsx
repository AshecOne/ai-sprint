"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Minus, Plus } from "lucide-react";
import { SPRITE_REGISTRY } from "@/renderer/assets";

export type ItemKind = "Fish" | "Plant" | "Equipment";

export interface DetailStat {
  label: string;
  value: string;
}

export interface DetailItem {
  kind: ItemKind;
  label: string;
  description: string;
  spriteKey: string;
  /** Unit price. */
  price: number;
  stats: DetailStat[];
  /**
   * How many MORE units may be bought before hitting a hard cap (fish are
   * capped by tank capacity). Undefined = no cap. 0 = cannot buy (full).
   */
  capacityLeft?: number;
}

const lookup = (key: string) => SPRITE_REGISTRY.find((s) => s.key === key);

/**
 * Normalised item image: every item renders inside the SAME fixed square box so
 * the dialog never changes size between items. Fish sprites are 4-frame
 * horizontal sheets (64×16), so we crop frame 0; plants/equipment are single
 * PNGs shown with object-fit:contain. Everything is pixel-scaled, and the box's
 * background is the registry fallback colour so a missing file degrades to a
 * coloured tile instead of a broken image.
 */
function ItemSprite({ spriteKey, box = 120 }: { spriteKey: string; box?: number }) {
  const entry = lookup(spriteKey);
  const fallback = entry?.fallback ?? "#1f2937";
  const file = entry?.file ?? `${spriteKey}.png`;
  // Fish carry frameWidth in the registry → they're animation sheets.
  const isSheet = !!entry?.frameWidth;
  const inner = Math.round(box * 0.78);

  return (
    <div
      style={{
        width: box,
        height: box,
        borderRadius: 10,
        background: `${fallback}1f`, // faint tint of the fallback colour
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {isSheet ? (
        // Crop frame 0 of a horizontal sheet by drawing it 4× wide and
        // anchoring to the left edge.
        <div
          style={{
            width: inner,
            height: inner,
            backgroundImage: `url(/sprites/${file})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: `${inner * 4}px ${inner}px`,
            backgroundPosition: "0 0",
            imageRendering: "pixelated",
          }}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="pixelated"
          src={`/sprites/${file}`}
          alt=""
          aria-hidden="true"
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
          onError={(e) => {
            // Hide the broken image → the fallback-tinted box shows through.
            e.currentTarget.style.visibility = "hidden";
          }}
        />
      )}
    </div>
  );
}

export interface ItemDetailModalProps {
  item: DetailItem;
  cash: number;
  onBuy: (qty: number) => void;
  onClose: () => void;
}

/**
 * Floating shop detail dialog. Shows one item's image, type, name, description,
 * stats and price, with a quantity stepper and a Buy/Cancel pair. Portaled to
 * <body> with inline-styled fixed centering (per the project's portal lesson),
 * reusing the proven .panel / .btn visual classes.
 *
 * Buy does NOT confirm here — it hands the chosen qty back to the parent, which
 * closes this dialog first and then shows the shared confirm dialog, so the two
 * modals never stack.
 */
export function ItemDetailModal({ item, cash, onBuy, onClose }: ItemDetailModalProps) {
  const [qty, setQty] = useState(1);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocused = useRef<Element | null>(null);

  const affordableQty = item.price > 0 ? Math.floor(cash / item.price) : 0;
  const capLeft = item.capacityLeft ?? Infinity;
  const maxQty = Math.max(0, Math.min(affordableQty, capLeft));
  const isFull = item.capacityLeft === 0;
  const canBuy = maxQty >= 1 && qty <= maxQty && qty >= 1;
  const total = item.price * qty;

  // Keep qty within the buyable range as cash/cap change.
  useEffect(() => {
    setQty((q) => Math.min(Math.max(1, q), Math.max(1, maxQty)));
  }, [maxQty]);

  // Esc to close; focus management mirrors ConfirmDialog.
  useEffect(() => {
    lastFocused.current = document.activeElement;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    const id = window.requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      document.removeEventListener("keydown", onKey);
      window.cancelAnimationFrame(id);
      if (lastFocused.current instanceof HTMLElement) lastFocused.current.focus();
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(3, 8, 14, 0.6)",
        backdropFilter: "blur(2px)",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="panel"
        style={{ width: "100%", maxWidth: 360, padding: 18 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-detail-title"
        data-testid="item-detail-modal"
      >
        {/* Type eyebrow + name */}
        <div className="title-eyebrow" style={{ marginBottom: 2 }}>{item.kind}</div>
        <h2 id="item-detail-title" className="section-title" style={{ margin: "0 0 12px" }}>
          {item.label}
        </h2>

        <div className="flex gap-3.5">
          <ItemSprite spriteKey={item.spriteKey} />
          <div className="min-w-0 flex-1">
            <p
              className="text-[11px] leading-relaxed text-slate-300"
              style={{ margin: 0, minHeight: 48 }}
            >
              {item.description}
            </p>
            <dl className="mt-2 space-y-1">
              {item.stats.map((s) => (
                <div key={s.label} className="flex items-center justify-between gap-2 text-[10px]">
                  <dt className="uppercase tracking-wider text-slate-500">{s.label}</dt>
                  <dd className="m-0 font-semibold tabular-nums text-cyan-300/90">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Price + quantity stepper */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Unit price <span className="font-semibold text-slate-200">${item.price}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label="Decrease quantity"
              data-testid="qty-decrease"
              className={`btn btn-ghost px-2! py-1! ${qty <= 1 ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <Minus size={14} />
            </button>
            <span
              className="w-7 text-center text-[13px] font-semibold tabular-nums text-slate-100"
              data-testid="qty-value"
            >
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(Math.max(1, maxQty), q + 1))}
              disabled={qty >= maxQty}
              aria-label="Increase quantity"
              data-testid="qty-increase"
              className={`btn btn-ghost px-2! py-1! ${qty >= maxQty ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Total + note */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-slate-500">Total</span>
          <span className="text-[15px] font-bold tabular-nums text-emerald-300" data-testid="detail-total">
            ${total}
          </span>
        </div>
        {isFull ? (
          <p className="mt-1.5 text-[10px] text-amber-300/90">Tank is full — upgrade the tank to add more fish.</p>
        ) : !canBuy ? (
          <p className="mt-1.5 text-[10px] text-amber-300/90">Not enough cash.</p>
        ) : null}

        {/* Actions */}
        <div className="mt-4 flex justify-end gap-2">
          <button
            ref={closeRef}
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            data-testid="detail-cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            className={`btn btn-emerald ${canBuy ? "" : "opacity-40 cursor-not-allowed"}`}
            onClick={() => canBuy && onBuy(qty)}
            disabled={!canBuy}
            data-testid="detail-buy"
          >
            Buy (${total})
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
