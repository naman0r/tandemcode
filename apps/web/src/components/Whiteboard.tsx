import { memo, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent, PointerEvent } from "react";
import { useAuth } from "@clerk/clerk-react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { Circle, Diamond, Hand, Minus, MousePointer2, MoveUpRight, Pencil, Redo2, Square, Type, Undo2 } from "lucide-react";
import { WS_BASE_URL } from "../lib/config";

export type Shape = {
  id: string;
  type: "rect" | "diamond" | "ellipse" | "arrow" | "line" | "draw" | "text";
  // An arrow or line runs from (x, y) by (w, h). A drawing is `points`, flat
  // x, y pairs relative to (x, y). Every other shape is a box with w, h >= 0.
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  points?: number[];
  // Unset is INK, which is every shape drawn before colours existed.
  color?: string;
};

type Tool = "select" | "hand" | Shape["type"];
type View = { x: number; y: number; zoom: number };
type Peer = { key: number; id: string; name: string; x: number; y: number };
type Gesture =
  | { kind: "pan"; clientX: number; clientY: number; view: View }
  | { kind: "move" | "draw"; x: number; y: number; shape: Shape }
  | { kind: "text" };

interface Props {
  roomId: string;
  user: { id: string; name: string };
  colorOf: (userId: string) => string;
}

const TOOLS: { tool: Tool; icon: typeof Square; label: string; key: string }[] = [
  { tool: "hand", icon: Hand, label: "Pan", key: "h" },
  { tool: "select", icon: MousePointer2, label: "Select", key: "v" },
  { tool: "rect", icon: Square, label: "Rectangle", key: "r" },
  { tool: "diamond", icon: Diamond, label: "Diamond", key: "d" },
  { tool: "ellipse", icon: Circle, label: "Ellipse", key: "o" },
  { tool: "arrow", icon: MoveUpRight, label: "Arrow", key: "a" },
  { tool: "line", icon: Minus, label: "Line", key: "l" },
  { tool: "draw", icon: Pencil, label: "Draw", key: "p" },
  { tool: "text", icon: Type, label: "Text", key: "t" },
];

const INK = "#e4e4e7";
// The room's person colours, so the board reads as part of the same product.
const COLORS = [INK, "#f97316", "#0ea5e9", "#22c55e", "#eab308", "#ef4444", "#a855f7"];
// A drawing keeps a point only this far from the last, which keeps a long
// scribble to a few hundred numbers.
const PEN_STEP = 3;
const FONT = 24;
const LINE = FONT * 1.2;
// Jersey 10 runs narrow; this is close enough to size a selection box.
const CHAR = FONT * 0.42;
const GRID = 24;
// The relay closes a socket sending more than FRAME_BURST frames in its
// window, so pointer moves are not all worth a cursor update.
const CURSOR_MS = 50;
// Same reason as in CollaborativeEditor: Clerk tokens outlive a reconnect only if refreshed.
const TOKEN_REFRESH_MS = 30_000;
const WS_URL = `${WS_BASE_URL}/ws/yjs`;

const CURSORS: Partial<Record<Tool, string>> = { hand: "grab", select: "default", text: "text" };

const toolbar = "px-box absolute flex bg-zinc-900 [--px:#3f3f46]";
const toolButton = (on: boolean) =>
  `p-2 transition-colors ${on ? "bg-orange-500 text-zinc-950" : "text-zinc-400 hover:text-zinc-100"}`;

// Seeded by the shape id, so every peer draws the same wobble.
const random = (id: string) => {
  let seed = [...id].reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619), 2166136261);
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// The hand-drawn look, after rough.js: every edge is a slightly bent curve,
// and every shape is drawn twice so the two passes never quite agree.
const edge = (x1: number, y1: number, x2: number, y2: number, rand: () => number) => {
  const reach = Math.min(Math.hypot(x2 - x1, y2 - y1) / 20, 3);
  const j = () => (rand() - 0.5) * 2 * reach;
  const dx = x2 - x1;
  const dy = y2 - y1;
  return `M${x1 + j()} ${y1 + j()}C${x1 + dx / 3 + j()} ${y1 + dy / 3 + j()} ${x1 + (dx * 2) / 3 + j()} ${y1 + (dy * 2) / 3 + j()} ${x2 + j()} ${y2 + j()}`;
};

