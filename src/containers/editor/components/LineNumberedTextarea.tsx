"use client";

import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  minHeight?: number;
}

export default function LineNumberedTextarea({
  value,
  onChange,
  placeholder,
  readOnly,
  className,
  minHeight = 200,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const LINE_HEIGHT = 22; // px, keep gutter and textarea perfectly aligned

  const lines = useMemo(() => value.replace(/\r\n/g, "\n").split("\n"), [value]);

  useEffect(() => {
    const ta = textareaRef.current;
    const gut = gutterRef.current;
    if (!ta || !gut) return;
    const onScroll = () => {
      gut.scrollTop = ta.scrollTop;
    };
    ta.addEventListener("scroll", onScroll);
    return () => ta.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={cn("w-full h-full flex", className)} style={{ minHeight }}>
      <div
        ref={gutterRef}
        className="w-12 select-none text-muted-foreground bg-muted/40 border-r border-border overflow-hidden text-xs font-mono flex flex-col items-end pr-3"
      >
        {lines.map((_, i) => (
          <div key={i} style={{ height: LINE_HEIGHT, lineHeight: `${LINE_HEIGHT}px` }}>{i + 1}</div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        wrap="off"
        className="flex-1 w-full h-full resize-none bg-transparent outline-none border-0 text-sm font-mono px-3 whitespace-pre overflow-auto"
        style={{ minHeight, lineHeight: `${LINE_HEIGHT}px` }}
      />
    </div>
  );
}


