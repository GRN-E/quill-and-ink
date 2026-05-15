import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Download,
  Trash2,
  Save,
  Check,
  Edit3,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Eye,
  PenLine,
  Maximize2,
  LogOut,
  Settings,
  Home,
} from 'lucide-react';
import { supabase } from './supabase';
import Logo from './components/Logo';

const CATEGORIES = {
  uppercase: {
    label: 'Uppercase',
    short: 'A–Z',
    chars: Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)),
  },
  lowercase: {
    label: 'Lowercase',
    short: 'a–z',
    chars: Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i)),
  },
  numbers: {
    label: 'Numbers',
    short: '0–9',
    chars: '0123456789'.split(''),
  },
};
const ALL_CHARS = [
  ...CATEGORIES.uppercase.chars,
  ...CATEGORIES.lowercase.chars,
  ...CATEGORIES.numbers.chars,
];

// Character classification
const DESCENDERS = 'gjpqy';
const ASCENDERS = 'bdfhklt';
const DOTTED = 'ij';

const classifyChar = (ch) => {
  if (ch >= 'A' && ch <= 'Z') return 'cap';
  if (ch >= '0' && ch <= '9') return 'cap';
  if (ch >= 'a' && ch <= 'z') {
    if (DESCENDERS.includes(ch)) return 'descender';
    if (ASCENDERS.includes(ch) || DOTTED.includes(ch)) return 'ascender';
    return 'xheight';
  }
  return 'cap';
};

// =========================================================================
// CANVAS ZONE LAYOUT
// The editor canvas is conceptually divided into four bands stacked top-to-bottom.
// Each band takes a fraction of the canvas height. Together they sum to 1.0.
// =========================================================================
const ZONE_LAYOUT = {
  ascender: 0.20,   // top: extra space above cap line (for b, d, h, k, l, t, i, j only)
  cap: 0.45,        // cap line down to x-height line (for capitals, numbers, ascender stems)
  xheight: 0.20,    // x-height line down to baseline (for lowercase bodies)
  descender: 0.15,  // below baseline (for g, j, p, q, y tails)
};

// Y-position (fraction of canvas) for each named horizontal line
const TOP = 0;
const CAP_LINE = ZONE_LAYOUT.ascender;
const X_HEIGHT_LINE = CAP_LINE + ZONE_LAYOUT.cap;
const BASELINE = X_HEIGHT_LINE + ZONE_LAYOUT.xheight;
const DESCENDER_LINE = BASELINE + ZONE_LAYOUT.descender;

// For each character class, which y-fractions define the captured region on save,
// and which y-fractions define the "active" (bright) zone for drawing.
const getCaptureRegion = (cls) => {
  if (cls === 'cap') return { top: CAP_LINE, bottom: BASELINE };
  if (cls === 'xheight') return { top: X_HEIGHT_LINE, bottom: BASELINE };
  if (cls === 'ascender') return { top: TOP, bottom: BASELINE };
  if (cls === 'descender') return { top: X_HEIGHT_LINE, bottom: DESCENDER_LINE };
  return { top: CAP_LINE, bottom: BASELINE };
};

// Relative height each class should render at in the preview, with cap height = 1.0
const getRenderHeight = (cls) => {
  if (cls === 'cap') return 1.0;
  if (cls === 'xheight') return ZONE_LAYOUT.xheight / ZONE_LAYOUT.cap;
  if (cls === 'ascender') return (ZONE_LAYOUT.ascender + ZONE_LAYOUT.cap + ZONE_LAYOUT.xheight) / ZONE_LAYOUT.cap;
  if (cls === 'descender') return (ZONE_LAYOUT.xheight + ZONE_LAYOUT.descender) / ZONE_LAYOUT.cap;
  return 1.0;
};

// How much of the rendered glyph drops below the baseline (descender tail)
const getDescenderDrop = (cls) => {
  if (cls === 'descender') return ZONE_LAYOUT.descender / ZONE_LAYOUT.cap;
  return 0;
};

