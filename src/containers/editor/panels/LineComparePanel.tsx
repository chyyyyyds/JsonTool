"use client";

import { useMemo, useState } from "react";
import { Container, ContainerContent, ContainerHeader } from "@/components/Container";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
// Use native textarea with styling; no custom Textarea component exists in ui/
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { cn } from "@/lib/utils";

function computeSets(a: string, b: string) {
  const left = a.replace(/\r\n/g, "\n").split("\n");
  const right = b.replace(/\r\n/g, "\n").split("\n");
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
  const [leftEditing, setLeftEditing] = useState(false);
  const [rightEditing, setRightEditing] = useState(false);
  const leftLines = useMemo(() => leftText.replace(/\r\n/g, "\n").split("\n"), [leftText]);
  const rightLines = useMemo(() => rightText.replace(/\r\n/g, "\n").split("\n"), [rightText]);

  const { onlyLeft, onlyRight, both } = useMemo(() => computeSets(leftText, rightText), [leftText, rightText]);

  return (
    <ResizablePanelGroup direction="horizontal" className="flex-grow">
      <ResizablePanel defaultSize={20} minSize={10}>
        <Container>
          <ContainerHeader>
            <div className="flex items-center gap-2">
              <span>{t("left_input")}</span>
              <Button
                title={t("Copy")}
                variant="icon-outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(leftText)}
              >
                <Copy className="icon" />
              </Button>
            </div>
          </ContainerHeader>
          <ContainerContent>
            {leftEditing ? (
              <textarea
                value={leftText}
                onChange={(e) => setLeftText(e.target.value)}
                wrap="off"
                onBlur={() => setLeftEditing(false)}
                autoFocus
                className="h-full w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-hl-string shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring whitespace-pre overflow-auto"
                placeholder={t("left_input") as string}
              />
            ) : (
              <div
                className="h-full overflow-auto space-y-1"
                onClick={() => setLeftEditing(true)}
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
                  <div key={idx} className="flex items-center gap-1">
                    <div className={cn("flex-1 min-w-0 text-sm text-hl-string", "truncate whitespace-nowrap overflow-hidden")}>{line}</div>
                    <Button
                      title={t("Copy")}
                      variant="icon-outline"
                      size="xs"
                      className="h-5 w-5 p-0"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        navigator.clipboard.writeText(line);
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
              <Button
                title={t("Copy")}
                variant="icon-outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(rightText)}
              >
                <Copy className="icon" />
              </Button>
            </div>
          </ContainerHeader>
          <ContainerContent>
            {rightEditing ? (
              <textarea
                value={rightText}
                onChange={(e) => setRightText(e.target.value)}
                wrap="off"
                onBlur={() => setRightEditing(false)}
                autoFocus
                className="h-full w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-hl-string shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring whitespace-pre overflow-auto"
                placeholder={t("right_input") as string}
              />
            ) : (
              <div
                className="h-full overflow-auto space-y-1"
                onClick={() => setRightEditing(true)}
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
                  <div key={idx} className="flex items-center gap-1">
                    <div className={cn("flex-1 min-w-0 text-sm text-hl-string", "truncate whitespace-nowrap overflow-hidden")}>{line}</div>
                    <Button
                      title={t("Copy")}
                      variant="icon-outline"
                      size="xs"
                      className="h-5 w-5 p-0"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        navigator.clipboard.writeText(line);
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
                onClick={() => navigator.clipboard.writeText(onlyLeft.join("\n"))}
              >
                <Copy className="icon" />
              </Button>
            </div>
          </ContainerHeader>
          <ContainerContent>
            <div className="h-full overflow-auto">
              {onlyLeft.map((line) => (
                <div key={line} className="flex items-center gap-1 py-0.5 leading-5">
                  <div className={cn("flex-1 min-w-0 text-sm text-hl-string", "truncate whitespace-nowrap")}>{line}</div>
                  <Button
                    title={t("Copy")}
                    variant="icon-outline"
                    size="xs"
                    className="h-5 w-5 p-0"
                    onClick={() => navigator.clipboard.writeText(line)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
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
                onClick={() => navigator.clipboard.writeText(onlyRight.join("\n"))}
              >
                <Copy className="icon" />
              </Button>
            </div>
          </ContainerHeader>
          <ContainerContent>
            <div className="h-full overflow-auto">
              {onlyRight.map((line) => (
                <div key={line} className="flex items-center gap-1 py-0.5 leading-5">
                  <div className={cn("flex-1 min-w-0 text-sm text-hl-string", "truncate whitespace-nowrap")}>{line}</div>
                  <Button
                    title={t("Copy")}
                    variant="icon-outline"
                    size="xs"
                    className="h-5 w-5 p-0"
                    onClick={() => navigator.clipboard.writeText(line)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
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
                onClick={() => navigator.clipboard.writeText(both.join("\n"))}
              >
                <Copy className="icon" />
              </Button>
            </div>
          </ContainerHeader>
          <ContainerContent>
            <div className="h-full overflow-auto">
              {both.map((line) => (
                <div key={line} className="flex items-center gap-1 py-0.5 leading-5">
                  <div className={cn("flex-1 min-w-0 text-sm text-hl-string", "truncate whitespace-nowrap")}>{line}</div>
                  <Button
                    title={t("Copy")}
                    variant="icon-outline"
                    size="xs"
                    className="h-5 w-5 p-0"
                    onClick={() => navigator.clipboard.writeText(line)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ContainerContent>
        </Container>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}


