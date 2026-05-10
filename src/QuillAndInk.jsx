import React, { useState, useRef, useEffect } from 'react';
import { Feather, BookOpen, Download, Trash2, Save, Sparkles, Check, Edit3, Menu, X, ChevronRight, ChevronLeft, Eye, PenLine, Maximize2, LogOut } from 'lucide-react';
import { supabase } from './supabase';

const C = {
  parchment: '#f4ecd8',
  parchmentLight: '#fdfaf3',
  parchmentDark: '#ece3c6',
  notebook: '#f0e6ce',
  ink: '#3b2f2f',
  inkSoft: 'rgba(59, 47, 47, 0.6)',
  brass: '#b5a642',
  brassDark: '#8a7d2e',
};

const CATEGORIES = {
  uppercase: { label: 'Uppercase', short: 'A–Z', chars: Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)) },
  lowercase: { label: 'Lowercase', short: 'a–z', chars: Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i)) },
  numbers:   { label: 'Numbers',   short: '0–9', chars: '0123456789'.split('') },
};
const ALL_CHARS = [...CATEGORIES.uppercase.chars, ...CATEGORIES.lowercase.chars, ...CATEGORIES.numbers.chars];

const DESCENDERS = 'gjpqy';
const ASCENDERS = 'bdfhklt';
const DOTTED = 'ij';
const X_HEIGHT_RATIO = 0.55;
const ASCENDER_RATIO = 0.92;
const DESCENDER_BODY_RATIO = 0.55;
const DESCENDER_TAIL_RATIO = 0.25;

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

const getBodyHeight = (cls) => {
  if (cls === 'cap') return 1.0;
  if (cls === 'ascender') return ASCENDER_RATIO;
  if (cls === 'descender') return DESCENDER_BODY_RATIO + DESCENDER_TAIL_RATIO;
  return X_HEIGHT_RATIO;
};

