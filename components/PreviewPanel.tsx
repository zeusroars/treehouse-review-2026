"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { getEffectiveNaturalDimensions } from "@/lib/display-rotation";
import { useLanguage } from "@/contexts/LanguageContext";
import type { PreviewFile } from "@/types/review";

const MIN_ZOOM = 70;
const MAX_ZOOM = 200;
const ZOOM_STEP = 5;

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

type ImageOrientation = "portrait" | "landscape";

interface ContainedImageLayout {
  orientation: ImageOrientation;
  offsetLeft: number;
  offsetTop: number;
  displayWidth: number;
  displayHeight: number;
  imgWidth: number;
  imgHeight: number;
  overlay: { left: number; top: number; width: number; height: number };
}

function computeContainedLayout(
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

function PreviewImageWithFrost({
  src,
  alt,
  rotation = 0,
  onError,
}: {
  src: string;
  alt: string;
  rotation?: number;
  onError: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<ContainedImageLayout | null>(null);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const img = container?.querySelector("img");
    if (!container || !img?.naturalWidth) {
      setLayout(null);
      return;
    }
    setLayout(
      computeContainedLayout(
        container.clientWidth,
        container.clientHeight,
        img.naturalWidth,
        img.naturalHeight,
        rotation
      )
    );
  }, [rotation]);

  useEffect(() => {
    setLayout(null);
  }, [src, rotation]);

  useEffect(() => {
    measure();
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(container);
    return () => ro.disconnect();
  }, [measure, src, rotation]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center bg-slate-950"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={
          layout || rotation
            ? "absolute left-1/2 top-1/2 max-h-none max-w-none"
            : "max-h-full max-w-full object-contain"
        }
        style={
          layout
            ? {
                width: layout.imgWidth,
                height: layout.imgHeight,
                transform: `translate(-50%, -50%)${rotation ? ` rotate(${rotation}deg)` : ""}`,
                transformOrigin: "center center",
              }
            : rotation
              ? {
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                }
              : undefined
        }
        onLoad={measure}
        onError={onError}
      />
      {layout ? (
        <div
          className="preview-image-frost pointer-events-none absolute"
          style={{
            left: layout.overlay.left,
            top: layout.overlay.top,
            width: layout.overlay.width,
            height: layout.overlay.height,
          }}
          aria-hidden
        />
      ) : null}
    </div>
  );
}

interface PreviewPanelProps {
  entryId: string;
  files: PreviewFile[];
  currentPage: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  displayRotation?: number;
}

export default function PreviewPanel({
  entryId,
  files = [],
  currentPage,
  onPageChange,
  loading = false,
  displayRotation = 0,
}: PreviewPanelProps) {
  const { t } = useLanguage();
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    panX: 0,
    panY: 0,
  });
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const totalPages = Math.max(files.length, 1);
  const activeFile = files[currentPage - 1];

  const canInteract = Boolean(activeFile) && !loading;

  const handleZoomIn = () => setZoom((z) => clampZoom(z + ZOOM_STEP));
  const handleZoomOut = () => setZoom((z) => clampZoom(z - ZOOM_STEP));

  useEffect(() => {
    setImageFailed(false);
    setZoom(100);
    setPan({ x: 0, y: 0 });
  }, [activeFile?.previewUrl, entryId, currentPage]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !canInteract) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta =
        event.deltaY < 0 ? ZOOM_STEP : event.deltaY > 0 ? -ZOOM_STEP : 0;
      if (delta === 0) return;
      setZoom((current) => clampZoom(current + delta));
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [canInteract]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !canInteract) return;
    event.preventDefault();
    dragState.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.active || event.pointerId !== dragState.current.pointerId) {
      return;
    }
    setPan({
      x: dragState.current.panX + (event.clientX - dragState.current.startX),
      y: dragState.current.panY + (event.clientY - dragState.current.startY),
    });
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.active || event.pointerId !== dragState.current.pointerId) {
      return;
    }
    dragState.current.active = false;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <section className="relative flex h-full min-h-[50vh] min-w-0 flex-1 flex-col bg-slate-900 lg:min-h-0">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950" />
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-sage-700/20 blur-3xl" />
        <div className="absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-wood-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 items-stretch justify-center px-2 py-2 lg:px-4 lg:py-3">
          <div className="relative flex h-full min-h-0 w-full max-w-5xl">
            <div
              ref={viewportRef}
              className={`relative flex h-full min-h-0 w-full touch-none select-none overflow-hidden rounded-2xl shadow-2xl shadow-black/40 ring-1 ring-white/10 ${
                canInteract
                  ? isDragging
                    ? "cursor-grabbing"
                    : "cursor-grab"
                  : "cursor-default"
              }`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <div
                className="relative h-full w-full bg-slate-950"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
                  transformOrigin: "center center",
                  transition: isDragging ? "none" : "transform 0.15s ease-out",
                }}
              >
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-white/50">
                    {t("preview.loadingFiles")}
                  </div>
                ) : activeFile ? (
                  activeFile.type === "pdf" ? (
                    <iframe
                      title={`${entryId} PDF ${currentPage}`}
                      src={activeFile.previewUrl}
                      className="pointer-events-none absolute inset-0 h-full w-full border-0 bg-slate-900"
                      allow="autoplay"
                    />
                  ) : imageFailed ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-white/50">
                      <p className="text-sm">{t("preview.imageLoadFailed")}</p>
                      <p className="text-xs text-white/30">
                        {t("preview.drivePermissionHint")}
                      </p>
                    </div>
                  ) : (
                    <PreviewImageWithFrost
                      src={activeFile.previewUrl}
                      alt={`${entryId} ${t("preview.imageAlt")}`}
                      rotation={displayRotation}
                      onError={() => setImageFailed(true)}
                    />
                  )
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/50">
                    <p className="text-sm">{t("preview.noFiles")}</p>
                    <p className="text-xs text-white/30">
                      {t("preview.sheetLinkHint")}
                    </p>
                  </div>
                )}
              </div>

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-5 lg:p-8">
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/50">
                  {t("preview.entryIdLabel")}
                </p>
                <p className="mt-1 font-mono text-xl font-light tracking-widest text-white lg:text-3xl">
                  {entryId}
                </p>
                <p className="mt-2 text-sm text-white/40">
                  {t("preview.anonymousReview")}
                  {totalPages > 1 ? ` · ${currentPage} / ${totalPages}` : null}
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-center px-4 pb-3 pt-1">
          <div className="flex items-center gap-1 rounded-2xl bg-white/10 p-1.5 backdrop-blur-md ring-1 ring-white/10">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= MIN_ZOOM || !activeFile}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white disabled:opacity-30"
              aria-label={t("preview.zoomOut")}
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="min-w-[3.5rem] text-center text-xs font-medium text-white/50">
              {zoom}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= MAX_ZOOM || !activeFile}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white disabled:opacity-30"
              aria-label={t("preview.zoomIn")}
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </footer>
      </div>
    </section>
  );
}
