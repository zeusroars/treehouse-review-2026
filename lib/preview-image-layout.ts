import { getEffectiveNaturalDimensions } from "@/lib/display-rotation";

export type ImageOrientation = "portrait" | "landscape";

export interface ContainedImageLayout {
  orientation: ImageOrientation;
  offsetLeft: number;
  offsetTop: number;
  displayWidth: number;
  displayHeight: number;
  imgWidth: number;
  imgHeight: number;
  overlay: { left: number; top: number; width: number; height: number };
}

export function computeContainedLayout(
  containerWidth: number,
  containerHeight: number,
  naturalWidth: number,
  naturalHeight: number,
  rotation = 0
): ContainedImageLayout | null {
  if (
    containerWidth <= 0 ||
    containerHeight <= 0 ||
    naturalWidth <= 0 ||
    naturalHeight <= 0
  ) {
    return null;
  }

  const effective = getEffectiveNaturalDimensions(
    naturalWidth,
    naturalHeight,
    rotation
  );

  const scale = Math.min(
    containerWidth / effective.width,
    containerHeight / effective.height
  );
  const displayWidth = effective.width * scale;
  const displayHeight = effective.height * scale;
  const offsetLeft = (containerWidth - displayWidth) / 2;
  const offsetTop = (containerHeight - displayHeight) / 2;
  const imgWidth = naturalWidth * scale;
  const imgHeight = naturalHeight * scale;
  const portrait = effective.height > effective.width;

  if (portrait) {
    const frostHeight = displayHeight / 5;
    return {
      orientation: "portrait",
      offsetLeft,
      offsetTop,
      displayWidth,
      displayHeight,
      imgWidth,
      imgHeight,
      overlay: {
        left: offsetLeft,
        top: offsetTop + displayHeight - frostHeight,
        width: displayWidth,
        height: frostHeight,
      },
    };
  }

  const frostWidth = displayWidth / 5;
  return {
    orientation: "landscape",
    offsetLeft,
    offsetTop,
    displayWidth,
    displayHeight,
    imgWidth,
    imgHeight,
    overlay: {
      left: offsetLeft + displayWidth - frostWidth,
      top: offsetTop,
      width: frostWidth,
      height: displayHeight,
    },
  };
}
