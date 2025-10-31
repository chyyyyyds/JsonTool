"use client";

import { type ReactNode, type HTMLAttributes } from "react";
import { Separator } from "@/components/ui/separator";
import { type CommandMode } from "@/stores/statusStore";

export function Container({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden" {...props}>
      {children}
    </div>
  );
}

interface ContainerHeaderProps extends HTMLAttributes<HTMLDivElement> {
  mode?: CommandMode;
  modeHeaders?: Record<CommandMode, ReactNode>;
}

export function ContainerHeader({ children, mode, modeHeaders, ...props }: ContainerHeaderProps) {
  return (
    <>
      <div className="flex items-center w-full sticky top-0 z-10 bg-background px-4 py-3" {...props}>
        {children}
      </div>
      <Separator />
    </>
  );
}

export function ContainerContent({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="w-full flex-grow overflow-y-auto pb-4 px-4" {...props}>
      {children}
    </div>
  );
}
