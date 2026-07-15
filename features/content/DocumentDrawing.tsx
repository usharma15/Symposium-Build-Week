"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Eraser, RotateCcw, Save, Undo2, X } from "lucide-react";
import type { DocumentDrawingContract } from "@/packages/contracts/src";

const drawingColors: Record<DocumentDrawingContract["strokes"][number]["color"], string> = {
  ink: "var(--document-drawing-ink, #13201f)",
  blue: "#276aa0",
  crimson: "#a33c4a",
  forest: "#34725a",
  gold: "#a87818"
};

const points = (stroke: DocumentDrawingContract["strokes"][number], width: number, height: number) =>
  stroke.points.map((point) => `${point.x * width},${point.y * height}`).join(" ");

export function DocumentDrawingPreview({ drawing }: { drawing: DocumentDrawingContract }) {
  return (
    <svg
      className="document-drawing-svg"
      viewBox={`0 0 ${drawing.width} ${drawing.height}`}
      role="img"
      aria-label="Drawing"
      preserveAspectRatio="xMidYMid meet"
    >
      {drawing.strokes.map((stroke, index) => stroke.points.length === 1 ? (
        <circle
          key={index}
          cx={stroke.points[0]!.x * drawing.width}
          cy={stroke.points[0]!.y * drawing.height}
          r={stroke.width / 2}
          fill={drawingColors[stroke.color]}
        />
      ) : (
        <polyline
          key={index}
          points={points(stroke, drawing.width, drawing.height)}
          fill="none"
          stroke={drawingColors[stroke.color]}
          strokeWidth={stroke.width}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

export function DocumentDrawingDialog({
  initial,
  onCancel,
  onSave
}: {
  initial?: DocumentDrawingContract;
  onCancel: () => void;
  onSave: (drawing: DocumentDrawingContract) => void;
}) {
  const [drawing, setDrawing] = useState<DocumentDrawingContract>(() => initial ?? ({
    version: 1,
    width: 960,
    height: 540,
    strokes: []
  }));
  const [color, setColor] = useState<DocumentDrawingContract["strokes"][number]["color"]>("ink");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const activePointerRef = useRef<number | null>(null);
  const canvasRef = useRef<SVGSVGElement>(null);

  const normalizedPoint = (event: ReactPointerEvent<SVGSVGElement>) => {
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (!bounds) return null;
    return {
      x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)),
      y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)),
      ...(event.pressure > 0 ? { pressure: Math.max(0, Math.min(1, event.pressure)) } : {})
    };
  };

  const beginStroke = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    const point = normalizedPoint(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointerRef.current = event.pointerId;
    setDrawing((current) => ({
      ...current,
      strokes: [...current.strokes, { color, width: strokeWidth, points: [point] }]
    }));
  };

  const continueStroke = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (activePointerRef.current !== event.pointerId) return;
    const point = normalizedPoint(event);
    if (!point) return;
    setDrawing((current) => {
      const strokes = [...current.strokes];
      const active = strokes.at(-1);
      if (!active || active.points.length >= 5000) return current;
      const previous = active.points.at(-1);
      if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < 0.0015) return current;
      strokes[strokes.length - 1] = { ...active, points: [...active.points, point] };
      return { ...current, strokes };
    });
  };

  const endStroke = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (activePointerRef.current !== event.pointerId) return;
    activePointerRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div className="drawing-dialog-backdrop" role="presentation" onClick={onCancel}>
      <section className="drawing-dialog" role="dialog" aria-modal="true" aria-label="Insert drawing" onClick={(event) => event.stopPropagation()}>
        <header>
          <div><span>Insert drawing</span><small>Draw with a pointer, trackpad, pen, or touch.</small></div>
          <button type="button" title="Close drawing" onClick={onCancel}><X size={17} /></button>
        </header>
        <div className="drawing-controls" role="toolbar" aria-label="Drawing controls">
          <button type="button" title="Undo stroke" disabled={!drawing.strokes.length} onClick={() => setDrawing((current) => ({ ...current, strokes: current.strokes.slice(0, -1) }))}><Undo2 size={16} /></button>
          <button type="button" title="Clear drawing" disabled={!drawing.strokes.length} onClick={() => setDrawing((current) => ({ ...current, strokes: [] }))}><Eraser size={16} /></button>
          <button type="button" title="Reset drawing" onClick={() => setDrawing({ version: 1, width: 960, height: 540, strokes: initial?.strokes ?? [] })}><RotateCcw size={16} /></button>
          <span className="drawing-control-divider" />
          {(Object.keys(drawingColors) as Array<keyof typeof drawingColors>).map((value) => (
            <button
              key={value}
              type="button"
              className={`drawing-color ${color === value ? "active" : ""}`}
              style={{ "--drawing-color": drawingColors[value] } as React.CSSProperties}
              title={`${value} ink`}
              aria-label={`${value} ink`}
              aria-pressed={color === value}
              onClick={() => setColor(value)}
            />
          ))}
          <label><span>Width</span><input type="range" min="1" max="16" value={strokeWidth} onChange={(event) => setStrokeWidth(Number(event.target.value))} /></label>
        </div>
        <div className="drawing-canvas-shell">
          <svg
            ref={canvasRef}
            className="drawing-canvas"
            viewBox="0 0 960 540"
            onPointerDown={beginStroke}
            onPointerMove={continueStroke}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
          >
            {drawing.strokes.map((stroke, index) => stroke.points.length === 1 ? (
              <circle key={index} cx={stroke.points[0]!.x * 960} cy={stroke.points[0]!.y * 540} r={stroke.width / 2} fill={drawingColors[stroke.color]} />
            ) : (
              <polyline key={index} points={points(stroke, 960, 540)} fill="none" stroke={drawingColors[stroke.color]} strokeWidth={stroke.width} strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </svg>
        </div>
        <footer>
          <button type="button" onClick={onCancel}>Cancel</button>
          <button type="button" className="primary" disabled={!drawing.strokes.length} onClick={() => onSave(drawing)}><Save size={16} />{initial ? "Update drawing" : "Insert drawing"}</button>
        </footer>
      </section>
    </div>
  );
}
