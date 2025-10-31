"use client";

import { useRef, useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { CollapseHint, InitialSetup, StatusBar } from "@/containers/editor/components";
import { useObserveResize } from "@/containers/editor/hooks/useObserveResize";
import ModePanel from "@/containers/editor/mode/ModePanel";
import { initLogger } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useConfigFromCookies } from "@/stores/hook";
import { useStatusStore } from "@/stores/statusStore";
import { useShallow } from "zustand/shallow";
import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";
import LineComparePanel from "./LineComparePanel";
import LineTransformPanel from "./LineTransformPanel";
import LineAssemblerPanel from "./LineAssemblerPanel";

const leftPanelId = "left-panel";
const rightPanelId = "right-panel";
initLogger();

export default function MainPanel() {
  const cc = useConfigFromCookies();
  const {
    rightPanelSize,
    rightPanelCollapsed,
    leftPanelCollapsed,
    setRightPanelSize,
    setRightPanelCollapsed,
    setLeftPanelCollapsed,
  } = useStatusStore(
    useShallow((state) => ({
      rightPanelSize: state._hasHydrated ? state.rightPanelSize : cc.rightPanelSize,
      rightPanelCollapsed: state._hasHydrated ? state.rightPanelCollapsed : cc.rightPanelCollapsed,
      leftPanelCollapsed: state._hasHydrated ? state.leftPanelCollapsed : cc.leftPanelCollapsed,
      setRightPanelSize: state.setRightPanelSize,
      setRightPanelCollapsed: state.setRightPanelCollapsed,
      setLeftPanelCollapsed: state.setLeftPanelCollapsed,
    })),
  );
  const [showLeftCollapseHint, setShowLeftCollapseHint] = useState(false);
  const [showRightCollapseHint, setShowRightCollapseHint] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const layoutRef = useRef<number[]>();
  const { lineCompareEnabled, lineAssemblerEnabled, lineTransformEnabled } = useStatusStore(useShallow((s) => ({ 
    lineCompareEnabled: s.lineCompareEnabled,
    lineAssemblerEnabled: s.lineAssemblerEnabled,
    lineTransformEnabled: s.lineTransformEnabled,
  })));

  useObserveResize(leftPanelId, rightPanelId);

  // see https://github.com/bvaughn/react-resizable-panels/issues/128#issuecomment-1523343548
  return (
    <div className="relative w-full h-full flex flex-col min-w-0 overflow-hidden">
      {lineAssemblerEnabled ? (
        <LineAssemblerPanel />
      ) : lineTransformEnabled ? (
        <LineTransformPanel visible={lineTransformEnabled} />
      ) : (
        <ResizablePanelGroup
          className="flex-grow"
          direction="horizontal"
          onLayout={(layout) => (layoutRef.current = layout)}
        >
        {!lineCompareEnabled && (
          <>
            <ResizablePanel
          id={leftPanelId}
          defaultSize={100 - rightPanelSize}
          minSize={10}
          collapsible
          onCollapse={() => {
            setLeftPanelCollapsed(true);
            setShowLeftCollapseHint(false);
          }}
          onExpand={() => setLeftPanelCollapsed(false)}
          onResize={(size) => setShowLeftCollapseHint(5 < size && size < 15)}
          className={cn(leftPanelCollapsed && "w-0 invisible transition-all duration-300 ease-in-out")}
          // The preview displayed by the hover provider of the monaco editor
          // will be obscured by the right panel, so this style needs to be set.
          style={{ overflow: "visible" }}
        >
          <div className={cn("relative h-full w-full", leftPanelCollapsed && "invisible")}>
            {isDragging && showLeftCollapseHint && <CollapseHint side="left" />}
            <LeftPanel />
          </div>
        </ResizablePanel>
            <ResizableHandle
          withHandle
          onDragging={(dragging) => {
            setIsDragging(dragging);
            if (!dragging) {
              setRightPanelSize(layoutRef.current![1]);
            }
          }}
          className={cn("hover:bg-blue-600", (leftPanelCollapsed || rightPanelCollapsed) && "bg-blue-200 w-2")}
            />
            <ResizablePanel
          id={rightPanelId}
          defaultSize={rightPanelSize}
          minSize={10}
          collapsible
          onCollapse={() => {
            setRightPanelCollapsed(true);
            setShowRightCollapseHint(false);
          }}
          onExpand={() => setRightPanelCollapsed(false)}
          onResize={(size) => setShowRightCollapseHint(5 < size && size < 15)}
          className={cn(rightPanelCollapsed && "transition-all duration-300 ease-in-out")}
        >
              <div className="relative h-full w-full">
                {isDragging && showRightCollapseHint && <CollapseHint side="right" />}
                <RightPanel />
              </div>
            </ResizablePanel>
          </>
        )}
        {lineCompareEnabled && <LineComparePanel />}
      </ResizablePanelGroup>
      )}
      <ModePanel />
      <Separator />
      <StatusBar />
      <InitialSetup />
    </div>
  );
}
