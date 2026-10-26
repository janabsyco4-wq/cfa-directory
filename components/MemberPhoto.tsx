"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { frameStyle, type PhotoFrame } from "@/lib/photoFrame";

interface Props {
  src?: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  frame?: PhotoFrame;
}

export default function MemberPhoto({ src, alt, sizes, priority, className = "", frame }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const watchForError = useCallback((img: HTMLImageElement | null) => {
    if (!img) return;
    const fail = () => setErrored(true);
    // An error before hydration leaves the image complete with no pixels.
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) fail();
    else img.addEventListener("error", fail, { once: true });
  }, []);

  if (!src || errored) {
    return (
      <div className={`absolute inset-0 flex items-center justify-center bg-[#eef2ec] ${className}`}>
        <Image
          src="/logo.avif"
          alt={`${alt} — photo not available`}
          width={96}
          height={96}
          className="w-[34%] max-w-24 h-auto object-contain opacity-80"
        />
      </div>
    );
  }

  return (
    <>
      {!loaded && <div className="absolute inset-0 skeleton" aria-hidden />}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        onLoad={() => setLoaded(true)}
        // Native listener instead of onError: that prop makes next/image re-assign src after
        // hydration, which restarts in-flight priority loads (they never settled in Chrome).
        ref={watchForError}
        style={frameStyle(frame)}
        className={`transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"} ${className}`}
      />
    </>
  );
}