// ============ CALLIGRAPHY PREVIEW CANVAS ============
const CalligraphyCanvas = ({ text, customAlphabet, capHeight, padding, lineSpacing }) => {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const cacheRef = useRef({});
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Object.entries(customAlphabet).forEach(([ch, entry]) => {
      const src = typeof entry === 'string' ? entry : entry?.src;
      if (!src || cacheRef.current[src]) return;
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        cacheRef.current[src] = img;
        setTick((n) => n + 1);
      };
      img.src = src;
    });
    return () => {
      cancelled = true;
    };
  }, [customAlphabet]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const W = wrap.clientWidth;
    if (W === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const letterSpacing = Math.max(1, Math.round(capHeight * 0.04));
    const wordGap = capHeight * 0.4;
    const lineH = capHeight * 1.6 + lineSpacing;
    const maxX = W - padding;

    const measureCtx = canvas.getContext('2d');

    const getGlyph = (ch) => {
      const cls = classifyChar(ch);
      const renderH = capHeight * getRenderHeight(cls);
      const drop = capHeight * getDescenderDrop(cls);

      const entry = customAlphabet[ch];
      const src = typeof entry === 'string' ? entry : entry?.src;

      if (src && cacheRef.current[src]) {
        const img = cacheRef.current[src];
        const aspect = img.naturalWidth / img.naturalHeight || 1;
        const w = renderH * aspect;
        return { type: 'img', img, w, h: renderH, drop, ch, cls };
      }
      const fontSize = renderH * 1.05;
      measureCtx.font = `${fontSize}px Georgia, serif`;
      const w = measureCtx.measureText(ch).width;
      return { type: 'text', ch, w, h: renderH, drop, fontSize, cls };
    };

    const tokens = [];
    let buf = [];
    const flush = () => {
      if (buf.length) {
        tokens.push({ kind: 'word', chars: buf });
        buf = [];
      }
    };
    for (const ch of text) {
      if (ch === '\n') {
        flush();
        tokens.push({ kind: 'newline' });
      } else if (ch === ' ' || ch === '\t') {
        flush();
        tokens.push({ kind: 'space' });
      } else {
        buf.push(ch);
      }
    }
    flush();

    const sized = tokens.map((tk) => {
      if (tk.kind !== 'word') return tk;
      const glyphs = tk.chars.map(getGlyph);
      let w = 0;
      glyphs.forEach((g, i) => {
        w += g.w;
        if (i < glyphs.length - 1) w += letterSpacing;
      });
      return { ...tk, glyphs, width: w };
    });

    const lines = [];
    let line = [];
    let curX = padding;
    let atStart = true;
    for (const tk of sized) {
      if (tk.kind === 'newline') {
        lines.push(line);
        line = [];
        curX = padding;
        atStart = true;
      } else if (tk.kind === 'space') {
        if (!atStart) {
          line.push({ kind: 'space' });
          curX += wordGap;
        }
      } else {
        if (curX + tk.width > maxX && !atStart) {
          while (line.length && line[line.length - 1].kind === 'space') line.pop();
          lines.push(line);
          line = [];
          curX = padding;
          atStart = true;
        }
        line.push({ ...tk, x: curX });
        curX += tk.width;
        atStart = false;
      }
    }
    lines.push(line);

    const minH = wrap.clientHeight || 200;
    const contentH = padding * 2 + Math.max(1, lines.length) * lineH;
    const H = Math.max(minH, contentH);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';

    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(99, 102, 241, 0.18)';
    ctx.lineWidth = 1;
    const visibleLines = Math.ceil((H - padding) / lineH) + 1;
    for (let i = 0; i < visibleLines; i++) {
      const y = Math.round(padding + (i + 1) * lineH - capHeight * 0.2) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#0a0a0a';
    ctx.textBaseline = 'alphabetic';

    lines.forEach((ln, li) => {
      const baselineY = padding + (li + 1) * lineH - capHeight * 0.2;
      ln.forEach((tk) => {
        if (tk.kind !== 'word') return;
        let x = tk.x;
        tk.glyphs.forEach((g, gi) => {
          const seed = (Math.floor(tk.x) * 13 + gi * 17 + g.ch.charCodeAt(0)) % 100;
          const wobble = (seed / 100) * 0.8 - 0.4;
          const rot = ((seed % 13) / 13 - 0.5) * 0.025;

          ctx.save();
          ctx.translate(x + g.w / 2, baselineY);
          ctx.rotate(rot);
          ctx.translate(-(x + g.w / 2), -baselineY);

          if (g.type === 'img') {
            const top = baselineY - g.h + g.drop;
            ctx.drawImage(g.img, x, top + wobble, g.w, g.h);
          } else {
            ctx.font = `${g.fontSize}px Georgia, serif`;
            ctx.fillText(g.ch, x, baselineY + g.drop + wobble);
          }
          ctx.restore();
          x += g.w + letterSpacing;
        });
      });
    });
  }, [text, customAlphabet, capHeight, padding, lineSpacing, tick]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const obs = new ResizeObserver(() => setTick((n) => n + 1));
    obs.observe(wrap);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className="w-full h-full overflow-y-auto rounded-xl bg-white border border-ink-200 relative"
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      {text.length === 0 && (
        <div
          className="absolute top-0 left-0 italic pointer-events-none text-ink-400"
          style={{ padding, fontSize: capHeight * 0.55 }}
        >
          Empty — type on the left to see your hand…
        </div>
      )}
    </div>
  );
};

