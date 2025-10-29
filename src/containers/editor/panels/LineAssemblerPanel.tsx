"use client";

import { useState, useMemo } from "react";
import { Container, ContainerContent, ContainerHeader } from "@/components/Container";
import LineNumberedTextarea from "@/containers/editor/components/LineNumberedTextarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Copy, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { toastSucc } from "@/lib/utils";

interface AssemblerConfig {
  prefix: string;
  itemPrefix: string;
  separator: string;
  itemSuffix: string;
  suffix: string;
}

const defaultConfig: AssemblerConfig = {
  prefix: "[",
  itemPrefix: "\"",
  separator: ",",
  itemSuffix: "\"",
  suffix: "]"
};

const emptyConfig: AssemblerConfig = {
  prefix: "",
  itemPrefix: "",
  separator: "\n",
  itemSuffix: "",
  suffix: "",
};

export default function LineAssemblerPanel() {
  const t = useTranslations();
  const [inputText, setInputText] = useState("");
  const [config, setConfig] = useState<AssemblerConfig>(defaultConfig);
  const [pretty, setPretty] = useState(false);

  const outputText = useMemo(() => {
    if (!inputText.trim()) return "";
    
    const lines = inputText.split("\n").filter(line => line.trim() !== "");
    if (lines.length === 0) return "";
    
    const assembledItems = lines.map(line => `${config.itemPrefix}${line.trim()}${config.itemSuffix}`);

    if (pretty) {
      const indent = "  ";
      const body = assembledItems.map((it) => `${indent}${it}`).join(`${config.separator}\n`);
      return `${config.prefix}\n${body}\n${config.suffix}`;
    }

    return `${config.prefix}${assembledItems.join(config.separator)}${config.suffix}`;
  }, [inputText, config, pretty]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toastSucc(t("Copied"));
    } catch (err) {
      console.error("Failed to copy:", err);
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

  const resetConfig = () => {
    setConfig(defaultConfig);
  };

  const updateConfig = (key: keyof AssemblerConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="h-full w-full flex">
      {/* 左侧输入区域 */}
      <div className="flex-1 flex flex-col border-r border-border">
        <ContainerHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">{"输入文本"}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInputText("")}
              className="h-6 w-6 p-0"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        </ContainerHeader>
        <ContainerContent>
          <LineNumberedTextarea
            value={inputText}
            onChange={(v) => setInputText(v)}
            placeholder="请输入要组装的文本，每行一项..."
            minHeight={400}
          />
        </ContainerContent>
      </div>

      {/* 中间配置区域 */}
      <div className="w-80 flex flex-col border-r border-border">
        <ContainerHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">{"组装配置"}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetConfig}
              className="h-6 w-6 p-0"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfig(emptyConfig)}
              className="h-6 px-2"
            >
              清空
            </Button>
          </div>
        </ContainerHeader>
        <ContainerContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prefix" className="text-xs font-medium text-muted-foreground">
              容器前缀
            </Label>
            <Input
              id="prefix"
              value={config.prefix}
              onChange={(e) => updateConfig("prefix", e.target.value)}
              placeholder="如: ["
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="itemPrefix" className="text-xs font-medium text-muted-foreground">
              项前缀
            </Label>
            <Input
              id="itemPrefix"
              value={config.itemPrefix}
              onChange={(e) => updateConfig("itemPrefix", e.target.value)}
              placeholder={'如: "'}
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="separator" className="text-xs font-medium text-muted-foreground">
              项分隔符
            </Label>
            <Input
              id="separator"
              value={config.separator}
              onChange={(e) => updateConfig("separator", e.target.value)}
              placeholder="如: ,"
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="itemSuffix" className="text-xs font-medium text-muted-foreground">
              项后缀
            </Label>
            <Input
              id="itemSuffix"
              value={config.itemSuffix}
              onChange={(e) => updateConfig("itemSuffix", e.target.value)}
              placeholder={'如: "'}
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="suffix" className="text-xs font-medium text-muted-foreground">
              容器后缀
            </Label>
            <Input
              id="suffix"
              value={config.suffix}
              onChange={(e) => updateConfig("suffix", e.target.value)}
              placeholder="如: ]"
              className="h-8 text-sm"
            />
          </div>

          {/* 预览效果已移除 */}
        </ContainerContent>
      </div>

      {/* 右侧输出区域 */}
      <div className="flex-1 flex flex-col">
        <ContainerHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">{"组装结果"}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPretty((p) => !p)}
              className="h-6 px-2"
            >
              {pretty ? "单行" : "多行"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(outputText)}
              disabled={!outputText}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </ContainerHeader>
        <ContainerContent>
          <LineNumberedTextarea
            value={outputText}
            readOnly
            placeholder="组装结果将在这里显示..."
            minHeight={400}
          />
        </ContainerContent>
      </div>
    </div>
  );
}
