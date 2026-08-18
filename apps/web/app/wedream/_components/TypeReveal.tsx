"use client";

import { useEffect, useRef, useState } from "react";

interface TypeRevealProps {
  text: string;
  className?: string;
  letterStepMs?: number;
}

export default function TypeReveal({ text, className = "", letterStepMs = 38 }: TypeRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || !window.IntersectionObserver) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio > 0.35) {
          setIsVisible(true);
        }
      },
      { threshold: [0, 0.35, 0.6] }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={ref} className={className} aria-label={text}>
      {text.split("").map((char, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="inline-block"
          style={{
            opacity: isVisible ? undefined : 0,
            animation: isVisible ? `word-in 0.4s ease ${i * letterStepMs}ms forwards` : "none",
          }}
        >
          {char === " " ? " " : char}
        </span>
      ))}
    </span>
  );
}
