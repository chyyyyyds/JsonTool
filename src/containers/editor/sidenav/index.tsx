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
  SquareStack,
  BarChartBig,
  AlignHorizontalJustifyCenter,
  ArrowLeftToLine,
  ArrowRightFromLine,
  Bug,
  Layers,
  Eraser,
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
import { ListChecks } from "lucide-react";

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
    enableAutoFormat,
    enableAutoSort,
    enableNestParse,
    setParseOptions,
    enableSyncScroll,
    setEnableSyncScroll,
    lineCompareEnabled,
    setLineCompareEnabled,
    lineAssemblerEnabled,
    setLineAssemblerEnabled,
    lineTransformEnabled,
    setLineTransformEnabled,
  } = useStatusStore(
    useShallow((state) => {
      const parseOptions = state._hasHydrated ? state.parseOptions : cc.parseOptions;
      return {
        sideNavExpanded: !!state.sideNavExpanded,
        setSideNavExpanded: state.setSideNavExpanded,
        fixSideNav: state._hasHydrated ? state.fixSideNav : cc.fixSideNav,
        setFixSideNav: state.setFixSideNav,
        enableAutoFormat: !!parseOptions.format,
        enableAutoSort: !!parseOptions.sort,
        enableNestParse: !!parseOptions.nest,
        setParseOptions: state.setParseOptions,
        enableSyncScroll: state._hasHydrated ? state.enableSyncScroll : cc.enableSyncScroll,
        setEnableSyncScroll: state.setEnableSyncScroll,
        lineCompareEnabled: state.lineCompareEnabled,
        setLineCompareEnabled: state.setLineCompareEnabled,
        lineAssemblerEnabled: state.lineAssemblerEnabled,
        setLineAssemblerEnabled: state.setLineAssemblerEnabled,
        lineTransformEnabled: state.lineTransformEnabled,
        setLineTransformEnabled: state.setLineTransformEnabled,
      };
    }),
  );

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
          <Toggle
            icon={<Braces className="icon" />}
            title={t("Auto Format")}
            description={t("auto_format_desc")}
            isPressed={enableAutoFormat}
            onPressedChange={(pressed) => setParseOptions({ format: pressed })}
          />
          <Toggle
            icon={<SquareStack className="icon" />}
            title={t("Nested Parse")}
            description={t("nested_parse_desc")}
            isPressed={enableNestParse}
            onPressedChange={(pressed) => setParseOptions({ nest: pressed })}
          />
          <Toggle
            icon={<ArrowDownNarrowWide className="icon" />}
            title={t("Auto Sort")}
            description={t("auto_sort_desc")}
            isPressed={enableAutoSort}
            onPressedChange={(pressed) => setParseOptions({ sort: pressed ? "asc" : undefined })}
          />
          <Toggle
            icon={<AlignHorizontalJustifyCenter className="icon" />}
            title={t("sync_reveal")}
            description={t("sync_reveal_desc")}
            isPressed={enableSyncScroll}
            onPressedChange={(pressed) => setEnableSyncScroll(pressed)}
          />
          <Toggle
            icon={<ListChecks className="icon" />}
            title={t("line_compare")}
            description={t("line_compare_desc")}
            isPressed={!!lineCompareEnabled}
            onPressedChange={(pressed) => setLineCompareEnabled(pressed)}
          />
          <Toggle
            icon={<Layers className="icon" />}
            title={(t as any)("line_assembler")}
            description={(t as any)("line_assembler_desc")}
            isPressed={!!lineAssemblerEnabled}
            onPressedChange={(pressed) => setLineAssemblerEnabled(pressed)}
          />
          <Toggle
            icon={<Eraser className="icon" />}
            title={(t as any)("line_transform")}
            description={(t as any)("line_transform_desc")}
            isPressed={!!lineTransformEnabled}
            onPressedChange={(pressed) => setLineTransformEnabled(pressed)}
          />
        </ul>
        <ul className="flex flex-col px-1 gap-y-2">
          <LinkButton icon={<CircleHelp className="icon" />} title={t("Tutorial")} href={"/tutorial"} newWindow />
          {false && <LinkButton icon={<Bug className="icon" />} title={t("Feedback")} href={"#"} newWindow />}
          {false && <PopoverBtn title={t("statistics")} icon={<BarChartBig className="icon" />} content={<div />} />}
          {false && <div />}
          <Button
            className="my-1.5"
            icon={fixSideNav ? <ArrowRightFromLine className="icon" /> : <ArrowLeftToLine className="icon" />}
            title={t(fixSideNav ? "Expand" : "Collapse")}
            onClick={() => {
              setFixSideNav(!fixSideNav);
              setSideNavExpanded(fixSideNav);
            }}
          />
        </ul>
      </nav>
    </div>
  );
}
