import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Download, Trash2, Save, Check, Edit3, Menu, X,
  ChevronRight, ChevronLeft, Eye, PenLine, Maximize2, LogOut,
  Settings, Home, Sliders, Image as ImageIcon, Palette, FileText,
  Plus, Pencil, FolderOpen, ArrowLeft,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { supabase } from './supabase';
import Logo from './components/Logo';
import { useLang } from './i18n';
import { usePlan } from './PlanContext';
import { getPlan } from './planLimits';

const UPPER = 'АБВГДЕЁЖЗИЙКЛМНОӨПРСТУҮФХЦЧШЩЪЫЬЭЮЯ'.split('');
const LOWER = 'абвгдеёжзийклмноөпрстуүфхцчшщъыьэюя'.split('');
const NUMS = '0123456789'.split('');

const CATEGORIES = {
  uppercase: { key: 'app_uppercase', short: 'А–Я', chars: UPPER },
  lowercase: { key: 'app_lowercase', short: 'а–я', chars: LOWER },
  numbers: { key: 'app_numbers', short: '0–9', chars: NUMS },
};
const ALL_CHARS = [...UPPER, ...LOWER, ...NUMS];

const CYR_DESCENDERS = 'руфцщ';
const CYR_ASCENDERS = 'б';

const classifyChar = (ch) => {
  if (UPPER.includes(ch)) return 'cap';
  if (NUMS.includes(ch)) return 'cap';
  if (LOWER.includes(ch)) {
    if (CYR_DESCENDERS.includes(ch)) return 'descender';
    if (CYR_ASCENDERS.includes(ch)) return 'ascender';
    return 'xheight';
  }
  return 'cap';
};

const CLASS_HEIGHT = { cap: 1.0, ascender: 1.0, xheight: 0.62, descender: 0.78 };
const CLASS_DROP = { cap: 0, ascender: 0, xheight: 0, descender: 0.30 };

const GUIDE_CAP = 0.18;
const GUIDE_XHEIGHT = 0.45;
const GUIDE_BASELINE = 0.78;
const GUIDE_DESC = 0.93;

const PAPER_STYLES = ['blank', 'lined', 'dotted', 'grid'];
const DEFAULT_NOTEBOOK_SETTINGS = {
  capHeight: 32, letterSpacing: 1, wordSpacing: 0.4, lineHeight: 1.6, paperStyle: 'lined',
};
const PEN_COLORS = [
  { hex: '#0a0a0a', label: 'Black' },
  { hex: '#4f46e5', label: 'Indigo' },
  { hex: '#dc2626', label: 'Red' },
  { hex: '#16a34a', label: 'Green' },
  { hex: '#2563eb', label: 'Blue' },
  { hex: '#9333ea', label: 'Purple' },
  { hex: '#b45309', label: 'Sepia' },
];
const DEFAULT_PEN_COLOR = PEN_COLORS[0].hex;
const EMPTY_RUNS = [{ text: '', color: DEFAULT_PEN_COLOR }];
const blankPage = () => ({ runs: [{ text: '', color: DEFAULT_PEN_COLOR }] });
const TEMPLATES = [
  { id: 'blank', nameKey: 'tpl_blank', descKey: 'tpl_blank_desc', bodyKey: null },
  { id: 'letter', nameKey: 'tpl_letter', descKey: 'tpl_letter_desc', bodyKey: 'tpl_letter_body' },
  { id: 'diary', nameKey: 'tpl_diary', descKey: 'tpl_diary_desc', bodyKey: 'tpl_diary_body' },
  { id: 'essay', nameKey: 'tpl_essay', descKey: 'tpl_essay_desc', bodyKey: 'tpl_essay_body' },
  { id: 'poem', nameKey: 'tpl_poem', descKey: 'tpl_poem_desc', bodyKey: 'tpl_poem_body' },
];

const tintGlyphImage = (sourceImg, hex) => {
  const cv = document.createElement('canvas');
  cv.width = sourceImg.naturalWidth || sourceImg.width;
  cv.height = sourceImg.naturalHeight || sourceImg.height;
  const ctx = cv.getContext('2d');
  ctx.drawImage(sourceImg, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.globalCompositeOperation = 'source-over';
  return cv;
};

const CalligraphyCanvas = React.forwardRef(function CalligraphyCanvas(
  { runs, customAlphabet, settings, padding, emptyHint, header }, ref
) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const imageCacheRef = useRef({});
  const tintedCacheRef = useRef({});
  const [tick, setTick] = useState(0);

  React.useImperativeHandle(ref, () => ({ getCanvas: () => canvasRef.current }));

  useEffect(() => {
    let cancelled = false;
    Object.entries(customAlphabet).forEach(([ch, entry]) => {
      const src = typeof entry === 'string' ? entry : entry?.src;
      if (!src || imageCacheRef.current[src]) return;
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        imageCacheRef.current[src] = img;
        setTick((n) => n + 1);
      };
      img.src = src;
    });
    return () => { cancelled = true; };
  }, [customAlphabet]);

  const getTintedGlyph = (src, color) => {
    const key = src + '|' + color;
    if (tintedCacheRef.current[key]) return tintedCacheRef.current[key];
    const baseImg = imageCacheRef.current[src];
    if (!baseImg) return null;
    if (color.toLowerCase() === DEFAULT_PEN_COLOR.toLowerCase()) {
      tintedCacheRef.current[key] = baseImg;
      return baseImg;
    }
    const tinted = tintGlyphImage(baseImg, color);
    tintedCacheRef.current[key] = tinted;
    return tinted;
  };

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const W = wrap.clientWidth;
    if (W === 0) return;

    const { capHeight, letterSpacing, wordSpacing, lineHeight, paperStyle } = settings;
    const dpr = window.devicePixelRatio || 1;
    const baseLetterSp = Math.max(1, Math.round(capHeight * 0.04));
    const effectiveLetterSp = baseLetterSp + (letterSpacing - 1) * 4;
    const wordGap = capHeight * wordSpacing;
    const lineH = capHeight * lineHeight;
    const maxX = W - padding;
    const measureCtx = canvas.getContext('2d');

    const charsWithColor = [];
    runs.forEach((run) => {
      for (const ch of run.text) charsWithColor.push({ ch, color: run.color });
    });

    const getGlyph = (item) => {
      const { ch, color } = item;
      const cls = classifyChar(ch);
      const targetH = capHeight * (CLASS_HEIGHT[cls] ?? 1.0);
      const drop = capHeight * (CLASS_DROP[cls] ?? 0);
      const entry = customAlphabet[ch];
      const src = typeof entry === 'string' ? entry : entry?.src;
      if (src) {
        const tinted = getTintedGlyph(src, color);
        if (tinted) {
          const nW = tinted.naturalWidth || tinted.width;
          const nH = tinted.naturalHeight || tinted.height;
          const aspect = nW / nH || 1;
          return { type: 'img', img: tinted, w: targetH * aspect, h: targetH, drop, ch, cls, color };
        }
      }
      const fontSize = targetH * 1.35;
      measureCtx.font = `${fontSize}px Georgia, serif`;
      const w = measureCtx.measureText(ch).width;
      return { type: 'text', ch, w, h: targetH, drop, fontSize, cls, color };
    };

    const tokens = [];
    let buf = [];
    const flush = () => { if (buf.length) { tokens.push({ kind: 'word', items: buf }); buf = []; } };
    for (const it of charsWithColor) {
      if (it.ch === '\n') { flush(); tokens.push({ kind: 'newline' }); }
      else if (it.ch === ' ' || it.ch === '\t') { flush(); tokens.push({ kind: 'space' }); }
      else buf.push(it);
    }
    flush();

    const sized = tokens.map((tk) => {
      if (tk.kind !== 'word') return tk;
      const glyphs = tk.items.map(getGlyph);
      let w = 0;
      glyphs.forEach((g, i) => {
        w += g.w;
        if (i < glyphs.length - 1) w += effectiveLetterSp;
      });
      return { ...tk, glyphs, width: w };
    });

    const lines = [];
    let line = [];
    let curX = padding;
    let atStart = true;
    for (const tk of sized) {
      if (tk.kind === 'newline') {
        lines.push(line); line = []; curX = padding; atStart = true;
      } else if (tk.kind === 'space') {
        if (!atStart) { line.push({ kind: 'space' }); curX += wordGap; }
      } else {
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

    const headBand = header && header.trim() ? Math.round(capHeight * 1.6) : 0;
    const minH = wrap.clientHeight || 200;
    const contentH = padding * 2 + headBand + Math.max(1, lines.length) * lineH;
    const H = Math.max(minH, contentH);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';

    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    if (paperStyle === 'lined') {
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.18)';
      ctx.lineWidth = 1;
      const vis = Math.ceil((H - padding) / lineH) + 1;
      for (let i = 0; i < vis; i++) {
        const y = Math.round(padding + (i + 1) * lineH - capHeight * 0.2) + 0.5;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
    } else if (paperStyle === 'dotted') {
      ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
      const step = Math.max(20, capHeight * 0.6);
      for (let y = step; y < H; y += step)
        for (let x = step; x < W; x += step) {
          ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill();
        }
    } else if (paperStyle === 'grid') {
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.13)';
      ctx.lineWidth = 1;
      const step = Math.max(20, capHeight * 0.6);
      for (let y = step; y < H; y += step) {
        ctx.beginPath(); ctx.moveTo(0, Math.round(y) + 0.5); ctx.lineTo(W, Math.round(y) + 0.5); ctx.stroke();
      }
      for (let x = step; x < W; x += step) {
        ctx.beginPath(); ctx.moveTo(Math.round(x) + 0.5, 0); ctx.lineTo(Math.round(x) + 0.5, H); ctx.stroke();
      }
    }

    if (headBand > 0) {
      ctx.fillStyle = '#0a0a0a';
      ctx.font = `600 ${Math.round(capHeight * 0.85)}px Inter, system-ui, sans-serif`;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(header.trim(), padding, padding + capHeight);
      ctx.strokeStyle = 'rgba(10,10,10,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, padding + headBand - 8);
      ctx.lineTo(W - padding, padding + headBand - 8);
      ctx.stroke();
    }
    ctx.textBaseline = 'alphabetic';
    lines.forEach((ln, li) => {
      const baselineY = padding + headBand + (li + 1) * lineH - capHeight * 0.2;
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
            ctx.fillStyle = g.color;
            ctx.font = `${g.fontSize}px Georgia, serif`;
            ctx.fillText(g.ch, x, baselineY + g.drop + wobble);
          }
          ctx.restore();
          x += g.w + effectiveLetterSp;
        });
      });
    });
  }, [runs, customAlphabet, settings, padding, tick]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const obs = new ResizeObserver(() => setTick((n) => n + 1));
    obs.observe(wrap);
    return () => obs.disconnect();
  }, []);

  const totalText = runs.map((r) => r.text).join('');
  return (
    <div ref={wrapRef} className="w-full h-full overflow-y-auto rounded-xl bg-white border border-ink-200 relative">
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      {totalText.length === 0 && (
        <div className="absolute top-0 left-0 italic pointer-events-none text-ink-400"
          style={{ padding, fontSize: settings.capHeight * 0.55 }}>
          {emptyHint}
        </div>
      )}
    </div>
  );
});

