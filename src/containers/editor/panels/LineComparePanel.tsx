"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Container, ContainerContent, ContainerHeader } from "@/components/Container";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
// Use native textarea with styling; no custom Textarea component exists in ui/
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import LineNumberedTextarea from "@/containers/editor/components/LineNumberedTextarea";
import { Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { toastSucc } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Toggle } from "@/components/ui/toggle";

function computeSets(a: string, b: string, ignoreLeftWhitespace: boolean, ignoreRightWhitespace: boolean) {
  const left = a.replace(/\r\n/g, "\n").split("\n").map(s => ignoreLeftWhitespace ? s.trim() : s);
  const right = b.replace(/\r\n/g, "\n").split("\n").map(s => ignoreRightWhitespace ? s.trim() : s);
  const leftSet = new Set(left.filter((s) => s.length > 0));
  const rightSet = new Set(right.filter((s) => s.length > 0));
  const onlyLeft: string[] = [];
  const onlyRight: string[] = [];
  const both: string[] = [];

  leftSet.forEach((s) => {
    if (rightSet.has(s)) both.push(s);
    else onlyLeft.push(s);
  });
  rightSet.forEach((s) => {
    if (!leftSet.has(s)) onlyRight.push(s);
  });
  return { onlyLeft, onlyRight, both };
}


