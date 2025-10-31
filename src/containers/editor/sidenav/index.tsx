"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/icons/Logo";
import { Separator } from "@/components/ui/separator";
import { isCN } from "@/lib/env";
import { cn } from "@/lib/utils";
import { useConfigFromCookies } from "@/stores/hook";
import { useStatusStore } from "@/stores/statusStore";
import {
  ArrowDownNarrowWide,
  Braces,
  Download,
  FileUp,
  CircleHelp,
  Share2,
  BarChartBig,
  AlignHorizontalJustifyCenter,
  ArrowLeftToLine,
  ArrowRightFromLine,
  Bug,
  Layers,
  Eraser,
  ListChecks,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/shallow";
// import AccountButton from "./AccountButton";
import Button from "./Button";
import ExportPopover from "./ExportPopover";
// import { Label } from "./IconLabel";
import ImportPopover from "./ImportPopover";
import LinkButton from "./LinkButton";
import PopoverBtn, { popoverBtnClass } from "./PopoverButton";
// import SharePopover from "./SharePopover";
// import StatisticsPopover from "./StatisticsPopover";
import Toggle from "./Toggle";

export default function SideNav() {
  const [transition, setTransition] = useState(false);
  useEffect(() => {
    setTransition(true);
  }, []);

  const cc = useConfigFromCookies();
  const t = useTranslations();
  const {
    sideNavExpanded,
    setSideNavExpanded,
    fixSideNav,
    setFixSideNav,
    lineCompareEnabled,
    setLineCompareEnabled,
    lineAssemblerEnabled,
    setLineAssemblerEnabled,
    lineTransformEnabled,
    setLineTransformEnabled,
  } = useStatusStore(
    useShallow((state) => {
      return {
        sideNavExpanded: !!state.sideNavExpanded,
        setSideNavExpanded: state.setSideNavExpanded,
        fixSideNav: state._hasHydrated ? state.fixSideNav : cc.fixSideNav,
        setFixSideNav: state.setFixSideNav,
        lineCompareEnabled: state.lineCompareEnabled,
        setLineCompareEnabled: state.setLineCompareEnabled,
        lineAssemblerEnabled: state.lineAssemblerEnabled,
        setLineAssemblerEnabled: state.setLineAssemblerEnabled,
        lineTransformEnabled: state.lineTransformEnabled,
        setLineTransformEnabled: state.setLineTransformEnabled,
      };
    }),
  );

  const isJsonMode = !lineCompareEnabled && !lineAssemblerEnabled && !lineTransformEnabled;

  return (
    <div
      className="flex flex-col h-full w-8"
      onMouseEnter={(event) => {
        if (fixSideNav || (event.target as HTMLElement).closest(`.${popoverBtnClass}`)) {
          return;
        }
        setSideNavExpanded(true);
      }}
      onMouseLeave={() => setSideNavExpanded(false)}
    >
      <nav
        className={cn(
          "group z-50 h-full py-1.5 w-8 data-[expanded=true]:w-32 box-content border-r border-default shadow-xl duration-200 hide-scrollbar flex flex-col justify-between bg-background overflow-hidden gap-y-2",
          transition && "transition-width",
        )}
        data-expanded={sideNavExpanded}
      >
        <ul className="relative flex flex-col justify-start px-1 gap-y-1">
          <Link prefetch={false} href="/" className="flex items-center pointer mt-1 mb-2">
            <Logo className="w-6 h-6" />
          </Link>
          <PopoverBtn title={t("Import")} icon={<FileUp className="icon" />} content={<ImportPopover />} />
          <PopoverBtn title={t("Export")} icon={<Download className="icon" />} content={<ExportPopover />} />
          {false && (
            <PopoverBtn className="hidden" title={t("Share")} icon={<Share2 className="icon" />} content={<div />} />
          )}
          <Separator className="my-1" />
          {/* JSON 处理入口 */}
          <Toggle
            icon={<Braces className="icon" />}
            title={(t as any)("json_process")}
            description={""}
            isPressed={isJsonMode}
            onPressedChange={() => {
              setLineCompareEnabled(false);
              setLineAssemblerEnabled(false);
              setLineTransformEnabled(false);
            }}
          />
          {/* 功能开关：互斥 */}
          <Toggle
            icon={<ListChecks className="icon" />}
            title={t("line_compare")}
            description={t("line_compare_desc")}
            isPressed={!!lineCompareEnabled}
            onPressedChange={(pressed) => {
              setLineCompareEnabled(pressed);
              if (pressed) {
                setLineAssemblerEnabled(false);
                setLineTransformEnabled(false);
              }
            }}
          />
          <Toggle
            icon={<Layers className="icon" />}
            title={(t as any)("line_assembler")}
            description={(t as any)("line_assembler_desc")}
            isPressed={!!lineAssemblerEnabled}
            onPressedChange={(pressed) => {
              setLineAssemblerEnabled(pressed);
              if (pressed) {
                setLineCompareEnabled(false);
                setLineTransformEnabled(false);
              }
            }}
          />
          <Toggle
            icon={<Eraser className="icon" />}
            title={(t as any)("line_transform")}
            description={(t as any)("line_transform_desc")}
            isPressed={!!lineTransformEnabled}
            onPressedChange={(pressed) => {
              setLineTransformEnabled(pressed);
              if (pressed) {
                setLineCompareEnabled(false);
                setLineAssemblerEnabled(false);
              }
            }}
          />
        </ul>
        <ul className="flex flex-col px-1 gap-y-2">
          <LinkButton icon={<CircleHelp className="icon" />} title={t("Tutorial")} href={"/tutorial"} newWindow />
          {false && <LinkButton icon={<Bug className="icon" />} title={t("Feedback")} href={"#"} newWindow />}
          {false && <PopoverBtn title={t("statistics")} icon={<BarChartBig className="icon" />} content={<div />} />}
          {false && <div />}
          <Button
            className="my-1.5"
            title={fixSideNav ? t("Collapse") : t("Expand")}
            onClick={() => setFixSideNav(!fixSideNav)}
          >
            <span className="group-data-[expanded=true]:block hidden">
              {fixSideNav ? t("Collapse") : t("Expand")}
            </span>
            <ArrowLeftToLine className="group-data-[expanded=true]:hidden icon" />
            <ArrowRightFromLine className="group-data-[expanded=true]:block hidden icon" />
          </Button>
        </ul>
      </nav>
    </div>
  );
}
