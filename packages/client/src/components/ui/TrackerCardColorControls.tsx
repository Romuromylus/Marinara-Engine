import type { CSSProperties } from "react";
import { Check, MessageSquareText, Package, Palette, Sparkles } from "lucide-react";
import type { TrackerCardColorConfig, TrackerCardColorMode } from "@marinara-engine/shared";
import { cn } from "../../lib/utils";
import {
  cleanTrackerCardColorConfig,
  getTrackerCardFinish,
  getTrackerCardSkinFinish,
  normalizeTrackerCardColorMode,
  parseTrackerCardColorConfig,
} from "../../lib/tracker-card-colors";
import { ColorPicker } from "./ColorPicker";

interface TrackerCardColorControlsProps {
  value: TrackerCardColorConfig | string | null | undefined;
  onChange: (value: TrackerCardColorConfig) => void;
  chatColors: {
    nameColor?: string | null;
    dialogueColor?: string | null;
    boxColor?: string | null;
  };
  entityLabel: "Character" | "Persona";
  previewName: string;
}

const MODE_OPTIONS: Array<{
  mode: TrackerCardColorMode;
  label: string;
  icon: typeof Palette;
}> = [
  { mode: "default", label: "Default", icon: Palette },
  { mode: "chat", label: "Chat colors", icon: MessageSquareText },
  { mode: "custom", label: "Custom", icon: Sparkles },
];

const FINISH_OPTIONS: Array<{
  key: "tintIntensity" | "glowIntensity" | "contrastIntensity";
  label: string;
}> = [
  { key: "tintIntensity", label: "Tint" },
  { key: "glowIntensity", label: "Glow" },
  { key: "contrastIntensity", label: "Contrast" },
];

const TRACKER_CARD_PREVIEW_STATS = [
  { label: "Satiety", value: "58", width: "58%", color: "#55c860" },
  { label: "Energy", value: "67", width: "67%", color: "#ffb01f" },
  { label: "Hygiene", value: "70", width: "70%", color: "#2ea7f7" },
  { label: "Morale", value: "83", width: "83%", color: "#ff5555" },
];

function getDisplayStyle(value: string | null | undefined) {
  if (!value) {
    return {
      backgroundImage: "repeating-conic-gradient(var(--border) 0% 25%, transparent 0% 50%)",
      backgroundSize: "0.5rem 0.5rem",
    };
  }

  return value.includes("gradient(") ? { background: value } : { backgroundColor: value };
}

function getPaintLayer(value: string | null | undefined) {
  const text = value?.trim();
  if (!text) return null;
  return text.includes("gradient(") ? text : `linear-gradient(${text}, ${text})`;
}

function getPaintSolidFallback(value: string | null | undefined) {
  const text = value?.trim();
  if (!text) return null;
  if (!text.includes("gradient(")) return text;
  return (
    text.match(
      /#[0-9a-f]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\)|oklch\([^)]+\)|oklab\([^)]+\)|lch\([^)]+\)|lab\([^)]+\)|var\(--[\w-]+\)/i,
    )?.[0] ?? null
  );
}

type TrackerPreviewStyle = CSSProperties & {
  "--tracker-preview-accent": string;
  "--tracker-preview-accent-layer": string;
  "--tracker-preview-box": string;
  "--tracker-preview-box-layer": string;
  "--tracker-preview-dialogue-glow": string;
  "--tracker-preview-display-layer": string;
  "--tracker-preview-display-opacity": string;
  "--tracker-preview-display-solid": string;
  "--tracker-preview-frame": string;
  "--tracker-preview-muted-panel": string;
  "--tracker-preview-panel": string;
  "--tracker-preview-panel-strong": string;
  "--tracker-preview-rule": string;
  "--tracker-preview-surface": string;
  "--tracker-preview-tint-opacity": string;
  "--tracker-preview-glow-opacity": string;
  "--tracker-preview-contrast-top": string;
  "--tracker-preview-contrast-mid": string;
  "--tracker-preview-contrast-bottom": string;
  "--tracker-preview-muted-text": string;
  "--tracker-preview-number-text": string;
  "--tracker-preview-row-rule": string;
  "--tracker-preview-stat-fill-glow": string;
  "--tracker-preview-stat-fill-highlight": string;
  "--tracker-preview-stat-track": string;
  "--tracker-preview-stat-track-ring": string;
  "--tracker-preview-stat-track-shadow": string;
  "--tracker-preview-text": string;
};

