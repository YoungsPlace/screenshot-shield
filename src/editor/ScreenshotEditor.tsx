import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppError,
  clampRect,
  closeImageAsset,
  createHistory,
  drawBaseImage,
  exportRedactedImage,
  getLocalOcrSuggestions,
  isMeaningfulRect,
  normalizeRect,
  observationsToSuggestions,
  pushHistory,
  redoHistory,
  rectContainsPoint,
  undoHistory,
  type EditorSnapshot,
  type ExportOptions,
  type ImageAsset,
  type Point,
  type RedactionMode,
  type RedactionRegion,
  type SensitiveSuggestion,
  type TextObservation,
} from '../domain';
import './Editor.css';

const initialSnapshot: EditorSnapshot = { regions: [], selectedRegionId: null };
const syntheticOcrObservations: TextObservation[] = [
  { text: 'demo@example.com token sk_live_redacted_1234567890', box: { x: 72, y: 72, width: 440, height: 32 }, confidence: 0.82 },
];

function regionId(): string {
  return `region-${crypto.randomUUID()}`;
}

function imagePoint(event: React.PointerEvent, target: HTMLElement, zoom: number): Point {
  const bounds = target.getBoundingClientRect();
  return {
    x: (event.clientX - bounds.left) / zoom,
    y: (event.clientY - bounds.top) / zoom,
  };
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noreferrer';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function ScreenshotEditor(): JSX.Element {
  const [asset, setAsset] = useState<ImageAsset | null>(null);
  const [history, setHistory] = useState(() => createHistory(initialSnapshot));
  const [error, setError] = useState<string | null>(null);
  const [draggingFile, setDraggingFile] = useState(false);
  const [draft, setDraft] = useState<RedactionRegion | null>(null);
  const [zoom, setZoom] = useState(1);
  const [mode, setMode] = useState<RedactionMode>('cover');
  const [exportFormat, setExportFormat] = useState<ExportOptions['format']>('image/png');
  const [jpegQuality, setJpegQuality] = useState(0.92);
  const [suggestions, setSuggestions] = useState<SensitiveSuggestion[]>([]);
  const [ocrStatus, setOcrStatus] = useState('OCR suggestions are optional; manual redaction works without OCR.');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const layerRef = useRef<HTMLDivElement | null>(null);
  const startPointRef = useRef<Point | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const snapshot = history.present;
  const visibleRegions = draft ? [...snapshot.regions, draft] : snapshot.regions;
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const commitSnapshot = useCallback((next: EditorSnapshot) => {
    setHistory((current) => pushHistory(current, next));
  }, []);

  const resetForAsset = useCallback((nextAsset: ImageAsset) => {
    setAsset((previous) => {
      closeImageAsset(previous);
      return nextAsset;
    });
    setHistory(createHistory(initialSnapshot));
    setSuggestions([]);
    setDraft(null);
    setError(null);
    setOcrStatus('Ready. Draw rectangles or run local detection suggestions.');
  }, []);

  useEffect(() => () => closeImageAsset(asset), [asset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!asset || !canvas) return;
    drawBaseImage(canvas, asset);
  }, [asset]);

  useEffect(() => {
    function onPaste(event: ClipboardEvent): void {
      const file = Array.from(event.clipboardData?.files ?? []).find((item) => item.type.startsWith('image/'));
      if (file) void importFile(file);
    }
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  });

  const importFile = useCallback(
    async (file: File) => {
      setError(null);
      try {
        const { loadImageAsset } = await import('../domain/image');
        resetForAsset(await loadImageAsset(file));
      } catch (caught) {
        setError(caught instanceof AppError ? caught.message : 'The screenshot could not be imported.');
      }
    },
    [resetForAsset],
  );

  const addRegion = useCallback(
    (region: RedactionRegion) => {
      commitSnapshot({ regions: [...snapshot.regions, region], selectedRegionId: region.id });
    },
    [commitSnapshot, snapshot.regions],
  );

  const removeSelected = useCallback(() => {
    if (!snapshot.selectedRegionId) return;
    commitSnapshot({
      regions: snapshot.regions.filter((region) => region.id !== snapshot.selectedRegionId),
      selectedRegionId: null,
    });
  }, [commitSnapshot, snapshot.regions, snapshot.selectedRegionId]);

  const clearAll = useCallback(() => {
    if (snapshot.regions.length === 0) return;
    commitSnapshot(initialSnapshot);
  }, [commitSnapshot, snapshot.regions.length]);

  const runSuggestions = useCallback(async () => {
    if (!asset) return;
    setOcrStatus('Checking local OCR suggestions…');
    try {
      const detected = await getLocalOcrSuggestions(asset);
      setSuggestions(detected);
      setOcrStatus(detected.length ? `${detected.length} suggestion(s) found locally.` : 'Local OCR ran but found no supported sensitive patterns.');
    } catch (caught) {
      const fallback = observationsToSuggestions(syntheticOcrObservations);
      setSuggestions(fallback);
      setOcrStatus(
        caught instanceof AppError
          ? `${caught.message} Showing synthetic detector examples for review.`
          : 'OCR unavailable. Showing synthetic detector examples for review.',
      );
    }
  }, [asset]);

  const acceptSuggestion = useCallback(
    (suggestion: SensitiveSuggestion) => {
      addRegion({
        id: regionId(),
        x: suggestion.x,
        y: suggestion.y,
        width: suggestion.width,
        height: suggestion.height,
        mode: 'cover',
        source: 'suggestion',
        label: suggestion.kind,
      });
      setSuggestions((current) => current.filter((item) => item.id !== suggestion.id));
    },
    [addRegion],
  );

  const exportImage = useCallback(async () => {
    if (!asset) return;
    setError(null);
    try {
      const blob = await exportRedactedImage(asset, {
        format: exportFormat,
        quality: jpegQuality,
        regions: snapshot.regions,
      });
      const extension = exportFormat === 'image/png' ? 'png' : 'jpg';
      downloadBlob(blob, `sanitized-${asset.fileName.replace(/\.[^.]+$/, '')}.${extension}`);
    } catch (caught) {
      setError(caught instanceof AppError ? caught.message : 'The sanitized screenshot could not be exported.');
    }
  }, [asset, exportFormat, jpegQuality, snapshot.regions]);

  const stats = useMemo(() => {
    if (!asset) return 'No screenshot loaded.';
    return `${asset.width} × ${asset.height}px · ${(asset.bytes / 1024 / 1024).toFixed(2)} MB · ${snapshot.regions.length} redaction(s)`;
  }, [asset, snapshot.regions.length]);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>): void {
    if (!asset || !layerRef.current) return;
    const point = imagePoint(event, layerRef.current, zoom);
    const selected = [...snapshot.regions].reverse().find((region) => rectContainsPoint(region, point));
    if (selected) {
      commitSnapshot({ ...snapshot, selectedRegionId: selected.id });
      return;
    }
    startPointRef.current = point;
    const nextDraft: RedactionRegion = { id: 'draft-region', x: point.x, y: point.y, width: 0, height: 0, mode, source: 'manual' };
    setDraft(nextDraft);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>): void {
    if (!asset || !layerRef.current || !startPointRef.current) return;
    const next = clampRect(normalizeRect(startPointRef.current, imagePoint(event, layerRef.current, zoom)), asset);
    setDraft({ id: 'draft-region', ...next, mode, source: 'manual' });
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>): void {
    if (!draft || !asset) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    const finalRect = clampRect(draft, asset);
    startPointRef.current = null;
    setDraft(null);
    if (isMeaningfulRect(finalRect)) addRegion({ ...finalRect, id: regionId(), mode, source: 'manual' });
  }

  return (
    <section id="editor" className="editor-section" aria-labelledby="editor-title">
      <div className="toolbar" role="group" aria-label="Import screenshot">
        <h2 id="editor-title">Local screenshot editor</h2>
        <label className="button-like primary">
          Select screenshot
          <input
            ref={fileInputRef}
            className="file-input"
            data-testid="file-input"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) void importFile(file);
              event.currentTarget.value = '';
            }}
          />
        </label>
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          Open picker
        </button>
      </div>

      {error ? <p className="notice error" role="alert">{error}</p> : null}
      <p className="notice">Images stay in memory only. Paste, drop, or pick a PNG/JPEG/WebP screenshot; export is re-encoded from a fresh canvas.</p>

      <div className="editor-layout">
        <div className="editor-panel">
          {!asset ? (
            <div
              className={`dropzone ${draggingFile ? 'dragging' : ''}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDraggingFile(true);
              }}
              onDragLeave={() => setDraggingFile(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDraggingFile(false);
                const file = Array.from(event.dataTransfer.files).find((item) => item.type.startsWith('image/'));
                if (file) void importFile(file);
              }}
            >
              <div>
                <strong>Drop a screenshot here</strong>
                <p>Clipboard paste works anywhere on the page.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="toolbar" aria-label="Editor controls">
                <label>
                  Redaction mode{' '}
                  <select value={mode} onChange={(event) => setMode(event.target.value as RedactionMode)}>
                    <option value="cover">Opaque cover</option>
                    <option value="pixelate">Pixelate + darken</option>
                  </select>
                </label>
                <button type="button" onClick={() => setZoom((value) => Math.max(0.2, value - 0.1))}>Zoom out</button>
                <button type="button" onClick={() => setZoom(1)}>Fit 100%</button>
                <button type="button" onClick={() => setZoom((value) => Math.min(3, value + 0.1))}>Zoom in</button>
              </div>
              <div className="canvas-shell">
                <div className="canvas-wrap" style={{ width: asset.width * zoom + 32, height: asset.height * zoom + 32 }}>
                  <canvas
                    ref={canvasRef}
                    className="editor-canvas"
                    width={asset.width}
                    height={asset.height}
                    style={{ width: asset.width * zoom, height: asset.height * zoom }}
                    aria-label="Screenshot preview canvas"
                  />
                  <div
                    ref={layerRef}
                    className="region-layer"
                    role="application"
                    aria-label="Draw redaction rectangles"
                    tabIndex={0}
                    style={{ width: asset.width * zoom, height: asset.height * zoom }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onKeyDown={(event) => {
                      if (event.key === 'Delete' || event.key === 'Backspace') removeSelected();
                      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') setHistory((current) => undoHistory(current));
                    }}
                  >
                    {visibleRegions.map((region) => (
                      <button
                        type="button"
                        key={region.id}
                        className={`region-box ${region.mode} ${snapshot.selectedRegionId === region.id ? 'selected' : ''}`}
                        style={{ left: region.x * zoom, top: region.y * zoom, width: region.width * zoom, height: region.height * zoom }}
                        aria-label={`${region.label ?? region.source} redaction`}
                        onClick={(event) => {
                          event.stopPropagation();
                          commitSnapshot({ ...snapshot, selectedRegionId: region.id });
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <aside className="side-panel" aria-label="Redaction review and export">
          <p className="meta">{stats}</p>
          <div className="history-actions">
            <button type="button" disabled={!canUndo} onClick={() => setHistory((current) => undoHistory(current))}>Undo</button>
            <button type="button" disabled={!canRedo} onClick={() => setHistory((current) => redoHistory(current))}>Redo</button>
            <button type="button" disabled={!snapshot.selectedRegionId} onClick={removeSelected}>Remove selected</button>
            <button className="danger" type="button" disabled={!snapshot.regions.length} onClick={clearAll}>Clear all</button>
          </div>

          <h3>OCR-assisted suggestions</h3>
          <p className="meta">{ocrStatus}</p>
          <button type="button" disabled={!asset} onClick={runSuggestions}>Review local suggestions</button>
          <ul className="panel-list" aria-label="Detection suggestions">
            {suggestions.map((suggestion) => (
              <li key={suggestion.id}>
                <strong>{suggestion.kind}</strong>
                <p className="meta">{suggestion.text}</p>
                <button type="button" disabled={!asset} onClick={() => acceptSuggestion(suggestion)}>Add redaction</button>
              </li>
            ))}
          </ul>

          <h3>Regions</h3>
          <ul className="panel-list" aria-label="Redaction regions">
            {snapshot.regions.length === 0 ? <li className="meta">No redactions yet. Draw over sensitive areas.</li> : null}
            {snapshot.regions.map((region, index) => (
              <li key={region.id}>
                <button type="button" onClick={() => commitSnapshot({ ...snapshot, selectedRegionId: region.id })}>
                  Region {index + 1}: {Math.round(region.width)} × {Math.round(region.height)} {region.mode}
                </button>
              </li>
            ))}
          </ul>

          <h3>Export</h3>
          <div className="control-row">
            <label htmlFor="format">Format</label>
            <select id="format" value={exportFormat} onChange={(event) => setExportFormat(event.target.value as ExportOptions['format'])}>
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPEG</option>
            </select>
          </div>
          {exportFormat === 'image/jpeg' ? (
            <div className="control-row">
              <label htmlFor="quality">JPEG quality {Math.round(jpegQuality * 100)}%</label>
              <input id="quality" type="range" min="0.6" max="0.98" step="0.01" value={jpegQuality} onChange={(event) => setJpegQuality(Number(event.target.value))} />
            </div>
          ) : null}
          <button className="primary" type="button" disabled={!asset} onClick={exportImage}>Download sanitized image</button>
        </aside>
      </div>
    </section>
  );
}