// A smooth curve through jittered points on the ellipse, running a little past
// where it started, as a hand would.
const loop = (cx: number, cy: number, rx: number, ry: number, rand: () => number) => {
  const steps = 16;
  const start = rand() * Math.PI * 2;
  const points = Array.from({ length: steps + 2 }, (_, i) => {
    const angle = start + (i * Math.PI * 2 * 1.06) / steps;
    const k = 1 + (rand() - 0.5) * 0.06;
    return [cx + Math.cos(angle) * rx * k, cy + Math.sin(angle) * ry * k];
  });
  const mid = (a: number[], b: number[]) => `${(a[0] + b[0]) / 2} ${(a[1] + b[1]) / 2}`;
  let path = `M${mid(points[0], points[1])}`;
  for (let i = 1; i < points.length - 1; i++) path += `Q${points[i][0]} ${points[i][1]} ${mid(points[i], points[i + 1])}`;
  return path;
};

const outline = (shape: Shape): string => {
  const rand = random(shape.id);
  const { x, y, w, h } = shape;
  const twice = (draw: () => string) => draw() + draw();
  const polygon = (corners: number[][]) =>
    twice(() => corners.map(([cx, cy], i) => edge(cx, cy, ...(corners[(i + 1) % corners.length] as [number, number]), rand)).join(""));
  if (shape.type === "rect") {
    return polygon([
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ]);
  }
  if (shape.type === "diamond") {
    return polygon([
      [x + w / 2, y],
      [x + w, y + h / 2],
      [x + w / 2, y + h],
      [x, y + h / 2],
    ]);
  }
  if (shape.type === "ellipse") return twice(() => loop(x + w / 2, y + h / 2, w / 2, h / 2, rand));
  if (shape.type === "line") return twice(() => edge(x, y, x + w, y + h, rand));
  if (shape.type === "arrow") {
    const angle = Math.atan2(h, w);
    const head = Math.min(18, Math.hypot(w, h) / 3);
    const barb = (turn: number) =>
      edge(x + w, y + h, x + w - head * Math.cos(angle + turn), y + h - head * Math.sin(angle + turn), rand);
    return twice(() => edge(x, y, x + w, y + h, rand) + barb(0.5) + barb(-0.5));
  }
  if (shape.type === "draw" && shape.points) {
    // The hand already wobbles; a smooth curve through the midpoints is enough.
    const p = shape.points;
    let path = `M${x + p[0]} ${y + p[1]}`;
    for (let i = 2; i < p.length - 2; i += 2) {
      path += `Q${x + p[i]} ${y + p[i + 1]} ${x + (p[i] + p[i + 2]) / 2} ${y + (p[i + 1] + p[i + 3]) / 2}`;
    }
    return `${path}L${x + p[p.length - 2]} ${y + p[p.length - 1]}`;
  }
  return "";
};

const box = (shape: Shape) => {
  if (shape.points) {
    const xs = shape.points.filter((_, i) => i % 2 === 0);
    const ys = shape.points.filter((_, i) => i % 2 === 1);
    const left = Math.min(...xs);
    const top = Math.min(...ys);
    return { x: shape.x + left, y: shape.y + top, w: Math.max(...xs) - left, h: Math.max(...ys) - top };
  }
  return {
    x: Math.min(shape.x, shape.x + shape.w),
    y: Math.min(shape.y, shape.y + shape.h),
    w: Math.abs(shape.w),
    h: Math.abs(shape.h),
  };
};

// Lines, arrows and drawings are hit along their stroke, not across their box.
const stroked = (shape: Shape) => shape.type === "arrow" || shape.type === "line" || shape.type === "draw";

const lines = (text: string) => text.split("\n");

const textSize = (text: string) => ({
  w: Math.max(1, ...lines(text).map((line) => line.length)) * CHAR,
  h: lines(text).length * LINE,
});

const Label = ({ text, x, y, centered, color }: { text: string; x: number; y: number; centered: boolean; color: string }) => (
  <text
    x={x}
    y={centered ? y - ((lines(text).length - 1) * LINE) / 2 : y + LINE / 2}
    fill={color}
    fontFamily='"Jersey 10", monospace'
    fontSize={FONT}
    textAnchor={centered ? "middle" : "start"}
    dominantBaseline="central"
  >
    {lines(text).map((line, i) => (
      <tspan key={i} x={x} dy={i ? LINE : 0}>
        {line}
      </tspan>
    ))}
  </text>
);

