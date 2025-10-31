"use client";

import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { cn } from "@/lib/utils";
import TextSearchInput from "@/components/ui/search/TextSearchInput";
import { useDebounceEffect } from "ahooks";

interface Props {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  minHeight?: number;
  onSearch?: (show: boolean) => void;
}

export default function LineNumberedTextarea({
  value,
  onChange,
  placeholder,
  readOnly,
  className,
  minHeight = 200,
  onSearch,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const selectionRef = useRef<{ start: number; end: number } | null>(null);
  const LINE_HEIGHT = 22; // px, keep gutter and textarea perfectly aligned

  const [showTextSearch, setShowTextSearch] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [matches, setMatches] = useState<[number, number][]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number | null>(null);

  const lines = useMemo(() => value.replace(/\r\n/g, "\n").split("\n"), [value]);
  const gutterWidth = useMemo(() => {
    const digits = Math.max(1, Math.floor(Math.log10(lines.length)) + 1);
    return 8 + digits * 8 + 12; // 8px for left padding, 8px per digit, 12px for right padding (pr-3 -> 12px)
  }, [lines.length]);

  // Restore cursor position after value changes, but before browser paint
  useLayoutEffect(() => {
    if (textareaRef.current && selectionRef.current) {
      console.log("useLayoutEffect: Restoring cursor to", selectionRef.current);
      textareaRef.current.selectionStart = selectionRef.current.start;
      textareaRef.current.selectionEnd = selectionRef.current.end;
      selectionRef.current = null; // Clear after use
    }
  }, [value]);

  useDebounceEffect(() => {
    if (!showTextSearch) {
      setMatches([]);
      setCurrentMatchIndex(null);
      // No longer reset cursor here, as it interferes with normal typing.
      // Cursor reset for search should be handled by TextSearchInput or specific search actions.
      return;
    }

    if (!searchText) {
      setMatches([]);
      setCurrentMatchIndex(null);
      return;
    }

    const newMatches: [number, number][] = [];
    let lastIndex = 0;
    while (lastIndex !== -1) {
      lastIndex = value.indexOf(searchText, lastIndex);
      if (lastIndex !== -1) {
        newMatches.push([lastIndex, lastIndex + searchText.length]);
        lastIndex += searchText.length;
      }
    }
    setMatches(newMatches);
    setCurrentMatchIndex(newMatches.length > 0 ? 0 : null);
  }, [searchText, value, showTextSearch], { wait: 300 });

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta || currentMatchIndex === null || matches.length === 0) return;

    const [start, end] = matches[currentMatchIndex];
    // Remove focus and selection here to avoid stealing focus from search input
    // ta.focus();
    // ta.setSelectionRange(start, end);

    // Scroll into view
    const lineStart = value.substring(0, start).split("\n").length - 1;
    const lineEnd = value.substring(0, end).split("\n").length - 1;
    const charHeight = LINE_HEIGHT;
    const containerHeight = ta.clientHeight;
    const scrollTop = ta.scrollTop;

    const targetScrollTop = lineStart * charHeight;

    if (targetScrollTop < scrollTop || targetScrollTop + charHeight > scrollTop + containerHeight) {
      ta.scrollTop = targetScrollTop;
    }
  }, [currentMatchIndex, matches, value]);

  const handleNavigate = (direction: "next" | "prev") => {
    if (matches.length === 0) return;

    if (direction === "next") {
      setCurrentMatchIndex((prev) => (prev === null || prev === matches.length - 1 ? 0 : prev + 1));
    } else {
      setCurrentMatchIndex((prev) => (prev === null || prev === 0 ? matches.length - 1 : prev - 1));
    }
  };

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
    <div className={cn("relative w-full h-full flex", className)} style={{ minHeight }}>
      <div
        ref={gutterRef}
        className="select-none text-muted-foreground bg-muted/40 border-r border-border overflow-hidden text-xs font-mono flex flex-col items-end pr-3 custom-scrollbar"
        style={{ width: `${gutterWidth}px` }}
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
        onChange={(e) => {
          // Save cursor position before onChange updates value and potentially rerenders
          selectionRef.current = { start: e.target.selectionStart, end: e.target.selectionEnd };
          onChange?.(e.target.value);
          console.log("onChange: Saved cursor to", selectionRef.current);
        }}
        onPaste={(e) => {
          // This is a native paste event, let parent handle value update
          // After native paste, reset cursor to 0
          setTimeout(() => {
            const el = textareaRef.current;
            if (!el) return;
            try {
              el.selectionStart = el.selectionEnd = 0;
            } catch (e) { /* noop */ }
            el.scrollTop = 0;
            selectionRef.current = null; // Clear saved position to ensure paste behavior
            console.log("onPaste: Resetting cursor to 0,0 and clearing selectionRef");
          }, 0);
        }}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "f") {
            e.preventDefault();
            setShowTextSearch(true);
            console.log("onKeyDown: Ctrl+F pressed");
          }
        }}
        wrap="off"
        className="flex-1 w-full h-full resize-none bg-transparent outline-none border-0 text-sm font-mono px-3 whitespace-pre overflow-auto text-[var(--hl-string)] custom-scrollbar"
        style={{ minHeight, lineHeight: `${LINE_HEIGHT}px` }}
      />
      <div className={cn("absolute bottom-2 right-2 z-10", !showTextSearch && "hidden")}>
          <TextSearchInput
            value={value}
            onClose={() => setShowTextSearch(false)}
            onSearchChange={setSearchText}
            onNavigate={handleNavigate}
            currentMatchIndex={currentMatchIndex}
            totalMatches={matches.length}
            visible={showTextSearch}
          />
        </div>
    </div>
  );
}


