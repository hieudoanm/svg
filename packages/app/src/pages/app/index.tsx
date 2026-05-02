import { NextPage } from 'next';
import Head from 'next/head';
import { useCallback, useRef, useState } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_SVG = `<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8B5CF6" />
      <stop offset="100%" stop-color="#EC4899" />
    </linearGradient>
  </defs>
  <rect x="50" y="50" width="300" height="300" rx="40" fill="url(#gradient)" />
  <circle cx="200" cy="200" r="80" fill="white" fill-opacity="0.2" />
  <text x="200" y="215" font-family="sans-serif" font-size="24" fill="white" text-anchor="middle" font-weight="bold">SVG EDITOR</text>
</svg>`;

const PRESETS = [
  { name: 'Modern', code: DEFAULT_SVG },
  {
    name: 'Galaxy',
    code: `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#020617"/><g transform="translate(200,200)"><circle r="140" fill="none" stroke="#3b82f6" stroke-width="0.5" stroke-dasharray="1 10"/><circle r="100" fill="none" stroke="#8b5cf6" stroke-width="1" stroke-dasharray="5 15" opacity="0.5"/><circle r="60" fill="none" stroke="#ec4899" stroke-width="2" stroke-dasharray="10 20"/><circle r="20" fill="#f43f5e" filter="blur(8px)"/><circle r="6" fill="white"/></g></svg>`,
  },
  {
    name: 'Aurora',
    code: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><path fill="#8B5CF6" d="M44.7,-76.4C58.2,-69.2,70,-58.5,77.4,-45.5C84.7,-32.5,87.7,-17.2,85.1,-2.6C82.5,12,74.3,25.9,64.8,38.2C55.3,50.5,44.6,61.1,32.1,68.2C19.7,75.3,5.5,78.9,-9.4,77.5C-24.3,76.1,-39.8,69.7,-52.2,59.8C-64.6,49.9,-73.9,36.5,-78.9,21.8C-83.9,7.1,-84.6,-8.8,-79.9,-23.5C-75.2,-38.2,-65.1,-51.7,-52.1,-59.1C-39.1,-66.5,-23.2,-67.7,-8.4,-75.4C6.5,-83.1,21.3,-97.3,44.7,-76.4Z" transform="translate(100 100)" filter="blur(4px)" /></svg>`,
  },
  {
    name: 'Blueprint',
    code: `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#2563eb"/><path d="M0 50h100M50 0v100" stroke="#60a5fa" stroke-width="0.5"/><path d="M20 20h60v60h-60z" fill="none" stroke="white" stroke-width="1.5" stroke-dasharray="4 2"/><circle cx="50" cy="50" r="25" fill="none" stroke="white" stroke-width="1"/></svg>`,
  },
];

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// ─── Types ────────────────────────────────────────────────────────────────────

type BgMode = 'grid' | 'white' | 'black' | 'transparent';
type Tab = 'editor' | 'icons';