function RichTextEditor({ runs, setRuns, currentColor, setCurrentColor, mobile, t }) {
  const editorRef = useRef(null);
  const lastRangeRef = useRef(null);
  const isComposingRef = useRef(false);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && editorRef.current?.contains(sel.anchorNode)) {
      lastRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };
  const restoreSelection = () => {
    const r = lastRangeRef.current;
    if (!r) return false;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
    return true;
  };
  const rgbToHex = (rgb) => {
    if (!rgb) return null;
    if (rgb.startsWith('#')) return rgb;
    const m = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!m) return null;
    const toHex = (n) => Number(n).toString(16).padStart(2, '0');
    return ('#' + toHex(m[1]) + toHex(m[2]) + toHex(m[3])).toLowerCase();
  };
  const parseDomToRuns = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return [];
    const out = [];
    const walk = (node, inherited) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent) out.push({ text: node.textContent, color: inherited });
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (node.tagName === 'BR') { out.push({ text: '\n', color: inherited }); return; }
      let color = inherited;
      if (node.style?.color) color = rgbToHex(node.style.color) || node.style.color;
      const isBlock = node.tagName === 'DIV' || node.tagName === 'P';
      if (isBlock && out.length > 0 && !out[out.length - 1].text.endsWith('\n') && node.previousSibling) {
        out.push({ text: '\n', color });
      }
      for (const c of node.childNodes) walk(c, color);
    };
    for (const c of editor.childNodes) walk(c, DEFAULT_PEN_COLOR);
    const merged = [];
    for (const r of out) {
      if (merged.length && merged[merged.length - 1].color === r.color) merged[merged.length - 1].text += r.text;
      else merged.push({ ...r });
    }
    return merged;
  }, []);

  const handleInput = () => {
    if (isComposingRef.current) return;
    setRuns(parseDomToRuns());
    saveSelection();
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const currentText = editor.innerText.replace(/\r\n/g, '\n');
    const runsText = runs.map((r) => r.text).join('');
    if (currentText === runsText) return;
    editor.innerHTML = '';
    runs.forEach((run) => {
      const segs = run.text.split('\n');
      segs.forEach((seg, i) => {
        if (seg.length > 0) {
          const span = document.createElement('span');
          span.style.color = run.color;
          span.textContent = seg;
          editor.appendChild(span);
        }
        if (i < segs.length - 1) editor.appendChild(document.createElement('br'));
      });
    });
  }, [runs]);

  const applyColor = (color) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    if (!restoreSelection()) { setCurrentColor(color); return; }
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.getRangeAt(0).collapsed) { setCurrentColor(color); return; }
    document.execCommand('styleWithCSS', false, true);
    document.execCommand('foreColor', false, color);
    setCurrentColor(color);
    setRuns(parseDomToRuns());
  };

  const handleBeforeInput = () => {
    saveSelection();
    document.execCommand('styleWithCSS', false, true);
    document.execCommand('foreColor', false, currentColor);
  };

  const charCount = runs.reduce((s, r) => s + r.text.length, 0);
  const wordCount = runs.map((r) => r.text).join('').split(/\s+/).filter(Boolean).length;

  return (
    <div className="h-full flex flex-col gap-2">
      <div className={`rounded-xl bg-white border border-ink-200 ${mobile ? 'p-2' : 'p-3'} flex items-center gap-2 flex-wrap`}>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-500 inline-flex items-center gap-1">
          <Palette size={11} /> {t('app_color')}
        </span>
        <div className="flex items-center gap-1">
          {PEN_COLORS.map((c) => {
            const active = c.hex.toLowerCase() === currentColor.toLowerCase();
            return (
              <button key={c.hex} onClick={() => applyColor(c.hex)} aria-label={c.label} title={c.label}
                className={`w-6 h-6 rounded-full transition-base ${active ? 'ring-2 ring-offset-2 ring-brand-500 scale-110' : 'hover:scale-105'}`}
                style={{ background: c.hex }} />
            );
          })}
        </div>
        <div className="ml-auto text-[10px] text-ink-500 hidden sm:block">{t('app_color_hint')}</div>
      </div>
      <div ref={editorRef} contentEditable suppressContentEditableWarning
        onInput={handleInput} onBeforeInput={handleBeforeInput}
        onMouseUp={saveSelection} onKeyUp={saveSelection}
        onCompositionStart={() => { isComposingRef.current = true; }}
        onCompositionEnd={() => { isComposingRef.current = false; handleInput(); }}
        spellCheck="false"
        className="flex-1 w-full overflow-y-auto outline-none rounded-xl border border-ink-200 bg-white text-ink-900 hover:border-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-base whitespace-pre-wrap"
        style={{ padding: mobile ? '14px' : '24px', fontSize: mobile ? '15px' : '16px', lineHeight: mobile ? '24px' : '26px', minHeight: '120px' }} />
      <div className="flex items-center justify-between text-xs text-ink-500 px-1">
        <span>{charCount} {t('app_chars')} · {wordCount} {t('app_words')}</span>
        {charCount > 0 && (
          <button onClick={() => { setRuns([{ text: '', color: DEFAULT_PEN_COLOR }]); if (editorRef.current) editorRef.current.innerHTML = ''; }}
            className="text-ink-500 hover:text-ink-900 underline transition-base">{t('app_clear_text')}</button>
        )}
      </div>
    </div>
  );
}