const CalligraphyCanvas = ({ text, customAlphabet, capHeight, padding, lineSpacing }) => {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const cacheRef = useRef({});
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Object.entries(customAlphabet).forEach(([ch, src]) => {
      if (cacheRef.current[src]) return;
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        cacheRef.current[src] = img;
        setTick(n => n + 1);
      };
      img.src = src;
    });
    return () => { cancelled = true; };
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
      const bodyH = capHeight * getBodyHeight(cls);
      const drop = cls === 'descender' ? capHeight * DESCENDER_TAIL_RATIO : 0;
      const src = customAlphabet[ch];
      if (src && cacheRef.current[src]) {
        const img = cacheRef.current[src];
        const aspectRatio = img.naturalWidth / img.naturalHeight || 1;
        const w = bodyH * aspectRatio;
        return { type: 'img', img, w, h: bodyH, drop, ch, cls };
      }
      const fontSize = bodyH * 1.1;
      measureCtx.font = `${fontSize}px Georgia, serif`;
      const w = measureCtx.measureText(ch).width;
      return { type: 'text', ch, w, h: bodyH, drop, fontSize, cls };
    };

    const tokens = [];
    let buf = [];
    const flush = () => { if (buf.length) { tokens.push({ kind: 'word', chars: buf }); buf = []; } };
    for (const ch of text) {
      if (ch === '\n') { flush(); tokens.push({ kind: 'newline' }); }
      else if (ch === ' ' || ch === '\t') { flush(); tokens.push({ kind: 'space' }); }
      else buf.push(ch);
    }
    flush();

    const sized = tokens.map(tk => {
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
      if (tk.kind === 'newline') { lines.push(line); line = []; curX = padding; atStart = true; }
      else if (tk.kind === 'space') { if (!atStart) { line.push({ kind: 'space' }); curX += wordGap; } }
      else {
        if (curX + tk.width > maxX && !atStart) {
          while (line.length && line[line.length - 1].kind === 'space') line.pop();
          lines.push(line); line = []; curX = padding; atStart = true;
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

    ctx.strokeStyle = 'rgba(181, 166, 66, 0.3)';
    ctx.lineWidth = 1;
    const visibleLines = Math.ceil((H - padding) / lineH) + 1;
    for (let i = 0; i < visibleLines; i++) {
      const y = Math.round(padding + (i + 1) * lineH - capHeight * 0.2) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    ctx.fillStyle = C.ink;
    ctx.textBaseline = 'alphabetic';

    lines.forEach((ln, li) => {
      const baselineY = padding + (li + 1) * lineH - capHeight * 0.2;
      ln.forEach(tk => {
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
            const bottom = baselineY + g.drop;
            ctx.drawImage(g.img, x, bottom - g.h + wobble, g.w, g.h);
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
    const obs = new ResizeObserver(() => setTick(n => n + 1));
    obs.observe(wrap);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={wrapRef}
      className="w-full h-full overflow-y-auto rounded shadow-md relative"
      style={{
        background: C.notebook,
        borderLeft: `3px solid ${C.brass}`,
        boxShadow: 'inset 0 0 12px rgba(59,47,47,0.05)',
      }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      {text.length === 0 && (
        <div className="absolute top-0 left-0 italic pointer-events-none"
          style={{ color: C.inkSoft, padding, fontSize: capHeight * 0.6 }}>
          (empty — type something on the left)
        </div>
      )}
    </div>
  );
};

export default function VintageCalligraphyApp({ session }) {
  const [customAlphabet, setCustomAlphabet] = useState({});
  const [syncing, setSyncing] = useState(true);
  const [activeLetter, setActiveLetter] = useState('A');
  const [activeCategory, setActiveCategory] = useState('uppercase');
  const [activeView, setActiveView] = useState('editor');
  const [text, setText] = useState('Dear friend,\n\nI am writing this in my own hand. The words flow together — each curve is mine.');
  const [notebookMode, setNotebookMode] = useState('write');
  const [baseThickness, setBaseThickness] = useState(10);
  const [opacity, setOpacity] = useState(0.88);
  const [savedFlash, setSavedFlash] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSliders, setShowSliders] = useState(false);

  const [editorMode, setEditorMode] = useState('draw');
  const [transformBox, setTransformBox] = useState(null);
  const transformImageRef = useRef(null);
  const transformDragRef = useRef(null);

  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const textareaRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastTime = useRef(0);
  const currentWidth = useRef(baseThickness);

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
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  useEffect(() => {
    if (syncing || !session?.user) return;
    const t = setTimeout(async () => {
      await supabase.from('alphabets').upsert({
        user_id: session.user.id,
        glyphs: customAlphabet,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    }, 1000);
    return () => clearTimeout(t);
  }, [customAlphabet, session?.user?.id, syncing]);

  const completedCount = Object.keys(customAlphabet).length;
  const counts = {
    uppercase: CATEGORIES.uppercase.chars.filter(c => customAlphabet[c]).length,
    lowercase: CATEGORIES.lowercase.chars.filter(c => customAlphabet[c]).length,
    numbers: CATEGORIES.numbers.chars.filter(c => customAlphabet[c]).length,
  };

  const detectCategory = (ch) => {
    if (CATEGORIES.uppercase.chars.includes(ch)) return 'uppercase';
    if (CATEGORIES.lowercase.chars.includes(ch)) return 'lowercase';
    return 'numbers';
  };

  const activeClass = classifyChar(activeLetter);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    setEditorMode('draw');
    setTransformBox(null);
    transformImageRef.current = null;
  }, [activeLetter, activeView]);

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
      if (customAlphabet[activeLetter]) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, w, h);
        img.src = customAlphabet[activeLetter];
      }
    });
    return () => cancelAnimationFrame(id);
  }, [activeLetter, activeView, isMobile, showSliders, editorMode, customAlphabet]);

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
    ctx.drawImage(transformImageRef.current, transformBox.x, transformBox.y, transformBox.w, transformBox.h);
  }, [transformBox, editorMode]);

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
    ctx.fillStyle = C.ink;
    ctx.strokeStyle = C.ink;
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
    ctx.strokeStyle = C.ink;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    lastPos.current = { x, y };
    lastTime.current = t;
  };

  const stopDrawing = () => { isDrawing.current = false; };

  const enterTransformMode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
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
        transformDragRef.current = { kind: 'corner', corner: c.name, startBox: { ...transformBox }, startPos: { x, y } };
        return;
      }
    }
    if (x >= transformBox.x && x <= transformBox.x + transformBox.w &&
        y >= transformBox.y && y <= transformBox.y + transformBox.h) {
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
        nx = d.startBox.x; ny = d.startBox.y;
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

  const onTransformPointerUp = () => { transformDragRef.current = null; };

  const onCanvasDown = (e) => editorMode === 'transform' ? onTransformPointerDown(e) : startDrawing(e);
  const onCanvasMove = (e) => editorMode === 'transform' ? onTransformPointerMove(e) : draw(e);
  const onCanvasUp = () => editorMode === 'transform' ? onTransformPointerUp() : stopDrawing();

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
    setCustomAlphabet(prev => {
      const next = { ...prev };
      delete next[activeLetter];
      return next;
    });
  };

  const saveLetter = () => {
    const src = canvasRef.current;
    const ctx = src.getContext('2d');
    const w = src.width, h = src.height;
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
      alert("The inkwell is dry — draw something first.");
      return;
    }
    const padX = 2, padY = 2;
    minX = Math.max(0, minX - padX); minY = Math.max(0, minY - padY);
    maxX = Math.min(w, maxX + padX); maxY = Math.min(h, maxY + padY);
    const cw = maxX - minX, ch = maxY - minY;
    const tmp = document.createElement('canvas');
    tmp.width = cw; tmp.height = ch;
    tmp.getContext('2d').drawImage(src, minX, minY, cw, ch, 0, 0, cw, ch);
    const dataUrl = tmp.toDataURL('image/png');
    setCustomAlphabet(prev => ({ ...prev, [activeLetter]: dataUrl }));
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

  const exportSheet = () => {
    if (completedCount === 0) {
      alert("Your inkwell is empty — draw some letters before exporting.");
      return;
    }
    const cell = 200, cols = 7;
    const headerH = 90, footerH = 50, sectionH = 40;
    const sections = ['uppercase', 'lowercase', 'numbers'];
    const totalRows = sections.reduce((sum, s) => sum + Math.ceil(CATEGORIES[s].chars.length / cols), 0);
    const out = document.createElement('canvas');
    out.width = cell * cols;
    out.height = cell * totalRows + headerH + footerH + sectionH * sections.length;
    const ctx = out.getContext('2d');
    ctx.fillStyle = C.parchment;
    ctx.fillRect(0, 0, out.width, out.height);
    const grad = ctx.createRadialGradient(out.width/2, out.height/2, 100, out.width/2, out.height/2, out.width/1.2);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(59,47,47,0.12)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.fillStyle = C.ink;
    ctx.textAlign = 'center';
    ctx.font = 'italic 32px Georgia, serif';
    ctx.fillText('My Vintage Alphabet', out.width / 2, 48);
    ctx.fillStyle = C.brass;
    ctx.font = 'italic 14px Georgia, serif';
    ctx.fillText('— hand-drawn in Inkly —', out.width / 2, 72);
    ctx.strokeStyle = C.brass;
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, out.width - 40, out.height - 40);
    ctx.lineWidth = 1;
    ctx.strokeRect(28, 28, out.width - 56, out.height - 56);

    let pending = ALL_CHARS.length;
    const finish = () => {
      ctx.fillStyle = C.brass;
      ctx.font = 'italic 14px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(`✦  ${completedCount} of ${ALL_CHARS.length} glyphs inscribed  ✦`, out.width / 2, out.height - 20);
      const link = document.createElement('a');
      link.download = 'inkly-alphabet.png';
      link.href = out.toDataURL('image/png');
      link.click();
    };

    let yCursor = headerH;
    sections.forEach((sec) => {
      const chars = CATEGORIES[sec].chars;
      ctx.fillStyle = C.brassDark;
      ctx.font = 'bold italic 18px Georgia, serif';
      ctx.textAlign = 'left';
      ctx.fillText(`✦ ${CATEGORIES[sec].label} (${counts[sec]}/${chars.length})`, 40, yCursor + 24);
      yCursor += sectionH;
      chars.forEach((letter, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const x = col * cell, y = row * cell + yCursor;
        ctx.strokeStyle = 'rgba(181, 166, 66, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 8, y + 8, cell - 16, cell - 16);
        ctx.fillStyle = C.brass;
        ctx.font = 'bold 13px Georgia, serif';
        ctx.textAlign = 'left';
        ctx.fillText(letter, x + 16, y + 26);
        if (customAlphabet[letter]) {
          const img = new Image();
          img.onload = () => {
            const inner = cell - 50;
            const ratio = Math.min(inner / img.width, inner / img.height);
            const dw = img.width * ratio, dh = img.height * ratio;
            ctx.drawImage(img, x + (cell - dw) / 2, y + 35 + (inner - dh) / 2, dw, dh);
            if (--pending === 0) finish();
          };
          img.onerror = () => { if (--pending === 0) finish(); };
          img.src = customAlphabet[letter];
        } else {
          ctx.fillStyle = 'rgba(59, 47, 47, 0.2)';
          ctx.font = 'italic 24px Georgia, serif';
          ctx.textAlign = 'center';
          ctx.fillText('—', x + cell / 2, y + cell / 2 + 5);
          if (--pending === 0) finish();
        }
      });
      yCursor += Math.ceil(chars.length / cols) * cell;
    });
  };

  const drawingHint = () => {
    if (activeClass === 'cap') return 'Cap line to baseline';
    if (activeClass === 'xheight') return 'X-height to baseline (small body)';
    if (activeClass === 'ascender') return 'Body x-height; stem to cap';
    if (activeClass === 'descender') return 'Body x-height; tail to desc';
    return '';
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const renderEditorGuides = (category, mobile = false) => {
    const CAP = 0.18, XHEIGHT = 0.42, BASE = 0.78, DESC = 0.94;
    const showXHeight = category === 'lowercase';
    return (
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-0 right-0" style={{ top: `${CAP * 100}%`, borderTop: `1px dashed ${C.brass}55` }}>
          {!mobile && <span className="absolute left-2 -top-3 text-[10px] italic" style={{ color: C.brass, opacity: 0.7 }}>cap</span>}
        </div>
        {showXHeight && (
          <div className="absolute left-0 right-0" style={{ top: `${XHEIGHT * 100}%`, borderTop: `1px dashed ${C.brass}88` }}>
            {!mobile && <span className="absolute left-2 -top-3 text-[10px] italic font-bold" style={{ color: C.brassDark }}>x-height</span>}
          </div>
        )}
        <div className="absolute left-0 right-0" style={{ top: `${BASE * 100}%`, borderTop: `2px solid ${C.brass}99` }}>
          {!mobile && <span className="absolute left-2 -top-4 text-[10px] italic font-bold" style={{ color: C.brassDark }}>baseline</span>}
        </div>
        <div className="absolute left-0 right-0" style={{ top: `${DESC * 100}%`, borderTop: `1px dashed ${C.brass}55` }}>
          {!mobile && <span className="absolute left-2 -top-3 text-[10px] italic" style={{ color: C.brass, opacity: 0.7 }}>desc</span>}
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
        <div className="absolute pointer-events-none"
          style={{
            left: transformBox.x, top: transformBox.y,
            width: transformBox.w, height: transformBox.h,
            border: `2px dashed ${C.brass}`,
            background: 'rgba(181, 166, 66, 0.05)',
          }} />
        {corners.map((c, i) => (
          <div key={i} className="absolute pointer-events-none rounded-full"
            style={{
              left: c.l - half, top: c.t - half,
              width: handleSize, height: handleSize,
              background: C.brass,
              border: `2px solid ${C.parchment}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }} />
        ))}
      </>
    );
  };

  const renderAlphabetPanel = (onPick) => (
    <>
      <div className="p-4 text-center" style={{ borderBottom: `1px solid ${C.brass}55` }}>
        <Feather size={24} className="mx-auto mb-1" style={{ color: C.brass }} />
        <h1 className="text-xl font-bold tracking-widest uppercase" style={{ color: C.ink }}>Inkly</h1>
        <p className="text-xs italic truncate" style={{ color: C.brassDark }}>{session?.user?.email}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <h3 className="text-xs uppercase tracking-widest font-bold mb-2 pl-1" style={{ color: C.brassDark }}>Views</h3>
        <button onClick={() => { setActiveView('editor'); onPick?.(); }}
          className="w-full text-left px-3 py-2 rounded flex items-center gap-2"
          style={activeView === 'editor' ? { background: C.brass, color: C.parchment, fontWeight: 600 } : { color: C.ink }}>
          <Edit3 size={16} /> Letter Editor
        </button>
        <button onClick={() => { setActiveView('notebook'); onPick?.(); }}
          className="w-full text-left px-3 py-2 rounded flex items-center gap-2"
          style={activeView === 'notebook' ? { background: C.brass, color: C.parchment, fontWeight: 600 } : { color: C.ink }}>
          <BookOpen size={16} /> Notebook
        </button>
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <div key={key}>
            <div className="flex items-center justify-between mt-5 mb-2 pl-1">
              <h3 className="text-xs uppercase tracking-widest font-bold" style={{ color: C.brassDark }}>
                {cat.label}
              </h3>
              <span className="text-xs italic" style={{ color: C.inkSoft }}>{counts[key]}/{cat.chars.length}</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {cat.chars.map(letter => {
                const drawn = !!customAlphabet[letter];
                const active = activeLetter === letter;
                return (
                  <button key={letter}
                    onClick={() => { pickLetter(letter); onPick?.(); }}
                    className="relative h-9 rounded text-sm font-bold flex items-center justify-center"
                    style={active
                      ? { background: C.brass, color: C.parchment }
                      : { background: drawn ? 'rgba(181,166,66,0.2)' : 'transparent', color: C.ink, border: `1px solid ${C.brass}55` }}>
                    {letter}
                    {drawn && !active && <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full" style={{ background: C.brass }} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 space-y-2" style={{ borderTop: `1px solid ${C.brass}55` }}>
        <button onClick={() => { exportSheet(); onPick?.(); }}
          className="w-full py-2.5 rounded font-semibold shadow-md flex items-center justify-center gap-2"
          style={{ background: C.brass, color: C.parchment }}>
          <Download size={16} /> Export Alphabet
        </button>
        <button onClick={handleSignOut}
          className="w-full py-2 rounded text-xs flex items-center justify-center gap-1.5"
          style={{ border: `1px solid ${C.brass}55`, color: C.inkSoft }}>
          <LogOut size={12} /> Sign out
        </button>
      </div>
    </>
  );

  const renderTextareaPane = (size = 'desktop') => {
    const isM = size === 'mobile';
    return (
      <div className="relative h-full flex flex-col">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck="false"
          placeholder="Begin writing here…"
          className="flex-1 w-full resize-none outline-none"
          style={{
            background: C.notebook,
            color: C.ink,
            borderLeft: `${isM ? 3 : 4}px solid ${C.brass}`,
            borderRadius: '4px',
            padding: isM ? '12px' : '32px',
            fontFamily: 'Georgia, serif',
            fontSize: isM ? '15px' : '18px',
            lineHeight: isM ? '24px' : '32px',
            backgroundImage: `linear-gradient(transparent 0px, transparent ${isM ? 23 : 31}px, rgba(181, 166, 66, 0.3) ${isM ? 24 : 32}px)`,
            backgroundSize: `100% ${isM ? 24 : 32}px`,
            backgroundAttachment: 'local',
            boxShadow: 'inset 0 0 12px rgba(59,47,47,0.05)',
          }}
        />
        <div className="mt-1.5 flex items-center justify-between text-[11px] italic" style={{ color: C.inkSoft }}>
          <span>{text.length} chars · {text.split(/\s+/).filter(Boolean).length} words</span>
          {text.length > 0 && (
            <button onClick={() => setText('')} className="underline" style={{ color: C.brassDark }}>
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
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 relative">
          <CalligraphyCanvas
            text={text}
            customAlphabet={customAlphabet}
            capHeight={isM ? 22 : 32}
            padding={isM ? 14 : 28}
            lineSpacing={isM ? 8 : 14}
          />
        </div>
        <div className="mt-1.5 text-[11px] italic text-center" style={{ color: C.inkSoft }}>
          {completedCount === 0
            ? 'No glyphs drawn — open Editor.'
            : `${counts.uppercase}/26 · ${counts.lowercase}/26 · ${counts.numbers}/10`}
        </div>
      </div>
    );
  };

  if (isMobile) {
    const inTransform = editorMode === 'transform';
    return (
      <div className="flex flex-col font-serif relative overflow-hidden"
        style={{
          background: C.parchment, color: C.ink,
          fontFamily: '"Playfair Display", Georgia, serif',
          height: '100dvh',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}>
        <header className="flex items-center justify-between px-2 py-1.5 z-20 flex-shrink-0"
          style={{ background: C.parchmentDark, borderBottom: `1px solid ${C.brass}66` }}>
          <button onClick={() => setDrawerOpen(true)} className="p-1.5 rounded" style={{ color: C.ink }}>
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-1.5">
            <Feather size={14} style={{ color: C.brass }} />
            <h1 className="text-xs font-bold tracking-widest uppercase">Inkly</h1>
          </div>
          <div className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: 'rgba(181,166,66,0.2)', color: C.brassDark }}>
            {completedCount}/{ALL_CHARS.length}
          </div>
        </header>
        <div className="flex flex-shrink-0" style={{ background: C.parchmentDark, borderBottom: `1px solid ${C.brass}33` }}>
          <button onClick={() => setActiveView('editor')}
            className="flex-1 py-1 text-[11px] font-semibold flex items-center justify-center gap-1"
            style={activeView === 'editor' ? { background: C.brass, color: C.parchment } : { color: C.inkSoft }}>
            <Edit3 size={11} /> Editor
          </button>
          <button onClick={() => setActiveView('notebook')}
            className="flex-1 py-1 text-[11px] font-semibold flex items-center justify-center gap-1"
            style={activeView === 'notebook' ? { background: C.brass, color: C.parchment } : { color: C.inkSoft }}>
            <BookOpen size={11} /> Notebook
          </button>
        </div>
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {activeView === 'editor' ? (
            <>
              <div className="flex gap-1 px-2 py-1 flex-shrink-0" style={{ background: C.parchmentDark, borderBottom: `1px solid ${C.brass}22` }}>
                {Object.entries(CATEGORIES).map(([key, cat]) => (
                  <button key={key} onClick={() => setActiveCategory(key)}
                    className="flex-1 py-0.5 rounded text-[10px] font-semibold"
                    style={activeCategory === key
                      ? { background: 'rgba(181,166,66,0.4)', color: C.ink, border: `1px solid ${C.brass}` }
                      : { color: C.inkSoft, border: `1px solid ${C.brass}33` }}>
                    {cat.short} · {counts[key]}/{cat.chars.length}
                  </button>
                ))}
              </div>
              <div className="overflow-x-auto py-1 px-1.5 flex-shrink-0"
                style={{ background: C.parchmentDark, borderBottom: `1px solid ${C.brass}33`, WebkitOverflowScrolling: 'touch' }}>
                <div className="flex gap-1 w-max">
                  {CATEGORIES[activeCategory].chars.map(letter => {
                    const drawn = !!customAlphabet[letter];
                    const active = activeLetter === letter;
                    return (
                      <button key={letter} onClick={() => setActiveLetter(letter)}
                        className="relative w-8 h-8 rounded font-bold text-xs flex-shrink-0"
                        style={active
                          ? { background: C.brass, color: C.parchment }
                          : { background: drawn ? 'rgba(181,166,66,0.2)' : 'transparent', color: C.ink, border: `1px solid ${C.brass}55` }}>
                        {letter}
                        {drawn && !active && (
                          <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full" style={{ background: C.brass }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex-1 min-h-0 flex flex-col p-2 gap-1.5">
                <div className="flex items-center justify-between flex-shrink-0">
                  <button onClick={goToPrevLetter} className="p-1 rounded" style={{ color: C.inkSoft }}>
                    <ChevronLeft size={16} />
                  </button>
                  <div className="text-center flex-1">
                    <div className="text-base leading-none">
                      <span className="italic text-xs" style={{ color: C.inkSoft }}>{CATEGORIES[activeCategory].label.charAt(0)}</span>{' '}
                      <span className="font-bold text-xl" style={{ color: C.brass }}>{activeLetter}</span>
                      {savedFlash && <Check size={12} className="inline ml-1.5" style={{ color: C.brass }} />}
                      {!savedFlash && customAlphabet[activeLetter] && <span className="ml-1.5 w-1.5 h-1.5 inline-block rounded-full align-middle" style={{ background: C.brass }} />}
                    </div>
                    <div className="text-[10px] italic" style={{ color: inTransform ? C.brass : C.inkSoft }}>
                      {inTransform ? 'Drag corners to scale · drag center to move' : drawingHint()}
                    </div>
                  </div>
                  <button onClick={goToNextLetter} className="p-1 rounded" style={{ color: C.inkSoft }}>
                    <ChevronRight size={16} />
                  </button>
                </div>
                <div ref={wrapRef}
                  className="flex-1 w-full rounded relative overflow-hidden"
                  style={{ background: C.parchmentLight, border: `1px solid ${C.brass}55`, minHeight: 0, touchAction: 'none' }}>
                  {!inTransform && renderEditorGuides(activeCategory, true)}
                  <canvas ref={canvasRef}
                    className="absolute inset-0 touch-none"
                    onMouseDown={onCanvasDown} onMouseMove={onCanvasMove} onMouseUp={onCanvasUp} onMouseLeave={onCanvasUp}
                    onTouchStart={onCanvasDown} onTouchMove={onCanvasMove} onTouchEnd={onCanvasUp} />
                  {renderTransformOverlay()}
                </div>
                <div className="flex-shrink-0">
                  {showSliders && !inTransform && (
                    <div className="p-2 mb-1.5 rounded text-xs" style={{ background: C.parchmentDark, border: `1px solid ${C.brass}55` }}>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between mb-0.5">
                            <span className="uppercase tracking-wider font-semibold text-[10px]">Nib</span>
                            <span className="text-[10px]" style={{ color: C.brass }}>{baseThickness}</span>
                          </div>
                          <input type="range" min="2" max="30" value={baseThickness}
                            onChange={(e) => setBaseThickness(Number(e.target.value))}
                            className="w-full h-4" style={{ accentColor: C.brass }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-0.5">
                            <span className="uppercase tracking-wider font-semibold text-[10px]">Ink</span>
                            <span className="text-[10px]" style={{ color: C.brass }}>{Math.round(opacity * 100)}%</span>
                          </div>
                          <input type="range" min="0.2" max="1" step="0.05" value={opacity}
                            onChange={(e) => setOpacity(Number(e.target.value))}
                            className="w-full h-4" style={{ accentColor: C.brass }} />
                        </div>
                      </div>
                    </div>
                  )}
                  {inTransform ? (
                    <div className="flex gap-1">
                      <button onClick={exitTransformMode}
                        className="flex-1 py-2.5 rounded font-semibold flex items-center justify-center gap-1.5 shadow"
                        style={{ background: C.brass, color: C.parchment }}>
                        <Check size={14} /> Done — Apply Size
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <button onClick={() => setShowSliders(s => !s)}
                        className="py-2 px-2.5 rounded text-[10px] font-semibold"
                        style={{ border: `1px solid ${C.brass}88`, color: C.ink, background: showSliders ? 'rgba(181,166,66,0.15)' : 'transparent' }}>
                        ⚙
                      </button>
                      <button onClick={clearCanvas}
                        className="py-2 px-2 rounded flex items-center justify-center text-[11px]"
                        style={{ border: `1px solid ${C.brass}88`, color: C.ink }}>
                        <Trash2 size={12} />
                      </button>
                      <button onClick={enterTransformMode}
                        className="flex-1 py-2 rounded flex items-center justify-center gap-1 text-[11px] font-semibold"
                        style={{ border: `1px solid ${C.brass}88`, color: C.ink, background: 'rgba(181,166,66,0.1)' }}>
                        <Maximize2 size={12} /> Resize
                      </button>
                      <button onClick={saveLetter}
                        className="flex-1 py-2 rounded font-semibold flex items-center justify-center gap-1 text-[11px] shadow"
                        style={{ background: C.brass, color: C.parchment }}>
                        <Save size={12} /> Save
                      </button>
                      <button onClick={() => { saveLetter(); setTimeout(goToNextLetter, 200); }}
                        className="py-2 px-2.5 rounded"
                        style={{ background: C.brassDark, color: C.parchment }}>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col p-2 gap-1.5">
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => setNotebookMode('write')}
                  className="flex-1 py-1.5 rounded text-[11px] font-semibold flex items-center justify-center gap-1"
                  style={notebookMode === 'write' ? { background: C.brass, color: C.parchment } : { color: C.inkSoft, border: `1px solid ${C.brass}55` }}>
                  <PenLine size={11} /> Write
                </button>
                <button onClick={() => setNotebookMode('preview')}
                  className="flex-1 py-1.5 rounded text-[11px] font-semibold flex items-center justify-center gap-1"
                  style={notebookMode === 'preview' ? { background: C.brass, color: C.parchment } : { color: C.inkSoft, border: `1px solid ${C.brass}55` }}>
                  <Eye size={11} /> Preview
                </button>
              </div>
              <div className="flex-1 min-h-0">
                {notebookMode === 'write' ? renderTextareaPane('mobile') : renderPreviewPane('mobile')}
              </div>
            </div>
          )}
        </main>
        {drawerOpen && (
          <div className="fixed inset-0 z-30" onClick={() => setDrawerOpen(false)}
            style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="absolute left-0 top-0 bottom-0 flex flex-col shadow-2xl"
              style={{
                background: C.parchmentDark,
                width: 'min(280px, 80vw)',
                paddingTop: 'env(safe-area-inset-top, 0px)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              }}
              onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setDrawerOpen(false)}
                className="absolute top-2 right-2 p-1.5 rounded z-10"
                style={{ color: C.inkSoft }}>
                <X size={18} />
              </button>
              {renderAlphabetPanel(() => setDrawerOpen(false))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const inTransform = editorMode === 'transform';
  return (
    <div className="flex h-screen overflow-hidden font-serif" style={{ background: C.parchment, color: C.ink, fontFamily: '"Playfair Display", Georgia, serif' }}>
      <aside className="w-72 flex flex-col shadow-2xl z-10" style={{ background: C.parchmentDark, borderRight: `1px solid ${C.brass}66` }}>
        {renderAlphabetPanel()}
      </aside>
      <main className="flex-1 p-6 relative overflow-hidden">
        <Sparkles size={24} className="absolute top-4 right-6 opacity-30" style={{ color: C.brass }} />
        {activeView === 'editor' ? (
          <div className="h-full max-w-5xl mx-auto flex flex-col gap-4 p-6 rounded-lg shadow-inner"
            style={{ border: `2px dashed ${C.brass}66`, background: C.parchment }}>
            <div className="flex justify-between items-end pb-2" style={{ borderBottom: `1px solid ${C.brass}55` }}>
              <div>
                <h2 className="text-3xl italic">
                  {CATEGORIES[activeCategory].label}:{' '}
                  <span className="font-bold not-italic" style={{ color: C.brass }}>{activeLetter}</span>
                </h2>
                <p className="text-xs italic mt-1" style={{ color: inTransform ? C.brass : C.inkSoft }}>
                  {inTransform ? 'Drag corner handles to resize · drag the box to reposition' : drawingHint()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {savedFlash && <span className="text-sm italic flex items-center gap-1" style={{ color: C.brass }}><Check size={14} /> Inscribed</span>}
                {customAlphabet[activeLetter] && !savedFlash && <span className="text-sm italic" style={{ color: C.inkSoft }}>Saved in notebook</span>}
              </div>
            </div>
            <div ref={wrapRef}
              className="flex-1 w-full rounded shadow-sm relative overflow-hidden"
              style={{ background: C.parchmentLight, border: `1px solid ${C.brass}55`, cursor: inTransform ? 'move' : 'crosshair' }}>
              {!inTransform && renderEditorGuides(activeCategory)}
              <canvas ref={canvasRef}
                className="absolute inset-0 touch-none"
                onMouseDown={onCanvasDown} onMouseMove={onCanvasMove} onMouseUp={onCanvasUp} onMouseLeave={onCanvasUp}
                onTouchStart={onCanvasDown} onTouchMove={onCanvasMove} onTouchEnd={onCanvasUp} />
              {renderTransformOverlay()}
            </div>
            <div className="p-4 rounded shadow-sm flex flex-wrap gap-6 items-center"
              style={{ background: C.parchmentDark, border: `1px solid ${C.brass}55` }}>
              {!inTransform && (
                <>
                  <div className="flex-1 min-w-48 flex flex-col gap-1">
                    <label className="text-xs uppercase tracking-widest font-semibold flex justify-between">
                      <span>Nib Thickness</span><span style={{ color: C.brass }}>{baseThickness}px</span>
                    </label>
                    <input type="range" min="2" max="40" value={baseThickness}
                      onChange={(e) => setBaseThickness(Number(e.target.value))}
                      style={{ accentColor: C.brass }} />
                  </div>
                  <div className="flex-1 min-w-48 flex flex-col gap-1">
                    <label className="text-xs uppercase tracking-widest font-semibold flex justify-between">
                      <span>Ink Opacity</span><span style={{ color: C.brass }}>{Math.round(opacity * 100)}%</span>
                    </label>
                    <input type="range" min="0.2" max="1" step="0.05" value={opacity}
                      onChange={(e) => setOpacity(Number(e.target.value))}
                      style={{ accentColor: C.brass }} />
                  </div>
                </>
              )}
              <div className="flex gap-2 ml-auto">
                {inTransform ? (
                  <button onClick={exitTransformMode}
                    className="px-6 py-2 rounded font-semibold shadow-md flex items-center gap-1.5 hover:opacity-90"
                    style={{ background: C.brass, color: C.parchment }}>
                    <Check size={14} /> Done — Apply Size
                  </button>
                ) : (
                  <>
                    <button onClick={clearCanvas}
                      className="px-4 py-2 rounded flex items-center gap-1.5 hover:opacity-80"
                      style={{ border: `1px solid ${C.brass}88`, color: C.ink }}>
                      <Trash2 size={14} /> Clear
                    </button>
                    {customAlphabet[activeLetter] && (
                      <button onClick={eraseLetter}
                        className="px-4 py-2 rounded flex items-center gap-1.5 hover:opacity-80"
                        style={{ border: `1px solid #a0524066`, color: '#80322f' }}>
                        Erase
                      </button>
                    )}
                    <button onClick={enterTransformMode}
                      className="px-4 py-2 rounded flex items-center gap-1.5 hover:opacity-80"
                      style={{ border: `1px solid ${C.brass}88`, color: C.ink, background: 'rgba(181,166,66,0.1)' }}>
                      <Maximize2 size={14} /> Resize
                    </button>
                    <button onClick={saveLetter}
                      className="px-5 py-2 rounded font-semibold shadow-md flex items-center gap-1.5 hover:opacity-90"
                      style={{ background: C.brass, color: C.parchment }}>
                      <Save size={14} /> Save Ink
                    </button>
                    <button onClick={() => { saveLetter(); setTimeout(goToNextLetter, 200); }}
                      className="px-3 py-2 rounded hover:opacity-80"
                      style={{ border: `1px solid ${C.brass}88`, color: C.ink }} title="Save and advance">
                      →
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full max-w-6xl mx-auto flex flex-col p-6">
            <h2 className="text-3xl italic mb-4 pb-2" style={{ borderBottom: `1px solid ${C.brass}55` }}>
              Your Notebook
              <span className="text-sm not-italic ml-3" style={{ color: C.inkSoft }}>
                — write on the left, see it flow on the right
              </span>
            </h2>
            <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
              <div className="flex flex-col">
                <div className="text-xs uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5" style={{ color: C.brassDark }}>
                  <PenLine size={12} /> Write
                </div>
                <div className="flex-1 min-h-0">{renderTextareaPane('desktop')}</div>
              </div>
              <div className="flex flex-col">
                <div className="text-xs uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5" style={{ color: C.brassDark }}>
                  <Eye size={12} /> Calligraphy Preview
                </div>
                <div className="flex-1 min-h-0">{renderPreviewPane('desktop')}</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
