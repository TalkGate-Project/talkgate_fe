"use client";

import { useEffect, useRef } from "react";
import lottie, { AnimationItem } from "lottie-web";
import { ungzip } from "pako";

type Props = {
  src: string; // URL to .tgs (gzipped Lottie JSON)
  width?: number;
  height?: number;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
};

/**
 * Render Telegram .tgs sticker by fetching, gunzipping and playing via lottie-web.
 */
export default function TgsSticker({
  src,
  width = 200,
  height = 200,
  className,
  loop = true,
  autoplay = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    let aborted = false;

    async function load() {
      try {
        const res = await fetch(src, { cache: "force-cache" });
        if (!res.ok) throw new Error(`Failed to fetch tgs: ${res.status}`);
        const buf = await res.arrayBuffer();
        const ungzipped = ungzip(new Uint8Array(buf));
        const jsonString = new TextDecoder("utf-8").decode(ungzipped);
        const animationData = JSON.parse(jsonString);

        if (aborted || !containerRef.current) return;
        // Cleanup previous if any
        animRef.current?.destroy();
        animRef.current = lottie.loadAnimation({
          container: containerRef.current,
          renderer: "svg",
          loop,
          autoplay,
          animationData,
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to render .tgs sticker", e);
      }
    }

    load();
    return () => {
      aborted = true;
      animRef.current?.destroy();
      animRef.current = null;
    };
  }, [src, loop, autoplay]);

  return (
    <div
      ref={containerRef}
      style={{ width, height }}
      className={className}
      aria-label="sticker"
    />
  );
}


