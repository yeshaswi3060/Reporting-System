import React, { useEffect, useRef, useState } from 'react';
import { loadGuidanceFromOutputCsv, loadGuidanceFromLocal } from '../utils/guidanceLoader';
import type { GuidanceMap } from '../types/guidance';

function getImageUrlFromHash(): string | null {
  try {
    const hash = window.location.hash || '';
    const queryIndex = hash.indexOf('?');
    if (queryIndex === -1) return null;
    const search = new URLSearchParams(hash.substring(queryIndex + 1));
    const url = search.get('url');
    return url ? decodeURIComponent(url) : null;
  } catch {
    return null;
  }
}

export const ImagePage: React.FC = () => {
  const imageUrl = getImageUrlFromHash();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [hasImage, setHasImage] = useState<boolean>(!!imageUrl);
  const [baseImg, setBaseImg] = useState<HTMLImageElement | null>(null);
  const [showCenter, setShowCenter] = useState<boolean>(false);
  const [northPos, setNorthPos] = useState<{ x: number; y: number } | null>(null);
  const [northFixed, setNorthFixed] = useState<boolean>(false);
  const [isDraggingNorth, setIsDraggingNorth] = useState<boolean>(false);
  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [annotateOn, setAnnotateOn] = useState<boolean>(false);
  const [brushColor, setBrushColor] = useState<string>('#e11d48');
  const [brushSize, setBrushSize] = useState<number>(6);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [isSelectingWall, setIsSelectingWall] = useState<boolean>(false);
  const [wallPoints, setWallPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [wallCentroid, setWallCentroid] = useState<{ x: number; y: number } | null>(null);
  const [progressStage, setProgressStage] = useState<'idle' | 'wall' | 'center' | 'north'>('idle');
  const [showDirections, setShowDirections] = useState<boolean>(false);
  const [directionRotationDeg, setDirectionRotationDeg] = useState<number>(0);
  const [numBedrooms, setNumBedrooms] = useState<number>(0);
  const [numBathrooms, setNumBathrooms] = useState<number>(0);
  const [numHalls, setNumHalls] = useState<number>(0);
  const [numStudyRooms, setNumStudyRooms] = useState<number>(0);
  const [numPujaRooms, setNumPujaRooms] = useState<number>(0);
  const [numToilets, setNumToilets] = useState<number>(0);
  const [, setShowRoomPlanner] = useState<boolean>(false);
  type AreaType = 'Bedroom' | 'Bathroom' | 'Hall' | 'Study' | 'Puja' | 'Toilet' | 'GasStove' | 'DiningTable' | 'ToiletFixture';
  type Area = {
    key: string; // e.g., Bedroom-1
    type: AreaType;
    color: string; // rgba string
    rect: { x: number; y: number; w: number; h: number };
    fixed: boolean;
    stageIndex: number; // at which stage it was created
    meta?: {
      seatDirection?: string; // for ToiletFixture: one of 16 directions
    };
  };
  const [areas, setAreas] = useState<Area[]>([]);
  const [activeAreaKey, setActiveAreaKey] = useState<string | null>(null);
  // Drag/resize interactions for areas
  const [isAreaDragging, setIsAreaDragging] = useState<boolean>(false);
  const areaDragModeRef = useRef<'move' | 'resize' | null>(null);
  const areaResizeHandleRef = useRef<'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const areaDragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [toolStage, setToolStage] = useState<1 | 2 | 3>(1);
  const [numGasStoves, setNumGasStoves] = useState<number>(0);
  const [numToiletFixtures, setNumToiletFixtures] = useState<number>(0);
  const [numDiningTables, setNumDiningTables] = useState<number>(0);
  const [guidanceUrl, setGuidanceUrl] = useState<string>('');
  const [guidance, setGuidance] = useState<GuidanceMap>({});
  const [guidanceStatus, setGuidanceStatus] = useState<string>('');

  const typePrefix = (t: AreaType): string => ({ Bedroom: 'B', Bathroom: 'Ba', Hall: 'H', Study: 'S', Puja: 'P', Toilet: 'T', GasStove: 'GS', DiningTable: 'DT', ToiletFixture: 'TF' }[t]);
  const buildAreaLabel = (a: Area): string => {
    const parts = a.key.split('-');
    return `${typePrefix(a.type)}${parts[1] || ''}`;
  };
  const typeColor = (t: AreaType): string => (
    {
      Bedroom: 'rgba(99,102,241,0.25)',
      Bathroom: 'rgba(16,185,129,0.25)',
      Hall: 'rgba(234,179,8,0.25)',
      Study: 'rgba(59,130,246,0.25)',
      Puja: 'rgba(236,72,153,0.25)',
      Toilet: 'rgba(239,68,68,0.25)',
      GasStove: 'rgba(20,184,166,0.25)',
      DiningTable: 'rgba(168,85,247,0.25)',
      ToiletFixture: 'rgba(251,146,60,0.25)'
    }[t]
  );
  const ensureArea = (type: AreaType, index: number) => {
    const key = `${type}-${index}`;
    setAreas(prev => {
      if (prev.find(a => a.key === key)) return prev;
      const canvas = canvasRef.current;
      const w = canvas?.width || 800;
      const h = canvas?.height || 600;
      const rectW = Math.max(60, Math.round(w * 0.15));
      const rectH = Math.max(40, Math.round(h * 0.12));
      const newArea: Area = {
        key,
        type,
        color: typeColor(type),
        rect: { x: Math.round(w / 2 - rectW / 2), y: Math.round(h / 2 - rectH / 2), w: rectW, h: rectH },
        fixed: false,
        stageIndex: toolStage,
        meta: {},
      };
      return [...prev, newArea];
    });
    setActiveAreaKey(key);
    setShowRoomPlanner(true);
  };
  const undoStack = useRef<Array<{
    showCenter: boolean;
    northPos: { x: number; y: number } | null;
    northFixed: boolean;
    wallPoints: Array<{ x: number; y: number }>;
    wallCentroid: { x: number; y: number } | null;
    showDirections: boolean;
    directionRotationDeg: number;
    overlayImage: ImageData | null;
  }>>([]);
  const redoStack = useRef<typeof undoStack.current>([]);

  const captureState = (): typeof undoStack.current[number] => {
    const overlay = overlayCanvasRef.current;
    let overlayImage: ImageData | null = null;
    try {
      if (overlay && overlay.width > 0 && overlay.height > 0) {
        const octx = overlay.getContext('2d');
        if (octx) overlayImage = octx.getImageData(0, 0, overlay.width, overlay.height);
      }
    } catch {}
    return {
      showCenter,
      northPos,
      northFixed,
      wallPoints: [...wallPoints],
      wallCentroid: wallCentroid ? { ...wallCentroid } : null,
      showDirections,
      directionRotationDeg,
      overlayImage,
    };
  };

  const restoreState = (s: typeof undoStack.current[number]) => {
    setShowCenter(s.showCenter);
    setNorthPos(s.northPos ? { ...s.northPos } : null);
    setNorthFixed(s.northFixed);
    setWallPoints([...s.wallPoints]);
    setWallCentroid(s.wallCentroid ? { ...s.wallCentroid } : null);
    setShowDirections(s.showDirections);
    setDirectionRotationDeg(s.directionRotationDeg);
    const overlay = overlayCanvasRef.current;
    if (overlay) {
      const octx = overlay.getContext('2d');
      if (octx) {
        octx.clearRect(0, 0, overlay.width, overlay.height);
        if (s.overlayImage) {
          try { octx.putImageData(s.overlayImage, 0, 0); } catch {}
        }
      }
    }
    redraw();
  };

  const pushHistory = () => {
    undoStack.current.push(captureState());
    redoStack.current = [];
  };

  const computePolygonCentroid = (points: Array<{ x: number; y: number }>): { x: number; y: number } | null => {
    if (points.length < 3) return null;
    let areaTwice = 0;
    let cxSum = 0;
    let cySum = 0;
    for (let i = 0; i < points.length; i++) {
      const p0 = points[i];
      const p1 = points[(i + 1) % points.length];
      const cross = p0.x * p1.y - p1.x * p0.y;
      areaTwice += cross;
      cxSum += (p0.x + p1.x) * cross;
      cySum += (p0.y + p1.y) * cross;
    }
    if (areaTwice === 0) return null;
    const cx = cxSum / (3 * areaTwice);
    const cy = cySum / (3 * areaTwice);
    return { x: Math.round(cx), y: Math.round(cy) };
  };

  // Ensure points are in a consistent clockwise order before centroid computation
  const orderPointsClockwise = (points: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> => {
    if (points.length <= 2) return points;
    const avg = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    const cx = avg.x / points.length;
    const cy = avg.y / points.length;
    return [...points].sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
  };

  const drawBase = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = img.width;
    const h = img.height;
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0);
    setInfo(`${w}×${h}`);
    const overlay = overlayCanvasRef.current;
    if (overlay) {
      overlay.width = w;
      overlay.height = h;
      overlay.style.width = `${w}px`;
      overlay.style.height = `${h}px`;
    }
  };

  const drawOverlays = (
    ctx: CanvasRenderingContext2D,
    drawW: number,
    drawH: number,
    opts?: { pointsOverride?: Array<{ x: number; y: number }> }
  ) => {
    if (showCenter) {
      const cx = wallCentroid ? wallCentroid.x : Math.round(drawW / 2);
      const cy = wallCentroid ? wallCentroid.y : Math.round(drawH / 2);
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (northPos && !showDirections) {
      ctx.save();
      // anchor dot at exact north vector tip
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(northPos.x, northPos.y, 6, 0, Math.PI * 2);
      ctx.fill();

      // place the big 'N' between two rays (sector label position)
      const centerX = wallCentroid ? wallCentroid.x : Math.round(drawW / 2);
      const centerY = wallCentroid ? wallCentroid.y : Math.round(drawH / 2);
      const vx = northPos.x - centerX;
      const vy = northPos.y - centerY;
      const northAngle = Math.atan2(vy, vx);
      const step = (Math.PI * 2) / 16;
      const angLabel = northAngle + step / 2; // between North ray and next ray
      const padding = 20;
      const cosA = Math.cos(angLabel);
      const sinA = Math.sin(angLabel);
      const dxMax = cosA > 0 ? (drawW - padding - centerX) / cosA : (padding - centerX) / cosA;
      const dyMax = sinA > 0 ? (drawH - padding - centerY) / sinA : (padding - centerY) / sinA;
      const dMax = Math.min(Math.abs(dxMax), Math.abs(dyMax));
      const labelDist = Math.max(30, Math.min(dMax - 10, Math.min(drawW, drawH) * 0.35));
      const lx = centerX + cosA * labelDist;
      const ly = centerY + sinA * labelDist;

      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 4;
      ctx.strokeText('N', lx, ly);
      ctx.fillStyle = '#111827';
      ctx.fillText('N', lx, ly);
      ctx.restore();
    }

    // Draw 16-direction compass aligned to user-defined North
    if (showDirections && northPos) {
      const centerX = wallCentroid ? wallCentroid.x : Math.round(drawW / 2);
      const centerY = wallCentroid ? wallCentroid.y : Math.round(drawH / 2);
      const vx = northPos.x - centerX;
      const vy = northPos.y - centerY;
      const northAngle = Math.atan2(vy, vx);
      const labels = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
      const step = (Math.PI * 2) / 16;
      // Very large radius to extend rays well beyond canvas; canvas will clip
      const radius = Math.max(drawW, drawH) * 2;
      const rotationRad = (directionRotationDeg || 0) * Math.PI / 180; // positive = clockwise
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(17,24,39,0.9)';
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < 16; i++) {
        // Apply rotation to ALL rays, including North
        const ang = northAngle + i * step - rotationRad;
        const ex = centerX + Math.cos(ang) * radius;
        const ey = centerY + Math.sin(ang) * radius;
        // haloed line
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.95)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.restore();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        // label placement
        // Place label between adjacent rays using midpoint angle
        const angLabel = ang + step / 2;
        // label midway along the line (between center and edge), clamped inside
        const padding = 20;
        const cosA = Math.cos(angLabel);
        const sinA = Math.sin(angLabel);
        const dxMax = cosA > 0 ? (drawW - padding - centerX) / cosA : (padding - centerX) / cosA;
        const dyMax = sinA > 0 ? (drawH - padding - centerY) / sinA : (padding - centerY) / sinA;
        const dMax = Math.min(Math.abs(dxMax), Math.abs(dyMax));
        const labelDist = Math.max(30, Math.min(dMax - 10, Math.min(drawW, drawH) * 0.35));
        const lx = centerX + cosA * labelDist;
        const ly = centerY + sinA * labelDist;
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.95)';
        ctx.lineWidth = 4;
        ctx.strokeText(labels[i], lx, ly);
        ctx.fillStyle = '#111827';
        ctx.fillText(labels[i], lx, ly);
        ctx.restore();
      }
      ctx.restore();
    }

    const pointsToDraw = opts?.pointsOverride ?? wallPoints;
    if (pointsToDraw.length > 0) {
      ctx.save();
      ctx.fillStyle = '#000000';
      for (const p of pointsToDraw) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Draw room/equipment areas on top of everything else
    if (areas.length > 0) {
      ctx.save();
      for (const a of areas) {
        const { x, y, w, h } = a.rect;
        // dim older stage areas when current stage > their stage
        const isDimmed = a.stageIndex < toolStage;
        const rgba = a.color.replace(/rgba\(([^)]+)\)/, (_match: string, inner: string) => {
          const parts = inner.split(',').map((s: string) => s.trim());
          const alpha = Math.max(0.1, Math.min(1, (parseFloat(parts[3] || '0.25')) * (isDimmed ? 0.5 : 1)));
          return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
        });
        // fill
        ctx.fillStyle = rgba;
        ctx.fillRect(x, y, w, h);
        // border
        ctx.lineWidth = activeAreaKey === a.key ? 3 : 1.5;
        ctx.strokeStyle = activeAreaKey === a.key ? '#111827' : 'rgba(17,24,39,0.7)';
        ctx.strokeRect(x, y, w, h);
        // center label
        const label = buildAreaLabel(a);
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.95)';
        ctx.lineWidth = 3;
        ctx.strokeText(label, x + w / 2, y + h / 2);
        ctx.restore();
        ctx.fillStyle = '#111827';
        ctx.fillText(label, x + w / 2, y + h / 2);
      }
      ctx.restore();
    }
  };

  const redraw = (pointsOverride?: Array<{ x: number; y: number }>) => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImg) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const drawW = baseImg.width;
    const drawH = baseImg.height;
    canvas.width = drawW;
    canvas.height = drawH;
    ctx.clearRect(0, 0, drawW, drawH);
    ctx.drawImage(baseImg, 0, 0);
    drawOverlays(ctx, drawW, drawH, pointsOverride ? { pointsOverride } : undefined);
    const overlay = overlayCanvasRef.current;
    if (overlay) {
      overlay.style.width = `${drawW}px`;
      overlay.style.height = `${drawH}px`;
    }
  };

  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setBaseImg(img);
      drawBase(img);
      setHasImage(true);
      setShowCenter(false);
      setNorthPos(null);
      setNorthFixed(false);
      setWallPoints([]);
      setWallCentroid(null);
      setProgressStage('idle');
      setToolStage(1);
      // seed history at image load
      pushHistory();
    };
    img.onerror = () => setLoadError('Failed to load image');
    img.src = imageUrl;
  }, [imageUrl]);

  // Ensure overlays (N, center, wall points, directions) redraw as soon as state changes
  useEffect(() => {
    redraw();
  }, [northPos, showCenter, wallPoints, wallCentroid, showDirections]);

  // Redraw when areas or selection changes so newly added rooms appear immediately
  useEffect(() => {
    redraw();
  }, [areas, activeAreaKey]);

  // Hit testing helpers for room areas
  const hitTestArea = (x: number, y: number): Area | null => {
    for (let i = areas.length - 1; i >= 0; i--) {
      const a = areas[i];
      const { x: ax, y: ay, w, h } = a.rect;
      if (x >= ax && x <= ax + w && y >= ay && y <= ay + h) return a;
    }
    return null;
  };

  const hitTestResizeHandle = (a: Area, x: number, y: number): 'nw' | 'ne' | 'sw' | 'se' | null => {
    const handleSize = 10;
    const { x: ax, y: ay, w, h } = a.rect;
    const handles = [
      { key: 'nw' as const, hx: ax, hy: ay },
      { key: 'ne' as const, hx: ax + w, hy: ay },
      { key: 'sw' as const, hx: ax, hy: ay + h },
      { key: 'se' as const, hx: ax + w, hy: ay + h },
    ];
    for (const hdl of handles) {
      if (Math.abs(x - hdl.hx) <= handleSize && Math.abs(y - hdl.hy) <= handleSize) return hdl.key;
    }
    return null;
  };

  // Compass labels retained for reference in math; unused variable removed to satisfy TS

  // mapping helper removed (we resolve per-case in report generation)

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-sky-50 to-blue-50">
      <div className="max-w-[1200px] mx-auto px-4 py-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <button
              aria-label="Toggle sidebar"
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="flex flex-col justify-center items-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
            >
              <span className="block w-5 h-0.5 bg-gray-800 mb-1"></span>
              <span className="block w-5 h-0.5 bg-gray-800 mb-1"></span>
              <span className="block w-5 h-0.5 bg-gray-800"></span>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Image Workspace</h1>
              <p className="text-gray-600 text-sm">Edit and analyze your uploaded image.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (undoStack.current.length === 0) return;
                const curr = captureState();
                const prev = undoStack.current.pop()!;
                redoStack.current.push(curr);
                restoreState(prev);
              }}
              className="bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded-lg font-semibold transition-colors duration-200 hover:bg-gray-50"
              title="Undo"
            >
              Undo
            </button>
            <button
              onClick={() => {
                if (redoStack.current.length === 0) return;
                const curr = captureState();
                const next = redoStack.current.pop()!;
                undoStack.current.push(curr);
                restoreState(next);
              }}
              className="bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded-lg font-semibold transition-colors duration-200 hover:bg-gray-50"
              title="Redo"
            >
              Redo
            </button>
            <button
              onClick={() => setAnnotateOn(!annotateOn)}
              className={`px-3 py-2 rounded-lg font-semibold transition-colors duration-200 border ${annotateOn ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600' : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-200'}`}
              title="Toggle brush"
            >
              Brush
            </button>
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
              <button aria-label="Red" className={`w-5 h-5 rounded-full border ${brushColor === '#e11d48' ? 'ring-2 ring-offset-1 ring-pink-400' : ''}`} style={{ backgroundColor: '#e11d48' }} onClick={() => setBrushColor('#e11d48')}></button>
              <button aria-label="Blue" className={`w-5 h-5 rounded-full border ${brushColor === '#2563eb' ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`} style={{ backgroundColor: '#2563eb' }} onClick={() => setBrushColor('#2563eb')}></button>
              <button aria-label="Green" className={`w-5 h-5 rounded-full border ${brushColor === '#059669' ? 'ring-2 ring-offset-1 ring-emerald-400' : ''}`} style={{ backgroundColor: '#059669' }} onClick={() => setBrushColor('#059669')}></button>
              <button aria-label="Black" className={`w-5 h-5 rounded-full border ${brushColor === '#111827' ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`} style={{ backgroundColor: '#111827' }} onClick={() => setBrushColor('#111827')}></button>
            </div>
            <div className="flex items-center bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-700">
              <span className="mr-2">Size</span>
              <input type="range" min={2} max={24} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} />
            </div>
            <button
              onClick={() => { window.location.hash = '#/dashboard'; }}
              className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className={`${drawerOpen ? 'w-64' : 'w-0'} transition-all duration-200 overflow-hidden mr-4`}>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow border border-white/50 h-full">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Tools</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center flex-wrap gap-2">
                  {toolStage === 1 && (
                    <>
                  <button
                    disabled={!hasImage || !(progressStage === 'idle' || progressStage === 'wall')}
                    onClick={() => {
                      setIsSelectingWall(true);
                      setWallPoints([]);
                      setWallCentroid(null);
                      setShowCenter(false);
                      setAnnotateOn(false);
                      setProgressStage('wall');
                    }}
                    className="bg-gray-900 disabled:bg-gray-300 disabled:text-gray-600 hover:bg-black text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200"
                    title="Click multiple points to define wall boundary"
                  >
                    Get Wall
                  </button>
                  
                  <button
                    disabled={!hasImage || !(progressStage === 'wall' && wallPoints.length >= 3)}
                    onClick={() => {
                      if (!baseImg || wallPoints.length < 3) return;
                      // Calculate center from current wall points
                      const ordered = orderPointsClockwise(wallPoints);
                      const centroidA = computePolygonCentroid(ordered);
                      let centroid = centroidA;
                      if (!centroid) {
                        // Fallback to average if area collapses to zero
                        const avg = ordered.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
                        centroid = { x: Math.round(avg.x / ordered.length), y: Math.round(avg.y / ordered.length) };
                      }
                      setWallCentroid(centroid);
                      setShowCenter(true);
                      setIsSelectingWall(false);
                      setInfo(`${baseImg.width}×${baseImg.height} • center=(${centroid.x},${centroid.y}) • ${wallPoints.length} points`);
                      redraw();
                      setProgressStage('center');
                      setShowDirections(false);
                      pushHistory();
                    }}
                    className="bg-blue-600 disabled:bg-gray-300 disabled:text-gray-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200"
                    title="Calculate center from selected wall points (minimum 3 points required)"
                  >
                    Get Center
                  </button>
                  <button
                    disabled={!hasImage || !(progressStage === 'wall' && wallPoints.length > 0)}
                    onClick={() => {
                      setWallPoints([]);
                      setWallCentroid(null);
                      setShowCenter(false);
                      const overlay = overlayCanvasRef.current;
                      if (overlay) {
                        const octx = overlay.getContext('2d');
                        if (octx) octx.clearRect(0, 0, overlay.width, overlay.height);
                      }
                      redraw();
                      setInfo('Wall points cleared. Click on the image to start selecting points again.');
                      pushHistory();
                    }}
                    className="bg-red-600 disabled:bg-gray-300 disabled:text-gray-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200"
                    title="Clear all selected wall points"
                  >
                    Clear Points
                  </button>
                  <button
                    disabled={!hasImage || progressStage !== 'center'}
                    onClick={() => {
                      if (!baseImg) return;
                      // Enter North placement mode; user will click to place
                      setNorthPos(null);
                      setNorthFixed(false);
                      setInfo('Click on the image to place North, then drag to adjust.');
                      setTimeout(() => redraw(), 0);
                      setProgressStage('north');
                      setShowDirections(false);
                      pushHistory();
                    }}
                    className="bg-indigo-600 disabled:bg-gray-300 disabled:text-gray-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200"
                  >
                    Get North
                  </button>
                  <button
                    type="button"
                    disabled={!hasImage || !northPos || northFixed}
                    onClick={() => {
                      setNorthFixed(true);
                      setIsDraggingNorth(false);
                      pushHistory();
                    }}
                    className="bg-gray-700 disabled:bg-gray-300 disabled:text-gray-600 hover:bg-gray-800 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200"
                    title="Fix North position"
                  >
                    Fix
                  </button>
                  <button
                    type="button"
                    disabled={!hasImage || !northPos}
                    onClick={() => {
                      setShowDirections(true);
                      setNorthFixed(true);
                      redraw();
                      pushHistory();
                    }}
                    className="bg-purple-700 disabled:bg-gray-300 disabled:text-gray-600 hover:bg-purple-800 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200"
                    title="Show 16 directions from center aligned to North"
                  >
                    Get Directions (16)
                  </button>
                  <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
                    <span className="text-xs text-gray-700">Rotate</span>
                    <input
                      type="number"
                      className="w-20 border rounded px-1 py-0.5 text-sm"
                      value={directionRotationDeg}
                      onChange={(e) => setDirectionRotationDeg(Number(e.target.value || 0))}
                    />
                    <span className="text-xs text-gray-500">deg</span>
                    <button
                      className="ml-1 bg-white border border-gray-300 px-2 py-1 rounded text-sm hover:bg-gray-50"
                      onClick={() => { setNorthFixed(true); redraw(); pushHistory(); }}
                    >
                      Apply
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={!hasImage}
                    onClick={() => setToolStage(2)}
                    className="w-full bg-teal-700 disabled:bg-gray-300 disabled:text-gray-600 hover:bg-teal-800 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200"
                  >
                    Next
                  </button>
                    </>
                  )}
                  {toolStage === 2 && (
                    <>
                  <button
                    type="button"
                    disabled={!hasImage}
                    onClick={() => {
                      const canvas = canvasRef.current;
                      if (!canvas) return;
                      const overlay = overlayCanvasRef.current;
                      const exportCanvas = document.createElement('canvas');
                      exportCanvas.width = canvas.width;
                      exportCanvas.height = canvas.height;
                      const ectx = exportCanvas.getContext('2d');
                      if (!ectx) return;
                      ectx.drawImage(canvas, 0, 0);
                      if (overlay) {
                        ectx.drawImage(overlay, 0, 0);
                      }
                      const url = exportCanvas.toDataURL('image/png');
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'image.png';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                    className="bg-emerald-600 disabled:bg-gray-300 disabled:text-gray-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200"
                    title="Save canvas as PNG"
                  >
                    Save
                  </button>
                  {/* Room counts */}
                  <div className="w-full grid grid-cols-2 gap-2 mt-2">
                    <label className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700">
                      <span>Bedrooms</span>
                      <input type="number" className="w-16 border rounded px-1 py-0.5 text-xs ml-2" value={numBedrooms} onChange={(e) => setNumBedrooms(Number(e.target.value || 0))} />
                    </label>
                    <label className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700">
                      <span>Bathrooms</span>
                      <input type="number" className="w-16 border rounded px-1 py-0.5 text-xs ml-2" value={numBathrooms} onChange={(e) => setNumBathrooms(Number(e.target.value || 0))} />
                    </label>
                    <label className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700">
                      <span>Halls</span>
                      <input type="number" className="w-16 border rounded px-1 py-0.5 text-xs ml-2" value={numHalls} onChange={(e) => setNumHalls(Number(e.target.value || 0))} />
                    </label>
                    <label className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700">
                      <span>Study Rooms</span>
                      <input type="number" className="w-16 border rounded px-1 py-0.5 text-xs ml-2" value={numStudyRooms} onChange={(e) => setNumStudyRooms(Number(e.target.value || 0))} />
                    </label>
                    <label className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700">
                      <span>Puja House</span>
                      <input type="number" className="w-16 border rounded px-1 py-0.5 text-xs ml-2" value={numPujaRooms} onChange={(e) => setNumPujaRooms(Number(e.target.value || 0))} />
                    </label>
                    <label className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700">
                      <span>Toilets</span>
                      <input type="number" className="w-16 border rounded px-1 py-0.5 text-xs ml-2" value={numToilets} onChange={(e) => setNumToilets(Number(e.target.value || 0))} />
                    </label>
                  </div>
                  <div className="w-full grid grid-cols-2 gap-2 mt-2">
                    {Array.from({ length: numBedrooms }).map((_, i) => (
                      <button key={`Bedroom-${i+1}`} onClick={() => ensureArea('Bedroom', i+1)} className="bg-white border hover:bg-gray-50 border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-800 text-left">Bedroom {i+1}</button>
                    ))}
                    {Array.from({ length: numBathrooms }).map((_, i) => (
                      <button key={`Bathroom-${i+1}`} onClick={() => ensureArea('Bathroom', i+1)} className="bg-white border hover:bg-gray-50 border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-800 text-left">Bathroom {i+1}</button>
                    ))}
                    {Array.from({ length: numHalls }).map((_, i) => (
                      <button key={`Hall-${i+1}`} onClick={() => ensureArea('Hall', i+1)} className="bg-white border hover:bg-gray-50 border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-800 text-left">Hall {i+1}</button>
                    ))}
                    {Array.from({ length: numStudyRooms }).map((_, i) => (
                      <button key={`Study-${i+1}`} onClick={() => ensureArea('Study', i+1)} className="bg-white border hover:bg-gray-50 border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-800 text-left">Study {i+1}</button>
                    ))}
                    {Array.from({ length: numPujaRooms }).map((_, i) => (
                      <button key={`Puja-${i+1}`} onClick={() => ensureArea('Puja', i+1)} className="bg-white border hover:bg-gray-50 border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-800 text-left">Puja House {i+1}</button>
                    ))}
                    {Array.from({ length: numToilets }).map((_, i) => (
                      <button key={`Toilet-${i+1}`} onClick={() => ensureArea('Toilet', i+1)} className="bg-white border hover:bg-gray-50 border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-800 text-left">Toilet {i+1}</button>
                    ))}
                  </div>
                  <div className="flex gap-2 w-full mt-2">
                    <button
                      type="button"
                      className="flex-1 bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded-lg font-medium hover:bg-gray-50"
                      onClick={() => setToolStage(1)}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className="flex-1 bg-teal-700 text-white px-3 py-2 rounded-lg font-medium hover:bg-teal-800"
                      onClick={() => setToolStage(3)}
                    >
                      Next
                    </button>
                  </div>
                    </>
                  )}
                  {toolStage === 3 && (
                    <>
                    <div className="w-full bg-white/70 border border-gray-200 rounded-lg p-2">
                      <div className="text-xs text-gray-700 mb-1">Guidance Source (Output CSV URL)</div>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <input
                            value={guidanceUrl}
                            onChange={(e) => setGuidanceUrl(e.target.value)}
                            placeholder="https://docs.google.com/spreadsheets/.../export?format=csv&gid=..."
                            className="min-w-0 flex-1 border rounded px-2 py-1 text-xs"
                          />
                          <button
                            className="shrink-0 bg-gray-800 text-white px-2 py-1 rounded text-xs"
                            onClick={async () => {
                              try {
                                setGuidanceStatus('Loading...');
                                const map = await loadGuidanceFromOutputCsv(guidanceUrl);
                                setGuidance(map);
                                const roomTypes = Object.keys(map);
                                const dirsCount = roomTypes.reduce((acc, rt) => acc + Object.keys(map[rt] || {}).length, 0);
                                setGuidanceStatus(`Loaded ${roomTypes.length} types, ${dirsCount} directions`);
                              } catch {}
                            }}
                          >
                            Load
                          </button>
                        </div>
                        <button
                          className="w-full bg-white border border-gray-300 text-gray-800 px-2 py-1 rounded text-xs"
                          onClick={async () => {
                            setGuidanceStatus('Loading local data...');
                            const map = await loadGuidanceFromLocal();
                            setGuidance(map);
                            const roomTypes = Object.keys(map);
                            const dirsCount = roomTypes.reduce((acc, rt) => acc + Object.keys(map[rt] || {}).length, 0);
                            setGuidanceStatus(`Loaded ${roomTypes.length} local types, ${dirsCount} directions`);
                          }}
                        >
                          Load Local
                        </button>
                      </div>
                      {guidanceStatus && <div className="text-[11px] text-gray-600 mt-1">{guidanceStatus}</div>}
                    </div>
                    <div className="w-full grid grid-cols-2 gap-2 mt-2">
                      <label className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700">
                        <span>Gas Stoves</span>
                        <input type="number" className="w-16 border rounded px-1 py-0.5 text-xs ml-2" value={numGasStoves} onChange={(e) => setNumGasStoves(Number(e.target.value || 0))} />
                      </label>
                      <label className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700">
                        <span>Toilet Fixtures</span>
                        <input type="number" className="w-16 border rounded px-1 py-0.5 text-xs ml-2" value={numToiletFixtures} onChange={(e) => setNumToiletFixtures(Number(e.target.value || 0))} />
                      </label>
                      <label className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700">
                        <span>Dining Tables</span>
                        <input type="number" className="w-16 border rounded px-1 py-0.5 text-xs ml-2" value={numDiningTables} onChange={(e) => setNumDiningTables(Number(e.target.value || 0))} />
                      </label>
                    </div>
                    <div className="w-full grid grid-cols-2 gap-2 mt-2">
                      {Array.from({ length: numGasStoves }).map((_, i) => (
                        <button key={`GasStove-${i+1}`} onClick={() => ensureArea('GasStove', i+1)} className="bg-white border hover:bg-gray-50 border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-800 text-left">Gas Stove {i+1}</button>
                      ))}
                      {Array.from({ length: numToiletFixtures }).map((_, i) => (
                        <button key={`ToiletFixture-${i+1}`} onClick={() => ensureArea('ToiletFixture', i+1)} className="bg-white border hover:bg-gray-50 border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-800 text-left">Toilet {i+1}</button>
                      ))}
                      {Array.from({ length: numDiningTables }).map((_, i) => (
                        <button key={`DiningTable-${i+1}`} onClick={() => ensureArea('DiningTable', i+1)} className="bg-white border hover:bg-gray-50 border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-800 text-left">Dining Table {i+1}</button>
                      ))}
                    </div>
                    <div className="flex gap-2 w-full mt-2">
                      <button
                        type="button"
                        className="flex-1 bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded-lg font-medium hover:bg-gray-50"
                        onClick={() => setToolStage(2)}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        className="flex-1 bg-rose-700 text-white px-3 py-2 rounded-lg font-medium hover:bg-rose-800"
                        onClick={() => {
                          // generate printable report
                          const reportWin = window.open('', '_blank');
                          if (!reportWin) return;
                          const title = 'Vastu Shikhar Sphere';
                          const labels = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
                          const centerX = wallCentroid ? wallCentroid.x : (baseImg?.width ? Math.round(baseImg.width/2) : 0);
                          const centerY = wallCentroid ? wallCentroid.y : (baseImg?.height ? Math.round(baseImg.height/2) : 0);
                          const northAngle = (northPos && centerX && centerY) ? Math.atan2(northPos.y - centerY, northPos.x - centerX) : 0;
                          const toDirection = (x: number, y: number) => {
                            const ang = Math.atan2(y - centerY, x - centerX);
                            let rel = ang - northAngle;
                            while (rel < 0) rel += Math.PI*2;
                            while (rel >= Math.PI*2) rel -= Math.PI*2;
                            const idx = Math.round(rel / ((Math.PI*2)/16)) % 16;
                            return labels[idx];
                          };
                          // legacy rows removed (not used in card summary)
                          const css = `@page { size: A4 portrait; margin: 22mm; }
                          *{box-sizing:border-box}
                          body{font-family: 'Inter', 'Source Sans 3', ui-sans-serif, system-ui, Segoe UI, Roboto, Helvetica, Arial; color:#1C2534;}
                          header{position:fixed;top:0;left:0;right:0;height:28mm;padding:8mm 0 4mm;border-bottom:1px solid #e5e7eb;}
                          footer{position:fixed;bottom:0;left:0;right:0;height:14mm;padding:4mm 0;border-top:1px solid #f3f4f6;color:#6B7280;font-size:10px;}
                          .container{max-width:170mm;margin:0 auto;}
                          .logo{float:right;font-weight:700;color:#1E88E5}
                          .title{font-weight:600;font-size:24px}
                          .watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-weight:800;color:#1C2534;opacity:.06;font-size:72px;pointer-events:none}
                          h2{font-weight:600;font-size:18px;margin:16px 0 8px}
                          .label{color:#6B7280;font-size:12px}
                          .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
                          .counts{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
                          .card{border:1px solid #e5e7eb;border-radius:6px;padding:10px}
                          .card .num{font-variant-numeric: tabular-nums; font-size:18px; font-weight:700;color:#1E88E5}
                          .accent{height:3px;background:#1E88E5;margin-top:8px}
                          .kicker{color:#6B7280;font-size:10px;letter-spacing:.06em;text-transform:uppercase}
                          .page{page-break-after:always}
                          .no-break{page-break-inside:avoid}
                          .cards{display:flex;flex-direction:column;gap:10px;margin-top:8px}
                          .card2{border:1px solid #e5e7eb;border-radius:8px;padding:12px}
                          .h3{font-weight:600;font-size:16px;margin:2px 0 6px}
                          .meta{color:#374151;font-size:12px;margin-bottom:6px}
                          .subhead{margin-top:6px;color:#1E88E5;font-weight:600;font-size:12px}
                          .ul{margin:4px 0 0 16px;padding:0}
                          .ul li{margin:2px 0;}
                          `;
                          const now = new Date();
                          const genAt = now.toLocaleString();
                          const propertyName = 'Property Name';
                          const counts = {
                            Bedrooms: numBedrooms,
                            Bathrooms: numBathrooms,
                            Halls: numHalls,
                            Kitchens: 0,
                            Balconies: 0,
                            'Store Rooms': 0,
                            'Pooja Rooms': numPujaRooms,
                            'Study Rooms': numStudyRooms,
                            Parking: 0,
                          } as const;
                          const countsCards = Object.entries(counts).map(([k,v])=>`<div class=\"card\"><div class=\"num\">${v}</div><div class=\"label\">${k}</div></div>`).join('');
                          const summaryRows = areas.map(a=>{
                            const cx = a.rect.x + a.rect.w/2; const cy = a.rect.y + a.rect.h/2; const dir = northPos ? toDirection(cx,cy) : '-';
                            // internal key role removed from output
                            // guidance lookup
                            const roomType = (function(){
                              switch (a.type as AreaType) {
                                case 'ToiletFixture': return 'toilet';
                                case 'DiningTable': return 'dinning_hall';
                                case 'Bedroom': return 'bedroom';
                                case 'Bathroom': return 'toilet';
                                case 'Hall': return (guidance['drawing_room']? 'drawing_room' : 'hall');
                                case 'Study': return 'study_room';
                                case 'Puja': return 'temple';
                                case 'GasStove': return 'kitchen';
                                // no default
                              }
                            })();
                            const entry = roomType && dir && guidance[roomType] && guidance[roomType][dir] ? guidance[roomType][dir] : null;
                            // We will not show zone/element if you don't need; keep for internal logic only
                            // zone/element kept internal, not shown
                            const effectsList = (entry?.effect || []).map((t:string)=>`<li>${t}</li>`).join('');
                            const remediesList = (entry?.remedies_primary || []).map((t:string)=>`<li>${t}</li>`).join('');
                            return `
                              <div class=\"card2 no-break\">
                                <div class=\"kicker\">${String(a.type).toUpperCase()}</div>
                                <div class=\"h3\">${a.key}</div>
                                <div class=\"meta\">Direction: <strong>${dir}</strong></div>
                                ${effectsList ? `<div class=\\"subhead\\">Effects</div><ul class=\\"ul\\">${effectsList}</ul>` : ''}
                                ${remediesList ? `<div class=\\"subhead\\">Remedies</div><ul class=\\"ul\\">${remediesList}</ul>` : ''}
                              </div>
                            `;
                          }).join('');
                          const html = `<!doctype html><html><head><meta charset=\"utf-8\"/><title>${title}</title>
                          <style>${css}</style></head><body>
                          <header><div class=\"container\"><div class=\"title\">${title}</div><div class=\"logo\">${propertyName}</div></div></header>
                          <footer><div class=\"container\"><div style=\"float:left\">Prepared by Vastu Shikhar</div><div style=\"float:right\" class=\"pages\"></div></div></footer>
                          <div class=\"watermark\">VASTU SHIKHAR</div>
                          <div class=\"container page\" style=\"margin-top:38mm\">
                            <div class=\"title\">${title}</div>
                            <div class=\"label\">Vastu report</div>
                            <div class=\"accent\"></div>
                            <div class=\"grid\" style=\"margin-top:10mm\">
                              <div>
                                <div class=\"label\">Property Name</div>
                                <div>Property Name</div>
                                <div class=\"label\" style=\"margin-top:4mm\">Address</div>
                                <div>Address line</div>
                                <div class=\"label\" style=\"margin-top:4mm\">Facing Direction</div>
                                <div>${northPos ? 'Defined' : '-'}</div>
                                <div class=\"label\" style=\"margin-top:4mm\">Plot Shape</div>
                                <div>-</div>
                                <div class=\"label\" style=\"margin-top:4mm\">Floors</div>
                                <div>-</div>
                              </div>
                              <div>
                                <div class=\"label\">Report ID</div>
                                <div>${Math.random().toString(36).slice(2,10).toUpperCase()}</div>
                                <div class=\"label\" style=\"margin-top:4mm\">Generated At</div>
                                <div>${genAt}</div>
                                <div class=\"label\" style=\"margin-top:4mm\">Prepared By</div>
                                <div>Vastu Shikhar</div>
                              </div>
                            </div>
                          </div>
                          <div class=\"container page\">
                            <h2>Overview & Counts</h2>
                            <div class=\"grid\">
                              <div>
                                <div class=\"label\">Facing Direction</div>
                                <div>${northPos ? 'Defined' : '-'}</div>
                              </div>
                              <div>
                                <div class=\"label\">Plot Shape</div>
                                <div>-</div>
                              </div>
                              <div>
                                <div class=\"label\">Floor Count</div>
                                <div>-</div>
                              </div>
                            </div>
                            <div class=\"counts\" style=\"margin-top:8px\">${countsCards}</div>
                          </div>
                          <div class=\"container page\">
                            <h2>Direction Summary by Space</h2>
                            <div class=\"cards\">${summaryRows}</div>
                          </div>
                          <script>const pages = document.querySelectorAll('.page'); const footer=document.querySelector('.pages'); if(footer){footer.textContent='page 1 of '+(pages.length||1);} window.onload=()=>window.print()</script>
                          </body></html>`;
                          reportWin.document.open();
                          reportWin.document.write(html);
                          reportWin.document.close();
                        }}
                      >
                        Get Report
                      </button>
                    </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0 min-h-0">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow border border-white/50 h-full">
              {!hasImage && (
                <div className="text-center text-gray-600">No image loaded.</div>
              )}
              {loadError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs mb-3">{loadError}</div>
              )}
              <div ref={containerRef} className="w-full h-full relative overflow-auto">
                <canvas
                  ref={canvasRef}
                  className="block"
                  onMouseDown={(e) => {
                    // If North not set yet but stage is north, place it at click
                    const canvas = canvasRef.current;
                    if (!canvas) return;
                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    if (progressStage === 'north' && !northFixed) {
                      if (!northPos) {
                        setNorthPos({ x, y });
                        pushHistory();
                        return;
                      }
                      // If exists, start drag regardless of hit radius for easier UX
                      dragOffsetRef.current = { dx: x - northPos.x, dy: y - northPos.y };
                      setIsDraggingNorth(true);
                      return;
                    }
                    // Area interactions (enabled from stage 2 onwards)
                    if (toolStage >= 2 && areas.length > 0) {
                      const a = hitTestArea(x, y);
                      if (a) {
                        setActiveAreaKey(a.key);
                        const handle = hitTestResizeHandle(a, x, y);
                        if (handle) {
                          areaDragModeRef.current = 'resize';
                          areaResizeHandleRef.current = handle;
                          setIsAreaDragging(true);
                          pushHistory();
                          return;
                        }
                        areaDragModeRef.current = 'move';
                        areaResizeHandleRef.current = null;
                        areaDragOffsetRef.current = { dx: x - a.rect.x, dy: y - a.rect.y };
                        setIsAreaDragging(true);
                        pushHistory();
                        return;
                      } else {
                        setActiveAreaKey(null);
                      }
                    }
                  }}
                  onMouseMove={(e) => {
                    const canvas = canvasRef.current;
                    if (!canvas) return;
                    const rect = canvas.getBoundingClientRect();
                    const mx = e.clientX - rect.left;
                    const my = e.clientY - rect.top;
                    if (isDraggingNorth && baseImg && northPos) {
                      const x = mx - dragOffsetRef.current.dx;
                      const y = my - dragOffsetRef.current.dy;
                      const clampedX = Math.max(0, Math.min(baseImg.width, x));
                      const clampedY = Math.max(0, Math.min(baseImg.height, y));
                      setNorthPos({ x: clampedX, y: clampedY });
                      redraw();
                      return;
                    }
                    if (toolStage >= 2 && isAreaDragging && activeAreaKey) {
                      setAreas(prev => prev.map(area => {
                        if (area.key !== activeAreaKey) return area;
                        const r = { ...area.rect };
                        if (areaDragModeRef.current === 'move') {
                          r.x = Math.round(mx - areaDragOffsetRef.current.dx);
                          r.y = Math.round(my - areaDragOffsetRef.current.dy);
                        } else if (areaDragModeRef.current === 'resize' && areaResizeHandleRef.current) {
                          const minW = 30;
                          const minH = 20;
                          switch (areaResizeHandleRef.current) {
                            case 'nw': r.w += r.x - mx; r.h += r.y - my; r.x = mx; r.y = my; break;
                            case 'ne': r.w = mx - r.x; r.h += r.y - my; r.y = my; break;
                            case 'sw': r.w += r.x - mx; r.x = mx; r.h = my - r.y; break;
                            case 'se': r.w = mx - r.x; r.h = my - r.y; break;
                          }
                          r.w = Math.max(minW, r.w);
                          r.h = Math.max(minH, r.h);
                        }
                        return { ...area, rect: r };
                      }));
                      redraw();
                    }
                  }}
                  onMouseUp={() => {
                    if (isDraggingNorth) { setIsDraggingNorth(false); pushHistory(); }
                    if (isAreaDragging) { setIsAreaDragging(false); areaDragModeRef.current = null; areaResizeHandleRef.current = null; pushHistory(); }
                  }}
                  onMouseLeave={() => {
                    if (isDraggingNorth) setIsDraggingNorth(false);
                    if (isAreaDragging) { setIsAreaDragging(false); areaDragModeRef.current = null; areaResizeHandleRef.current = null; }
                  }}
                />
                {hasImage && (
                  <div className="absolute left-3 bottom-3 text-gray-700/70 text-xs bg-white/70 px-2 py-0.5 rounded border border-white/60 select-none">
                    vastu shikhar
                  </div>
                )}
                <canvas
                  ref={overlayCanvasRef}
                  className="absolute top-0 left-0"
                  style={{ pointerEvents: annotateOn || isSelectingWall ? 'auto' : 'none' }}
                  onMouseDown={(e) => {
                    if (!baseImg) return;
                    if (isSelectingWall) {
                      const overlay = overlayCanvasRef.current;
                      if (!overlay) return;
                      const rect = overlay.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      const next = [...wallPoints, { x: Math.round(x), y: Math.round(y) }];
                      setWallPoints(next);
                      const octx = overlay.getContext('2d');
                      if (octx) {
                        octx.clearRect(0, 0, overlay.width, overlay.height);
                      }
                      // Draw wall points in the order they were clicked for feedback
                      redraw(next);
                      setInfo(`${next.length} points selected. Click "Get Center" when ready (minimum 3 points required).`);
                      pushHistory();
                      return;
                    }
                    if (!annotateOn) return;
                    const overlay = overlayCanvasRef.current;
                    if (!overlay) return;
                    const rect = overlay.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    setIsDrawing(true);
                    lastPointRef.current = { x, y };
                  }}
                  onMouseMove={(e) => {
                    if (!baseImg) return;
                    if (isSelectingWall) return;
                    if (!isDrawing) return;
                    const overlay = overlayCanvasRef.current;
                    if (!overlay) return;
                    const ctx = overlay.getContext('2d');
                    if (!ctx) return;
                    const rect = overlay.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const last = lastPointRef.current;
                    if (!last) { lastPointRef.current = { x, y }; return; }
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.strokeStyle = brushColor;
                    ctx.lineWidth = brushSize;
                    ctx.beginPath();
                    ctx.moveTo(last.x, last.y);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                    lastPointRef.current = { x, y };
                  }}
                  onMouseUp={() => { if (!isSelectingWall) { setIsDrawing(false); lastPointRef.current = null; } }}
                  onMouseLeave={() => { if (!isSelectingWall) { setIsDrawing(false); lastPointRef.current = null; } }}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    setLoadError(null);
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!file.type.startsWith('image/')) {
                      setLoadError('Only image files are allowed');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      const dataUrl = reader.result as string;
                      const img2 = new Image();
                      img2.onload = () => {
                        const canvas = canvasRef.current;
                        if (!canvas) return;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return;
                        const w = img2.width;
                        const h = img2.height;
                        canvas.width = w;
                        canvas.height = h;
                        ctx.clearRect(0, 0, w, h);
                        ctx.drawImage(img2, 0, 0);
                        setBaseImg(img2);
                        setInfo(`${w}×${h}`);
                        setHasImage(true);
                        setShowCenter(false);
                        setNorthPos(null);
                        setNorthFixed(false);
                        setWallPoints([]);
                        setWallCentroid(null);
                        setProgressStage('idle');
                        const overlay = overlayCanvasRef.current;
                        if (overlay) {
                          overlay.width = w;
                          overlay.height = h;
                          overlay.style.width = `${w}px`;
                          overlay.style.height = `${h}px`;
                        }
                      };
                      img2.onerror = () => setLoadError('Failed to load image');
                      img2.src = dataUrl;
                    };
                    reader.onerror = () => setLoadError('Failed to read file');
                    reader.readAsDataURL(file);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                />
                {!hasImage && (
                  <div className="absolute top-3 right-3 flex items-center space-x-2">
                    {info && <span className="text-xs text-gray-600 bg-white/80 px-2 py-1 rounded border">{info}</span>}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold"
                    >
                      Upload Image
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


