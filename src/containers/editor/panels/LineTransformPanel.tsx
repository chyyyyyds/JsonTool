"use client";

import { useMemo, useState } from "react";
import { Container, ContainerContent, ContainerHeader } from "@/components/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { RotateCcw, Plus, Copy } from "lucide-react";
import LineNumberedTextarea from "@/containers/editor/components/LineNumberedTextarea";

type Mode = "remove" | "replace";
type Scope = "start" | "center" | "end";
type Occurrence = "first" | "all" | "last";

interface Op {
  id: string;
  mode: Mode;
  scope: Scope;
  fromStart?: string; // when scope includes start
  fromEnd?: string;   // when scope includes end
  replaceWith?: string; // only for replace of spaces; when replacing spaces, use this
  target: "space" | "custom"; // operate spaces or custom token(s)
  occurrence?: Occurrence; // only for center
}

function applyOpsToLine(line: string, ops: Op[]): string {
  let current = line;
  for (const op of ops) {
    const isSpace = op.target === "space";
    if (op.mode === "remove") {
      if (op.scope === "start") {
        if (isSpace) current = current.replace(/^\s+/, "");
        else if (op.fromStart) current = current.replace(new RegExp(`^${escapeRegex(op.fromStart)}`), "");
      }
      if (op.scope === "end") {
        if (isSpace) current = current.replace(/\s+$/, "");
        else if (op.fromEnd) current = current.replace(new RegExp(`${escapeRegex(op.fromEnd)}$`), "");
      }
      if (op.scope === "center") {
        const occurrence: Occurrence = op.occurrence ?? "all";
        if (isSpace) {
          if (occurrence === "all") current = current.replace(/\s+/g, "");
          else if (occurrence === "first") current = current.replace(/\s+/, "");
          else if (occurrence === "last") current = replaceLast(current, /\s+/, "");
        } else if (op.fromStart) {
          const pat = new RegExp(escapeRegex(op.fromStart), occurrence === "all" ? "g" : "");
          if (occurrence === "all") current = current.replace(pat, "");
          else if (occurrence === "first") current = current.replace(pat, "");
          else if (occurrence === "last") current = replaceLast(current, new RegExp(escapeRegex(op.fromStart)), "");
        }
      }
    } else if (op.mode === "replace") {
      const rep = op.replaceWith ?? "";
      if (op.scope === "start") {
        if (isSpace) current = current.replace(/^\s+/, rep);
        else if (op.fromStart) current = current.replace(new RegExp(`^${escapeRegex(op.fromStart)}`), rep);
      }
      if (op.scope === "end") {
        if (isSpace) current = current.replace(/\s+$/, rep);
        else if (op.fromEnd) current = current.replace(new RegExp(`${escapeRegex(op.fromEnd)}$`), rep);
      }
      if (op.scope === "center") {
        const occurrence: Occurrence = op.occurrence ?? "all";
        if (isSpace) {
          if (occurrence === "all") current = current.replace(/\s+/g, rep);
          else if (occurrence === "first") current = current.replace(/\s+/, rep);
          else if (occurrence === "last") current = replaceLast(current, /\s+/, rep);
        } else if (op.fromStart) {
          if (occurrence === "all") current = current.replace(new RegExp(escapeRegex(op.fromStart), "g"), rep);
          else if (occurrence === "first") current = current.replace(new RegExp(escapeRegex(op.fromStart)), rep);
          else if (occurrence === "last") current = replaceLast(current, new RegExp(escapeRegex(op.fromStart)), rep);
        }
      }
    }
  }
  return current;
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceLast(input: string, pattern: RegExp, replacement: string) {
  // Ensure non-global pattern
  const nonGlobal = new RegExp(pattern.source, pattern.flags.replace("g", ""));
  const matches = [...input.matchAll(new RegExp(nonGlobal.source, nonGlobal.flags + "g"))];
  if (matches.length === 0) return input;
  const last = matches[matches.length - 1];
  const start = last.index ?? 0;
  const end = start + last[0].length;
  return input.slice(0, start) + replacement + input.slice(end);
}

function countNewlines(value?: string) {
  if (!value) return 0;
  return (value.match(/\n/g) || []).length;
}

export default function LineTransformPanel() {
  const [inputText, setInputText] = useState("");
  const [ops, setOps] = useState<Op[]>([{ id: crypto.randomUUID(), mode: "remove", scope: "start", target: "space" }]);
  

  const outputText = useMemo(() => {
    // 统一换行符
    let text = inputText.replace(/\r\n/g, "\n");

    // 跨行操作：当目标包含换行符，且 scope 为 center 或者（start/end 对应字段包含换行）时，对整段文本处理
    const isCrossLineOp = (op: Op) => {
      if (op.target !== "custom") return false;
      const hasNlStart = (op.fromStart ?? "").includes("\n");
      const hasNlEnd = (op.fromEnd ?? "").includes("\n");
      if (op.scope === "center") return hasNlStart || hasNlEnd;
      if (op.scope === "start") return hasNlStart; // 例如把行首的"\n"当作整段处理无意义，但支持用户意图
      if (op.scope === "end") return hasNlEnd; // 替换行尾换行为分隔符（A,B,C）
      return false;
    };
    const crossLineOps = ops.filter(isCrossLineOp);
    if (crossLineOps.length > 0) {
      for (const op of crossLineOps) {
        // 取要匹配的整体模式
        const patternStr = op.scope === "end" ? (op.fromEnd ?? "") : (op.fromStart ?? op.fromEnd ?? "");
        if (!patternStr) continue;
        const rep = op.mode === "replace" ? (op.replaceWith ?? "") : "";

        // 选择出现位置：center 提供 first/all/last；start/end 默认 all
        const occurrence: Occurrence = op.scope === "center" ? (op.occurrence ?? "all") : "all";

        // 特殊处理：pattern 为单个换行符时，用 /\n/ 直接替换
        const patternIsNewline = patternStr === "\n";
        if (occurrence === "all") {
          text = patternIsNewline
            ? text.replace(/\n/g, rep)
            : text.replace(new RegExp(escapeRegex(patternStr), "g"), rep);
        } else if (occurrence === "first") {
          text = patternIsNewline
            ? text.replace(/\n/, rep)
            : text.replace(new RegExp(escapeRegex(patternStr)), rep);
        } else if (occurrence === "last") {
          text = patternIsNewline
            ? replaceLast(text, /\n/, rep)
            : replaceLast(text, new RegExp(escapeRegex(patternStr)), rep);
        }
      }
    }

    // 其余操作：逐行处理
    const lines = text.split("\n");
    const out = lines.map((ln) => applyOpsToLine(ln, ops.filter((op) => !crossLineOps.includes(op))));
    return out.join("\n");
  }, [inputText, ops]);

  const addOp = () => {
    setOps((prev) => [...prev, { id: crypto.randomUUID(), mode: "remove", scope: "start", target: "space" }]);
  };
  const resetOps = () => setOps([]);

  return (
    <div className="h-full w-full flex">
      {/* 左：输入 */}
      <div className="flex-1 flex flex-col border-r border-border">
        <ContainerHeader>
          <div className="flex items-center justify-between w-full">
            <h3 className="text-sm font-medium">{"输入文本"}</h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => { try { await navigator.clipboard.writeText(inputText); } catch {} }}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setInputText("")} className="h-6 w-6 p-0">
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </ContainerHeader>
        <ContainerContent>
          <LineNumberedTextarea value={inputText} onChange={setInputText} placeholder="每行一条..." minHeight={400} />
        </ContainerContent>
      </div>

      {/* 中：配置 */}
      <div className="w-[480px] flex flex-col border-r border-border">
        <ContainerHeader>
          <div className="flex items-center justify-between w-full">
            <h3 className="text-sm font-medium">{"行替换配置"}</h3>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={resetOps} className="h-6 px-2">
                清空
              </Button>
              <Button variant="ghost" size="sm" onClick={addOp} className="h-6 px-2">
                <Plus className="h-3 w-3" /> 添加
              </Button>
            </div>
          </div>
        </ContainerHeader>
        <ContainerContent className="space-y-3 p-3">
          {ops.map((op, idx) => (
            <OpRow
              key={op.id}
              op={op}
              onChange={(next) => setOps((prev) => prev.map((o) => (o.id === op.id ? next : o)))}
              onRemove={() => setOps((prev) => prev.filter((o) => o.id !== op.id))}
              index={idx}
            />
          ))}
        </ContainerContent>
      </div>

      {/* 右：输出 */}
      <div className="flex-1 flex flex-col">
        <ContainerHeader>
          <div className="flex items-center justify-between w-full">
            <h3 className="text-sm font-medium">{"替换结果"}</h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => { try { await navigator.clipboard.writeText(outputText); } catch {} }}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </ContainerHeader>
        <ContainerContent>
          <LineNumberedTextarea value={outputText} readOnly placeholder="结果将在这里显示..." minHeight={400} />
        </ContainerContent>
      </div>
    </div>
  );
}

