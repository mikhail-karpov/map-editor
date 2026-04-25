import { useRef, useState, useCallback, useEffect } from 'react';
import { useMapStore, useDoc, useSelection } from '@/store/mapStore';
import { useToolStore, useActiveTool, useConnectSourceId } from '@/store/toolStore';
import { useViewportStore, useViewport } from '@/store/viewportStore';
import { screenToWorld } from '@/lib/geometry';

import { BackgroundLayer } from './BackgroundLayer';
import { MapBorderLayer } from './MapBorderLayer';
import { BorderHandlesLayer, type HandleId } from './BorderHandlesLayer';
import { EdgesLayer } from './EdgesLayer';
import { ZonesLayer } from './ZonesLayer';
import { GhostLine } from './GhostLine';
import type { BackgroundGeometry } from '@/types/map';

type Props = {
  bgObjectUrl: string | null;
};

export function Canvas({ bgObjectUrl }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const doc = useDoc();
  const selection = useSelection();
  const activeTool = useActiveTool();
  const connectSourceId = useConnectSourceId();
  const vp = useViewport();

  const createZone = useMapStore((s) => s.createZone);
  const moveZone = useMapStore((s) => s.moveZone);
  const createEdge = useMapStore((s) => s.createEdge);
  const select = useMapStore((s) => s.select);
  const beginTransaction = useMapStore((s) => s.beginTransaction);
  const commitTransaction = useMapStore((s) => s.commitTransaction);
  const setBackgroundGeometry = useMapStore((s) => s.setBackgroundGeometry);
  const resizeBorder = useMapStore((s) => s.resizeBorder);

  const { setConnectSource } = useToolStore();
  const zoom = useViewportStore((s) => s.zoom);

  // Ghost line cursor position (world coords)
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);

  // Cursor-relevant state (mirrors refs so cursor re-renders when these change)
  const [spacePanning, setSpacePanning] = useState(false);
  const [panDragging, setPanDragging] = useState(false);

  // Drag state
  const dragRef = useRef<
    | {
        kind: 'zone' | 'pan' | 'background';
        id?: string;
        startX: number;
        startY: number;
        originTx?: number;
        originTy?: number;
        bgStartOffsetX?: number;
        bgStartOffsetY?: number;
      }
    | {
        kind: 'borderHandle';
        handle: HandleId;
        startX: number; // pointer world X at pointer-down
        startY: number; // pointer world Y at pointer-down
        startBX: number; // border.x at drag start
        startBY: number; // border.y at drag start
        startW: number; // border.width at drag start
        startH: number; // border.height at drag start
      }
    | null
  >(null);

  // Temporary space-pan (doesn't change active tool in store)
  const spacePanRef = useRef(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isInputFocused()) {
        e.preventDefault();
        spacePanRef.current = true;
        setSpacePanning(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spacePanRef.current = false;
        setSpacePanning(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const getSvgPoint = useCallback(
    (e: React.PointerEvent | React.MouseEvent | PointerEvent | MouseEvent) => {
      const rect = svgRef.current!.getBoundingClientRect();
      return screenToWorld(e.clientX - rect.left, e.clientY - rect.top, vp);
    },
    [vp]
  );

  // ── Pointer events ──────────────────────────────────────────────────────

  const onSvgPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (e.target !== svgRef.current && e.target instanceof SVGElement) {
        // Clicked on a child element — zone/edge handlers handle it
        return;
      }

      const effective = spacePanRef.current || activeTool === 'pan' ? 'pan' : activeTool;

      if (effective === 'pan') {
        dragRef.current = {
          kind: 'pan',
          startX: e.clientX,
          startY: e.clientY,
          originTx: vp.tx,
          originTy: vp.ty,
        };
        setPanDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }

      if (effective === 'background') {
        if (doc.background) {
          dragRef.current = {
            kind: 'background',
            startX: e.clientX,
            startY: e.clientY,
            bgStartOffsetX: doc.background.x,
            bgStartOffsetY: doc.background.y,
          };
          beginTransaction();
          e.currentTarget.setPointerCapture(e.pointerId);
        }
        return;
      }

      if (effective === 'addZone') {
        const wp = getSvgPoint(e);
        const id = createZone(wp.x, wp.y);
        select({ kind: 'zone', id });
        return;
      }

      if (effective === 'connect') {
        // Clicking empty canvas cancels connect
        setConnectSource(null);
        setGhostPos(null);
        return;
      }

      if (effective === 'select') {
        select({ kind: 'none' });
        return;
      }
    },
    [
      activeTool,
      vp,
      doc.background,
      getSvgPoint,
      createZone,
      select,
      setConnectSource,
      beginTransaction,
    ]
  );

  const onSvgPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const drag = dragRef.current;

      if (drag?.kind === 'pan') {
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        useViewportStore.getState().setViewport({
          tx: drag.originTx! + dx,
          ty: drag.originTy! + dy,
          scale: vp.scale,
        });
        return;
      }

      if (drag?.kind === 'zone') {
        const wp = getSvgPoint(e);
        moveZone(drag.id!, wp.x, wp.y);
        return;
      }

      if (drag?.kind === 'background' && doc.background) {
        const dx = (e.clientX - drag.startX) / vp.scale;
        const dy = (e.clientY - drag.startY) / vp.scale;
        const newGeom: BackgroundGeometry = {
          ...doc.background,
          x: drag.bgStartOffsetX! + dx,
          y: drag.bgStartOffsetY! + dy,
        };
        setBackgroundGeometry(newGeom);
        return;
      }

      if (drag?.kind === 'borderHandle') {
        const wp = getSvgPoint(e);
        const dx = wp.x - drag.startX;
        const dy = wp.y - drag.startY;
        const MIN = 200;
        const { handle, startBX, startBY, startW: w, startH: h } = drag;

        let x = startBX;
        let y = startBY;
        let newW = w;
        let newH = h;

        // Left edge: move x, shrink width
        if (handle === 'tl' || handle === 'bl' || handle === 'l') {
          newW = Math.max(MIN, w - dx);
          x = startBX + (w - newW);
        }
        // Right edge: grow width
        if (handle === 'tr' || handle === 'r' || handle === 'br') {
          newW = Math.max(MIN, w + dx);
        }
        // Top edge: move y, shrink height
        if (handle === 'tl' || handle === 't' || handle === 'tr') {
          newH = Math.max(MIN, h - dy);
          y = startBY + (h - newH);
        }
        // Bottom edge: grow height
        if (handle === 'br' || handle === 'b' || handle === 'bl') {
          newH = Math.max(MIN, h + dy);
        }

        resizeBorder({ x, y, width: newW, height: newH });
        return;
      }

      if (activeTool === 'connect' && connectSourceId) {
        const wp = getSvgPoint(e);
        setGhostPos(wp);
      }
    },
    [
      vp.scale,
      doc.background,
      activeTool,
      connectSourceId,
      getSvgPoint,
      moveZone,
      setBackgroundGeometry,
      resizeBorder,
    ]
  );

  const onSvgPointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const drag = dragRef.current;
      if (drag?.kind === 'zone') {
        commitTransaction();
      }
      if (drag?.kind === 'background') {
        commitTransaction();
      }
      if (drag?.kind === 'borderHandle') {
        commitTransaction();
      }
      if (drag?.kind === 'pan') {
        setPanDragging(false);
      }
      dragRef.current = null;
      e.currentTarget.releasePointerCapture(e.pointerId);
    },
    [commitTransaction]
  );

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      zoom(factor, cx, cy);
    };
    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, [zoom]);

  const onMiddleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (e.button !== 1) return;
      e.preventDefault();
      dragRef.current = {
        kind: 'pan',
        startX: e.clientX,
        startY: e.clientY,
        originTx: vp.tx,
        originTy: vp.ty,
      };
      setPanDragging(true);
    },
    [vp]
  );

  // ── Border handle pointer events ────────────────────────────────────────

  const onBorderHandlePointerDown = useCallback(
    (handle: HandleId, e: React.PointerEvent<SVGRectElement>) => {
      e.stopPropagation();
      const wp = getSvgPoint(e);
      beginTransaction();
      svgRef.current!.setPointerCapture(e.pointerId);
      dragRef.current = {
        kind: 'borderHandle',
        handle,
        startX: wp.x,
        startY: wp.y,
        startBX: doc.border.x,
        startBY: doc.border.y,
        startW: doc.border.width,
        startH: doc.border.height,
      };
    },
    [getSvgPoint, beginTransaction, doc.border]
  );

  // ── Zone pointer events ─────────────────────────────────────────────────

  const onZonePointerDown = useCallback(
    (id: string, e: React.PointerEvent) => {
      e.stopPropagation();
      const effective = spacePanRef.current || activeTool === 'pan' ? 'pan' : activeTool;

      if (effective === 'pan') return;

      if (effective === 'connect') {
        if (connectSourceId === null) {
          setConnectSource(id);
          const wp = getSvgPoint(e);
          setGhostPos(wp);
        } else {
          if (connectSourceId !== id) {
            createEdge(connectSourceId, id);
          }
          setConnectSource(null);
          setGhostPos(null);
        }
        return;
      }

      if (effective === 'addZone') {
        // Clicked on existing zone while in addZone — just select it
        select({ kind: 'zone', id });
        return;
      }

      if (effective === 'select') {
        select({ kind: 'zone', id });
        // Start dragging
        const zone = doc.zones.find((z) => z.id === id);
        if (zone) {
          beginTransaction();
          dragRef.current = {
            kind: 'zone',
            id,
            startX: e.clientX,
            startY: e.clientY,
          };
          (e.target as Element).closest('svg')?.setPointerCapture(e.pointerId);
        }
      }
    },
    [
      activeTool,
      connectSourceId,
      doc.zones,
      getSvgPoint,
      createEdge,
      select,
      setConnectSource,
      beginTransaction,
    ]
  );

  // ── Edge pointer events ─────────────────────────────────────────────────

  const onEdgeClick = useCallback(
    (id: string, e: React.PointerEvent) => {
      e.stopPropagation();
      if (activeTool === 'select') {
        select({ kind: 'edge', id });
      }
    },
    [activeTool, select]
  );

  // ── Cursor style ────────────────────────────────────────────────────────
  let cursor = 'default';
  if (spacePanning || activeTool === 'pan') cursor = 'grab';
  if (panDragging) cursor = 'grabbing';
  if (activeTool === 'addZone') cursor = 'crosshair';
  if (activeTool === 'connect') cursor = 'cell';
  if (activeTool === 'background') cursor = 'move';

  // Ghost line source zone
  const connectSourceZone = connectSourceId
    ? doc.zones.find((z) => z.id === connectSourceId)
    : null;

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        cursor,
        touchAction: 'none',
      }}
      onPointerDown={onSvgPointerDown}
      onPointerMove={onSvgPointerMove}
      onPointerUp={onSvgPointerUp}
      onMouseDown={onMiddleMouseDown}
    >
      <g transform={`translate(${vp.tx},${vp.ty}) scale(${vp.scale})`}>
        {/* Background image layer */}
        {bgObjectUrl && doc.background && (
          <BackgroundLayer geom={doc.background} objectUrl={bgObjectUrl} />
        )}

        {/* Map border frame */}
        <MapBorderLayer border={doc.border} activeTool={activeTool} />

        {/* Edges */}
        <EdgesLayer
          edges={doc.edges}
          zones={doc.zones}
          selection={selection}
          onEdgeClick={onEdgeClick}
        />

        {/* Ghost line while connecting */}
        {connectSourceZone && ghostPos && (
          <GhostLine
            x1={connectSourceZone.x}
            y1={connectSourceZone.y}
            x2={ghostPos.x}
            y2={ghostPos.y}
          />
        )}

        {/* Zones */}
        <ZonesLayer
          zones={doc.zones}
          selection={selection}
          connectSourceId={connectSourceId}
          onZonePointerDown={onZonePointerDown}
        />

        {/* Border adjustment handles */}
        {activeTool === 'adjustBorder' && (
          <BorderHandlesLayer border={doc.border} onHandlePointerDown={onBorderHandlePointerDown} />
        )}
      </g>
    </svg>
  );
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || (el as HTMLElement).isContentEditable;
}
