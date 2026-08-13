"use client";



import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import {

  getEffectiveAspectRatio,

  isQuarterTurn,

  rotationTransform,

} from "@/lib/display-rotation";



type RotatedContainImageLayout = "intrinsic" | "fill";



/** Placeholder ratio so rotated wrappers never collapse to 0 height before onLoad. */

const FALLBACK_ASPECT_RATIO = 4 / 3;



interface RotatedContainImageProps {

  src: string;

  alt: string;

  rotation?: number | null;

  layout?: RotatedContainImageLayout;

  className?: string;

  imgClassName?: string;

  onLoad?: () => void;

  onError?: () => void;

}



function rotatedImageStyle(rotation: number): CSSProperties {

  const quarter = isQuarterTurn(rotation);

  const transform = rotationTransform(rotation);



  return {

    position: "absolute",

    left: "50%",

    top: "50%",

    transform: `translate(-50%, -50%) ${transform ?? ""}`.trim(),

    maxWidth: "none",

    maxHeight: "none",

    ...(quarter ? { height: "100%", width: "auto" } : { width: "100%", height: "auto" }),

  };

}



function readNaturalSize(img: HTMLImageElement | null): { w: number; h: number } | null {

  if (!img || !img.complete || img.naturalWidth <= 0) return null;

  return { w: img.naturalWidth, h: img.naturalHeight };

}



export default function RotatedContainImage({

  src,

  alt,

  rotation = 0,

  layout = "intrinsic",

  className = "",

  imgClassName = "",

  onLoad,

  onError,

}: RotatedContainImageProps) {

  const imgRef = useRef<HTMLImageElement>(null);

  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);



  const syncNaturalFromImg = useCallback(() => {

    const size = readNaturalSize(imgRef.current);

    if (size) setNatural(size);

  }, []);



  useEffect(() => {

    setNatural(null);

  }, [src, rotation]);



  useEffect(() => {

    syncNaturalFromImg();

  }, [src, rotation, syncNaturalFromImg]);



  const handleLoad = useCallback(

    (event: React.SyntheticEvent<HTMLImageElement>) => {

      const img = event.currentTarget;

      setNatural({ w: img.naturalWidth, h: img.naturalHeight });

      onLoad?.();

    },

    [onLoad]

  );



  const handleImageRef = useCallback(

    (node: HTMLImageElement | null) => {

      imgRef.current = node;

      const size = readNaturalSize(node);

      if (size) setNatural(size);

    },

    []

  );



  if (!rotation) {

    if (layout === "fill") {

      return (

        // eslint-disable-next-line @next/next/no-img-element

        <img

          src={src}

          alt={alt}

          className={`h-full w-full object-contain ${imgClassName}`.trim()}

          onLoad={onLoad}

          onError={onError}

        />

      );

    }



    return (

      // eslint-disable-next-line @next/next/no-img-element

      <img

        src={src}

        alt={alt}

        className={`h-auto w-full object-contain ${imgClassName}`.trim()}

        onLoad={onLoad}

        onError={onError}

      />

    );

  }



  const aspectRatio = natural

    ? getEffectiveAspectRatio(natural.w, natural.h, rotation)

    : FALLBACK_ASPECT_RATIO;



  const wrapperClass =

    layout === "fill"

      ? `relative h-full w-full overflow-hidden ${className}`.trim()

      : `relative w-full overflow-hidden ${className}`.trim();



  return (

    <div

      className={wrapperClass}

      style={layout === "intrinsic" ? { aspectRatio } : undefined}

    >

      {/* eslint-disable-next-line @next/next/no-img-element */}

      <img

        ref={handleImageRef}

        src={src}

        alt={alt}

        className={imgClassName}

        style={rotatedImageStyle(rotation)}

        onLoad={handleLoad}

        onError={onError}

      />

    </div>

  );

}


