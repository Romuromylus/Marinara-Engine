import type { TrackerCardColorConfig, TrackerCardColorMode } from "@marinara-engine/shared";

export const DEFAULT_TRACKER_CARD_COLOR_MODE: TrackerCardColorMode = "chat";

export interface TrackerCardFinish {
  tintIntensity: number;
  glowIntensity: number;
  contrastIntensity: number;
}

export interface TrackerCardPaintOpacity {
  nameColorOpacity: number;
  dialogueColorOpacity: number;
  boxColorOpacity: number;
}

export interface TrackerCardSkinFinish {
  accentPanelMix: number;
  borderOpacity: number;
  displayOpacity: string;
  glowMix: number;
  mutedTextMix: number;
  numberTextMix: number;
  panelBoxMix: number;
  panelDisplayMix: number;
  rowRuleOpacity: number;
  softContrastBottom: number;
  softContrastMid: number;
  softContrastTop: number;
  slotBackgroundBottomMix: number;
  slotBackgroundTopMix: number;
  slotRuleOpacity: number;
  slotShadowOpacity: string;
  statTrackAccentMix: number;
  statFillGlowMix: number;
  statFillHighlightMix: number;
  statTrackBackgroundMix: number;
  statTrackBoxMix: number;
  statTrackRingOpacity: number;
  statTrackShadowOpacity: string;
  strongContrastBottom: number;
  strongContrastMid: number;
  strongContrastTop: number;
  surfaceBoxMix: number;
  surfaceDisplayMix: number;
  textMix: number;
  tintOpacity: string;
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

export const TRACKER_CARD_PAINT_OPACITY_DEFAULTS: TrackerCardPaintOpacity = {
  nameColorOpacity: 100,
  dialogueColorOpacity: 100,
  boxColorOpacity: 100,
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
  const nameColorOpacity = getClampedFinishValue(config?.nameColorOpacity);
  const dialogueColorOpacity = getClampedFinishValue(config?.dialogueColorOpacity);
  const boxColorOpacity = getClampedFinishValue(config?.boxColorOpacity);
  const tintIntensity = getClampedFinishValue(config?.tintIntensity);
  const glowIntensity = getClampedFinishValue(config?.glowIntensity);
  const contrastIntensity = getClampedFinishValue(config?.contrastIntensity);

  return {
    mode: normalizeTrackerCardColorMode(config?.mode),
    ...(config?.nameColor ? { nameColor: config.nameColor } : {}),
    ...(nameColorOpacity !== undefined && { nameColorOpacity }),
    ...(config?.dialogueColor ? { dialogueColor: config.dialogueColor } : {}),
    ...(dialogueColorOpacity !== undefined && { dialogueColorOpacity }),
    ...(config?.boxColor ? { boxColor: config.boxColor } : {}),
    ...(boxColorOpacity !== undefined && { boxColorOpacity }),
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
    nameColorOpacity: getClampedFinishValue(record.nameColorOpacity),
    dialogueColor: getString(record.dialogueColor),
    dialogueColorOpacity: getClampedFinishValue(record.dialogueColorOpacity),
    boxColor: getString(record.boxColor),
    boxColorOpacity: getClampedFinishValue(record.boxColorOpacity),
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

export function getTrackerCardPaintOpacity(config: TrackerCardColorConfig | null | undefined): TrackerCardPaintOpacity {
  return {
    nameColorOpacity:
      getClampedFinishValue(config?.nameColorOpacity) ?? TRACKER_CARD_PAINT_OPACITY_DEFAULTS.nameColorOpacity,
    dialogueColorOpacity:
      getClampedFinishValue(config?.dialogueColorOpacity) ?? TRACKER_CARD_PAINT_OPACITY_DEFAULTS.dialogueColorOpacity,
    boxColorOpacity:
      getClampedFinishValue(config?.boxColorOpacity) ?? TRACKER_CARD_PAINT_OPACITY_DEFAULTS.boxColorOpacity,
  };
}

function getMix(value: number, scale: number, max: number) {
  return Math.min(max, Math.round(value * scale));
}

function getRange(base: number, value: number, scale: number, max: number) {
  return Math.min(max, Math.round(base + value * scale));
}

function getOpacity(base: number, value: number, scale: number, max: number) {
  return Math.min(max, base + value * scale).toFixed(3);
}

export function getTrackerCardSkinFinish(finish: TrackerCardFinish): TrackerCardSkinFinish {
  const tint = finish.tintIntensity;
  const glow = finish.glowIntensity;
  const contrast = finish.contrastIntensity;

  return {
    accentPanelMix: getMix(glow, 0.2, 22),
    borderOpacity: Math.min(86, Math.round(20 + glow * 0.38 + contrast * 0.24)),
    displayOpacity: getOpacity(0.035, tint + glow, 0.00062, 0.18),
    glowMix: getRange(12, glow, 0.42, 56),
    mutedTextMix: getRange(54, contrast, 0.38, 92),
    numberTextMix: getRange(62, contrast, 0.34, 96),
    panelBoxMix: getMix(tint, 0.28, 32),
    panelDisplayMix: getMix(tint, 0.2, 22),
    rowRuleOpacity: Math.min(66, Math.round(10 + contrast * 0.48 + glow * 0.08)),
    softContrastBottom: getRange(14, contrast, 0.48, 70),
    softContrastMid: getRange(9, contrast, 0.38, 56),
    softContrastTop: getRange(12, contrast, 0.44, 64),
    slotBackgroundBottomMix: getRange(52, contrast, 0.42, 94),
    slotBackgroundTopMix: getRange(42, contrast, 0.44, 88),
    slotRuleOpacity: getRange(18, contrast, 0.42, 64),
    slotShadowOpacity: getOpacity(0.18, contrast, 0.0038, 0.58),
    statTrackAccentMix: Math.min(24, Math.round(2 + tint * 0.08 + glow * 0.12)),
    statFillGlowMix: Math.min(32, Math.round(5 + contrast * 0.12 + glow * 0.12)),
    statFillHighlightMix: getRange(8, contrast, 0.18, 28),
    statTrackBackgroundMix: getRange(55, contrast, 0.38, 94),
    statTrackBoxMix: getMix(tint, 0.18, 20),
    statTrackRingOpacity: getRange(8, contrast, 0.3, 42),
    statTrackShadowOpacity: getOpacity(0.18, contrast, 0.004, 0.56),
    strongContrastBottom: getRange(24, contrast, 0.55, 82),
    strongContrastMid: getRange(16, contrast, 0.46, 68),
    strongContrastTop: getRange(20, contrast, 0.52, 76),
    surfaceBoxMix: getMix(tint, 0.3, 34),
    surfaceDisplayMix: getMix(tint, 0.26, 30),
    textMix: getRange(74, contrast, 0.26, 98),
    tintOpacity: getOpacity(0.03, tint, 0.0014, 0.2),
  };
}