function mixPercent(value: number, scale: number, max: number) {
  return Math.min(max, Math.round(value * scale));
}

function getTrackerPreviewStyle(
  colors: TrackerCardColorControlsProps["chatColors"],
  finish: ReturnType<typeof getTrackerCardFinish>,
): TrackerPreviewStyle {
  const skin = getTrackerCardSkinFinish(finish);
  const displaySolid =
    getPaintSolidFallback(colors.nameColor) ??
    getPaintSolidFallback(colors.dialogueColor) ??
    getPaintSolidFallback(colors.boxColor) ??
    "var(--primary)";
  const accent = getPaintSolidFallback(colors.dialogueColor) ?? displaySolid;
  const box = getPaintSolidFallback(colors.boxColor) ?? displaySolid;
  const displayLayer = getPaintLayer(colors.nameColor) ?? `linear-gradient(${displaySolid}, ${displaySolid})`;
  const accentLayer = getPaintLayer(colors.dialogueColor) ?? `linear-gradient(${accent}, ${accent})`;
  const boxLayer = getPaintLayer(colors.boxColor) ?? `linear-gradient(${box}, ${box})`;
  const tint = finish.tintIntensity;
  const ambienceBoxMix = mixPercent(tint, 0.22, 22);
  const ambienceDisplayMix = mixPercent(tint, 0.2, 20);
  const ambienceRadialMix = mixPercent(tint, 0.18, 18);
  const mutedBoxMix = Math.round(skin.panelBoxMix * 0.55);
  const mutedDisplayMix = Math.round(skin.panelDisplayMix * 0.45);

  return {
    "--tracker-preview-accent": accent,
    "--tracker-preview-accent-layer": accentLayer,
    "--tracker-preview-box": box,
    "--tracker-preview-box-layer": boxLayer,
    "--tracker-preview-dialogue-glow": `color-mix(in srgb, ${accent} ${skin.glowMix}%, transparent)`,
    "--tracker-preview-display-layer": displayLayer,
    "--tracker-preview-display-opacity": skin.displayOpacity,
    "--tracker-preview-display-solid": displaySolid,
    "--tracker-preview-frame":
      `linear-gradient(135deg, ` +
      `color-mix(in srgb, var(--card) ${100 - skin.surfaceBoxMix}%, ${box} ${skin.surfaceBoxMix}%), ` +
      `color-mix(in srgb, var(--background) ${100 - skin.surfaceDisplayMix}%, ${displaySolid} ${skin.surfaceDisplayMix}%))`,
    "--tracker-preview-muted-panel":
      `linear-gradient(135deg, ` +
      `color-mix(in srgb, var(--background) ${100 - mutedBoxMix}%, ${box} ${mutedBoxMix}%), ` +
      `color-mix(in srgb, var(--card) ${100 - mutedDisplayMix}%, ${displaySolid} ${mutedDisplayMix}%))`,
    "--tracker-preview-panel":
      `linear-gradient(135deg, ` +
      `color-mix(in srgb, var(--background) ${100 - skin.panelBoxMix}%, ${box} ${skin.panelBoxMix}%), ` +
      `color-mix(in srgb, var(--card) ${100 - skin.panelDisplayMix}%, ${displaySolid} ${skin.panelDisplayMix}%))`,
    "--tracker-preview-panel-strong":
      `linear-gradient(135deg, ` +
      `color-mix(in srgb, color-mix(in srgb, var(--background) ${100 - skin.panelBoxMix}%, ${box} ${skin.panelBoxMix}%) ${100 - skin.accentPanelMix}%, ${accent} ${skin.accentPanelMix}%), ` +
      `color-mix(in srgb, var(--card) ${100 - skin.panelDisplayMix}%, ${displaySolid} ${skin.panelDisplayMix}%))`,
    "--tracker-preview-rule": `color-mix(in srgb, color-mix(in srgb, ${box} 58%, ${accent} 42%) ${skin.borderOpacity}%, transparent)`,
    "--tracker-preview-surface":
      `linear-gradient(135deg, ` +
      `color-mix(in srgb, var(--card) ${100 - skin.surfaceDisplayMix}%, ${displaySolid} ${skin.surfaceDisplayMix}%), ` +
      `color-mix(in srgb, var(--background) ${100 - skin.surfaceBoxMix}%, ${box} ${skin.surfaceBoxMix}%))`,
    "--tracker-preview-tint-opacity": skin.tintOpacity,
    "--tracker-preview-glow-opacity": skin.displayOpacity,
    "--tracker-preview-contrast-top": `${skin.strongContrastTop}%`,
    "--tracker-preview-contrast-mid": `${skin.strongContrastMid}%`,
    "--tracker-preview-contrast-bottom": `${skin.strongContrastBottom}%`,
    "--tracker-preview-muted-text": `color-mix(in srgb, var(--foreground) ${skin.mutedTextMix}%, var(--muted-foreground) ${100 - skin.mutedTextMix}%)`,
    "--tracker-preview-number-text": `color-mix(in srgb, var(--foreground) ${skin.numberTextMix}%, var(--muted-foreground) ${100 - skin.numberTextMix}%)`,
    "--tracker-preview-row-rule": `color-mix(in srgb, var(--foreground) ${skin.rowRuleOpacity}%, transparent)`,
    "--tracker-preview-stat-fill-glow": `color-mix(in srgb, var(--foreground) ${skin.statFillGlowMix}%, transparent)`,
    "--tracker-preview-stat-fill-highlight": `color-mix(in srgb, var(--foreground) ${skin.statFillHighlightMix}%, transparent)`,
    "--tracker-preview-stat-track": `color-mix(in srgb, var(--background) ${skin.statTrackBackgroundMix}%, var(--secondary) ${100 - skin.statTrackBackgroundMix}%)`,
    "--tracker-preview-stat-track-ring": `color-mix(in srgb, var(--foreground) ${skin.statTrackRingOpacity}%, transparent)`,
    "--tracker-preview-stat-track-shadow": `rgba(0, 0, 0, ${skin.statTrackShadowOpacity})`,
    "--tracker-preview-text": `color-mix(in srgb, var(--foreground) ${skin.textMix}%, var(--muted-foreground) ${100 - skin.textMix}%)`,
    background:
      `radial-gradient(circle at 78% 18%, color-mix(in srgb, ${displaySolid} ${ambienceRadialMix}%, transparent) 0%, transparent 54%), ` +
      `linear-gradient(135deg, color-mix(in srgb, var(--card) ${100 - ambienceBoxMix}%, ${box} ${ambienceBoxMix}%), ` +
      `color-mix(in srgb, var(--background) ${100 - ambienceDisplayMix}%, ${displaySolid} ${ambienceDisplayMix}%))`,
  };
}