export default function VintageCalligraphyApp({ session }) {
  const navigate = useNavigate();
  const [customAlphabet, setCustomAlphabet] = useState({});
  const [syncing, setSyncing] = useState(true);
  const [activeLetter, setActiveLetter] = useState('A');
  const [activeCategory, setActiveCategory] = useState('uppercase');
  const [activeView, setActiveView] = useState('editor');
  const [text, setText] = useState(
    'Dear friend,\n\nI am writing this in my own hand. The words flow together — each curve is mine.'
  );
  const [notebookMode, setNotebookMode] = useState('write');
  const [baseThickness, setBaseThickness] = useState(10);
  const [opacity, setOpacity] = useState(0.88);
  const [savedFlash, setSavedFlash] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSliders, setShowSliders] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [editorMode, setEditorMode] = useState('draw');
  const [transformBox, setTransformBox] = useState(null);
  const transformImageRef = useRef(null);
  const transformDragRef = useRef(null);

  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const textareaRef = useRef(null);
  const userMenuRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastTime = useRef(0);
  const currentWidth = useRef(baseThickness);

  // Load saved alphabet from Supabase
  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('alphabets')
        .select('glyphs')
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (!cancelled && data?.glyphs) setCustomAlphabet(data.glyphs);
      if (!cancelled) setSyncing(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  // Debounced save to Supabase
  useEffect(() => {
    if (syncing || !session?.user) return;
    const t = setTimeout(async () => {
      await supabase.from('alphabets').upsert(
        {
          user_id: session.user.id,
          glyphs: customAlphabet,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
    }, 1000);
    return () => clearTimeout(t);
  }, [customAlphabet, session?.user?.id, syncing]);

  const completedCount = Object.keys(customAlphabet).length;
  const counts = {
    uppercase: CATEGORIES.uppercase.chars.filter((c) => customAlphabet[c]).length,
    lowercase: CATEGORIES.lowercase.chars.filter((c) => customAlphabet[c]).length,
    numbers: CATEGORIES.numbers.chars.filter((c) => customAlphabet[c]).length,
  };

  const detectCategory = (ch) => {
    if (CATEGORIES.uppercase.chars.includes(ch)) return 'uppercase';
    if (CATEGORIES.lowercase.chars.includes(ch)) return 'lowercase';
    return 'numbers';
  };

  const activeClass = classifyChar(activeLetter);
  const activeRegion = getCaptureRegion(activeClass);

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Reset mode when changing letter or view
  useEffect(() => {
    setEditorMode('draw');
    setTransformBox(null);
    transformImageRef.current = null;
  }, [activeLetter, activeView]);

  // Render saved letter onto canvas when letter or view changes
  useEffect(() => {
    if (activeView !== 'editor' || editorMode !== 'draw') return;
    const id = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;
      const dpr = window.devicePixelRatio || 1;
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w === 0 || h === 0) return;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      const ctx = canvas.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.clearRect(0, 0, w, h);

      // Re-render the saved letter back into its zone
      const entry = customAlphabet[activeLetter];
      const src = typeof entry === 'string' ? entry : entry?.src;
      if (src) {
        const img = new Image();
        img.onload = () => {
          const region = getCaptureRegion(activeClass);
          const zoneTop = region.top * h;
          const zoneBottom = region.bottom * h;
          const zoneHeight = zoneBottom - zoneTop;
          ctx.drawImage(img, 0, zoneTop, w, zoneHeight);
        };
        img.src = src;
      }
    });
    return () => cancelAnimationFrame(id);
  }, [activeLetter, activeView, isMobile, showSliders, editorMode, customAlphabet, activeClass]);

  // Render transform-mode resized image
  useEffect(() => {
    if (editorMode !== 'transform' || !transformBox || !transformImageRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      transformImageRef.current,
      transformBox.x,
      transformBox.y,
      transformBox.w,
      transformBox.h
    );
  }, [transformBox, editorMode]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [userMenuOpen]);

  const pickLetter = (ch) => {
    setActiveLetter(ch);
    setActiveCategory(detectCategory(ch));
    setActiveView('editor');
  };

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - rect.left, y: cy - rect.top };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getPos(e);
    isDrawing.current = true;
    lastPos.current = { x, y };
    lastTime.current = Date.now();
    currentWidth.current = baseThickness;
    const ctx = canvasRef.current.getContext('2d');
    ctx.globalAlpha = opacity;
    ctx.fillStyle = '#0a0a0a';
    ctx.strokeStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.arc(x, y, baseThickness / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    const t = Date.now();
    const dist = Math.hypot(x - lastPos.current.x, y - lastPos.current.y);
    const dt = Math.max(1, t - lastTime.current);
    const v = dist / dt;
    const target = Math.max(2, baseThickness - v * 4);
    currentWidth.current += (target - currentWidth.current) * 0.35;
    const ctx = canvasRef.current.getContext('2d');
    ctx.globalAlpha = opacity;
    ctx.lineWidth = currentWidth.current;
    ctx.strokeStyle = '#0a0a0a';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    lastPos.current = { x, y };
    lastTime.current = t;
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  // Resize / transform mode
  const enterTransformMode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const data = ctx.getImageData(0, 0, w, h).data;
    let minX = w, minY = h, maxX = 0, maxY = 0, found = false;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 10) {
          found = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (!found) {
      alert('Draw something first, then resize.');
      return;
    }
    const tmp = document.createElement('canvas');
    tmp.width = maxX - minX;
    tmp.height = maxY - minY;
    tmp.getContext('2d').drawImage(canvas, minX, minY, maxX - minX, maxY - minY, 0, 0, maxX - minX, maxY - minY);
    const img = new Image();
    img.onload = () => {
      transformImageRef.current = img;
      setTransformBox({
        x: minX / dpr,
        y: minY / dpr,
        w: (maxX - minX) / dpr,
        h: (maxY - minY) / dpr,
      });
      setEditorMode('transform');
    };
    img.src = tmp.toDataURL('image/png');
  };

  const exitTransformMode = () => {
    setEditorMode('draw');
    setTransformBox(null);
    transformImageRef.current = null;
  };

  const HANDLE_HIT = 30;
  const onTransformPointerDown = (e) => {
    if (!transformBox) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    const corners = [
      { name: 'tl', cx: transformBox.x, cy: transformBox.y },
      { name: 'tr', cx: transformBox.x + transformBox.w, cy: transformBox.y },
      { name: 'bl', cx: transformBox.x, cy: transformBox.y + transformBox.h },
      { name: 'br', cx: transformBox.x + transformBox.w, cy: transformBox.y + transformBox.h },
    ];
    for (const c of corners) {
      if (Math.abs(x - c.cx) < HANDLE_HIT && Math.abs(y - c.cy) < HANDLE_HIT) {
        transformDragRef.current = {
          kind: 'corner',
          corner: c.name,
          startBox: { ...transformBox },
          startPos: { x, y },
        };
        return;
      }
    }
    if (
      x >= transformBox.x &&
      x <= transformBox.x + transformBox.w &&
      y >= transformBox.y &&
      y <= transformBox.y + transformBox.h
    ) {
      transformDragRef.current = { kind: 'move', startBox: { ...transformBox }, startPos: { x, y } };
    }
  };

  const onTransformPointerMove = (e) => {
    if (!transformDragRef.current) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    const d = transformDragRef.current;
    const dx = x - d.startPos.x;
    const dy = y - d.startPos.y;

    if (d.kind === 'move') {
      setTransformBox({ ...d.startBox, x: d.startBox.x + dx, y: d.startBox.y + dy });
    } else if (d.kind === 'corner') {
      const aspect = d.startBox.w / d.startBox.h;
      const MIN = 16;
      let newW, newH, nx, ny;
      if (d.corner === 'br') {
        newW = Math.max(MIN, d.startBox.w + dx);
        newH = newW / aspect;
        nx = d.startBox.x;
        ny = d.startBox.y;
      } else if (d.corner === 'tl') {
        newW = Math.max(MIN, d.startBox.w - dx);
        newH = newW / aspect;
        nx = d.startBox.x + d.startBox.w - newW;
        ny = d.startBox.y + d.startBox.h - newH;
      } else if (d.corner === 'tr') {
        newW = Math.max(MIN, d.startBox.w + dx);
        newH = newW / aspect;
        nx = d.startBox.x;
        ny = d.startBox.y + d.startBox.h - newH;
      } else {
        newW = Math.max(MIN, d.startBox.w - dx);
        newH = newW / aspect;
        nx = d.startBox.x + d.startBox.w - newW;
        ny = d.startBox.y;
      }
      setTransformBox({ x: nx, y: ny, w: newW, h: newH });
    }
  };

  const onTransformPointerUp = () => {
    transformDragRef.current = null;
  };

  const onCanvasDown = (e) =>
    editorMode === 'transform' ? onTransformPointerDown(e) : startDrawing(e);
  const onCanvasMove = (e) =>
    editorMode === 'transform' ? onTransformPointerMove(e) : draw(e);
  const onCanvasUp = () =>
    editorMode === 'transform' ? onTransformPointerUp() : stopDrawing();

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const dpr = window.devicePixelRatio || 1;
    ctx.scale(dpr, dpr);
    if (editorMode === 'transform') exitTransformMode();
  };

  const eraseLetter = () => {
    clearCanvas();
    setCustomAlphabet((prev) => {
      const next = { ...prev };
      delete next[activeLetter];
      return next;
    });
  };

  // SAVE: capture the active zone region instead of the bounding box.
  // This ensures uppercase A and lowercase a maintain their proper height ratio.
  const saveLetter = () => {
    const src = canvasRef.current;
    const ctx = src.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = src.width;
    const h = src.height;

    // Capture from the zone the active letter belongs in
    const region = getCaptureRegion(activeClass);
    const zoneTopPx = Math.floor(region.top * h);
    const zoneBottomPx = Math.ceil(region.bottom * h);
    const zoneHeight = zoneBottomPx - zoneTopPx;

    // Check that something was drawn anywhere on canvas (not just the zone)
    const data = ctx.getImageData(0, 0, w, h).data;
    let drewSomething = false;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 10) {
        drewSomething = true;
        break;
      }
    }
    if (!drewSomething) {
      alert('The canvas is empty — draw something first.');
      return;
    }

    // Find horizontal bounds within the zone (still trim left/right for ink-only width)
    let minX = w, maxX = 0;
    for (let y = zoneTopPx; y < zoneBottomPx; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
    }
    // Some ink may have been drawn outside the zone — include any column with ink
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 10) {
        const x = Math.floor((i / 4) % w);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
    if (minX >= maxX) {
      alert('Draw inside the visible drawing area first.');
      return;
    }

    // Pad slightly horizontally
    const padX = Math.round(4 * dpr);
    minX = Math.max(0, minX - padX);
    maxX = Math.min(w, maxX + padX);

    const cw = maxX - minX;
    const ch = zoneHeight;
    const tmp = document.createElement('canvas');
    tmp.width = cw;
    tmp.height = ch;
    tmp.getContext('2d').drawImage(src, minX, zoneTopPx, cw, ch, 0, 0, cw, ch);
    const dataUrl = tmp.toDataURL('image/png');

    setCustomAlphabet((prev) => ({
      ...prev,
      [activeLetter]: { src: dataUrl, cls: activeClass },
    }));
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
    if (editorMode === 'transform') exitTransformMode();
  };

  const goToNextLetter = () => {
    const list = CATEGORIES[activeCategory].chars;
    const idx = list.indexOf(activeLetter);
    if (idx < list.length - 1) setActiveLetter(list[idx + 1]);
  };
  const goToPrevLetter = () => {
    const list = CATEGORIES[activeCategory].chars;
    const idx = list.indexOf(activeLetter);
    if (idx > 0) setActiveLetter(list[idx - 1]);
  };

  // Export alphabet sheet as PNG
  const exportSheet = () => {
    if (completedCount === 0) {
      alert('Draw some letters before exporting.');
      return;
    }
    const cell = 200, cols = 7;
    const headerH = 90, footerH = 50, sectionH = 40;
    const sections = ['uppercase', 'lowercase', 'numbers'];
    const totalRows = sections.reduce(
      (sum, s) => sum + Math.ceil(CATEGORIES[s].chars.length / cols),
      0
    );
    const out = document.createElement('canvas');
    out.width = cell * cols;
    out.height = cell * totalRows + headerH + footerH + sectionH * sections.length;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.fillStyle = '#0a0a0a';
    ctx.textAlign = 'center';
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.fillText('My Inkly Alphabet', out.width / 2, 48);
    ctx.fillStyle = '#525252';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText('Hand-drawn at inkly.tech', out.width / 2, 72);
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 1;
    ctx.strokeRect(28, 28, out.width - 56, out.height - 56);

    let pending = ALL_CHARS.length;
    const finish = () => {
      ctx.fillStyle = '#737373';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${completedCount} of ${ALL_CHARS.length} glyphs · inkly.tech`,
        out.width / 2,
        out.height - 20
      );
      const link = document.createElement('a');
      link.download = 'inkly-alphabet.png';
      link.href = out.toDataURL('image/png');
      link.click();
    };

    let yCursor = headerH;
    sections.forEach((sec) => {
      const chars = CATEGORIES[sec].chars;
      ctx.fillStyle = '#4f46e5';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${CATEGORIES[sec].label} · ${counts[sec]}/${chars.length}`, 40, yCursor + 24);
      yCursor += sectionH;
      chars.forEach((letter, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const x = col * cell, y = row * cell + yCursor;
        ctx.strokeStyle = '#e5e5e5';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 8, y + 8, cell - 16, cell - 16);
        ctx.fillStyle = '#a3a3a3';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(letter, x + 16, y + 26);
        const entry = customAlphabet[letter];
        const src = typeof entry === 'string' ? entry : entry?.src;
        if (src) {
          const img = new Image();
          img.onload = () => {
            const inner = cell - 50;
            const ratio = Math.min(inner / img.width, inner / img.height);
            const dw = img.width * ratio, dh = img.height * ratio;
            ctx.drawImage(img, x + (cell - dw) / 2, y + 35 + (inner - dh) / 2, dw, dh);
            if (--pending === 0) finish();
          };
          img.onerror = () => { if (--pending === 0) finish(); };
          img.src = src;
        } else {
          ctx.fillStyle = '#d4d4d4';
          ctx.font = '24px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('—', x + cell / 2, y + cell / 2 + 5);
          if (--pending === 0) finish();
        }
      });
      yCursor += Math.ceil(chars.length / cols) * cell;
    });
  };

  const drawingHint = () => {
    if (activeClass === 'cap') return 'Draw between the cap line and baseline';
    if (activeClass === 'xheight') return 'Draw between the x-height line and baseline';
    if (activeClass === 'ascender') return 'Stem to the cap line, body at x-height to baseline';
    if (activeClass === 'descender') return 'Body at x-height to baseline, tail to descender line';
    return '';
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // =========================================================================
  // EDITOR ZONE OVERLAY — visible guide lines + dimmed inactive zones
  // =========================================================================
  const renderEditorGuides = () => {
    const region = getCaptureRegion(activeClass);
    return (
      <div className="absolute inset-0 pointer-events-none">
        {/* Dim the region above the active zone */}
        {region.top > 0 && (
          <div
            className="absolute left-0 right-0 top-0"
            style={{
              height: `${region.top * 100}%`,
              background: 'rgba(245, 245, 245, 0.6)',
              borderBottom: '1px dashed rgba(99, 102, 241, 0.3)',
            }}
          />
        )}
        {/* Dim the region below the active zone */}
        {region.bottom < 1 && (
          <div
            className="absolute left-0 right-0"
            style={{
              top: `${region.bottom * 100}%`,
              height: `${(1 - region.bottom) * 100}%`,
              background: 'rgba(245, 245, 245, 0.6)',
              borderTop: '1px dashed rgba(99, 102, 241, 0.3)',
            }}
          />
        )}

        {/* Cap line */}
        <div
          className="absolute left-0 right-0"
          style={{
            top: `${CAP_LINE * 100}%`,
            borderTop: activeClass === 'cap' || activeClass === 'ascender' ? '2px solid rgba(99, 102, 241, 0.55)' : '1px dashed rgba(99, 102, 241, 0.35)',
          }}
        >
          <span className="absolute left-3 -top-3 text-[10px] font-semibold text-brand-700 bg-white px-1.5 rounded">
            cap line
          </span>
        </div>

        {/* X-height line */}
        <div
          className="absolute left-0 right-0"
          style={{
            top: `${X_HEIGHT_LINE * 100}%`,
            borderTop: activeClass === 'xheight' || activeClass === 'descender' ? '2px solid rgba(99, 102, 241, 0.55)' : '1px dashed rgba(99, 102, 241, 0.35)',
          }}
        >
          <span className="absolute left-3 -top-3 text-[10px] font-semibold text-brand-700 bg-white px-1.5 rounded">
            x-height
          </span>
        </div>

        {/* Baseline — always strong */}
        <div
          className="absolute left-0 right-0"
          style={{
            top: `${BASELINE * 100}%`,
            borderTop: '2px solid rgba(99, 102, 241, 0.7)',
          }}
        >
          <span className="absolute left-3 -top-4 text-[10px] font-bold text-brand-700 bg-white px-1.5 rounded">
            baseline
          </span>
        </div>

        {/* Descender line */}
        <div
          className="absolute left-0 right-0"
          style={{
            top: `${DESCENDER_LINE * 100}%`,
            borderTop: activeClass === 'descender' ? '2px solid rgba(99, 102, 241, 0.55)' : '1px dashed rgba(99, 102, 241, 0.35)',
          }}
        >
          <span className="absolute left-3 -top-3 text-[10px] font-semibold text-brand-700 bg-white px-1.5 rounded">
            descender
          </span>
        </div>

        {/* Active zone label */}
        <div
          className="absolute right-3 px-2 py-0.5 rounded text-[10px] font-bold bg-brand-600 text-white"
          style={{ top: `${region.top * 100 + 0.5}%` }}
        >
          {activeClass.toUpperCase()} ZONE
        </div>
      </div>
    );
  };

  const renderTransformOverlay = () => {
    if (editorMode !== 'transform' || !transformBox) return null;
    const handleSize = 18;
    const half = handleSize / 2;
    const corners = [
      { l: transformBox.x, t: transformBox.y },
      { l: transformBox.x + transformBox.w, t: transformBox.y },
      { l: transformBox.x, t: transformBox.y + transformBox.h },
      { l: transformBox.x + transformBox.w, t: transformBox.y + transformBox.h },
    ];
    return (
      <>
        <div
          className="absolute pointer-events-none"
          style={{
            left: transformBox.x,
            top: transformBox.y,
            width: transformBox.w,
            height: transformBox.h,
            border: '2px dashed #4f46e5',
            background: 'rgba(99, 102, 241, 0.06)',
          }}
        />
        {corners.map((c, i) => (
          <div
            key={i}
            className="absolute pointer-events-none rounded-full bg-brand-600 border-2 border-white shadow-card"
            style={{
              left: c.l - half,
              top: c.t - half,
              width: handleSize,
              height: handleSize,
            }}
          />
        ))}
      </>
    );
  };

  const renderSidebarContent = (onPick) => (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-2 px-2">
            Workspace
          </p>
          <div className="space-y-1">
            <button
              onClick={() => { setActiveView('editor'); onPick?.(); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-base ${
                activeView === 'editor' ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50'
              }`}
            >
              <Edit3 size={16} />
              <span>Letter Editor</span>
            </button>
            <button
              onClick={() => { setActiveView('notebook'); onPick?.(); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-base ${
                activeView === 'notebook' ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50'
              }`}
            >
              <BookOpen size={16} />
              <span>Notebook</span>
            </button>
          </div>
        </div>

        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-2 px-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                {cat.label}
              </p>
              <span className="text-[10px] font-medium text-ink-400">
                {counts[key]}/{cat.chars.length}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {cat.chars.map((letter) => {
                const drawn = !!customAlphabet[letter];
                const active = activeLetter === letter;
                return (
                  <button
                    key={letter}
                    onClick={() => { pickLetter(letter); onPick?.(); }}
                    className={`relative h-8 rounded-md text-xs font-semibold transition-base ${
                      active
                        ? 'bg-brand-600 text-white shadow-card'
                        : drawn
                        ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                        : 'text-ink-600 hover:bg-ink-100'
                    }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-ink-200">
        <button
          onClick={() => { exportSheet(); onPick?.(); }}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-ink-950 text-white text-sm font-medium hover:bg-ink-800 shadow-card transition-base"
        >
          <Download size={14} />
          <span>Export alphabet</span>
        </button>
      </div>
    </>
  );

  const renderUserMenu = () => (
    <div className="relative" ref={userMenuRef}>
      <button
        onClick={() => setUserMenuOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-ink-100 transition-base"
      >
        <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
          {(session?.user?.email || '?').charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:inline text-sm font-medium text-ink-700 max-w-[140px] truncate">
          {session?.user?.email}
        </span>
      </button>
      {userMenuOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-ink-200 rounded-xl shadow-floating overflow-hidden z-50 animate-fade-in">
          <div className="px-4 py-3 border-b border-ink-100">
            <p className="text-xs text-ink-500">Signed in as</p>
            <p className="text-sm font-medium text-ink-950 truncate">{session?.user?.email}</p>
          </div>
          <button
            onClick={() => { navigate('/'); setUserMenuOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-50 transition-base text-left"
          >
            <Home size={14} />
            <span>Marketing site</span>
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-base text-left"
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );

  const renderTopBar = () => (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-ink-200">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        <div className="flex items-center gap-3 lg:gap-4">
          {isMobile && (
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-1.5 -ml-1.5 rounded-lg hover:bg-ink-100 transition-base"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
          )}
          <Logo size="sm" linkTo={null} />
          <div className="hidden md:flex items-center gap-1.5 text-sm text-ink-400">
            <span>/</span>
            <span className="text-ink-700 font-medium">Workspace</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 text-xs font-semibold">
            {completedCount}/{ALL_CHARS.length}
          </span>
          {renderUserMenu()}
        </div>
      </div>
    </header>
  );

  const renderTextareaPane = (size = 'desktop') => {
    const isM = size === 'mobile';
    return (
      <div className="h-full flex flex-col gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck="false"
          placeholder="Begin writing here…"
          className="flex-1 w-full resize-none outline-none rounded-xl border border-ink-200 bg-white text-ink-900 hover:border-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-base"
          style={{
            padding: isM ? '14px' : '24px',
            fontSize: isM ? '15px' : '16px',
            lineHeight: isM ? '24px' : '26px',
          }}
        />
        <div className="flex items-center justify-between text-xs text-ink-500 px-1">
          <span>
            {text.length} chars · {text.split(/\s+/).filter(Boolean).length} words
          </span>
          {text.length > 0 && (
            <button
              onClick={() => setText('')}
              className="text-ink-500 hover:text-ink-900 underline transition-base"
            >
              Clear text
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderPreviewPane = (size = 'desktop') => {
    const isM = size === 'mobile';
    return (
      <div className="h-full flex flex-col gap-2">
        <div className="flex-1 min-h-0">
          <CalligraphyCanvas
            text={text}
            customAlphabet={customAlphabet}
            capHeight={isM ? 22 : 32}
            padding={isM ? 14 : 28}
            lineSpacing={isM ? 8 : 14}
          />
        </div>
        <p className="text-xs text-ink-500 text-center">
          {completedCount === 0
            ? 'Draw some letters in the editor to see them here.'
            : `${counts.uppercase}/26 uppercase · ${counts.lowercase}/26 lowercase · ${counts.numbers}/10 numbers`}
        </p>
      </div>
    );
  };

  const inTransform = editorMode === 'transform';

  // ============ MOBILE LAYOUT ============
  if (isMobile) {
    return (
      <div
        className="flex flex-col bg-ink-50"
        style={{
          height: '100dvh',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {renderTopBar()}

        <div className="flex gap-1 px-3 py-2 bg-white border-b border-ink-200">
          <button
            onClick={() => setActiveView('editor')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-base ${
              activeView === 'editor' ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100'
            }`}
          >
            <Edit3 size={12} /> Editor
          </button>
          <button
            onClick={() => setActiveView('notebook')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-base ${
              activeView === 'notebook' ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100'
            }`}
          >
            <BookOpen size={12} /> Notebook
          </button>
        </div>

        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {activeView === 'editor' ? (
            <>
              <div className="flex gap-1 px-3 py-1.5 bg-white border-b border-ink-100">
                {Object.entries(CATEGORIES).map(([key, cat]) => (
                  <button
                    key={key}
                    onClick={() => setActiveCategory(key)}
                    className={`flex-1 py-1 rounded-md text-[10px] font-semibold transition-base ${
                      activeCategory === key
                        ? 'bg-brand-50 text-brand-700 border border-brand-200'
                        : 'text-ink-500 border border-transparent hover:bg-ink-50'
                    }`}
                  >
                    {cat.short} · {counts[key]}/{cat.chars.length}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto py-2 px-2 bg-white border-b border-ink-100">
                <div className="flex gap-1 w-max">
                  {CATEGORIES[activeCategory].chars.map((letter) => {
                    const drawn = !!customAlphabet[letter];
                    const active = activeLetter === letter;
                    return (
                      <button
                        key={letter}
                        onClick={() => setActiveLetter(letter)}
                        className={`w-8 h-8 rounded-md text-xs font-semibold transition-base flex-shrink-0 ${
                          active
                            ? 'bg-brand-600 text-white shadow-card'
                            : drawn
                            ? 'bg-brand-50 text-brand-700'
                            : 'text-ink-600 border border-ink-200'
                        }`}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 min-h-0 flex flex-col p-3 gap-2">
                <div className="flex items-center justify-between flex-shrink-0">
                  <button
                    onClick={goToPrevLetter}
                    className="p-1.5 rounded-md hover:bg-ink-100 transition-base text-ink-600"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="text-center flex-1">
                    <div className="text-sm leading-none">
                      <span className="text-xs text-ink-500">{CATEGORIES[activeCategory].label}</span>
                      <span className="ml-2 font-bold text-lg text-brand-600">{activeLetter}</span>
                      {savedFlash && <Check size={12} className="inline ml-2 text-brand-600" />}
                    </div>
                    <p className="text-[10px] text-ink-500 mt-0.5">
                      {inTransform ? 'Drag corners to scale · drag center to move' : drawingHint()}
                    </p>
                  </div>
                  <button
                    onClick={goToNextLetter}
                    className="p-1.5 rounded-md hover:bg-ink-100 transition-base text-ink-600"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div
                  ref={wrapRef}
                  className="flex-1 w-full rounded-xl relative overflow-hidden bg-white border border-ink-200"
                  style={{ minHeight: 0, touchAction: 'none' }}
                >
                  {!inTransform && renderEditorGuides()}
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 touch-none"
                    onMouseDown={onCanvasDown}
                    onMouseMove={onCanvasMove}
                    onMouseUp={onCanvasUp}
                    onMouseLeave={onCanvasUp}
                    onTouchStart={onCanvasDown}
                    onTouchMove={onCanvasMove}
                    onTouchEnd={onCanvasUp}
                  />
                  {renderTransformOverlay()}
                </div>

                <div className="flex-shrink-0">
                  {showSliders && !inTransform && (
                    <div className="p-3 mb-2 rounded-xl bg-white border border-ink-200">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Nib</span>
                            <span className="text-[10px] font-semibold text-brand-600">{baseThickness}</span>
                          </div>
                          <input type="range" min="2" max="30" value={baseThickness}
                            onChange={(e) => setBaseThickness(Number(e.target.value))}
                            className="w-full accent-brand-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Ink</span>
                            <span className="text-[10px] font-semibold text-brand-600">{Math.round(opacity * 100)}%</span>
                          </div>
                          <input type="range" min="0.2" max="1" step="0.05" value={opacity}
                            onChange={(e) => setOpacity(Number(e.target.value))}
                            className="w-full accent-brand-600" />
                        </div>
                      </div>
                    </div>
                  )}

                  {inTransform ? (
                    <button
                      onClick={exitTransformMode}
                      className="w-full py-2.5 rounded-lg font-semibold text-sm bg-brand-600 text-white shadow-card hover:bg-brand-700 transition-base inline-flex items-center justify-center gap-2"
                    >
                      <Check size={14} /> Done — Apply Size
                    </button>
                  ) : (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setShowSliders((s) => !s)}
                        className={`py-2 px-2.5 rounded-lg border border-ink-200 transition-base ${
                          showSliders ? 'bg-ink-100' : 'bg-white hover:bg-ink-50'
                        }`}
                      >
                        <Settings size={14} className="text-ink-600" />
                      </button>
                      <button onClick={clearCanvas}
                        className="py-2 px-2.5 rounded-lg border border-ink-200 bg-white hover:bg-ink-50 transition-base">
                        <Trash2 size={14} className="text-ink-600" />
                      </button>
                      <button onClick={enterTransformMode}
                        className="flex-1 py-2 rounded-lg border border-ink-200 bg-white hover:bg-ink-50 transition-base inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-ink-700">
                        <Maximize2 size={12} /> Resize
                      </button>
                      <button onClick={saveLetter}
                        className="flex-1 py-2 rounded-lg bg-brand-600 text-white shadow-card hover:bg-brand-700 transition-base inline-flex items-center justify-center gap-1.5 text-xs font-semibold">
                        <Save size={12} /> Save
                      </button>
                      <button onClick={() => { saveLetter(); setTimeout(goToNextLetter, 200); }}
                        className="py-2 px-2.5 rounded-lg bg-ink-950 text-white hover:bg-ink-800 transition-base">
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col p-3 gap-2">
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => setNotebookMode('write')}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-base inline-flex items-center justify-center gap-1.5 ${
                    notebookMode === 'write'
                      ? 'bg-brand-600 text-white'
                      : 'text-ink-600 border border-ink-200 bg-white'
                  }`}
                >
                  <PenLine size={12} /> Write
                </button>
                <button
                  onClick={() => setNotebookMode('preview')}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-base inline-flex items-center justify-center gap-1.5 ${
                    notebookMode === 'preview'
                      ? 'bg-brand-600 text-white'
                      : 'text-ink-600 border border-ink-200 bg-white'
                  }`}
                >
                  <Eye size={12} /> Preview
                </button>
              </div>
              <div className="flex-1 min-h-0">
                {notebookMode === 'write'
                  ? renderTextareaPane('mobile')
                  : renderPreviewPane('mobile')}
              </div>
            </div>
          )}
        </main>

        {drawerOpen && (
          <div
            className="fixed inset-0 z-40 bg-ink-950/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col shadow-floating"
              onClick={(e) => e.stopPropagation()}
              style={{
                paddingTop: 'env(safe-area-inset-top, 0px)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              }}
            >
              <div className="flex items-center justify-between p-4 border-b border-ink-200">
                <Logo size="sm" linkTo={null} />
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-600"
                >
                  <X size={18} />
                </button>
              </div>
              {renderSidebarContent(() => setDrawerOpen(false))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============ DESKTOP LAYOUT ============
  return (
    <div className="flex flex-col h-screen bg-ink-50">
      {renderTopBar()}

      <div className="flex-1 min-h-0 flex">
        <aside className="w-72 flex-shrink-0 flex flex-col bg-white border-r border-ink-200">
          {renderSidebarContent()}
        </aside>

        <main className="flex-1 min-h-0 p-6 lg:p-8 overflow-auto">
          {activeView === 'editor' ? (
            <div className="max-w-5xl mx-auto h-full flex flex-col gap-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">
                    {CATEGORIES[activeCategory].label} · {activeClass} zone
                  </p>
                  <h1 className="text-3xl font-bold text-ink-950 tracking-tight">
                    Letter <span className="text-brand-600">{activeLetter}</span>
                  </h1>
                  <p className="text-sm text-ink-500 mt-1">
                    {inTransform
                      ? 'Drag corner handles to resize · drag the box to reposition'
                      : drawingHint()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {savedFlash && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 text-xs font-semibold">
                      <Check size={12} /> Saved
                    </span>
                  )}
                  {customAlphabet[activeLetter] && !savedFlash && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-ink-100 text-ink-600 text-xs font-medium">
                      In your alphabet
                    </span>
                  )}
                </div>
              </div>

              <div
                ref={wrapRef}
                className="flex-1 w-full rounded-2xl bg-white border border-ink-200 shadow-card relative overflow-hidden"
                style={{ cursor: inTransform ? 'move' : 'crosshair' }}
              >
                {!inTransform && renderEditorGuides()}
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 touch-none"
                  onMouseDown={onCanvasDown}
                  onMouseMove={onCanvasMove}
                  onMouseUp={onCanvasUp}
                  onMouseLeave={onCanvasUp}
                  onTouchStart={onCanvasDown}
                  onTouchMove={onCanvasMove}
                  onTouchEnd={onCanvasUp}
                />
                {renderTransformOverlay()}
              </div>

              <div className="p-4 rounded-2xl bg-white border border-ink-200 flex flex-wrap items-center gap-6">
                {!inTransform && (
                  <>
                    <div className="flex-1 min-w-[180px]">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-ink-600">Nib thickness</span>
                        <span className="text-xs font-bold text-brand-600">{baseThickness}px</span>
                      </div>
                      <input type="range" min="2" max="40" value={baseThickness}
                        onChange={(e) => setBaseThickness(Number(e.target.value))}
                        className="w-full accent-brand-600" />
                    </div>
                    <div className="flex-1 min-w-[180px]">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-ink-600">Ink opacity</span>
                        <span className="text-xs font-bold text-brand-600">{Math.round(opacity * 100)}%</span>
                      </div>
                      <input type="range" min="0.2" max="1" step="0.05" value={opacity}
                        onChange={(e) => setOpacity(Number(e.target.value))}
                        className="w-full accent-brand-600" />
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  {inTransform ? (
                    <button onClick={exitTransformMode}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-brand-600 text-white shadow-card hover:bg-brand-700 transition-base text-sm font-semibold">
                      <Check size={14} /> Done — Apply Size
                    </button>
                  ) : (
                    <>
                      <button onClick={clearCanvas}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-ink-200 hover:bg-ink-50 transition-base text-sm font-medium text-ink-700">
                        <Trash2 size={14} /> Clear
                      </button>
                      {customAlphabet[activeLetter] && (
                        <button onClick={eraseLetter}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-red-200 hover:bg-red-50 transition-base text-sm font-medium text-red-700">
                          Erase
                        </button>
                      )}
                      <button onClick={enterTransformMode}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-ink-200 hover:bg-ink-50 transition-base text-sm font-medium text-ink-700">
                        <Maximize2 size={14} /> Resize
                      </button>
                      <button onClick={saveLetter}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-brand-600 text-white shadow-card hover:bg-brand-700 transition-base text-sm font-semibold">
                        <Save size={14} /> Save
                      </button>
                      <button onClick={() => { saveLetter(); setTimeout(goToNextLetter, 200); }}
                        title="Save and advance"
                        className="inline-flex items-center px-3 py-2 rounded-lg bg-ink-950 text-white hover:bg-ink-800 transition-base">
                        <ChevronRight size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto h-full flex flex-col gap-4">
              <div>
                <h1 className="text-3xl font-bold text-ink-950 tracking-tight">Notebook</h1>
                <p className="text-sm text-ink-500 mt-1">
                  Write on the left — your custom letters appear on the right.
                </p>
              </div>
              <div className="flex-1 min-h-0 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-600 flex items-center gap-1.5">
                    <PenLine size={12} /> Write
                  </p>
                  <div className="flex-1 min-h-0">{renderTextareaPane('desktop')}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-600 flex items-center gap-1.5">
                    <Eye size={12} /> Calligraphy preview
                  </p>
                  <div className="flex-1 min-h-0">{renderPreviewPane('desktop')}</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