// Memoised: Y.Map hands back the same object for a shape until it changes.
const ShapeView = memo(({ shape }: { shape: Shape }) => {
  const { x, y, w, h } = box(shape);
  const color = shape.color ?? INK;
  const path = outline(shape);
  return (
    <g data-id={shape.id}>
      {stroked(shape) ? (
        <path d={path} fill="none" stroke="transparent" strokeWidth={14} />
      ) : (
        <rect x={x} y={y} width={w} height={h} fill="transparent" />
      )}
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {shape.text && (
        <Label
          text={shape.text}
          x={shape.type === "text" ? x : x + w / 2}
          y={shape.type === "text" ? y : y + h / 2}
          centered={shape.type !== "text"}
          color={color}
        />
      )}
    </g>
  );
});

// The board read-only, framed to fit `fit`, for the replay.
export const Sketch = ({ shapes, fit }: { shapes: Shape[]; fit: Shape[] }) => {
  const boxes = fit.map(box);
  const pad = 40;
  const left = Math.min(...boxes.map((b) => b.x)) - pad;
  const top = Math.min(...boxes.map((b) => b.y)) - pad;
  const right = Math.max(...boxes.map((b) => b.x + b.w)) + pad;
  const bottom = Math.max(...boxes.map((b) => b.y + b.h)) + pad;
  return (
    <svg
      className="h-[480px] w-full bg-zinc-950"
      viewBox={boxes.length ? `${left} ${top} ${right - left} ${bottom - top}` : "0 0 800 480"}
    >
      {shapes.map((shape) => (
        <ShapeView key={shape.id} shape={shape} />
      ))}
    </svg>
  );
};

