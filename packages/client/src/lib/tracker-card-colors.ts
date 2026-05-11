import type { TrackerCardColorConfig, TrackerCardColorMode } from "@marinara-engine/shared";

export const DEFAULT_TRACKER_CARD_COLOR_MODE: TrackerCardColorMode = "chat";

export interface TrackerCardFinish {
  tintIntensity: number;
  glowIntensity: number;
  contrastIntensity: number;
}

export const TRACKER_CARD_FINISH_DEFAULTS: Record<TrackerCardColorMode, TrackerCardFinish> = {
  default: {
    tintIntensity: 0,
    glowIntensity: 25,
    contrastIntensity: 55,
  },
  chat: {
    tintIntensity: 35,
    glowIntensity: 45,
    contrastIntensity: 55,
  },
  custom: {
    tintIntensity: 35,
    glowIntensity: 45,
    contrastIntensity: 55,
  },
};

export function normalizeTrackerCardColorMode(value: unknown): TrackerCardColorMode {
  return value === "default" || value === "chat" || value === "custom" ? value : DEFAULT_TRACKER_CARD_COLOR_MODE;
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getClampedFinishValue(value: unknown): number | undefined {
  const numberValue = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isFinite(numberValue)) return undefined;
  return Math.max(0, Math.min(100, Math.round(numberValue)));
}

function parseRecord(value: unknown): Record<string, unknown> | null {
  if (!value) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    try {
      const parsed = JSON.parse(trimmed);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }

  return typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export function cleanTrackerCardColorConfig(config: TrackerCardColorConfig | null | undefined): TrackerCardColorConfig {
  const tintIntensity = getClampedFinishValue(config?.tintIntensity);
  const glowIntensity = getClampedFinishValue(config?.glowIntensity);
  const contrastIntensity = getClampedFinishValue(config?.contrastIntensity);

  return {
    mode: normalizeTrackerCardColorMode(config?.mode),
    ...(config?.nameColor ? { nameColor: config.nameColor } : {}),
    ...(config?.dialogueColor ? { dialogueColor: config.dialogueColor } : {}),
    ...(config?.boxColor ? { boxColor: config.boxColor } : {}),
    ...(tintIntensity !== undefined && { tintIntensity }),
    ...(glowIntensity !== undefined && { glowIntensity }),
    ...(contrastIntensity !== undefined && { contrastIntensity }),
  };
}

export function parseTrackerCardColorConfig(raw: unknown): TrackerCardColorConfig {
  const record = parseRecord(raw);
  if (!record) return { mode: DEFAULT_TRACKER_CARD_COLOR_MODE };

  return cleanTrackerCardColorConfig({
    mode: normalizeTrackerCardColorMode(record.mode),
    nameColor: getString(record.nameColor),
    dialogueColor: getString(record.dialogueColor),
    boxColor: getString(record.boxColor),
    tintIntensity: getClampedFinishValue(record.tintIntensity),
    glowIntensity: getClampedFinishValue(record.glowIntensity),
    contrastIntensity: getClampedFinishValue(record.contrastIntensity),
  });
}

export function serializeTrackerCardColorConfig(config: TrackerCardColorConfig): string {
  return JSON.stringify(cleanTrackerCardColorConfig(config));
}

export function getTrackerCardFinish(
  config: TrackerCardColorConfig | null | undefined,
  mode = normalizeTrackerCardColorMode(config?.mode),
): TrackerCardFinish {
  const defaults = TRACKER_CARD_FINISH_DEFAULTS[mode];

  return {
    tintIntensity: getClampedFinishValue(config?.tintIntensity) ?? defaults.tintIntensity,
    glowIntensity: getClampedFinishValue(config?.glowIntensity) ?? defaults.glowIntensity,
    contrastIntensity: getClampedFinishValue(config?.contrastIntensity) ?? defaults.contrastIntensity,
  };
}