function OpRow({ op, onChange, onRemove, index }: { op: Op; onChange: (o: Op) => void; onRemove: () => void; index: number }) {
  const isBoth = op.scope === "both";
  return (
    <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
      {/* 第一行：移除/替换切换 */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground w-16">操作类型:</span>
        <div className="flex border rounded-md">
          <Toggle
            pressed={op.mode === "remove"}
            onPressedChange={(pressed) => pressed && onChange({ ...op, mode: "remove" })}
            className="h-8 px-3 text-xs"
          >
            移除
          </Toggle>
          <Toggle
            pressed={op.mode === "replace"}
            onPressedChange={(pressed) => pressed && onChange({ ...op, mode: "replace" })}
            className="h-8 px-3 text-xs"
          >
            替换
          </Toggle>
        </div>
      </div>

      {/* 第二行：前/中/后切换 */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground w-16">位置:</span>
        <div className="flex border rounded-md">
          <Toggle
            pressed={op.scope === "start"}
            onPressedChange={(pressed) => pressed && onChange({ ...op, scope: "start" })}
            className="h-8 px-3 text-xs"
          >
            前
          </Toggle>
          <Toggle
            pressed={op.scope === "center"}
            onPressedChange={(pressed) => pressed && onChange({ ...op, scope: "center", occurrence: op.occurrence ?? "all" })}
            className="h-8 px-3 text-xs"
          >
            中
          </Toggle>
          <Toggle
            pressed={op.scope === "end"}
            onPressedChange={(pressed) => pressed && onChange({ ...op, scope: "end" })}
            className="h-8 px-3 text-xs"
          >
            后
          </Toggle>
        </div>
      </div>

      {/* 当选择“中”时，出现“第一个/所有/最后一个” */}
      {op.scope === "center" && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground w-16">出现:</span>
          <div className="flex border rounded-md">
            <Toggle
              pressed={op.occurrence === "first"}
              onPressedChange={(p) => p && onChange({ ...op, occurrence: "first" })}
              className="h-8 px-3 text-xs"
            >
              第一个
            </Toggle>
            <Toggle
              pressed={(op.occurrence ?? "all") === "all"}
              onPressedChange={(p) => p && onChange({ ...op, occurrence: "all" })}
              className="h-8 px-3 text-xs"
            >
              所有
            </Toggle>
            <Toggle
              pressed={op.occurrence === "last"}
              onPressedChange={(p) => p && onChange({ ...op, occurrence: "last" })}
              className="h-8 px-3 text-xs"
            >
              最后一个
            </Toggle>
          </div>
        </div>
      )}

      {/* 第三行：空格/指定字符 切换 */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground w-16">目标:</span>
        <div className="flex border rounded-md">
          <Toggle
            pressed={op.target === "space"}
            onPressedChange={(pressed) => pressed && onChange({ ...op, target: "space" })}
            className="h-8 px-3 text-xs"
          >
            空格
          </Toggle>
          <Toggle
            pressed={op.target === "custom"}
            onPressedChange={(pressed) => pressed && onChange({ ...op, target: "custom" })}
            className="h-8 px-3 text-xs"
          >
            指定字符
          </Toggle>
        </div>
      </div>

      {/* 第四行：输入框 */}
      {op.target === "custom" && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground w-16">字符:</span>
          <div className="flex gap-2 flex-1">
            {op.scope === "start" && (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  className="h-8 text-sm flex-1"
                  value={op.fromStart ?? ""}
                  onChange={(e) => onChange({ ...op, fromStart: e.target.value })}
                  placeholder="前置字符"
                />
                {countNewlines(op.fromStart) > 0 && (
                  <span className="text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground">↵{countNewlines(op.fromStart)}</span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => onChange({ ...op, fromStart: (op.fromStart ?? "") + "\n" })}
                >
                  +回车
                </Button>
              </div>
            )}
            {op.scope === "end" && (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  className="h-8 text-sm flex-1"
                  value={op.fromEnd ?? ""}
                  onChange={(e) => onChange({ ...op, fromEnd: e.target.value })}
                  placeholder="后置字符"
                />
                {countNewlines(op.fromEnd) > 0 && (
                  <span className="text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground">↵{countNewlines(op.fromEnd)}</span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => onChange({ ...op, fromEnd: (op.fromEnd ?? "") + "\n" })}
                >
                  +回车
                </Button>
              </div>
            )}
            {op.scope === "center" && (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  className="h-8 text-sm flex-1"
                  value={op.fromStart ?? ""}
                  onChange={(e) => onChange({ ...op, fromStart: e.target.value })}
                  placeholder="要匹配的字符"
                />
                {countNewlines(op.fromStart) > 0 && (
                  <span className="text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground">↵{countNewlines(op.fromStart)}</span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => onChange({ ...op, fromStart: (op.fromStart ?? "") + "\n" })}
                >
                  +回车
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 第五行：替换为 */}
      {op.mode === "replace" && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground w-16">替换为:</span>
          <div className="flex items-center gap-2 flex-1">
            <Input
              className="h-8 text-sm flex-1"
              value={op.replaceWith ?? ""}
              onChange={(e) => onChange({ ...op, replaceWith: e.target.value })}
              placeholder="替换为"
            />
            {countNewlines(op.replaceWith) > 0 && (
              <span className="text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground">↵{countNewlines(op.replaceWith)}</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => onChange({ ...op, replaceWith: (op.replaceWith ?? "") + "\n" })}
            >
              +回车
            </Button>
          </div>
        </div>
      )}

      {/* 第六行：操作按钮（仅删除） */}
      <div className="flex items-center justify-end">
        <Button variant="ghost" size="sm" onClick={onRemove} className="h-8 px-3 text-xs text-destructive">
          删除
        </Button>
      </div>
    </div>
  );
}