function NotebookToolbar({ settings, setSettings, onExportPNG, onExportPDF, onSaveDoc, saveState, exportInfo, mobile, t }) {
  const update = (key) => (e) => setSettings({ ...settings, [key]: Number(e.target.value) });
  const paperLabel = { blank: t('app_paper_blank'), lined: t('app_paper_lined'), dotted: t('app_paper_dotted'), grid: t('app_paper_grid') };
  return (
    <div className={`rounded-xl bg-white border border-ink-200 ${mobile ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-600 flex items-center gap-1.5">
          <Sliders size={12} /> {t('app_controls')}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={onSaveDoc} disabled={saveState === 'saving'}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-base ${
              saveState === 'saved' ? 'bg-green-600 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
            }`}>
            {saveState === 'saved' ? <Check size={12} /> : <Save size={12} />}
            {saveState === 'saving' ? t('app_saving') : saveState === 'saved' ? t('app_doc_saved') : t('app_doc_save')}
          </button>
          <button onClick={onExportPNG} disabled={!!exportInfo}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-ink-100 text-ink-700 text-xs font-semibold hover:bg-ink-200 transition-base disabled:opacity-50">
            <ImageIcon size={12} /> {exportInfo ? `${t('app_exporting')} ${exportInfo.done}/${exportInfo.total}` : 'PNG'}
          </button>
          <button onClick={onExportPDF} disabled={!!exportInfo}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 shadow-card transition-base disabled:opacity-50">
            <FileText size={12} /> {exportInfo ? `${t('app_exporting')} ${exportInfo.done}/${exportInfo.total}` : t('app_export_pdf')}
          </button>
        </div>
      </div>
      <div className={`grid ${mobile ? 'grid-cols-2 gap-2.5' : 'grid-cols-4 gap-4'}`}>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">{t('app_size')}</span>
            <span className="text-[10px] font-bold text-brand-600">{settings.capHeight}px</span>
          </div>
          <input type="range" min="18" max="64" step="2" value={settings.capHeight} onChange={update('capHeight')} className="w-full accent-brand-600" />
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">{t('app_letter_sp')}</span>
            <span className="text-[10px] font-bold text-brand-600">{settings.letterSpacing.toFixed(1)}</span>
          </div>
          <input type="range" min="0.5" max="5" step="0.1" value={settings.letterSpacing} onChange={update('letterSpacing')} className="w-full accent-brand-600" />
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">{t('app_word_sp')}</span>
            <span className="text-[10px] font-bold text-brand-600">{settings.wordSpacing.toFixed(2)}</span>
          </div>
          <input type="range" min="0.15" max="1.2" step="0.05" value={settings.wordSpacing} onChange={update('wordSpacing')} className="w-full accent-brand-600" />
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">{t('app_line_height')}</span>
            <span className="text-[10px] font-bold text-brand-600">{settings.lineHeight.toFixed(1)}</span>
          </div>
          <input type="range" min="1.2" max="3" step="0.1" value={settings.lineHeight} onChange={update('lineHeight')} className="w-full accent-brand-600" />
        </div>
      </div>
      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5">{t('app_paper')}</p>
        <div className="flex gap-1">
          {PAPER_STYLES.map((key) => {
            const active = settings.paperStyle === key;
            return (
              <button key={key} onClick={() => setSettings({ ...settings, paperStyle: key })}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-base ${active ? 'bg-brand-600 text-white shadow-card' : 'bg-ink-50 text-ink-700 hover:bg-ink-100 border border-ink-200'}`}>
                {paperLabel[key]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function VintageCalligraphyApp({ session }) {
  const navigate = useNavigate();
  const { t } = useLang();
  const { plan } = usePlan();
  const planConf = getPlan(plan);
  const maxDocs = planConf.maxDocuments;

  const [customAlphabet, setCustomAlphabet] = useState({});
  const [syncing, setSyncing] = useState(true);
  const [activeLetter, setActiveLetter] = useState(UPPER[0]);
  const [activeCategory, setActiveCategory] = useState('uppercase');
  const [activeView, setActiveView] = useState('editor');
  const [runs, setRuns] = useState(EMPTY_RUNS);
  const [currentColor, setCurrentColor] = useState(DEFAULT_PEN_COLOR);
  const [notebookMode, setNotebookMode] = useState('write');
  const [baseThickness, setBaseThickness] = useState(10);
  const [opacity, setOpacity] = useState(0.88);
  const [savedFlash, setSavedFlash] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSliders, setShowSliders] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notebookSettings, setNotebookSettings] = useState(DEFAULT_NOTEBOOK_SETTINGS);
  const [editorMode, setEditorMode] = useState('draw');
  const [transformBox, setTransformBox] = useState(null);

  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [docPages, setDocPages] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [notebookScreen, setNotebookScreen] = useState('list');
  const [creatingNew, setCreatingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [docSaveState, setDocSaveState] = useState('idle');
  const [docHeader, setDocHeader] = useState('');
  const [exportInfo, setExportInfo] = useState(null);
  const [autoSave, setAutoSave] = useState('idle');
  const [docOpening, setDocOpening] = useState(false);
  const docLoadedRef = useRef(false);

  const transformImageRef = useRef(null);
  const transformDragRef = useRef(null);
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const userMenuRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastTime = useRef(0);
  const currentWidth = useRef(baseThickness);

  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('alphabets').select('glyphs').eq('user_id', session.user.id).maybeSingle();
      if (!cancelled && data?.glyphs) setCustomAlphabet(data.glyphs);
      if (!cancelled) setSyncing(false);
    })();
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  useEffect(() => {
    if (syncing || !session?.user) return;
    const tm = setTimeout(async () => {
      await supabase.from('alphabets').upsert({ user_id: session.user.id, glyphs: customAlphabet, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    }, 1000);
    return () => clearTimeout(tm);
  }, [customAlphabet, session?.user?.id, syncing]);

  const loadDocs = useCallback(async () => {
    if (!session?.user) return;
    setDocsLoading(true);
    const { data } = await supabase
      .from('documents')
      .select('id,title,template,updated_at')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false });
    setDocs(data || []);
    setDocsLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const buildPagesWithCurrent = () => {
    if (!docPages.length) return [{ runs }];
    return docPages.map((p, i) => (i === pageIndex ? { runs } : p));
  };

  const createDocument = async (templateId) => {
    if (!session?.user) return;
    if (docs.length >= maxDocs) { alert(t('app_limit_docs_body').replace('{max}', String(maxDocs))); return; }
    if (!planConf.templates.includes(templateId)) { navigate('/pricing'); return; }
    const tpl = TEMPLATES.find((x) => x.id === templateId) || TEMPLATES[0];
    const title = newTitle.trim() || t(tpl.nameKey);
    const body = tpl.bodyKey ? t(tpl.bodyKey) : '';
    const pages = [{ runs: [{ text: body, color: DEFAULT_PEN_COLOR }] }];
    const { data, error } = await supabase
      .from('documents')
      .insert({ user_id: session.user.id, title, template: tpl.id, pages, settings: {} })
      .select()
      .single();
    if (error) { alert('Error: ' + error.message); return; }
    setCreatingNew(false);
    setNewTitle('');
    await loadDocs();
    openDocument(data);
  };

const openDocument = (doc) => {
    setCurrentDoc(doc);
    const raw = Array.isArray(doc.pages) && doc.pages.length > 0 ? doc.pages : [blankPage()];
    const norm = raw.map((p) => ({
      runs: Array.isArray(p?.runs) && p.runs.length > 0 ? p.runs : [{ text: '', color: DEFAULT_PEN_COLOR }],
    }));
    const st = doc.settings && typeof doc.settings === 'object' ? doc.settings : {};
    const nb = st.nb && typeof st.nb === 'object'
      ? { ...DEFAULT_NOTEBOOK_SETTINGS, ...st.nb }
      : DEFAULT_NOTEBOOK_SETTINGS;
    setNotebookSettings(nb);
    setDocHeader(typeof st.header === 'string' ? st.header : '');
    docLoadedRef.current = false;
    setDocPages(norm);
    setPageIndex(0);
    setRuns(norm[0].runs);
    setNotebookScreen('editor');
    setNotebookMode('write');
    setTimeout(() => { docLoadedRef.current = true; }, 300);
  };

  const openDocumentById = async (id) => {
    setDocOpening(true);
    const { data, error } = await supabase.from('documents').select('*').eq('id', id).single();
    if (error) { setDocOpening(false); alert('Error: ' + error.message); return; }
    openDocument(data);
    setDocOpening(false);
  };
  const goToPage = (idx) => {
    if (idx < 0 || idx >= docPages.length || idx === pageIndex) return;
    const merged = buildPagesWithCurrent();
    setDocPages(merged);
    setPageIndex(idx);
    setRuns(merged[idx].runs);
  };

  const addPage = () => {
    const merged = buildPagesWithCurrent();
    const bp = blankPage();
    const np = [...merged.slice(0, pageIndex + 1), bp, ...merged.slice(pageIndex + 1)];
    setDocPages(np);
    setPageIndex(pageIndex + 1);
    setRuns(bp.runs);
  };

  const deletePage = () => {
    if (docPages.length <= 1) return;
    if (!window.confirm(t('app_delete_page_confirm'))) return;
    const merged = buildPagesWithCurrent();
    const np = merged.filter((_, i) => i !== pageIndex);
    const ni = Math.min(pageIndex, np.length - 1);
    setDocPages(np);
    setPageIndex(ni);
    setRuns(np[ni].runs);
  };

  const saveCurrentDocument = async () => {
    if (!session?.user || !currentDoc) return;
    setDocSaveState('saving');
    try {
      const pages = buildPagesWithCurrent();
      const { error } = await supabase
        .from('documents')
        .update({ pages, title: currentDoc.title, settings: { nb: notebookSettings, header: docHeader }, updated_at: new Date().toISOString() })
        .eq('id', currentDoc.id);
      if (error) throw error;
      setDocPages(pages);
      setDocSaveState('saved');
      setDocs((prev) => prev.map((d) => d.id === currentDoc.id ? { ...d, title: currentDoc.title, updated_at: new Date().toISOString() } : d));
      setTimeout(() => setDocSaveState('idle'), 1800);
    } catch (e) {
      setDocSaveState('idle');
      alert('Save failed: ' + (e?.message || 'unknown'));
    }
  };

  useEffect(() => {
    if (!currentDoc || notebookScreen !== 'editor' || !docLoadedRef.current) return;
    const tm = setTimeout(async () => {
      setAutoSave('saving');
      const pages = buildPagesWithCurrent();
      await supabase.from('documents')
        .update({ pages, settings: { nb: notebookSettings, header: docHeader }, updated_at: new Date().toISOString() })
        .eq('id', currentDoc.id);
      setDocs((prev) => prev.map((d) => d.id === currentDoc.id ? { ...d, updated_at: new Date().toISOString() } : d));
      setAutoSave('saved');
      setTimeout(() => setAutoSave('idle'), 2000);
    }, 1500);
    return () => clearTimeout(tm);
  }, [runs, currentDoc, notebookScreen, pageIndex, notebookSettings, docHeader]);

  const renameDocument = async (id) => {
    const title = renameValue.trim();
    if (!title) { setRenamingId(null); return; }
    await supabase.from('documents').update({ pages, settings: { nb: notebookSettings, header: docHeader }, updated_at: new Date().toISOString() }).eq('id', currentDoc.id);
    setRenamingId(null);
    setRenameValue('');
    setDocs((prev) => prev.map((d) => d.id === id ? { ...d, title } : d));
    if (currentDoc?.id === id) setCurrentDoc({ ...currentDoc, title });
  };

  const deleteDocument = async (id) => {
    if (!window.confirm(t('app_doc_delete_confirm'))) return;
    await supabase.from('documents').delete().eq('id', id);
    setDocs((prev) => prev.filter((d) => d.id !== id));
    if (currentDoc?.id === id) {
      setCurrentDoc(null);
      setNotebookScreen('list');
    }
  };

  const backToDocList = async () => {
    if (currentDoc) {
      const pages = buildPagesWithCurrent();
      await supabase.from('documents').update({ pages, title: currentDoc.title, settings: { nb: notebookSettings, header: docHeader }, updated_at: new Date().toISOString() }).eq('id', currentDoc.id);
    }
    setCurrentDoc(null);
    setDocPages([]);
    setPageIndex(0);
    setNotebookScreen('list');
    loadDocs();
  };

  const completedCount = Object.keys(customAlphabet).length;
  const counts = {
    uppercase: UPPER.filter((c) => customAlphabet[c]).length,
    lowercase: LOWER.filter((c) => customAlphabet[c]).length,
    numbers: NUMS.filter((c) => customAlphabet[c]).length,
  };
  const detectCategory = (ch) => {
    if (UPPER.includes(ch)) return 'uppercase';
    if (LOWER.includes(ch)) return 'lowercase';
    return 'numbers';
  };
  const activeClass = classifyChar(activeLetter);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
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
      const entry = customAlphabet[activeLetter];
      const src = typeof entry === 'string' ? entry : entry?.src;
      if (src) {
        const img = new Image();
        img.onload = () => {
          const capY = GUIDE_CAP * h;
          const baseY = GUIDE_BASELINE * h;
          const zoneH = baseY - capY;
          const aspect = (img.naturalWidth || img.width) / (img.naturalHeight || img.height) || 1;
          const drawH = zoneH;
          const drawW = drawH * aspect;
          const drawX = (w - drawW) / 2;
          ctx.drawImage(img, drawX, capY, drawW, drawH);
        };
        img.src = src;
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

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
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
    const tm = Date.now();
    const dist = Math.hypot(x - lastPos.current.x, y - lastPos.current.y);
    const dt = Math.max(1, tm - lastTime.current);
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
    lastTime.current = tm;
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
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        if (data[(y * w + x) * 4 + 3] > 10) {
          found = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
    if (!found) { alert(t('app_empty_hint')); return; }
    const tmp = document.createElement('canvas');
    tmp.width = maxX - minX;
    tmp.height = maxY - minY;
    tmp.getContext('2d').drawImage(canvas, minX, minY, maxX - minX, maxY - minY, 0, 0, maxX - minX, maxY - minY);
    const img = new Image();
    img.onload = () => {
      transformImageRef.current = img;
      setTransformBox({ x: minX / dpr, y: minY / dpr, w: (maxX - minX) / dpr, h: (maxY - minY) / dpr });
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
    for (const c of corners)
      if (Math.abs(x - c.cx) < HANDLE_HIT && Math.abs(y - c.cy) < HANDLE_HIT) {
        transformDragRef.current = { kind: 'corner', corner: c.name, startBox: { ...transformBox }, startPos: { x, y } };
        return;
      }
    if (x >= transformBox.x && x <= transformBox.x + transformBox.w && y >= transformBox.y && y <= transformBox.y + transformBox.h)
      transformDragRef.current = { kind: 'move', startBox: { ...transformBox }, startPos: { x, y } };
  };
  const onTransformPointerMove = (e) => {
    if (!transformDragRef.current) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    const d = transformDragRef.current;
    const dx = x - d.startPos.x, dy = y - d.startPos.y;
    if (d.kind === 'move') {
      setTransformBox({ ...d.startBox, x: d.startBox.x + dx, y: d.startBox.y + dy });
    } else if (d.kind === 'corner') {
      const aspect = d.startBox.w / d.startBox.h;
      const MIN = 16;
      let nW, nH, nx, ny;
      if (d.corner === 'br') { nW = Math.max(MIN, d.startBox.w + dx); nH = nW / aspect; nx = d.startBox.x; ny = d.startBox.y; }
      else if (d.corner === 'tl') { nW = Math.max(MIN, d.startBox.w - dx); nH = nW / aspect; nx = d.startBox.x + d.startBox.w - nW; ny = d.startBox.y + d.startBox.h - nH; }
      else if (d.corner === 'tr') { nW = Math.max(MIN, d.startBox.w + dx); nH = nW / aspect; nx = d.startBox.x; ny = d.startBox.y + d.startBox.h - nH; }
      else { nW = Math.max(MIN, d.startBox.w - dx); nH = nW / aspect; nx = d.startBox.x + d.startBox.w - nW; ny = d.startBox.y; }
      setTransformBox({ x: nx, y: ny, w: nW, h: nH });
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
    setCustomAlphabet((prev) => {
      const next = { ...prev };
      delete next[activeLetter];
      return next;
    });
  };

  const saveLetter = () => {
    const src = canvasRef.current;
    const ctx = src.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
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
    if (!found) { alert(t('app_empty_hint')); return; }
    const pad = Math.round(3 * dpr);
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(w, maxX + pad);
    maxY = Math.min(h, maxY + pad);
    const cw = maxX - minX;
    const ch = maxY - minY;
    const tmp = document.createElement('canvas');
    tmp.width = cw;
    tmp.height = ch;
    tmp.getContext('2d').drawImage(src, minX, minY, cw, ch, 0, 0, cw, ch);
    const dataUrl = tmp.toDataURL('image/png');
    setCustomAlphabet((prev) => ({ ...prev, [activeLetter]: { src: dataUrl, cls: activeClass } }));
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
    if (completedCount === 0) { alert(t('app_no_glyphs')); return; }
    const cell = 200, cols = 7;
    const headerH = 90, footerH = 50, sectionH = 40;
    const sections = ['uppercase', 'lowercase', 'numbers'];
    const totalRows = sections.reduce((s, k) => s + Math.ceil(CATEGORIES[k].chars.length / cols), 0);
    const out = document.createElement('canvas');
    out.width = cell * cols;
    out.height = cell * totalRows + headerH + footerH + sectionH * sections.length;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.fillStyle = '#0a0a0a';
    ctx.textAlign = 'center';
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.fillText('Inkly', out.width / 2, 48);
    ctx.fillStyle = '#525252';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText('inkly.tech', out.width / 2, 72);
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 1;
    ctx.strokeRect(28, 28, out.width - 56, out.height - 56);
    let pending = ALL_CHARS.length;
    const finish = () => {
      ctx.fillStyle = '#737373';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${completedCount} / ${ALL_CHARS.length} · inkly.tech`, out.width / 2, out.height - 20);
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
      ctx.fillText(`${t(CATEGORIES[sec].key)} · ${counts[sec]}/${chars.length}`, 40, yCursor + 24);
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
        const isrc = typeof entry === 'string' ? entry : entry?.src;
        if (isrc) {
          const img = new Image();
          img.onload = () => {
            const inner = cell - 50;
            const ratio = Math.min(inner / img.width, inner / img.height);
            const dw = img.width * ratio, dh = img.height * ratio;
            ctx.drawImage(img, x + (cell - dw) / 2, y + 35 + (inner - dh) / 2, dw, dh);
            if (--pending === 0) finish();
          };
          img.onerror = () => { if (--pending === 0) finish(); };
          img.src = isrc;
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

    const renderToCanvas = (pageRuns, headerText) => new Promise((resolve) => {
    const wrap = previewCanvasRef.current?.getCanvas?.();
    const W = wrap ? wrap.width / (window.devicePixelRatio || 1) : 800;
    const padding = 28;
    const s = notebookSettings;
    const cap = s.capHeight;
    const baseLetterSp = Math.max(1, Math.round(cap * 0.04));
    const effLs = baseLetterSp + (s.letterSpacing - 1) * 4;
    const wordGap = cap * s.wordSpacing;
    const lineH = cap * s.lineHeight;
    const maxX = W - padding;
    const measure = document.createElement('canvas').getContext('2d');

    const imgs = {};
    const need = [];
    Object.entries(customAlphabet).forEach(([ch, en]) => {
      const sc = typeof en === 'string' ? en : en?.src;
      if (sc) need.push([ch, sc]);
    });
    let pending = need.length;
    const proceed = () => {
      const chars = [];
      pageRuns.forEach((r) => { for (const ch of r.text) chars.push({ ch, color: r.color }); });
      const glyph = (it) => {
        const cls = classifyChar(it.ch);
        const tH = cap * (CLASS_HEIGHT[cls] ?? 1);
        const drop = cap * (CLASS_DROP[cls] ?? 0);
        const im = imgs[it.ch];
        if (im) {
          const asp = im.width / im.height || 1;
          return { type: 'img', im, w: tH * asp, h: tH, drop };
        }
        const fs = tH * 1.35;
        measure.font = `${fs}px Georgia, serif`;
        return { type: 'text', ch: it.ch, w: measure.measureText(it.ch).width, h: tH, drop, fs, color: it.color };
      };
      const toks = [];
      let bf = [];
      const fl = () => { if (bf.length) { toks.push({ k: 'w', it: bf }); bf = []; } };
      for (const it of chars) {
        if (it.ch === '\n') { fl(); toks.push({ k: 'n' }); }
        else if (it.ch === ' ' || it.ch === '\t') { fl(); toks.push({ k: 's' }); }
        else bf.push(it);
      }
      fl();
      const sized = toks.map((tk) => {
        if (tk.k !== 'w') return tk;
        const gs = tk.it.map(glyph);
        let w = 0;
        gs.forEach((g, i) => { w += g.w; if (i < gs.length - 1) w += effLs; });
        return { ...tk, gs, w };
      });
      const lines = [];
      let ln = [], cx = padding, st = true;
      for (const tk of sized) {
        if (tk.k === 'n') { lines.push(ln); ln = []; cx = padding; st = true; }
        else if (tk.k === 's') { if (!st) { cx += wordGap; ln.push({ s: 1 }); } }
        else {
          if (cx + tk.w > maxX && !st) { lines.push(ln); ln = []; cx = padding; st = true; }
          ln.push({ ...tk, x: cx }); cx += tk.w; st = false;
        }
      }
      lines.push(ln);
      const headBand = headerText && headerText.trim() ? Math.round(cap * 1.6) : 0;       
      const H = Math.max(600, padding * 2 + headBand + Math.max(1, lines.length) * lineH);
      const cv = document.createElement('canvas');
      const dpr = 2;
      cv.width = W * dpr; cv.height = H * dpr;
      const ctx = cv.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      if (s.paperStyle === 'lined') {
        ctx.strokeStyle = 'rgba(99,102,241,0.18)';
        const vis = Math.ceil((H - padding) / lineH) + 1;
        for (let i = 0; i < vis; i++) {
          const y = Math.round(padding + (i + 1) * lineH - cap * 0.2) + 0.5;
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
      }
      if (headBand > 0) {
        ctx.fillStyle = '#0a0a0a';
        ctx.font = `600 ${Math.round(cap * 0.85)}px Inter, system-ui, sans-serif`;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(headerText.trim(), padding, padding + cap);
      }
      ctx.textBaseline = 'alphabetic';
      lines.forEach((lnn, li) => {
        const by = padding + headBand + (li + 1) * lineH - cap * 0.2;
        lnn.forEach((tk) => {
          if (!tk.gs) return;
          let x = tk.x;
          tk.gs.forEach((g) => {
            if (g.type === 'img') ctx.drawImage(g.im, x, by - g.h + g.drop, g.w, g.h);
            else { ctx.fillStyle = g.color; ctx.font = `${g.fs}px Georgia, serif`; ctx.fillText(g.ch, x, by + g.drop); }
            x += g.w + effLs;
          });
        });
      });
      resolve(cv);
    };
    if (pending === 0) { proceed(); return; }
    need.forEach(([ch, sc]) => {
      const im = new Image();
      im.onload = () => { imgs[ch] = im; if (--pending === 0) proceed(); };
      im.onerror = () => { if (--pending === 0) proceed(); };
      im.src = sc;
    });
  });

  const exportNotebookPNG = async () => {
    const pages = buildPagesWithCurrent();
    const nonEmpty = pages.filter((p) => p.runs.map((r) => r.text).join('').trim());
    if (nonEmpty.length === 0) { alert(t('app_empty_hint')); return; }
    const base = currentDoc?.title || 'inkly';
    for (let i = 0; i < nonEmpty.length; i++) {
      setExportInfo({ done: i + 1, total: nonEmpty.length });
      const cv = await renderToCanvas(nonEmpty[i].runs, docHeader);
      const link = document.createElement('a');
      link.download = base + '-' + (i + 1) + '.png';
      link.href = cv.toDataURL('image/png');
      link.click();
      await new Promise((r) => setTimeout(r, 400));
    }
    setExportInfo(null);
  };

  const exportNotebookPDF = async () => {
    if (!planConf.pdfExport) {
      if (window.confirm(t('app_golden_only'))) navigate('/pricing');
      return;
    }
    const pages = buildPagesWithCurrent();
    const nonEmpty = pages.filter((p) => p.runs.map((r) => r.text).join('').trim());
    if (nonEmpty.length === 0) { alert(t('app_empty_hint')); return; }
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 36;
    const usableW = pageW - margin * 2;
    const usableH = pageH - margin * 2;
    setExportInfo({ done: 0, total: nonEmpty.length });     
    for (let i = 0; i < nonEmpty.length; i++) {
      setExportInfo({ done: i + 1, total: nonEmpty.length });       
      const cv = await renderToCanvas(nonEmpty[i].runs, docHeader);
      const imgData = cv.toDataURL('image/png');
      const imgW = usableW;
      const imgH = (cv.height / cv.width) * imgW;
      if (i > 0) pdf.addPage();
      if (imgH <= usableH) {
        pdf.addImage(imgData, 'PNG', margin, margin, imgW, imgH);
      } else {
        let remaining = cv.height, srcY = 0;
        const pxPerPage = (usableH / imgW) * cv.width;
        let first = true;
        while (remaining > 0) {
          const sliceH = Math.min(pxPerPage, remaining);
          const slice = document.createElement('canvas');
          slice.width = cv.width; slice.height = sliceH;
          slice.getContext('2d').drawImage(cv, 0, srcY, cv.width, sliceH, 0, 0, cv.width, sliceH);
          if (!first) pdf.addPage();
          pdf.addImage(slice.toDataURL('image/png'), 'PNG', margin, margin, imgW, (sliceH / cv.width) * imgW);
          remaining -= sliceH; srcY += sliceH; first = false;
        }
      }
    }
    pdf.save((currentDoc?.title || 'inkly') + '.pdf');     
    setExportInfo(null);
  };

  const drawingHint = () => {
    if (activeClass === 'cap') return t('app_draw_hint_cap');
    if (activeClass === 'xheight') return t('app_draw_hint_x');
    if (activeClass === 'ascender') return t('app_draw_hint_asc');
    if (activeClass === 'descender') return t('app_draw_hint_desc');
    return '';
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const renderEditorGuides = () => (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute left-0 right-0" style={{ top: `${GUIDE_CAP * 100}%`, borderTop: '1px dashed rgba(99,102,241,0.35)' }}>
        <span className="absolute left-3 -top-3 text-[10px] font-semibold text-brand-700 bg-white px-1.5 rounded">cap</span>
      </div>
      <div className="absolute left-0 right-0" style={{ top: `${GUIDE_XHEIGHT * 100}%`, borderTop: '1px dashed rgba(99,102,241,0.35)' }}>
        <span className="absolute left-3 -top-3 text-[10px] font-semibold text-brand-700 bg-white px-1.5 rounded">x</span>
      </div>
      <div className="absolute left-0 right-0" style={{ top: `${GUIDE_BASELINE * 100}%`, borderTop: '2px solid rgba(99,102,241,0.6)' }}>
        <span className="absolute left-3 -top-4 text-[10px] font-bold text-brand-700 bg-white px-1.5 rounded">baseline</span>
      </div>
      <div className="absolute left-0 right-0" style={{ top: `${GUIDE_DESC * 100}%`, borderTop: '1px dashed rgba(99,102,241,0.35)' }}>
        <span className="absolute left-3 -top-3 text-[10px] font-semibold text-brand-700 bg-white px-1.5 rounded">desc</span>
      </div>
    </div>
  );

  const renderTransformOverlay = () => {
    if (editorMode !== 'transform' || !transformBox) return null;
    const hs = 18, half = 9;
    const corners = [
      { l: transformBox.x, t: transformBox.y },
      { l: transformBox.x + transformBox.w, t: transformBox.y },
      { l: transformBox.x, t: transformBox.y + transformBox.h },
      { l: transformBox.x + transformBox.w, t: transformBox.y + transformBox.h },
    ];
    return (
      <>
        <div className="absolute pointer-events-none" style={{ left: transformBox.x, top: transformBox.y, width: transformBox.w, height: transformBox.h, border: '2px dashed #4f46e5', background: 'rgba(99,102,241,0.06)' }} />
        {corners.map((c, i) => (
          <div key={i} className="absolute pointer-events-none rounded-full bg-brand-600 border-2 border-white shadow-card" style={{ left: c.l - half, top: c.t - half, width: hs, height: hs }} />
        ))}
      </>
    );
  };

  const renderSidebarContent = (onPick) => (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500 mb-2 px-2">{t('app_workspace')}</p>
          <div className="space-y-1">
            <button onClick={() => { setActiveView('editor'); onPick?.(); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-base ${activeView === 'editor' ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50'}`}>
              <Edit3 size={16} /> <span>{t('app_editor')}</span>
            </button>
            <button onClick={() => { setActiveView('notebook'); setNotebookScreen('list'); onPick?.(); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-base ${activeView === 'notebook' ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50'}`}>
              <BookOpen size={16} /> <span>{t('app_documents')}</span>
            </button>
          </div>
        </div>
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-2 px-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{t(cat.key)}</p>
              <span className="text-[10px] font-medium text-ink-400">{counts[key]}/{cat.chars.length}</span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {cat.chars.map((letter) => {
                const drawn = !!customAlphabet[letter];
                const active = activeLetter === letter;
                return (
                  <button key={letter} onClick={() => { pickLetter(letter); onPick?.(); }}
                    className={`relative h-8 rounded-md text-xs font-semibold transition-base ${active ? 'bg-brand-600 text-white shadow-card' : drawn ? 'bg-brand-50 text-brand-700 hover:bg-brand-100' : 'text-ink-600 hover:bg-ink-100'}`}>
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-ink-200">
        <button onClick={() => { exportSheet(); onPick?.(); }}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-ink-950 text-white text-sm font-medium hover:bg-ink-800 shadow-card transition-base">
          <Download size={14} /> <span>{t('app_export_alphabet')}</span>
        </button>
      </div>
    </>
  );

  const renderUserMenu = () => (
    <div className="relative" ref={userMenuRef}>
      <button onClick={() => setUserMenuOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-ink-100 transition-base">
        <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
          {(session?.user?.email || '?').charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:inline text-sm font-medium text-ink-700 max-w-[140px] truncate">{session?.user?.email}</span>
      </button>
      {userMenuOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-ink-200 rounded-xl shadow-floating overflow-hidden z-50 animate-fade-in">
          <div className="px-4 py-3 border-b border-ink-100">
            <p className="text-xs text-ink-500">{t('app_signed_in_as')}</p>
            <p className="text-sm font-medium text-ink-950 truncate">{session?.user?.email}</p>
          </div>
          <button onClick={() => { navigate('/'); setUserMenuOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-50 transition-base text-left">
            <Home size={14} /> <span>{t('app_marketing_site')}</span>
          </button>
          <button onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-base text-left">
            <LogOut size={14} /> <span>{t('app_signout')}</span>
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
            <button onClick={() => setDrawerOpen(true)} className="p-1.5 -ml-1.5 rounded-lg hover:bg-ink-100 transition-base" aria-label="Menu">
              <Menu size={18} />
            </button>
          )}
          <Logo size="sm" linkTo={null} />
          <div className="hidden md:flex items-center gap-1.5 text-sm text-ink-400">
            <span>/</span><span className="text-ink-700 font-medium">{t('app_workspace')}</span>
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

  const renderPreviewPane = (size = 'desktop') => {
    const isM = size === 'mobile';
    const eff = isM ? { ...notebookSettings, capHeight: Math.max(18, Math.round(notebookSettings.capHeight * 0.72)) } : notebookSettings;
    return (
      <div className="h-full flex flex-col gap-2">
        <div className="flex-1 min-h-0">
          <CalligraphyCanvas ref={previewCanvasRef} runs={runs} customAlphabet={customAlphabet} settings={eff} padding={isM ? 14 : 28} emptyHint={t('app_empty_hint')} header={docHeader} />
        </div>
        <p className="text-xs text-ink-500 text-center">
          {completedCount === 0 ? t('app_no_glyphs') : `${counts.uppercase}/${UPPER.length} · ${counts.lowercase}/${LOWER.length} · ${counts.numbers}/${NUMS.length}`}
        </p>
      </div>
    );
  };

  const fmtDate = (s) => {
    try { return new Date(s).toLocaleDateString(); } catch (e) { return ''; }
  };

  const renderDocumentList = () => (
    docOpening ? (
      <div className="max-w-4xl mx-auto w-full py-20 text-center text-sm text-ink-500">{t('app_loading')}</div>
    ) : (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink-950 tracking-tight">{t('app_documents')}</h1>
          <p className="text-sm text-ink-500 mt-1">{docs.length} / {maxDocs}</p>
        </div>
        {!creatingNew && docs.length < maxDocs && (
          <button onClick={() => { setCreatingNew(true); setNewTitle(''); }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 shadow-card transition-base">
            <Plus size={15} /> {t('app_new_document')}
          </button>
        )}
      </div>

     {!creatingNew && docs.length >= maxDocs && planConf.id === 'free' && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-5">
          <p className="text-sm font-semibold text-amber-900">{t('app_limit_docs_title')}</p>
          <p className="text-sm text-amber-800 mt-1">{t('app_limit_docs_body').replace('{max}', String(maxDocs))}</p>
          <button onClick={() => navigate('/pricing')}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-base">
            {t('hero_cta_secondary')}
          </button>
        </div>
      )}

      {creatingNew && (
        <div className="rounded-xl bg-white border border-ink-200 p-4 flex flex-col gap-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-600">{t('app_doc_title_label')}</label>
          <input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') createDocument('blank'); }}
            placeholder={t('app_doc_title_label')}
            className="w-full px-3 py-2 text-sm rounded-lg border border-ink-200 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-base" />
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-600 mt-1">{t('app_choose_template')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TEMPLATES.map((tp) => {
              const allowed = planConf.templates.includes(tp.id);
              return allowed ? (
                <button key={tp.id} onClick={() => createDocument(tp.id)}
                  className="text-left rounded-lg border border-ink-200 p-3 hover:border-brand-400 hover:bg-brand-50 transition-base">
                  <p className="text-sm font-semibold text-ink-950">{t(tp.nameKey)}</p>
                  <p className="text-xs text-ink-500 mt-0.5">{t(tp.descKey)}</p>
                </button>
              ) : (
                <button key={tp.id} onClick={() => navigate('/pricing')}
                  className="text-left rounded-lg border border-amber-200 bg-amber-50/40 p-3 hover:bg-amber-50 transition-base relative">
                  <span className="absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    🔒 {t('app_locked_golden')}
                  </span>
                  <p className="text-sm font-semibold text-ink-700">{t(tp.nameKey)}</p>
                  <p className="text-xs text-ink-500 mt-0.5">{t(tp.descKey)}</p>
                </button>
              );
            })}
          </div>
          <div>
            <button onClick={() => { setCreatingNew(false); setNewTitle(''); }}
              className="px-4 py-2 rounded-lg bg-white border border-ink-200 text-sm font-medium text-ink-700 hover:bg-ink-50 transition-base">
              {t('app_cancel')}
            </button>
          </div>
        </div>
      )}

      {docsLoading ? (
        <p className="text-sm text-ink-500 py-8 text-center">{t('app_loading')}</p>
      ) : docs.length === 0 && !creatingNew ? (
        <div className="rounded-xl bg-white border border-dashed border-ink-300 p-10 text-center">
          <FolderOpen size={32} className="mx-auto mb-3 text-ink-300" />
          <p className="text-sm text-ink-500">{t('app_docs_empty')}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {docs.map((d) => (
            <div key={d.id} className="rounded-xl bg-white border border-ink-200 p-4 flex items-center gap-3 hover:shadow-card transition-base">
              <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                <FileText size={18} />
              </div>
              {renamingId === d.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') renameDocument(d.id); }}
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-ink-200 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
                  <button onClick={() => renameDocument(d.id)} className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700">
                    <Check size={14} />
                  </button>
                  <button onClick={() => { setRenamingId(null); setRenameValue(''); }} className="px-3 py-1.5 rounded-lg bg-white border border-ink-200 text-xs text-ink-600 hover:bg-ink-50">
                    {t('app_cancel')}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-950 truncate">{d.title}</p>
                    <p className="text-xs text-ink-500">{fmtDate(d.updated_at)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => openDocumentById(d.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-base">
                      <FolderOpen size={13} /> {t('app_doc_open')}
                    </button>
                    <button onClick={() => { setRenamingId(d.id); setRenameValue(d.title); }}
                      title={t('app_doc_rename')}
                      className="p-1.5 rounded-lg bg-white border border-ink-200 text-ink-600 hover:bg-ink-50 transition-base">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => deleteDocument(d.id)}
                      title={t('app_doc_delete')}
                      className="p-1.5 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-base">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
    )
  );

  const renderDocBackBar = () => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={backToDocList}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-ink-200 text-sm font-medium text-ink-700 hover:bg-ink-50 transition-base">
          <ArrowLeft size={14} /> {t('app_back_to_docs')}
        </button>
        <p className="text-base font-semibold text-ink-950 truncate flex-1 text-center">{currentDoc?.title}</p>
        <div className="w-[140px] hidden sm:flex justify-end items-center">
          {autoSave === 'saving' && <span className="text-xs text-ink-500">{t('app_autosaving')}</span>}
          {autoSave === 'saved' && <span className="text-xs text-green-600 inline-flex items-center gap-1"><Check size={12} /> {t('app_autosaved')}</span>}
        </div>
      </div>
      <input
        value={docHeader}
        onChange={(e) => setDocHeader(e.target.value)}
        placeholder={t('app_doc_header_ph')}
        aria-label={t('app_doc_header')}
        className="w-full px-3 py-2 text-sm rounded-lg border border-ink-200 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-base"
      />
    </div>
  );

  const renderPageBar = () => (
    <div className="flex items-center justify-between gap-2 flex-wrap rounded-xl bg-white border border-ink-200 p-2">
      <div className="flex items-center gap-1">
        <button onClick={() => goToPage(pageIndex - 1)} disabled={pageIndex === 0}
          className="p-1.5 rounded-md hover:bg-ink-100 transition-base text-ink-600 disabled:opacity-40 disabled:hover:bg-transparent">
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs font-semibold text-ink-700 px-2">
          {t('app_page')} {pageIndex + 1} {t('app_page_of')} {docPages.length}
        </span>
        <button onClick={() => goToPage(pageIndex + 1)} disabled={pageIndex >= docPages.length - 1}
          className="p-1.5 rounded-md hover:bg-ink-100 transition-base text-ink-600 disabled:opacity-40 disabled:hover:bg-transparent">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <button onClick={addPage}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-base">
          <Plus size={12} /> {t('app_add_page')}
        </button>
        <button onClick={deletePage} disabled={docPages.length <= 1}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-base disabled:opacity-40">
          <Trash2 size={12} /> <span className="hidden sm:inline">{t('app_delete_page')}</span>
        </button>
      </div>
    </div>
  );

  const inTransform = editorMode === 'transform';

  if (isMobile) {
    return (
      <div className="flex flex-col bg-ink-50" style={{ height: '100dvh', paddingTop: 'env(safe-area-inset-top,0px)', paddingBottom: 'env(safe-area-inset-bottom,0px)' }}>
        {renderTopBar()}
        <div className="flex gap-1 px-3 py-2 bg-white border-b border-ink-200">
          <button onClick={() => setActiveView('editor')} className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-base ${activeView === 'editor' ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100'}`}>
            <Edit3 size={12} /> {t('app_editor')}
          </button>
          <button onClick={() => { setActiveView('notebook'); setNotebookScreen('list'); }} className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-base ${activeView === 'notebook' ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100'}`}>
            <BookOpen size={12} /> {t('app_documents')}
          </button>
        </div>
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {activeView === 'editor' ? (
            <>
              <div className="flex gap-1 px-3 py-1.5 bg-white border-b border-ink-100">
                {Object.entries(CATEGORIES).map(([key, cat]) => (
                  <button key={key} onClick={() => setActiveCategory(key)}
                    className={`flex-1 py-1 rounded-md text-[10px] font-semibold transition-base ${activeCategory === key ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'text-ink-500 border border-transparent hover:bg-ink-50'}`}>
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
                      <button key={letter} onClick={() => setActiveLetter(letter)}
                        className={`w-8 h-8 rounded-md text-xs font-semibold transition-base flex-shrink-0 ${active ? 'bg-brand-600 text-white shadow-card' : drawn ? 'bg-brand-50 text-brand-700' : 'text-ink-600 border border-ink-200'}`}>
                        {letter}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex-1 min-h-0 flex flex-col p-3 gap-2">
                <div className="flex items-center justify-between flex-shrink-0">
                  <button onClick={goToPrevLetter} className="p-1.5 rounded-md hover:bg-ink-100 transition-base text-ink-600"><ChevronLeft size={16} /></button>
                  <div className="text-center flex-1">
                    <div className="text-sm leading-none">
                      <span className="text-xs text-ink-500">{t(CATEGORIES[activeCategory].key)}</span>
                      <span className="ml-2 font-bold text-lg text-brand-600">{activeLetter}</span>
                      {savedFlash && <Check size={12} className="inline ml-2 text-brand-600" />}
                    </div>
                    <p className="text-[10px] text-ink-500 mt-0.5">{inTransform ? t('app_done_size') : drawingHint()}</p>
                  </div>
                  <button onClick={goToNextLetter} className="p-1.5 rounded-md hover:bg-ink-100 transition-base text-ink-600"><ChevronRight size={16} /></button>
                </div>
                <div ref={wrapRef} className="flex-1 w-full rounded-xl relative overflow-hidden bg-white border border-ink-200" style={{ minHeight: 0, touchAction: 'none' }}>
                  {!inTransform && renderEditorGuides()}
                  <canvas ref={canvasRef} className="absolute inset-0 touch-none"
                    onMouseDown={onCanvasDown} onMouseMove={onCanvasMove} onMouseUp={onCanvasUp} onMouseLeave={onCanvasUp}
                    onTouchStart={onCanvasDown} onTouchMove={onCanvasMove} onTouchEnd={onCanvasUp} />
                  {renderTransformOverlay()}
                </div>
                <div className="flex-shrink-0">
                  {showSliders && !inTransform && (
                    <div className="p-3 mb-2 rounded-xl bg-white border border-ink-200">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">{t('app_nib')}</span>
                            <span className="text-[10px] font-semibold text-brand-600">{baseThickness}</span>
                          </div>
                          <input type="range" min="2" max="30" value={baseThickness} onChange={(e) => setBaseThickness(Number(e.target.value))} className="w-full accent-brand-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">{t('app_ink')}</span>
                            <span className="text-[10px] font-semibold text-brand-600">{Math.round(opacity * 100)}%</span>
                          </div>
                          <input type="range" min="0.2" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full accent-brand-600" />
                        </div>
                      </div>
                    </div>
                  )}
                  {inTransform ? (
                    <button onClick={exitTransformMode} className="w-full py-2.5 rounded-lg font-semibold text-sm bg-brand-600 text-white shadow-card hover:bg-brand-700 transition-base inline-flex items-center justify-center gap-2">
                      <Check size={14} /> {t('app_done_size')}
                    </button>
                  ) : (
                    <div className="flex gap-1.5">
                      <button onClick={() => setShowSliders((s) => !s)} className={`py-2 px-2.5 rounded-lg border border-ink-200 transition-base ${showSliders ? 'bg-ink-100' : 'bg-white hover:bg-ink-50'}`}><Settings size={14} className="text-ink-600" /></button>
                      <button onClick={clearCanvas} className="py-2 px-2.5 rounded-lg border border-ink-200 bg-white hover:bg-ink-50 transition-base"><Trash2 size={14} className="text-ink-600" /></button>
                      <button onClick={enterTransformMode} className="flex-1 py-2 rounded-lg border border-ink-200 bg-white hover:bg-ink-50 transition-base inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-ink-700"><Maximize2 size={12} /> {t('app_resize')}</button>
                      <button onClick={saveLetter} className="flex-1 py-2 rounded-lg bg-brand-600 text-white shadow-card hover:bg-brand-700 transition-base inline-flex items-center justify-center gap-1.5 text-xs font-semibold"><Save size={12} /> {t('app_save')}</button>
                      <button onClick={() => { saveLetter(); setTimeout(goToNextLetter, 200); }} className="py-2 px-2.5 rounded-lg bg-ink-950 text-white hover:bg-ink-800 transition-base"><ChevronRight size={14} /></button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : notebookScreen === 'list' ? (
            <div className="flex-1 min-h-0 overflow-y-auto p-3">{renderDocumentList()}</div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col p-3 gap-3 overflow-y-auto">
              {renderDocBackBar()}
              {renderPageBar()}
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => setNotebookMode('write')} className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-base inline-flex items-center justify-center gap-1.5 ${notebookMode === 'write' ? 'bg-brand-600 text-white' : 'text-ink-600 border border-ink-200 bg-white'}`}>
                  <PenLine size={12} /> {t('app_write')}
                </button>
                <button onClick={() => setNotebookMode('preview')} className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-base inline-flex items-center justify-center gap-1.5 ${notebookMode === 'preview' ? 'bg-brand-600 text-white' : 'text-ink-600 border border-ink-200 bg-white'}`}>
                  <Eye size={12} /> {t('app_preview')}
                </button>
              </div>
              {notebookMode === 'preview' && (
                <NotebookToolbar settings={notebookSettings} setSettings={setNotebookSettings}
                  onExportPNG={exportNotebookPNG} onExportPDF={exportNotebookPDF} onSaveDoc={saveCurrentDocument}
                  saveState={docSaveState} exportInfo={exportInfo} mobile={true} t={t} />
              )}
              <div className="flex-1 min-h-0" style={{ minHeight: '300px' }}>
                {notebookMode === 'write'
                  ? <RichTextEditor runs={runs} setRuns={setRuns} currentColor={currentColor} setCurrentColor={setCurrentColor} mobile={true} t={t} />
                  : renderPreviewPane('mobile')}
              </div>
            </div>
          )}
        </main>
        {drawerOpen && (
          <div className="fixed inset-0 z-40 bg-ink-950/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)}>
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col shadow-floating" onClick={(e) => e.stopPropagation()} style={{ paddingTop: 'env(safe-area-inset-top,0px)', paddingBottom: 'env(safe-area-inset-bottom,0px)' }}>
              <div className="flex items-center justify-between p-4 border-b border-ink-200">
                <Logo size="sm" linkTo={null} />
                <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-600"><X size={18} /></button>
              </div>
              {renderSidebarContent(() => setDrawerOpen(false))}
            </div>
          </div>
        )}
      </div>
    );
  }

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
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">{t(CATEGORIES[activeCategory].key)}</p>
                  <h1 className="text-3xl font-bold text-ink-950 tracking-tight">{t('app_letter')} <span className="text-brand-600">{activeLetter}</span></h1>
                  <p className="text-sm text-ink-500 mt-1">{inTransform ? t('app_done_size') : drawingHint()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {savedFlash && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 text-xs font-semibold"><Check size={12} /> {t('app_saved')}</span>}
                  {customAlphabet[activeLetter] && !savedFlash && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-ink-100 text-ink-600 text-xs font-medium">{t('app_in_alphabet')}</span>}
                </div>
              </div>
              <div ref={wrapRef} className="flex-1 w-full rounded-2xl bg-white border border-ink-200 shadow-card relative overflow-hidden" style={{ cursor: inTransform ? 'move' : 'crosshair' }}>
                {!inTransform && renderEditorGuides()}
                <canvas ref={canvasRef} className="absolute inset-0 touch-none"
                  onMouseDown={onCanvasDown} onMouseMove={onCanvasMove} onMouseUp={onCanvasUp} onMouseLeave={onCanvasUp}
                  onTouchStart={onCanvasDown} onTouchMove={onCanvasMove} onTouchEnd={onCanvasUp} />
                {renderTransformOverlay()}
              </div>
              <div className="p-4 rounded-2xl bg-white border border-ink-200 flex flex-wrap items-center gap-6">
                {!inTransform && (
                  <>
                    <div className="flex-1 min-w-[180px]">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-ink-600">{t('app_nib')}</span>
                        <span className="text-xs font-bold text-brand-600">{baseThickness}px</span>
                      </div>
                      <input type="range" min="2" max="40" value={baseThickness} onChange={(e) => setBaseThickness(Number(e.target.value))} className="w-full accent-brand-600" />
                    </div>
                    <div className="flex-1 min-w-[180px]">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-ink-600">{t('app_ink')}</span>
                        <span className="text-xs font-bold text-brand-600">{Math.round(opacity * 100)}%</span>
                      </div>
                      <input type="range" min="0.2" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full accent-brand-600" />
                    </div>
                  </>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  {inTransform ? (
                    <button onClick={exitTransformMode} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-brand-600 text-white shadow-card hover:bg-brand-700 transition-base text-sm font-semibold">
                      <Check size={14} /> {t('app_done_size')}
                    </button>
                  ) : (
                    <>
                      <button onClick={clearCanvas} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-ink-200 hover:bg-ink-50 transition-base text-sm font-medium text-ink-700"><Trash2 size={14} /> {t('app_clear')}</button>
                      {customAlphabet[activeLetter] && (
                        <button onClick={eraseLetter} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-red-200 hover:bg-red-50 transition-base text-sm font-medium text-red-700">{t('app_erase')}</button>
                      )}
                      <button onClick={enterTransformMode} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-ink-200 hover:bg-ink-50 transition-base text-sm font-medium text-ink-700"><Maximize2 size={14} /> {t('app_resize')}</button>
                      <button onClick={saveLetter} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-brand-600 text-white shadow-card hover:bg-brand-700 transition-base text-sm font-semibold"><Save size={14} /> {t('app_save')}</button>
                      <button onClick={() => { saveLetter(); setTimeout(goToNextLetter, 200); }} className="inline-flex items-center px-3 py-2 rounded-lg bg-ink-950 text-white hover:bg-ink-800 transition-base"><ChevronRight size={14} /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : notebookScreen === 'list' ? (
            <div className="h-full overflow-y-auto">{renderDocumentList()}</div>
          ) : (
            <div className="max-w-6xl mx-auto h-full flex flex-col gap-4">
              {renderDocBackBar()}
              {renderPageBar()}
              <NotebookToolbar settings={notebookSettings} setSettings={setNotebookSettings}
                onExportPNG={exportNotebookPNG} onExportPDF={exportNotebookPDF} onSaveDoc={saveCurrentDocument}
                saveState={docSaveState} exportInfo={exportInfo} mobile={false} t={t} />
              <div className="flex-1 min-h-0 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-600 flex items-center gap-1.5"><PenLine size={12} /> {t('app_write')}</p>
                  <div className="flex-1 min-h-0">
                    <RichTextEditor runs={runs} setRuns={setRuns} currentColor={currentColor} setCurrentColor={setCurrentColor} mobile={false} t={t} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-600 flex items-center gap-1.5"><Eye size={12} /> {t('app_preview')}</p>
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
