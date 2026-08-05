/** Allowed display rotations from Google Sheet (degrees, clockwise). */
export type DisplayRotation = 0 | 90 | 180 | 270;

const ROTATION_KEYS = [
  "顯示旋轉",
  "旋轉角度",
  "顯示旋轉角度",
  "旋轉",
  "displayRotation",
  "Display Rotation",
  "rotation",
];

export function getDisplayRotationColumnKeys(): string[] {
  return ROTATION_KEYS;
}

export function parseDisplayRotation(raw: string | undefined | null): DisplayRotation {
  if (!raw?.trim()) return 0;
  const cleaned = raw.trim().replace(/[°度\s]/g, "");
  const value = Number.parseInt(cleaned, 10);
  if (!Number.isFinite(value)) return 0;

  const normalized = ((value % 360) + 360) % 360;
  if (normalized === 90 || normalized === 180 || normalized === 270) {
    return normalized;
  }
  return 0;
}

export function rotationTransform(
  degrees?: DisplayRotation | number | null
): string | undefined {
  if (!degrees) return undefined;
  return `rotate(${degrees}deg)`;
}

export function isQuarterTurn(degrees?: DisplayRotation | number | null): boolean {
  return degrees === 90 || degrees === 270;
}

/** Natural dimensions after applying display rotation (clockwise). */
export function getEffectiveNaturalDimensions(
  naturalWidth: number,
  naturalHeight: number,
  rotation?: DisplayRotation | number | null
): { width: number; height: number } {
  if (isQuarterTurn(rotation)) {
    return { width: naturalHeight, height: naturalWidth };
  }
  return { width: naturalWidth, height: naturalHeight };
}

/** CSS aspect-ratio value (width / height) after rotation. */
export function getEffectiveAspectRatio(
  naturalWidth: number,
  naturalHeight: number,
  rotation?: DisplayRotation | number | null
): number {
  const { width, height } = getEffectiveNaturalDimensions(
    naturalWidth,
    naturalHeight,
    rotation
  );
  return width / height;
}
