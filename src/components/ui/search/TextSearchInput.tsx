"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Input } from "../input";
import { Button } from "../button";
import { useTranslations } from "next-intl";

interface Props {
  value: string; // The full text content to search within
  onClose: () => void;
  onSearchChange: (searchText: string) => void;
  onNavigate: (direction: "next" | "prev") => void;
  currentMatchIndex: number | null;
  totalMatches: number;
  visible: boolean; // Add this prop
}

export default function TextSearchInput({
  value,
  onClose,
  onSearchChange,
  onNavigate,
  currentMatchIndex,
  totalMatches,
  visible, // Destructure the new prop
}: Props) {
  const t = useTranslations();
  const [searchText, setSearchText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visible) {
      inputRef.current?.focus();
    }
  }, [visible]);

  useEffect(() => {
    onSearchChange(searchText);
  }, [searchText, onSearchChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onNavigate(e.shiftKey ? "prev" : "next");
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="flex items-center space-x-1 p-1 bg-background border rounded-md shadow-lg min-w-[250px]">
      <Input
        ref={inputRef}
        type="text"
        placeholder={t("Search Command")}
        className="h-7 text-sm px-2 py-1 flex-grow"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {searchText && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {totalMatches > 0
            ? `${(currentMatchIndex ?? 0) + 1}/${totalMatches}`
            : `0/0`}
        </span>
      )}
      <Button
        variant="icon"
        size="xs"
        className="h-7 w-7"
        onClick={() => onNavigate("prev")}
        disabled={totalMatches === 0}
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button
        variant="icon"
        size="xs"
        className="h-7 w-7"
        onClick={() => onNavigate("next")}
        disabled={totalMatches === 0}
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
      <Button variant="icon" size="xs" className="h-7 w-7" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