type GeneratedIcon = {
  size: number;
  dataUrl: string;
  canvas: HTMLCanvasElement;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function svgToCanvas(
  svgText: string,
  size: number
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const sized = svgText
      .replace(/width="[^"]*"/, `width="${size}"`)
      .replace(/height="[^"]*"/, `height="${size}"`);

    const blob = new Blob([sized], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to render SVG'));
    };
    img.src = url;
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const AppPage: NextPage = () => {
  // Editor state
  const [svgCode, setSvgCode] = useState(DEFAULT_SVG);
  const [isCopied, setIsCopied] = useState(false);
  const [bgMode, setBgMode] = useState<BgMode>('grid');
  const [activeTab, setActiveTab] = useState<Tab>('editor');

  // Icons state
  const [icons, setIcons] = useState<GeneratedIcon[]>([]);
  const [iconError, setIconError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [sourceName, setSourceName] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Editor handlers ──────────────────────────────────────────────────────

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(svgCode).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, [svgCode]);

  const handleDownloadSvg = useCallback(() => {
    const blob = new Blob([svgCode], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'icon.svg';
    link.click();
    URL.revokeObjectURL(url);
  }, [svgCode]);

  const handleFormat = useCallback(() => {
    const formatted = svgCode
      .replace(/>\s+</g, '><')
      .replace(/></g, '>\n<')
      .split('\n')
      .map((line) => line.trim())
      .join('\n');
    setSvgCode(formatted);
  }, [svgCode]);

  // ── Icon generation handlers ─────────────────────────────────────────────

  const runIconGeneration = useCallback(
    async (svgText: string, label: string) => {
      setIconError(null);
      setIcons([]);
      setProcessing(true);
      try {
        const generated: GeneratedIcon[] = await Promise.all(
          ICON_SIZES.map(async (size) => {
            const canvas = await svgToCanvas(svgText, size);
            return { size, dataUrl: canvas.toDataURL('image/png'), canvas };
          })
        );
        setIcons(generated);
        setSourceName(label);
      } catch {
        setIconError('Failed to render SVG. Make sure it is valid.');
      } finally {
        setProcessing(false);
      }
    },
    []
  );

  const generateFromEditor = useCallback(() => {
    runIconGeneration(svgCode, 'SVG Editor');
  }, [svgCode, runIconGeneration]);

  const processFile = useCallback(
    async (file: File) => {
      if (file.type !== 'image/svg+xml') {
        setIconError('Only SVG files are accepted.');
        return;
      }
      const svgText = await file.text();
      if (!svgText.trim().startsWith('<svg') && !svgText.includes('<svg')) {
        setIconError('Invalid SVG file.');
        return;
      }
      runIconGeneration(svgText, file.name);
    },
    [runIconGeneration]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (files && files[0]) processFile(files[0]);
    },
    [processFile]
  );

  const downloadSingle = (icon: GeneratedIcon) => {
    const a = document.createElement('a');
    a.href = icon.dataUrl;
    a.download = `icon-${icon.size}x${icon.size}.png`;
    a.click();
  };

  const downloadAll = async () => {
    const script = document.createElement('script');
    script.src =
      'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    document.head.appendChild(script);
    await new Promise((res) => (script.onload = res));
    // @ts-ignore
    const zip = new window.JSZip();
    const folder = zip.folder('icons');
    for (const icon of icons) {
      const blob = await new Promise<Blob>((res) =>
        icon.canvas.toBlob((b) => res(b!), 'image/png')
      );
      const buf = await blob.arrayBuffer();
      folder.file(`icon-${icon.size}x${icon.size}.png`, buf);
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = 'icons.zip';
    a.click();
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="bg-base-300 text-base-content selection:bg-primary/30 flex min-h-screen flex-col font-sans">
      <Head>
        <title>SVG Pro Studio</title>
      </Head>

      {/* Navbar */}
      <header className="navbar bg-base-100/80 border-base-200 sticky top-0 z-50 border-b px-4 shadow-lg backdrop-blur-md md:px-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="from-primary via-secondary to-accent shadow-primary/20 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="m11 20-3.5-3.5a1 1 0 0 1 0-1.4l10.1-10.1a1 1 0 0 1 1.4 0L22.5 8.5a1 1 0 0 1 0 1.4L12.4 20a1 1 0 0 1-1.4 0z" />
                <path d="M18 5q-1.5 1.5-3 3" />
                <rect x="2" y="14" width="8" height="8" rx="2" />
              </svg>
            </div>
            <div>
              <h1 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-lg font-black tracking-tighter text-transparent uppercase md:text-xl">
                SVG Pro{' '}
                <span className="text-base-content/40 font-light">Studio</span>
              </h1>
              <p className="text-base-content/30 -mt-1 hidden text-[10px] font-bold tracking-[0.2em] md:block">
                PROFESSIONAL DESIGNS
              </p>
            </div>
          </div>
        </div>

        <div className="flex-none gap-2 md:gap-4">
          {/* Tab switcher */}
          <div className="bg-base-200 mr-2 flex items-center gap-1 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('editor')}
              className={`btn btn-xs rounded-md border-none ${activeTab === 'editor' ? 'bg-base-100 text-primary shadow-sm' : 'hover:bg-base-100/50 bg-transparent'}`}>
              ✏️ Editor
            </button>
            <button
              onClick={() => setActiveTab('icons')}
              className={`btn btn-xs rounded-md border-none ${activeTab === 'icons' ? 'bg-base-100 text-primary shadow-sm' : 'hover:bg-base-100/50 bg-transparent'}`}>
              🖼️ Icons
            </button>
          </div>

          {/* Editor-specific controls */}
          {activeTab === 'editor' && (
            <>
              <div className="bg-base-200 mr-2 hidden items-center gap-1 rounded-lg p-1 sm:flex">
                {(['grid', 'white', 'black', 'transparent'] as const).map(
                  (mode) => (
                    <button
                      key={mode}
                      onClick={() => setBgMode(mode)}
                      className={`btn btn-xs rounded-md border-none ${bgMode === mode ? 'bg-base-100 text-primary shadow-sm' : 'hover:bg-base-100/50 bg-transparent'}`}>
                      {mode.charAt(0).toUpperCase()}
                    </button>
                  )
                )}
              </div>
              <button
                onClick={handleFormat}
                className="btn btn-ghost btn-sm tooltip tooltip-bottom"
                data-tip="Beautify SVG">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M21 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2" />
                  <path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
                  <path d="M12 11h4" />
                  <path d="M12 7h4" />
                  <path d="M12 15h4" />
                  <path d="M8 7H7a1 1 0 0 0-1 1v2.172a2 2 0 0 1-.586 1.414L4 13l1.414 1.414A2 2 0 0 1 6 15.828V18a1 1 0 0 0 1 1h1" />
                </svg>
              </button>
              <button
                onClick={handleCopy}
                className={`btn ${isCopied ? 'btn-success' : 'btn-primary'} btn-sm shadow-primary/20 rounded-full px-5 shadow-lg transition-all duration-500`}>
                {isCopied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={handleDownloadSvg}
                className="btn btn-secondary btn-sm shadow-secondary/20 rounded-full px-5 shadow-lg">
                Export
              </button>
            </>
          )}

          {/* Icons-specific controls */}
          {activeTab === 'icons' && icons.length > 0 && (
            <button
              onClick={downloadAll}
              className="btn btn-primary btn-sm shadow-primary/20 rounded-full px-5 shadow-lg">
              ZIP All
            </button>
          )}
        </div>
      </header>

      {/* ── Editor Tab ────────────────────────────────────────────────────────── */}
      {activeTab === 'editor' && (
        <>
          <main className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
            {/* Left: Editor */}
            <div className="border-base-content/5 bg-base-200/50 relative flex flex-col overflow-hidden border-r">
              <div className="bg-base-300/50 border-base-content/5 sticky top-0 z-20 flex items-center justify-between border-b px-4 py-3 backdrop-blur-sm">
                <span className="text-base-content/40 flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase">
                  <span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full"></span>
                  SVG Source
                </span>
                <div className="flex gap-1.5">
                  <div className="bg-base-content/10 h-2.5 w-2.5 rounded-full"></div>
                  <div className="bg-base-content/10 h-2.5 w-2.5 rounded-full"></div>
                  <div className="bg-base-content/10 h-2.5 w-2.5 rounded-full"></div>
                </div>
              </div>
              <div className="relative flex-1">
                <textarea
                  value={svgCode}
                  onChange={(e) => setSvgCode(e.target.value)}
                  className="selection:bg-primary/20 absolute inset-0 h-full w-full resize-none overflow-auto border-none bg-transparent p-6 font-mono text-sm leading-relaxed transition-all outline-none focus:ring-0 md:p-8"
                  spellCheck={false}
                  placeholder="Paste your SVG code here..."
                />
              </div>
            </div>

            {/* Right: Preview */}
            <div className="bg-base-300 group relative flex flex-col overflow-hidden">
              <div className="bg-base-300/50 border-base-content/5 sticky top-0 z-20 border-b px-4 py-3 backdrop-blur-sm">
                <span className="text-base-content/40 text-[10px] font-black tracking-[0.2em] uppercase">
                  Render Canvas
                </span>
              </div>

              <div
                className={`flex flex-1 items-center justify-center overflow-auto p-8 transition-colors duration-500 lg:p-20 ${bgMode === 'grid' ? 'bg-[radial-gradient(circle,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[length:30px_30px]' : ''} ${bgMode === 'white' ? 'bg-white' : ''} ${bgMode === 'black' ? 'bg-zinc-950' : ''} ${bgMode === 'transparent' ? 'bg-transparent' : ''}`}>
                <div className="group/canvas relative">
                  <div
                    className={`relative transition-all duration-700 hover:scale-[1.03] ${bgMode === 'black' ? 'shadow-[0_0_50px_rgba(255,255,255,0.05)]' : 'shadow-2xl shadow-black/20'}`}>
                    <div
                      className="animate-in fade-in zoom-in flex h-full w-full items-center justify-center duration-500"
                      dangerouslySetInnerHTML={{ __html: svgCode }}
                    />
                  </div>

                  <div className="absolute -top-4 -right-4 z-10">
                    <div className="badge badge-primary badge-sm shadow-primary/20 gap-1.5 border-none px-4 py-3.5 text-[9px] font-bold tracking-widest shadow-xl">
                      <div className="h-1 w-1 animate-ping rounded-full bg-white"></div>
                      LIVE VIEW
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating controls */}
              <div className="bg-base-100/60 absolute bottom-10 left-1/2 flex -translate-x-1/2 translate-y-4 items-center gap-2 rounded-2xl border border-white/10 p-1.5 opacity-0 shadow-2xl backdrop-blur-xl transition-all group-hover:translate-y-0 group-hover:opacity-100">
                <button
                  onClick={() => setSvgCode(DEFAULT_SVG)}
                  className="btn btn-circle btn-ghost btn-sm tooltip"
                  data-tip="Reset">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                </button>
                <div className="divider divider-horizontal mx-0"></div>
                <button
                  onClick={() => {
                    generateFromEditor();
                    setActiveTab('icons');
                  }}
                  className="btn btn-primary btn-xs rounded-xl px-4 text-[10px] tracking-widest uppercase">
                  🖼️ Generate Icons
                </button>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="bg-base-100/50 border-base-200 z-30 flex flex-wrap items-center gap-6 border-t px-6 py-5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="text-base-content/40 text-[10px] font-black tracking-widest uppercase">
                Library
              </span>
              <div className="flex gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => setSvgCode(p.code)}
                    className="btn btn-xs border-base-content/10 hover:border-primary/50 hover:bg-primary/5 rounded-full px-4 font-serif lowercase italic transition-all">
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="divider divider-horizontal mx-0 hidden h-8 opacity-20 lg:block"></div>

            <div className="ml-auto flex items-center gap-4">
              <div className="text-base-content/30 hidden text-[9px] font-bold tracking-widest uppercase md:block">
                Status:{' '}
                <span className="text-success">Perfectly Validated</span>
              </div>
              <div className="badge badge-outline border-base-content/10 rounded-full py-3 font-mono text-[9px] opacity-60">
                {svgCode.length} BYTES
              </div>
            </div>
          </footer>
        </>
      )}

      {/* ── Icons Tab ─────────────────────────────────────────────────────────── */}
      {activeTab === 'icons' && (
        <main className="flex flex-1 flex-col gap-8 overflow-y-auto px-6 py-10 md:px-12">
          {/* Source options */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-base-content/40 text-[10px] font-black tracking-[0.2em] uppercase">
                Source SVG
              </span>
              <button
                onClick={generateFromEditor}
                disabled={processing}
                className="btn btn-xs btn-outline border-primary/30 hover:btn-primary rounded-full px-4 text-[10px]">
                {processing ? '⏳ Rendering…' : '✏️ Use current editor SVG'}
              </button>
            </div>

            {/* Drop zone */}
            <div
              onClick={() => !processing && inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFiles(e.dataTransfer.files);
              }}
              className={[
                'border-base-content/10 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-12 transition-all duration-300',
                processing
                  ? 'border-primary/30 bg-primary/5 cursor-wait'
                  : dragging
                    ? 'border-primary/60 bg-primary/5'
                    : 'bg-base-200/30 hover:border-primary/40 hover:bg-primary/5',
              ].join(' ')}>
              <input
                ref={inputRef}
                type="file"
                accept="image/svg+xml,.svg"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <span className="text-4xl">
                {processing ? '⏳' : dragging ? '📂' : '📁'}
              </span>
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-base-content/60 text-sm font-light">
                  {processing
                    ? 'Rendering at all sizes…'
                    : dragging
                      ? 'Release to upload'
                      : 'Drop an SVG file here or click to browse'}
                </span>
                <span className="text-base-content/30 text-[10px] tracking-widest uppercase">
                  SVG only · generates PNG at 72 → 512 px
                </span>
              </div>
            </div>
          </div>

          {/* Error */}
          {iconError && (
            <div className="alert alert-error text-sm">
              <span>{iconError}</span>
            </div>
          )}

          {/* Results grid */}
          {icons.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base-content font-semibold tracking-wide">
                    Generated Icons
                  </h2>
                  {sourceName && (
                    <p className="text-base-content/30 mt-0.5 text-[10px] tracking-wide">
                      Source: {sourceName}
                    </p>
                  )}
                </div>
                <button
                  onClick={downloadAll}
                  className="btn btn-primary btn-sm shadow-primary/20 rounded-full px-6 shadow-lg">
                  Download ZIP
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
                {icons.map((icon) => (
                  <button
                    key={icon.size}
                    onClick={() => downloadSingle(icon)}
                    className="group bg-base-200 hover:bg-primary/10 border-base-content/5 hover:border-primary/30 flex flex-col items-center gap-2 rounded-xl border p-3 transition-all duration-200">
                    <img
                      src={icon.dataUrl}
                      alt={`${icon.size}x${icon.size}`}
                      className="h-10 w-10 object-contain"
                    />
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-base-content/60 text-[10px] font-medium tabular-nums">
                        {icon.size}px
                      </span>
                      <span className="text-primary/0 group-hover:text-primary/50 text-[9px] tracking-widest uppercase transition-all duration-200">
                        ↓ PNG
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <p className="text-base-content/20 text-center text-[10px] tracking-widest uppercase">
                Click any icon to download · or grab all as a ZIP
              </p>
            </div>
          )}
        </main>
      )}
    </div>
  );
};

export default AppPage;