const Whiteboard = ({ roomId, user, colorOf }: Props) => {
  const { getToken, isLoaded, isSignedIn, sessionId } = useAuth();
  // Held in refs so a new identity from Clerk or the parent cannot rebuild the board.
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const userRef = useRef(user);
  userRef.current = user;

  const [board, setBoard] = useState<{
    shapes: Y.Map<Shape>;
    undo: Y.UndoManager;
    awareness: WebsocketProvider["awareness"];
  } | null>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [tool, setTool] = useState<Tool>("select");
  const [color, setColor] = useState(INK);
  const [view, setView] = useState<View>({ x: 0, y: 0, zoom: 1 });
  const [selected, setSelected] = useState<string | null>(null);
  // The shape being drawn or dragged. It is only written to the board when the
  // pointer lifts, so each gesture is one change to sync, record and undo.
  const [draft, setDraft] = useState<Shape | null>(null);
  const [editing, setEditing] = useState<Shape | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const space = useRef(false);
  const cursorSentAt = useRef(0);
  const surface = useRef<HTMLDivElement>(null);

  // The board is a map in the room's Yjs document, carried by the same relay
  // as the editor, so it needs nothing new on the server.
  useEffect(() => {
    if (!roomId || !isLoaded || !isSignedIn) return;
    const doc = new Y.Doc();
    const map = doc.getMap<Shape>("board");
    const undo = new Y.UndoManager(map);
    map.observe(() => setShapes(Array.from(map.values())));
    let provider: WebsocketProvider | undefined;
    let refresh: ReturnType<typeof setInterval> | undefined;
    let cancelled = false;

    (async () => {
      const token = await getTokenRef.current();
      if (cancelled || !token) return;
      provider = new WebsocketProvider(WS_URL, roomId, doc, { params: { token } });
      const { awareness } = provider;
      awareness.setLocalStateField("user", { id: userRef.current.id, name: userRef.current.name });
      // Awareness state is whatever a peer sent; React escapes the name, and
      // the position is forced to numbers before it reaches an attribute.
      awareness.on("change", () => {
        const next: Peer[] = [];
        awareness.getStates().forEach((state, key) => {
          if (key === awareness.clientID || !state.cursor || !state.user) return;
          next.push({
            key,
            id: String(state.user.id),
            name: String(state.user.name ?? ""),
            x: Number(state.cursor.x) || 0,
            y: Number(state.cursor.y) || 0,
          });
        });
        setPeers(next);
      });
      refresh = setInterval(async () => {
        const next = await getTokenRef.current();
        if (next && provider) provider.params.token = next;
      }, TOKEN_REFRESH_MS);
      setBoard({ shapes: map, undo, awareness });
    })();

    return () => {
      cancelled = true;
      clearInterval(refresh);
      undo.destroy();
      provider?.destroy();
      doc.destroy();
      setBoard(null);
      setShapes([]);
      setPeers([]);
    };
  }, [roomId, isLoaded, isSignedIn, sessionId]);

  // React's wheel listener is passive, and the page must not scroll under the board.
  useEffect(() => {
    const element = surface.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      setView((current) => {
        if (!event.ctrlKey && !event.metaKey) {
          return { ...current, x: current.x - event.deltaX, y: current.y - event.deltaY };
        }
        // Pinch and ctrl+wheel zoom about the pointer, at most a tenth per notch.
        const step = Math.max(-10, Math.min(10, event.deltaY)) / 100;
        const zoom = Math.min(4, Math.max(0.25, current.zoom * Math.exp(-step)));
        const px = event.clientX - rect.left;
        const py = event.clientY - rect.top;
        return { zoom, x: px - ((px - current.x) * zoom) / current.zoom, y: py - ((py - current.y) * zoom) / current.zoom };
      });
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, []);

  const toBoard = (event: { clientX: number; clientY: number }) => {
    const rect = surface.current!.getBoundingClientRect();
    return { x: (event.clientX - rect.left - view.x) / view.zoom, y: (event.clientY - rect.top - view.y) / view.zoom };
  };

  // By point, not event.target: once the board has captured the pointer, the
  // browser aims click and dblclick at the board itself.
  const hit = (event: { clientX: number; clientY: number }) =>
    document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-id]")?.getAttribute("data-id") ?? null;

  const newText = (event: { clientX: number; clientY: number }): Shape => {
    const point = toBoard(event);
    return { id: crypto.randomUUID(), type: "text", x: point.x, y: point.y - LINE / 2, w: 0, h: 0, text: "", color };
  };

  const down = (event: PointerEvent<SVGSVGElement>) => {
    // A click away from a text being written only finishes it; blur commits.
    if (!board || editing) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = toBoard(event);
    if (tool === "hand" || space.current || event.button === 1) {
      gesture.current = { kind: "pan", clientX: event.clientX, clientY: event.clientY, view };
    } else if (event.button !== 0) {
      return;
    } else if (tool === "select") {
      const id = hit(event);
      const shape = id ? board.shapes.get(id) : undefined;
      setSelected(id);
      if (shape) {
        gesture.current = { kind: "move", ...point, shape };
        setColor(shape.color ?? INK);
      }
    } else if (tool === "text") {
      // The text box opens on release: opening it now would lose focus to the
      // board as the press finishes.
      gesture.current = { kind: "text" };
    } else {
      const shape: Shape = { id: crypto.randomUUID(), type: tool, ...point, w: 0, h: 0, color };
      if (tool === "draw") shape.points = [0, 0];
      gesture.current = { kind: "draw", ...point, shape };
      setDraft(shape);
    }
  };

  const move = (event: PointerEvent<SVGSVGElement>) => {
    const point = toBoard(event);
    const now = performance.now();
    if (board && now - cursorSentAt.current > CURSOR_MS) {
      cursorSentAt.current = now;
      board.awareness.setLocalStateField("cursor", point);
    }
    const current = gesture.current;
    if (current?.kind === "pan") {
      setView({ ...current.view, x: current.view.x + event.clientX - current.clientX, y: current.view.y + event.clientY - current.clientY });
    } else if (current?.kind === "move") {
      setDraft({ ...current.shape, x: current.shape.x + point.x - current.x, y: current.shape.y + point.y - current.y });
    } else if (current?.kind === "draw" && current.shape.points) {
      const points = current.shape.points;
      const dx = Math.round(point.x - current.x);
      const dy = Math.round(point.y - current.y);
      if (Math.hypot(dx - points[points.length - 2], dy - points[points.length - 1]) >= PEN_STEP) {
        current.shape = { ...current.shape, points: [...points, dx, dy] };
        setDraft(current.shape);
      }
    } else if (current?.kind === "draw") {
      const shape = { ...current.shape, w: point.x - current.x, h: point.y - current.y };
      setDraft(shape.type === "arrow" || shape.type === "line" ? shape : { ...shape, ...box(shape) });
    }
  };

  const up = (event: PointerEvent<SVGSVGElement>) => {
    const current = gesture.current;
    gesture.current = null;
    if (current?.kind === "text") {
      setEditing(newText(event));
      setTool("select");
    }
    const sized = draft && (draft.points ? draft.points.length > 4 : Math.hypot(draft.w, draft.h) > 4);
    if (board && draft && current?.kind === "draw" && sized) {
      board.shapes.set(draft.id, draft);
      setSelected(draft.id);
      setTool("select");
    }
    if (board && draft && current?.kind === "move" && (draft.x !== current.shape.x || draft.y !== current.shape.y)) {
      board.shapes.set(draft.id, draft);
    }
    setDraft(null);
  };

  const doubleClick = (event: MouseEvent<SVGSVGElement>) => {
    if (tool !== "select" || !board) return;
    const id = hit(event);
    const shape = id ? board.shapes.get(id) : undefined;
    if (!shape) setEditing(newText(event));
    else if (!stroked(shape)) setEditing({ ...shape, text: shape.text ?? "" });
  };

  const finishEditing = () => {
    if (!board || !editing) return;
    const text = editing.text?.trimEnd() ?? "";
    if (editing.type !== "text") board.shapes.set(editing.id, { ...editing, text });
    else if (text.trim()) board.shapes.set(editing.id, { ...editing, text, ...textSize(text) });
    else board.shapes.delete(editing.id);
    setEditing(null);
  };

  const key = (event: KeyboardEvent) => {
    if (!board || event.target instanceof HTMLTextAreaElement) return;
    const mod = event.metaKey || event.ctrlKey;
    const letter = event.key.toLowerCase();
    if (mod && (letter === "z" || letter === "y")) {
      event.preventDefault();
      if (letter === "y" || event.shiftKey) board.undo.redo();
      else board.undo.undo();
    } else if ((event.key === "Delete" || event.key === "Backspace") && selected) {
      board.shapes.delete(selected);
      setSelected(null);
    } else if (event.key === " ") {
      event.preventDefault();
      space.current = true;
    } else if (!mod) {
      const match = TOOLS.find((item) => item.key === letter);
      if (match) setTool(match.tool);
    }
  };

  const selection = draft ?? shapes.find((shape) => shape.id === selected);
  const selectionBox = selection && box(selection);
  const pad = 6 / view.zoom;
  const editingBox = editing && box(editing);
  const editingSize = editing && textSize(editing.text || " ");

  return (
    <div
      ref={surface}
      tabIndex={0}
      onKeyDown={key}
      onKeyUp={(event) => {
        if (event.key === " ") space.current = false;
      }}
      className="relative h-[calc(100vh-13rem)] min-h-[28rem] overflow-hidden bg-zinc-950 outline-none select-none"
      style={{
        backgroundImage: "radial-gradient(#27272a 1px, transparent 1px)",
        backgroundSize: `${GRID * view.zoom}px ${GRID * view.zoom}px`,
        backgroundPosition: `${view.x}px ${view.y}px`,
      }}
    >
      <svg
        className={`absolute inset-0 h-full w-full touch-none ${tool === "select" ? "[&_[data-id]]:cursor-move" : ""}`}
        style={{ cursor: CURSORS[tool] ?? "crosshair" }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={() => board?.awareness.setLocalStateField("cursor", null)}
        onDoubleClick={doubleClick}
      >
        <g transform={`translate(${view.x} ${view.y}) scale(${view.zoom})`}>
          {shapes.map((shape) =>
            shape.id === draft?.id ? null : (
              <ShapeView key={shape.id} shape={shape.id === editing?.id ? { ...shape, text: "" } : shape} />
            ),
          )}
          {draft && <ShapeView shape={draft} />}
          {selectionBox && (
            <rect
              x={selectionBox.x - pad}
              y={selectionBox.y - pad}
              width={selectionBox.w + pad * 2}
              height={selectionBox.h + pad * 2}
              fill="none"
              stroke="#f97316"
              strokeWidth={1.5 / view.zoom}
              strokeDasharray={`${6 / view.zoom} ${4 / view.zoom}`}
              pointerEvents="none"
            />
          )}
          {peers.map((peer) => (
            <g key={peer.key} transform={`translate(${peer.x} ${peer.y}) scale(${1 / view.zoom})`} pointerEvents="none">
              <path d="M0 0L0 17L4.5 13L8 20L11 19L7.5 12L13 12Z" fill={colorOf(peer.id)} stroke="#0a0a0b" />
              <rect x={12} y={18} width={peer.name.length * 7 + 8} height={18} fill={colorOf(peer.id)} />
              <text x={16} y={27} fill="#0a0a0b" fontFamily='"Jersey 10", monospace' fontSize={15} dominantBaseline="central">
                {peer.name}
              </text>
            </g>
          ))}
        </g>
      </svg>

      {shapes.length === 0 && !draft && !editing && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center font-pixel text-2xl text-zinc-600">
          Pick a shape and drag to draw. Double-click to write.
        </p>
      )}

      {editing && editingBox && editingSize && (
        <textarea
          autoFocus
          value={editing.text}
          onChange={(event) => setEditing({ ...editing, text: event.target.value })}
          onBlur={finishEditing}
          onKeyDown={(event) => event.key === "Escape" && event.currentTarget.blur()}
          spellCheck={false}
          className="absolute resize-none overflow-hidden bg-transparent font-pixel whitespace-pre outline-none"
          style={{
            color: editing.color ?? INK,
            fontSize: FONT * view.zoom,
            lineHeight: 1.2,
            width: (editingSize.w + CHAR) * view.zoom,
            height: editingSize.h * view.zoom,
            textAlign: editing.type === "text" ? "left" : "center",
            left:
              view.x +
              (editing.type === "text" ? editingBox.x : editingBox.x + editingBox.w / 2 - (editingSize.w + CHAR) / 2) * view.zoom,
            top: view.y + (editing.type === "text" ? editingBox.y : editingBox.y + editingBox.h / 2 - editingSize.h / 2) * view.zoom,
          }}
        />
      )}

      <div className={`${toolbar} top-4 left-1/2 -translate-x-1/2`} role="toolbar" aria-label="Drawing tools">
        {TOOLS.map(({ tool: item, icon: Icon, label, key: shortcut }) => (
          <button
            key={item}
            type="button"
            title={`${label} (${shortcut.toUpperCase()})`}
            aria-label={label}
            aria-pressed={tool === item}
            onClick={() => setTool(item)}
            className={toolButton(tool === item)}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      <div className={`${toolbar} top-4 left-4 flex-col gap-1.5 p-1.5`} role="radiogroup" aria-label="Colour">
        {COLORS.map((swatch) => (
          <button
            key={swatch}
            type="button"
            role="radio"
            aria-checked={color === swatch}
            aria-label={swatch}
            title={selection && !draft ? "Colour the selected shape" : "Colour for new shapes"}
            onClick={() => {
              setColor(swatch);
              const shape = selected && board?.shapes.get(selected);
              if (board && shape) board.shapes.set(shape.id, { ...shape, color: swatch });
            }}
            className={`h-5 w-5 ${color === swatch ? "outline-2 outline-offset-2 outline-zinc-100" : ""}`}
            style={{ backgroundColor: swatch }}
          />
        ))}
      </div>

      <div className={`${toolbar} bottom-4 left-4 items-center`}>
        <button type="button" title="Undo (Ctrl+Z)" aria-label="Undo" onClick={() => board?.undo.undo()} className={toolButton(false)}>
          <Undo2 className="h-4 w-4" />
        </button>
        <button type="button" title="Redo (Ctrl+Shift+Z)" aria-label="Redo" onClick={() => board?.undo.redo()} className={toolButton(false)}>
          <Redo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Reset the view"
          onClick={() => setView({ x: 0, y: 0, zoom: 1 })}
          className="px-2 font-pixel text-lg leading-none text-zinc-400 hover:text-zinc-100"
        >
          {Math.round(view.zoom * 100)}%
        </button>
      </div>
    </div>
  );
};

export default Whiteboard;