export default function LineComparePanel() {
  const t = useTranslations();
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [ignoreLeftWhitespace, setIgnoreLeftWhitespace] = useState(true);
  const [ignoreRightWhitespace, setIgnoreRightWhitespace] = useState(true);
  const [leftEditing, setLeftEditing] = useState(false);
  const [rightEditing, setRightEditing] = useState(false);
  const leftTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const rightTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [pendingFocus, setPendingFocus] = useState<{
    side: "left" | "right";
    lineIndex: number | null;
    offsetX?: number; // click x relative to text start in px
  } | null>(null);

  function getCharIndexByX(ctx: CanvasRenderingContext2D, text: string, x: number): number {
    if (x <= 0) return 0;
    let lo = 0;
    let hi = text.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      const w = ctx.measureText(text.slice(0, mid + 1)).width;
      if (w < x) lo = mid + 1; else hi = mid;
    }
    return lo;
  }
  const leftLines = useMemo(() => leftText.replace(/\r\n/g, "\n").split("\n"), [leftText]);
  const rightLines = useMemo(() => rightText.replace(/\r\n/g, "\n").split("\n"), [rightText]);

  const { onlyLeft, onlyRight, both } = useMemo(() => computeSets(leftText, rightText, ignoreLeftWhitespace, ignoreRightWhitespace), [leftText, rightText, ignoreLeftWhitespace, ignoreRightWhitespace]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toastSucc(t("Copied"));
    } catch (err) {
      console.error("Failed to copy:", err);
      // 降级方案：使用传统的 document.execCommand
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        toastSucc(t("Copied"));
      } catch (fallbackErr) {
        console.error("Fallback copy failed:", fallbackErr);
      }
    }
  };

  useEffect(() => {
    // When entering edit mode, move caret to requested position
    if (leftEditing && pendingFocus?.side === "left") {
      const ta = leftTextareaRef.current;
      if (ta) {
        const targetPos = (() => {
          if (pendingFocus.lineIndex === null) return leftText.length;
          const idx = Math.min(pendingFocus.lineIndex, leftLines.length - 1);
          const prefix = leftLines.slice(0, idx).join("\n");
          const prefixLen = prefix.length + (idx > 0 ? 1 : 0);
          if (pendingFocus.offsetX == null) {
            return prefixLen + leftLines[idx].length;
          }
          const cs = getComputedStyle(ta);
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) return prefixLen + leftLines[idx].length;
          ctx.font = `${cs.fontStyle} ${cs.fontVariant} ${cs.fontWeight} ${cs.fontSize} / ${cs.lineHeight} ${cs.fontFamily}`;
          const charIdx = getCharIndexByX(ctx, leftLines[idx], pendingFocus.offsetX);
          return prefixLen + charIdx;
        })();
        requestAnimationFrame(() => {
          ta.focus();
          try {
            ta.setSelectionRange(targetPos, targetPos);
          } catch {
            // 忽略设置光标位置时的错误
          }
        });
      }
      setPendingFocus(null);
    }
  }, [leftEditing]);

  useEffect(() => {
    if (rightEditing && pendingFocus?.side === "right") {
      const ta = rightTextareaRef.current;
      if (ta) {
        const targetPos = (() => {
          if (pendingFocus.lineIndex === null) return rightText.length;
          const idx = Math.min(pendingFocus.lineIndex, rightLines.length - 1);
          const prefix = rightLines.slice(0, idx).join("\n");
          const prefixLen = prefix.length + (idx > 0 ? 1 : 0);
          if (pendingFocus.offsetX == null) {
            return prefixLen + rightLines[idx].length;
          }
          const cs = getComputedStyle(ta);
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) return prefixLen + rightLines[idx].length;
          ctx.font = `${cs.fontStyle} ${cs.fontVariant} ${cs.fontWeight} ${cs.fontSize} / ${cs.lineHeight} ${cs.fontFamily}`;
          const charIdx = getCharIndexByX(ctx, rightLines[idx], pendingFocus.offsetX);
          return prefixLen + charIdx;
        })();
        requestAnimationFrame(() => {
          ta.focus();
          try {
            ta.setSelectionRange(targetPos, targetPos);
          } catch {
            // 忽略设置光标位置时的错误
          }
        });
      }
      setPendingFocus(null);
    }
  }, [rightEditing]);

  return (
    <ResizablePanelGroup direction="horizontal" className="flex-grow">
      <ResizablePanel defaultSize={20} minSize={10}>
        <Container>
          <ContainerHeader>
            <div className="flex items-center gap-2">
              <span>{t("left_input")}</span>
              <div className="flex items-center gap-1 ml-auto">
                <Toggle
                  pressed={ignoreLeftWhitespace}
                  onPressedChange={setIgnoreLeftWhitespace}
                  className="h-6 px-2 text-xs data-[state=on]:bg-blue-500 data-[state=on]:text-white data-[state=on]:hover:bg-blue-600 data-[state=on]:hover:text-white"
                >
                  {"忽略空格"}
                </Toggle>
              </div>
              <Button
                title={t("Copy")}
                variant="icon-outline"
                size="sm"
                onClick={() => copyToClipboard(leftText)}
              >
                <Copy className="icon" />
              </Button>
            </div>
          </ContainerHeader>
          <ContainerContent>
            {leftEditing ? (
              <LineNumberedTextarea
                value={leftText}
                onChange={(v) => setLeftText(v)}
                placeholder={t("left_input") as string}
              />
            ) : (
              <div
                className="h-full overflow-auto space-y-1"
                onClick={(e) => {
                  // click on blank area -> go end
                  setPendingFocus({ side: "left", lineIndex: null });
                  setLeftEditing(true);
                }}
                onPaste={(e) => {
                  const text = e.clipboardData.getData("text");
                  if (text) {
                    e.preventDefault();
                    const appended = text.replace(/\r\n/g, "\n").split("\n");
                    const next = leftLines.concat(appended);
                    setLeftText(next.join("\n"));
                  }
                }}
              >
                {leftLines.map((line, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      const rect = (ev.currentTarget.firstChild as HTMLElement)?.getBoundingClientRect();
                      const clickX = rect ? ev.clientX - rect.left : undefined;
                      setPendingFocus({ side: "left", lineIndex: idx, offsetX: clickX });
                      setLeftEditing(true);
                    }}
                  >
                    <div className={cn("flex-1 min-w-0 text-sm", "truncate whitespace-nowrap overflow-hidden")}>{line}</div>
                    <Button
                      title={t("Copy")}
                      variant="icon-outline"
                      size="xs"
                      className="h-5 w-5 p-0"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        copyToClipboard(line);
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ContainerContent>
        </Container>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={20} minSize={10}>
        <Container>
          <ContainerHeader>
            <div className="flex items-center gap-2">
              <span>{t("right_input")}</span>
              <div className="flex items-center gap-1 ml-auto">
                <Toggle
                  pressed={ignoreRightWhitespace}
                  onPressedChange={setIgnoreRightWhitespace}
                  className="h-6 px-2 text-xs data-[state=on]:bg-blue-500 data-[state=on]:text-white data-[state=on]:hover:bg-blue-600 data-[state=on]:hover:text-white"
                >
                  {"忽略空格"}
                </Toggle>
              </div>
              <Button
                title={t("Copy")}
                variant="icon-outline"
                size="sm"
                onClick={() => copyToClipboard(rightText)}
              >
                <Copy className="icon" />
              </Button>
            </div>
          </ContainerHeader>
          <ContainerContent>
            {rightEditing ? (
              <LineNumberedTextarea
                value={rightText}
                onChange={(v) => setRightText(v)}
                placeholder={t("right_input") as string}
              />
            ) : (
              <div
                className="h-full overflow-auto space-y-1"
                onClick={() => {
                  setPendingFocus({ side: "right", lineIndex: null });
                  setRightEditing(true);
                }}
                onPaste={(e) => {
                  const text = e.clipboardData.getData("text");
                  if (text) {
                    e.preventDefault();
                    const appended = text.replace(/\r\n/g, "\n").split("\n");
                    const next = rightLines.concat(appended);
                    setRightText(next.join("\n"));
                  }
                }}
              >
                {rightLines.map((line, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      const rect = (ev.currentTarget.firstChild as HTMLElement)?.getBoundingClientRect();
                      const clickX = rect ? ev.clientX - rect.left : undefined;
                      setPendingFocus({ side: "right", lineIndex: idx, offsetX: clickX });
                      setRightEditing(true);
                    }}
                  >
                    <div className={cn("flex-1 min-w-0 text-sm", "truncate whitespace-nowrap overflow-hidden")}>{line}</div>
                    <Button
                      title={t("Copy")}
                      variant="icon-outline"
                      size="xs"
                      className="h-5 w-5 p-0"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        copyToClipboard(line);
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ContainerContent>
        </Container>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={20} minSize={10}>
        <Container>
          <ContainerHeader>
            <div className="flex items-center gap-2">
              <span>{t("only_in_left")}</span>
              <Button
                title={t("Copy")}
                variant="icon-outline"
                size="sm"
                onClick={() => copyToClipboard(onlyLeft.join("\n"))}
              >
                <Copy className="icon" />
              </Button>
            </div>
          </ContainerHeader>
          <ContainerContent>
            <LineNumberedTextarea value={onlyLeft.join("\n")} readOnly />
          </ContainerContent>
        </Container>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={20} minSize={10}>
        <Container>
          <ContainerHeader>
            <div className="flex items-center gap-2">
              <span>{t("only_in_right")}</span>
              <Button
                title={t("Copy")}
                variant="icon-outline"
                size="sm"
                onClick={() => copyToClipboard(onlyRight.join("\n"))}
              >
                <Copy className="icon" />
              </Button>
            </div>
          </ContainerHeader>
          <ContainerContent>
            <LineNumberedTextarea value={onlyRight.join("\n")} readOnly />
          </ContainerContent>
        </Container>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={20} minSize={10}>
        <Container>
          <ContainerHeader>
            <div className="flex items-center gap-2">
              <span>{t("in_both")}</span>
              <Button
                title={t("Copy")}
                variant="icon-outline"
                size="sm"
                onClick={() => copyToClipboard(both.join("\n"))}
              >
                <Copy className="icon" />
              </Button>
            </div>
          </ContainerHeader>
          <ContainerContent>
            <LineNumberedTextarea value={both.join("\n")} readOnly />
          </ContainerContent>
        </Container>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}