function getPreviewInitial(name: string, fallback: string) {
  return (name.trim() || fallback).slice(0, 1).toUpperCase();
}

function getEffectiveColors(
  mode: TrackerCardColorMode,
  config: TrackerCardColorConfig,
  chatColors: TrackerCardColorControlsProps["chatColors"],
) {
  if (mode === "custom") return config;
  if (mode === "chat") return chatColors;
  return {};
}

export function TrackerCardColorControls({
  value,
  onChange,
  chatColors,
  entityLabel,
  previewName,
}: TrackerCardColorControlsProps) {
  const config = typeof value === "string" ? parseTrackerCardColorConfig(value) : cleanTrackerCardColorConfig(value);
  const mode = normalizeTrackerCardColorMode(config.mode);
  const finish = getTrackerCardFinish(config, mode);
  const effectiveColors = getEffectiveColors(mode, config, chatColors);
  const previewStyle = getTrackerPreviewStyle(effectiveColors, finish);
  const previewInitial = getPreviewInitial(previewName, entityLabel === "Persona" ? "Y" : "C");
  const previewContrastStyle = {
    background:
      "linear-gradient(180deg,color-mix(in srgb,var(--background) var(--tracker-preview-contrast-top),transparent) 0%,color-mix(in srgb,var(--card) var(--tracker-preview-contrast-mid),transparent) 58%,color-mix(in srgb,var(--background) var(--tracker-preview-contrast-bottom),transparent) 100%)",
  };

  const updateMode = (nextMode: TrackerCardColorMode) => {
    onChange(
      cleanTrackerCardColorConfig({
        ...config,
        mode: nextMode,
        ...(nextMode === "custom" && {
          nameColor: config.nameColor || chatColors.nameColor || "",
          dialogueColor: config.dialogueColor || chatColors.dialogueColor || "",
          boxColor: config.boxColor || chatColors.boxColor || "",
        }),
      }),
    );
  };

  const updateCustomColor = (key: "nameColor" | "dialogueColor" | "boxColor", color: string) => {
    onChange(cleanTrackerCardColorConfig({ ...config, mode: "custom", [key]: color }));
  };

  const updateFinish = (key: "tintIntensity" | "glowIntensity" | "contrastIntensity", nextValue: number) => {
    onChange(cleanTrackerCardColorConfig({ ...config, [key]: nextValue }));
  };

  return (
    <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-xs font-semibold text-[var(--foreground)]">{entityLabel} Tracker Card</h4>
          <p className="mt-0.5 text-[0.625rem] text-[var(--muted-foreground)]">Color source for tracker cards.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
          <span
            className="h-5 w-5 rounded-md ring-1 ring-[var(--border)]"
            style={getDisplayStyle(effectiveColors.nameColor)}
          />
          <span
            className="h-5 w-5 rounded-md ring-1 ring-[var(--border)]"
            style={getDisplayStyle(effectiveColors.dialogueColor)}
          />
          <span
            className="h-5 w-5 rounded-md ring-1 ring-[var(--border)]"
            style={getDisplayStyle(effectiveColors.boxColor)}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-lg bg-[var(--secondary)] p-1">
        {MODE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const selected = option.mode === mode;
          return (
            <button
              key={option.mode}
              type="button"
              onClick={() => updateMode(option.mode)}
              className={cn(
                "flex min-h-8 items-center justify-center gap-1 rounded-md px-1.5 text-[0.625rem] font-medium transition-all",
                selected
                  ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm ring-1 ring-[var(--border)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--background)]/55 hover:text-[var(--foreground)]",
              )}
            >
              {selected ? <Check size="0.6875rem" /> : <Icon size="0.6875rem" />}
              <span className="truncate">{option.label}</span>
            </button>
          );
        })}
      </div>

      <div className="@container mx-auto w-full max-w-[32rem]">
        <div
          className="relative min-w-0 overflow-hidden rounded-md border border-[var(--tracker-preview-rule)] bg-[image:var(--tracker-preview-frame)] p-0 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--foreground)_8%,transparent)]"
          style={previewStyle}
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--foreground)_4%,transparent),transparent_46%,color-mix(in_srgb,var(--tracker-preview-accent)_6%,transparent))]" />
          <div
            className="pointer-events-none absolute inset-0 bg-[image:var(--tracker-preview-display-layer)]"
            style={{ opacity: "var(--tracker-preview-display-opacity)" }}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[image:var(--tracker-preview-display-layer)] opacity-45" />

          <div className="relative z-[1] overflow-hidden rounded-md border border-[var(--tracker-preview-rule)] bg-[image:var(--tracker-preview-surface)]">
            <div className="pointer-events-none absolute inset-0" style={previewContrastStyle} />
            <div className="relative z-[1] grid grid-cols-[minmax(0,1fr)_clamp(5.75rem,42cqw,7.35rem)] @min-[380px]:grid-cols-[minmax(0,1fr)_9rem]">
              <div className="min-w-0 border-r border-[var(--tracker-preview-rule)]">
                <div className="relative flex min-h-5 items-center justify-center overflow-hidden border-b border-[var(--tracker-preview-rule)] bg-[image:var(--tracker-preview-panel-strong)] px-1.5 py-0">
                  <span
                    className="pointer-events-none absolute inset-0 bg-[image:var(--tracker-preview-display-layer)]"
                    style={{ opacity: "var(--tracker-preview-display-opacity)" }}
                  />
                  <span className="relative z-[1] block truncate text-[0.75rem] font-semibold leading-5 text-[color:var(--tracker-preview-text)]">
                    {previewName || entityLabel}
                  </span>
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[image:var(--tracker-preview-display-layer)] opacity-80" />
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[image:var(--tracker-preview-accent-layer)] opacity-35" />
                </div>
                <div className="space-y-1 px-1 py-1">
                  {TRACKER_CARD_PREVIEW_STATS.map((stat) => (
                    <div
                      key={stat.label}
                      className="grid gap-0.5 border-b border-[var(--tracker-preview-row-rule)] pb-0.5 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between gap-2 text-[0.625rem] leading-none">
                        <span className="truncate text-[color:var(--tracker-preview-text)]">{stat.label}</span>
                        <span className="font-mono text-[color:var(--tracker-preview-number-text)]">
                          {stat.value} / 100
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--tracker-preview-stat-track)] shadow-[inset_0_1px_2px_var(--tracker-preview-stat-track-shadow)] ring-1 ring-[var(--tracker-preview-stat-track-ring)]">
                        <div
                          className="h-full rounded-full shadow-[inset_0_1px_0_var(--tracker-preview-stat-fill-highlight),0_0_6px_var(--tracker-preview-stat-fill-glow)]"
                          style={{ width: stat.width, backgroundColor: stat.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative flex min-w-0 flex-col overflow-hidden rounded-b-md bg-[image:var(--tracker-preview-surface)] ring-1 ring-[var(--tracker-preview-rule)] shadow-[0_0_10px_var(--tracker-preview-dialogue-glow),inset_0_-16px_24px_color-mix(in_srgb,var(--background)_58%,transparent)]">
                <div className="relative flex h-5 shrink-0 items-center gap-1 overflow-hidden border-b border-[var(--tracker-preview-rule)] bg-[image:var(--tracker-preview-panel)] px-1">
                  <span
                    className="pointer-events-none absolute inset-0 bg-[image:var(--tracker-preview-display-layer)]"
                    style={{ opacity: "var(--tracker-preview-display-opacity)" }}
                  />
                  <span
                    className="relative z-[1] h-1.5 w-1.5 rounded-full bg-[image:var(--tracker-preview-accent-layer)]"
                    style={{ boxShadow: "0 0 6px color-mix(in srgb,var(--tracker-preview-accent) 42%,transparent)" }}
                  />
                  <span className="relative z-[1] min-w-0 truncate text-[0.5625rem] font-semibold leading-5 text-[color-mix(in_srgb,var(--foreground)_82%,var(--tracker-preview-accent)_18%)]">
                    Tracking
                  </span>
                </div>
                <div className="relative flex min-h-[8.75rem] flex-1 items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(150deg,color-mix(in_srgb,var(--tracker-preview-box)_30%,var(--background)_70%)_0%,color-mix(in_srgb,var(--background)_88%,var(--tracker-preview-display-solid)_12%)_48%,color-mix(in_srgb,var(--card)_70%,var(--tracker-preview-box)_30%)_100%)]" />
                  <div
                    className="absolute inset-0 bg-[image:var(--tracker-preview-box-layer)]"
                    style={{ opacity: "var(--tracker-preview-tint-opacity)" }}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--tracker-preview-display-solid)_18%,transparent)_0%,transparent_36%,color-mix(in_srgb,var(--background)_50%,transparent)_100%)]" />
                  <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--tracker-preview-rule)] bg-[color-mix(in_srgb,var(--background)_72%,transparent)] text-lg font-semibold leading-none text-[var(--tracker-preview-display-solid)] shadow-[0_0_10px_var(--tracker-preview-dialogue-glow)]">
                    {previewInitial}
                  </span>
                </div>
              </div>

              <div className="col-span-2 border-t border-[var(--tracker-preview-rule)] px-1 pb-1 pt-0.5">
                <div className="relative flex h-5 items-center gap-1 overflow-hidden bg-[image:var(--tracker-preview-panel)] px-0.5 text-[0.6875rem] leading-[0.875rem]">
                  <span
                    className="pointer-events-none absolute inset-0 bg-[image:var(--tracker-preview-display-layer)] [mask-image:linear-gradient(90deg,transparent_0%,black_13%,black_87%,transparent_100%)]"
                    style={{ opacity: "var(--tracker-preview-display-opacity)" }}
                  />
                  <Package size="0.75rem" className="relative z-[1] shrink-0 text-[var(--tracker-preview-accent)]/78" />
                  <span className="relative z-[1] min-w-0 flex-1 truncate font-medium text-[color-mix(in_srgb,var(--tracker-preview-text)_78%,var(--tracker-preview-accent)_22%)]">
                    Inventory
                  </span>
                </div>
                <div className="relative mt-px grid min-h-4 grid-cols-[minmax(0,1fr)_max-content] items-center gap-0.5 rounded-[2px] border border-[var(--tracker-preview-rule)] bg-[image:var(--tracker-preview-muted-panel)] px-1 py-px text-[0.625rem] leading-4">
                  <span className="truncate text-[color:var(--tracker-preview-text)]">None</span>
                  <span className="font-mono text-[color:var(--tracker-preview-number-text)]">1</span>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-[var(--tracker-preview-rule)] shadow-[0_0_10px_var(--tracker-preview-dialogue-glow)]" />
          </div>
        </div>
      </div>

      <div className="grid gap-2 rounded-lg bg-[var(--secondary)]/70 p-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[0.625rem] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
            Card finish
          </span>
          <span className="text-[0.625rem] text-[var(--muted-foreground)]">
            {finish.tintIntensity}/{finish.glowIntensity}/{finish.contrastIntensity}
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {FINISH_OPTIONS.map((option) => {
            const value = finish[option.key];
            return (
              <label key={option.key} className="min-w-0 space-y-1">
                <span className="flex items-center justify-between gap-2 text-[0.625rem] text-[var(--muted-foreground)]">
                  <span>{option.label}</span>
                  <span className="font-mono tabular-nums">{value}%</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={value}
                  onChange={(event) => updateFinish(option.key, Number(event.target.value))}
                  className="h-1.5 w-full cursor-pointer accent-[var(--primary)]"
                />
              </label>
            );
          })}
        </div>
      </div>

      {mode === "custom" && (
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <ColorPicker
              value={config.nameColor ?? ""}
              onChange={(color) => updateCustomColor("nameColor", color)}
              gradient
              label="Display"
            />
            <ColorPicker
              value={config.dialogueColor ?? ""}
              onChange={(color) => updateCustomColor("dialogueColor", color)}
              gradient
              label="Accent"
            />
            <ColorPicker
              value={config.boxColor ?? ""}
              onChange={(color) => updateCustomColor("boxColor", color)}
              gradient
              label="Surface"
            />
          </div>
        </div>
      )}
    </div>
  );
}
