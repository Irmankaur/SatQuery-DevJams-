"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, ImageOff, Loader } from "lucide-react";
import { Eyebrow } from "@/components/system/Eyebrow";
import { GlassPanel } from "@/components/system/GlassPanel";
import { StatBar } from "@/components/system/StatBar";
import { useMapStore } from "@/lib/store";
import type { GEECombinedResult } from "@/lib/store";
import type { GEETimelineDiff } from "@/lib/api";

type EvidencePanelProps = {
  open: boolean;
  onClose: () => void;
};

const CHANGE_ROWS: { key: keyof Pick<GEETimelineDiff, "water" | "vegetation" | "built_up">; label: string }[] = [
  { key: "water", label: "water" },
  { key: "vegetation", label: "vegetation" },
  { key: "built_up", label: "built-up" },
];

function ChangeRow({ label, value }: { label: string; value: number }) {
  const tone = value > 0.4 ? "text-good" : value < -0.4 ? "text-alert" : "text-ink-faint";
  const sign = value > 0 ? "+" : "";
  return (
    <div className="flex items-baseline justify-between">
      <span className="font-mono text-micro uppercase tracking-[0.12em] text-ink-faint">{label}</span>
      <span data-numeric="true" className={`font-mono text-small font-medium ${tone}`}>
        {sign}
        {value.toFixed(1)}%
      </span>
    </div>
  );
}

function Summary({ result }: { result: GEECombinedResult }) {
  const stats = result.analyze.stats;
  const diff = result.timeline.diff;
  
  return (
    <>
      <div className="mb-4 rounded-hard border border-line bg-void-3/40 px-3 py-2">
        <p className="text-small text-ink-dim leading-relaxed">
          {result.timeline.narrative}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <StatBar label="water" value={stats.water_pct} tone="signal" />
        <StatBar label="vegetation" value={stats.veg_pct} tone="good" />
        <StatBar label="built-up / bare" value={stats.built_up_pct} tone="alert" />
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <Eyebrow tone="dim" className="mb-3">
          Change · {diff.start_range[0]} → {diff.end_range[1]}
        </Eyebrow>
        <div className="flex flex-col gap-2">
          {CHANGE_ROWS.map((row) => (
            <ChangeRow key={row.key} label={row.label} value={diff[row.key].net_change_pct} />
          ))}
        </div>
      </div>
    </>
  );
}

export function EvidencePanel({ open, onClose }: EvidencePanelProps) {
  const geeResult = useMapStore((s) => s.geeResult);
  const analyzing = useMapStore((s) => s.analyzing);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-y-3 right-3 z-20 w-[calc(100vw-1.5rem)] sm:w-[360px]"
        >
          <GlassPanel variant="soft" scanlines className="flex h-full flex-col">
            <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3.5">
              <Eyebrow tone="dim">Evidence</Eyebrow>
              <button
                type="button"
                onClick={onClose}
                data-cursor="action"
                aria-label="Close evidence panel"
                className="flex h-6 w-6 items-center justify-center rounded-hard text-ink-faint transition-colors hover:text-ink"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto px-4 py-5">
              {analyzing ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
                  <Loader size={16} className="animate-spin text-signal" />
                  <p className="font-mono text-micro uppercase tracking-[0.14em] text-ink-faint">
                    analyzing region (Sentinel-2)…
                  </p>
                </div>
              ) : geeResult ? (
                <Summary result={geeResult} />
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-hard border border-line text-ink-faint">
                    <ImageOff size={15} strokeWidth={1.5} />
                  </div>
                  <p className="max-w-[24ch] text-small text-ink-dim">
                    No region selected. Draw a boundary to analyze its land
                    cover and recent change using Google Earth Engine.
                  </p>
                </div>
              )}
            </div>
          </GlassPanel>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
