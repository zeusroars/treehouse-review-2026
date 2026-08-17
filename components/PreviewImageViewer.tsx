"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { computeContainedLayout } from "@/lib/preview-image-layout";

const MIN_ZOOM = 70;
const MAX_ZOOM = 200;
const ZOOM_STEP = 5;

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
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
  onError?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<ReturnType<typeof computeContainedLayout>>(null);

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

interface PreviewImageViewerProps {
  src: string;
  alt: string;
  rotation?: number;
  className?: string;
  viewportClassName?: string;
  showZoomControls?: boolean;
  overlay?: ReactNode;
  cornerOverlay?: ReactNode;
  onImageError?: () => void;
}

export default function PreviewImageViewer({
  src,
  alt,
  rotation = 0,
  className = "",
  viewportClassName = "h-[50vh] min-h-[20rem]",
  showZoomControls = true,
  overlay,
  cornerOverlay,
  onImageError,
}: PreviewImageViewerProps) {
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

  useEffect(() => {
    setImageFailed(false);
    setZoom(100);
    setPan({ x: 0, y: 0 });
  }, [src, rotation]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || imageFailed) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta =
        event.deltaY < 0 ? ZOOM_STEP : event.deltaY > 0 ? -ZOOM_STEP : 0;
      if (delta === 0) return;
      setZoom((current) => clampZoom(current + delta));
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [imageFailed]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || imageFailed) return;
    if (
      (event.target as HTMLElement).closest(
        "button, a, input, textarea, select, [data-no-drag]"
      )
    ) {
      return;
    }
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

  const handleImageError = () => {
    setImageFailed(true);
    onImageError?.();
  };

  return (
    <div className={`relative flex h-full min-h-0 flex-col ${className}`.trim()}>
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl opacity-30">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-sage-700/20 blur-3xl" />
        <div className="absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-wood-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div
          ref={viewportRef}
          className={`relative min-h-0 flex-1 touch-none select-none overflow-hidden rounded-2xl shadow-2xl shadow-black/40 ring-1 ring-white/10 ${viewportClassName} ${
            imageFailed ? "cursor-default" : isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div
            className="absolute inset-0 bg-slate-950"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.15s ease-out",
            }}
          >
            {imageFailed ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-white/50">
                <p className="text-sm">{t("preview.imageLoadFailed")}</p>
                <p className="text-xs text-white/30">
                  {t("preview.drivePermissionHint")}
                </p>
              </div>
            ) : (
              <PreviewImageWithFrost
                src={src}
                alt={alt}
                rotation={rotation}
                onError={handleImageError}
              />
            )}
          </div>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          {overlay ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0">
              {overlay}
            </div>
          ) : null}
          {cornerOverlay ? (
            <div className="pointer-events-none absolute inset-0 z-20">
              {cornerOverlay}
            </div>
          ) : null}
          {showZoomControls ? (
            <div className="pointer-events-auto absolute bottom-3 left-1/2 z-20 -translate-x-1/2">
              <div className="flex items-center gap-1 rounded-2xl bg-white/10 p-1.5 backdrop-blur-md ring-1 ring-white/10">
                <button
                  type="button"
                  onClick={() => setZoom((value) => clampZoom(value - ZOOM_STEP))}
                  disabled={zoom <= MIN_ZOOM || imageFailed}
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
                  onClick={() => setZoom((value) => clampZoom(value + ZOOM_STEP))}
                  disabled={zoom >= MAX_ZOOM || imageFailed}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white disabled:opacity-30"
                  aria-label={t("preview.zoomIn")}
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
