import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppError,
  MIN_REDACTION_SIZE,
  clampRect,
  closeImageAsset,
  createHistory,
  drawBaseImage,
  getLocalOcrSuggestions,
  isMeaningfulRect,
  loadImageAsset,
  normalizeRect,
  moveRect,
  prepareRedactedFile,
  pushHistory,
  redoHistory,
  resizeRect,
  undoHistory,
  type EditorSnapshot,
  type ExportOptions,
  type ImageAsset,
  type Point,
  type RedactionMode,
  type RedactionRegion,
  type ResizeHandle,
  type SensitiveSuggestion,
} from '../domain';
import type { Locale } from '../marketing/i18n';
import './Editor.css';

const initialSnapshot: EditorSnapshot = { regions: [], selectedRegionId: null };
const resizeHandles: readonly ResizeHandle[] = [
  'north-west',
  'north',
  'north-east',
  'east',
  'south-east',
  'south',
  'south-west',
  'west',
];

type OutputState =
  | { status: 'dirty' }
  | { status: 'preparing' }
  | { status: 'ready'; file: File; objectUrl: string }
  | { status: 'error'; code: AppError['code'] | 'prepare-failed' };

type OcrStatus =
  | { status: 'initial' }
  | { status: 'ready' }
  | { status: 'checking' }
  | { status: 'found'; count: number }
  | { status: 'none' }
  | { status: 'unavailable' };

type ShareStatus = 'unsupported' | 'cancelled' | 'failed' | 'complete' | null;

type Interaction =
  | { kind: 'create'; start: Point }
  | { kind: 'move'; start: Point; region: RedactionRegion }
  | { kind: 'resize'; start: Point; region: RedactionRegion; handle: ResizeHandle };

type EditorCopy = {
  title: string;
  importGroup: string;
  selectScreenshot: string;
  retryImport: string;
  resetEditor: string;
  localOnlyNotice: string;
  dropTitle: string;
  dropBody: string;
  editorControls: string;
  modeLabel: string;
  coverMode: string;
  pixelateMode: string;
  zoomOut: string;
  zoomReset: string;
  zoomIn: string;
  previewCanvas: string;
  drawRegions: string;
  reviewExport: string;
  noImage: string;
  undo: string;
  redo: string;
  removeSelected: string;
  clearAll: string;
  manualEdit: string;
  addManualRedaction: string;
  moveLeft: string;
  moveRight: string;
  moveUp: string;
  moveDown: string;
  makeWider: string;
  makeNarrower: string;
  makeTaller: string;
  makeShorter: string;
  ocrTitle: string;
  reviewSuggestions: string;
  detectionSuggestions: string;
  addRedaction: string;
  regionsTitle: string;
  regionsList: string;
  noRegions: string;
  exportTitle: string;
  format: string;
  quality: string;
  prepare: string;
  preparing: string;
  prepareAgain: string;
  prepared: string;
  download: string;
  share: string;
  errors: Record<AppError['code'] | 'import-failed' | 'prepare-failed', string>;
  ocr: {
    initial: string;
    ready: string;
    checking: string;
    found: string;
    none: string;
    unavailable: string;
  };
  shareStatus: Record<Exclude<ShareStatus, null>, string>;
  source: Record<RedactionRegion['source'], string>;
  mode: Record<RedactionMode, string>;
  suggestionKind: Record<SensitiveSuggestion['kind'], string>;
};

const editorCopy: Record<Locale, EditorCopy> = {
  ko: {
    title: '로컬 스크린샷 편집기',
    importGroup: '스크린샷 가져오기',
    selectScreenshot: '스크린샷 선택',
    retryImport: '다시 선택',
    resetEditor: '편집기 초기화',
    localOnlyNotice:
      '이미지는 이 브라우저의 메모리에서만 처리됩니다. PNG, JPEG 또는 WebP 스크린샷을 붙여넣거나, 끌어놓거나, 선택하세요. 내보내기는 새 캔버스에서 다시 인코딩됩니다.',
    dropTitle: '여기에 스크린샷을 놓으세요',
    dropBody: '페이지 어디에서나 클립보드 붙여넣기를 사용할 수 있습니다.',
    editorControls: '편집기 제어',
    modeLabel: '가리기 방식',
    coverMode: '불투명 가리기',
    pixelateMode: '픽셀화 및 어둡게',
    zoomOut: '축소',
    zoomReset: '100%로 맞추기',
    zoomIn: '확대',
    previewCanvas: '스크린샷 미리보기 캔버스',
    drawRegions: '가리기 영역을 그리고 조정하세요',
    reviewExport: '가리기 검토 및 내보내기',
    noImage: '불러온 스크린샷이 없습니다.',
    undo: '실행 취소',
    redo: '다시 실행',
    removeSelected: '선택한 영역 삭제',
    clearAll: '모두 지우기',
    manualEdit: '선택한 영역 수동 조정',
    addManualRedaction: '수동 가리기 영역 추가',
    moveLeft: '왼쪽으로 이동',
    moveRight: '오른쪽으로 이동',
    moveUp: '위로 이동',
    moveDown: '아래로 이동',
    makeWider: '넓게',
    makeNarrower: '좁게',
    makeTaller: '높게',
    makeShorter: '낮게',
    ocrTitle: 'OCR 보조 제안',
    reviewSuggestions: '로컬 제안 검토',
    detectionSuggestions: '감지 제안',
    addRedaction: '가리기 영역 추가',
    regionsTitle: '영역',
    regionsList: '가리기 영역 목록',
    noRegions: '아직 가리기 영역이 없습니다. 민감한 부분 위에 직접 영역을 그리세요.',
    exportTitle: '내보내기',
    format: '형식',
    quality: 'JPEG 품질',
    prepare: '가린 파일 준비',
    preparing: '가린 파일을 준비하는 중…',
    prepareAgain: '다시 준비',
    prepared: '공유 또는 저장할 가린 파일이 준비되었습니다.',
    download: '다운로드 또는 저장',
    share: '공유',
    errors: {
      'unsupported-type': 'PNG, JPEG 또는 WebP 이미지만 선택할 수 있습니다.',
      'file-too-large': '이미지 파일이 허용된 최대 크기를 초과합니다.',
      'image-too-large': '이미지 크기가 허용된 최대 범위를 초과합니다.',
      'decode-failed': '이 이미지를 열 수 없습니다.',
      'canvas-unavailable': '이 브라우저에서는 캔버스 렌더링을 사용할 수 없습니다.',
      'export-failed': '가린 스크린샷을 준비할 수 없습니다.',
      'ocr-unavailable':
        '자동 제안을 사용할 수 없습니다. 이미지를 직접 검토하고 가리기 영역을 그리세요.',
      'import-failed': '스크린샷을 가져올 수 없습니다.',
      'prepare-failed': '가린 스크린샷을 준비할 수 없습니다.',
    },
    ocr: {
      initial: '자동 제안은 선택 사항입니다. 직접 가리기는 OCR 없이도 사용할 수 있습니다.',
      ready: '준비되었습니다. 영역을 직접 그리거나 로컬 제안을 검토하세요.',
      checking: '로컬 OCR 제안을 확인하는 중…',
      found: '개의 로컬 제안을 찾았습니다.',
      none: '로컬 OCR이 지원되는 민감 패턴을 찾지 못했습니다. 이미지를 직접 검토하세요.',
      unavailable:
        '자동 제안을 사용할 수 없습니다. 실제 스크린샷에는 예시 영역을 추가하지 않았습니다. 직접 검토하고 영역을 그리세요.',
    },
    shareStatus: {
      unsupported:
        '이 브라우저에서는 파일 공유를 사용할 수 없습니다. 준비된 파일을 다운로드하거나 저장하세요.',
      cancelled: '공유가 취소되었습니다. 준비된 파일은 계속 다운로드하거나 저장할 수 있습니다.',
      failed: '공유할 수 없습니다. 준비된 파일은 계속 다운로드하거나 저장할 수 있습니다.',
      complete: '공유가 완료되었습니다. 준비된 파일은 계속 다운로드하거나 저장할 수 있습니다.',
    },
    source: { manual: '수동', suggestion: '제안' },
    mode: { cover: '불투명 가리기', pixelate: '픽셀화' },
    suggestionKind: {
      email: '이메일',
      phone: '전화번호',
      'payment-card': '결제 카드 번호',
      ipv4: 'IPv4 주소',
      'url-query': '쿼리 문자열이 있는 URL',
      token: '긴 ID 또는 토큰',
    },
  },
  en: {
    title: 'Local screenshot editor',
    importGroup: 'Import screenshot',
    selectScreenshot: 'Select screenshot',
    retryImport: 'Try another screenshot',
    resetEditor: 'Reset editor',
    localOnlyNotice:
      'Images stay in this browser’s memory only. Paste, drop, or select a PNG, JPEG, or WebP screenshot. Exports are re-encoded from a fresh canvas.',
    dropTitle: 'Drop a screenshot here',
    dropBody: 'Clipboard paste works anywhere on this page.',
    editorControls: 'Editor controls',
    modeLabel: 'Redaction mode',
    coverMode: 'Opaque cover',
    pixelateMode: 'Pixelate and darken',
    zoomOut: 'Zoom out',
    zoomReset: 'Fit 100%',
    zoomIn: 'Zoom in',
    previewCanvas: 'Screenshot preview canvas',
    drawRegions: 'Draw and adjust redaction regions',
    reviewExport: 'Review redactions and export',
    noImage: 'No screenshot loaded.',
    undo: 'Undo',
    redo: 'Redo',
    removeSelected: 'Remove selected',
    clearAll: 'Clear all',
    manualEdit: 'Adjust selected region manually',
    addManualRedaction: 'Add manual redaction',
    moveLeft: 'Move left',
    moveRight: 'Move right',
    moveUp: 'Move up',
    moveDown: 'Move down',
    makeWider: 'Make wider',
    makeNarrower: 'Make narrower',
    makeTaller: 'Make taller',
    makeShorter: 'Make shorter',
    ocrTitle: 'OCR-assisted suggestions',
    reviewSuggestions: 'Review local suggestions',
    detectionSuggestions: 'Detection suggestions',
    addRedaction: 'Add redaction',
    regionsTitle: 'Regions',
    regionsList: 'Redaction regions',
    noRegions: 'No redactions yet. Draw over sensitive areas manually.',
    exportTitle: 'Export',
    format: 'Format',
    quality: 'JPEG quality',
    prepare: 'Prepare redacted file',
    preparing: 'Preparing redacted file…',
    prepareAgain: 'Prepare again',
    prepared: 'Your redacted file is ready to share or save.',
    download: 'Download or save',
    share: 'Share',
    errors: {
      'unsupported-type': 'Select a PNG, JPEG, or WebP image.',
      'file-too-large': 'The image file exceeds the allowed size.',
      'image-too-large': 'The image dimensions exceed the allowed limit.',
      'decode-failed': 'This image could not be opened.',
      'canvas-unavailable': 'Canvas rendering is unavailable in this browser.',
      'export-failed': 'The redacted screenshot could not be prepared.',
      'ocr-unavailable':
        'Automatic suggestions are unavailable. Review the image manually and draw redaction regions.',
      'import-failed': 'The screenshot could not be imported.',
      'prepare-failed': 'The redacted screenshot could not be prepared.',
    },
    ocr: {
      initial: 'Automatic suggestions are optional. Manual redaction works without OCR.',
      ready: 'Ready. Draw regions manually or review local suggestions.',
      checking: 'Checking local OCR suggestions…',
      found: 'local suggestion(s) found.',
      none: 'Local OCR found no supported sensitive patterns. Review the image manually.',
      unavailable:
        'Automatic suggestions are unavailable. No example regions were added to this real screenshot. Review it manually and draw regions.',
    },
    shareStatus: {
      unsupported:
        'File sharing is unavailable in this browser. Download or save the prepared file instead.',
      cancelled: 'Sharing was cancelled. The prepared file is still available to download or save.',
      failed:
        'The file could not be shared. The prepared file is still available to download or save.',
      complete: 'Shared. The prepared file is still available to download or save.',
    },
    source: { manual: 'manual', suggestion: 'suggestion' },
    mode: { cover: 'opaque cover', pixelate: 'pixelate' },
    suggestionKind: {
      email: 'Email address',
      phone: 'Phone number',
      'payment-card': 'Payment-card number',
      ipv4: 'IPv4 address',
      'url-query': 'URL with query string',
      token: 'Long ID or token',
    },
  },
  zh: {
    title: '本地截图编辑器',
    importGroup: '导入截图',
    selectScreenshot: '选择截图',
    retryImport: '重新选择截图',
    resetEditor: '重置编辑器',
    localOnlyNotice:
      '图片仅保留在此浏览器的内存中。可粘贴、拖放或选择 PNG、JPEG 或 WebP 截图。导出会在新的画布上重新编码。',
    dropTitle: '将截图拖放到这里',
    dropBody: '可在此页面任意位置使用剪贴板粘贴。',
    editorControls: '编辑器控件',
    modeLabel: '遮盖方式',
    coverMode: '不透明遮盖',
    pixelateMode: '像素化并加深',
    zoomOut: '缩小',
    zoomReset: '适配为 100%',
    zoomIn: '放大',
    previewCanvas: '截图预览画布',
    drawRegions: '绘制并调整遮盖区域',
    reviewExport: '检查遮盖并导出',
    noImage: '尚未载入截图。',
    undo: '撤销',
    redo: '重做',
    removeSelected: '删除所选区域',
    clearAll: '清除全部',
    manualEdit: '手动调整所选区域',
    addManualRedaction: '添加手动遮盖',
    moveLeft: '向左移动',
    moveRight: '向右移动',
    moveUp: '向上移动',
    moveDown: '向下移动',
    makeWider: '加宽',
    makeNarrower: '变窄',
    makeTaller: '加高',
    makeShorter: '变矮',
    ocrTitle: 'OCR 辅助建议',
    reviewSuggestions: '检查本地建议',
    detectionSuggestions: '检测建议',
    addRedaction: '添加遮盖',
    regionsTitle: '区域',
    regionsList: '遮盖区域列表',
    noRegions: '尚未添加遮盖。请手动在敏感区域上绘制区域。',
    exportTitle: '导出',
    format: '格式',
    quality: 'JPEG 质量',
    prepare: '准备遮盖后的文件',
    preparing: '正在准备遮盖后的文件…',
    prepareAgain: '再次准备',
    prepared: '遮盖后的文件已准备好，可分享或保存。',
    download: '下载或保存',
    share: '分享',
    errors: {
      'unsupported-type': '请选择 PNG、JPEG 或 WebP 图片。',
      'file-too-large': '图片文件超过允许的大小。',
      'image-too-large': '图片尺寸超过允许的上限。',
      'decode-failed': '无法打开此图片。',
      'canvas-unavailable': '此浏览器无法使用画布渲染。',
      'export-failed': '无法准备遮盖后的截图。',
      'ocr-unavailable': '自动建议不可用。请手动检查图片并绘制遮盖区域。',
      'import-failed': '无法导入截图。',
      'prepare-failed': '无法准备遮盖后的截图。',
    },
    ocr: {
      initial: '自动建议是可选的。没有 OCR 也可以手动遮盖。',
      ready: '已准备好。请手动绘制区域，或检查本地建议。',
      checking: '正在检查本地 OCR 建议…',
      found: '条本地建议。',
      none: '本地 OCR 未找到受支持的敏感模式。请手动检查图片。',
      unavailable: '自动建议不可用。没有向真实截图添加示例区域。请手动检查并绘制区域。',
    },
    shareStatus: {
      unsupported: '此浏览器无法分享文件。请下载或保存准备好的文件。',
      cancelled: '已取消分享。准备好的文件仍可下载或保存。',
      failed: '无法分享文件。准备好的文件仍可下载或保存。',
      complete: '已分享。准备好的文件仍可下载或保存。',
    },
    source: { manual: '手动', suggestion: '建议' },
    mode: { cover: '不透明遮盖', pixelate: '像素化' },
    suggestionKind: {
      email: '电子邮件地址',
      phone: '电话号码',
      'payment-card': '支付卡号码',
      ipv4: 'IPv4 地址',
      'url-query': '带查询字符串的网址',
      token: '长 ID 或令牌',
    },
  },
};

function regionId(): string {
  return `region-${crypto.randomUUID()}`;
}

function sourcePoint(
  event: React.PointerEvent,
  target: HTMLElement,
  asset: Pick<ImageAsset, 'width' | 'height'>,
): Point {
  const bounds = target.getBoundingClientRect();
  return {
    x: ((event.clientX - bounds.left) * asset.width) / bounds.width,
    y: ((event.clientY - bounds.top) * asset.height) / bounds.height,
  };
}

function sameGeometry(first: RedactionRegion, second: RedactionRegion): boolean {
  return (
    first.x === second.x &&
    first.y === second.y &&
    first.width === second.width &&
    first.height === second.height
  );
}
function isAbortError(caught: unknown): boolean {
  return (
    typeof caught === 'object' &&
    caught !== null &&
    'name' in caught &&
    (caught as { name?: unknown }).name === 'AbortError'
  );
}

function ocrStatusText(copy: EditorCopy, status: OcrStatus): string {
  switch (status.status) {
    case 'ready':
      return copy.ocr.ready;
    case 'checking':
      return copy.ocr.checking;
    case 'found':
      return `${status.count} ${copy.ocr.found}`;
    case 'none':
      return copy.ocr.none;
    case 'unavailable':
      return copy.ocr.unavailable;
    default:
      return copy.ocr.initial;
  }
}

export function ScreenshotEditor({ locale }: { locale: Locale }): React.JSX.Element {
  const copy = editorCopy[locale];
  const [asset, setAsset] = useState<ImageAsset | null>(null);
  const [history, setHistory] = useState(() => createHistory(initialSnapshot));
  const [error, setError] = useState<AppError['code'] | 'import-failed' | null>(null);
  const [draggingFile, setDraggingFile] = useState(false);
  const [draft, setDraft] = useState<RedactionRegion | null>(null);
  const [zoom, setZoom] = useState(1);
  const [mode, setMode] = useState<RedactionMode>('cover');
  const [exportFormat, setExportFormat] = useState<ExportOptions['format']>('image/png');
  const [jpegQuality, setJpegQuality] = useState(0.92);
  const [suggestions, setSuggestions] = useState<SensitiveSuggestion[]>([]);
  const [ocrStatus, setOcrStatus] = useState<OcrStatus>({ status: 'initial' });
  const [output, setOutput] = useState<OutputState>({ status: 'dirty' });
  const [shareStatus, setShareStatus] = useState<ShareStatus>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const layerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const interactionRef = useRef<Interaction | null>(null);
  const preparedUrlRef = useRef<string | null>(null);
  const preparationRef = useRef(0);
  const assetRef = useRef<ImageAsset | null>(null);
  const editorEpochRef = useRef(0);
  const ocrRequestEpochRef = useRef(0);

  const snapshot = history.present;
  const visibleRegions = useMemo(() => {
    if (!draft) return snapshot.regions;
    const existingIndex = snapshot.regions.findIndex((region) => region.id === draft.id);
    if (existingIndex < 0) return [...snapshot.regions, draft];
    return snapshot.regions.map((region, index) => (index === existingIndex ? draft : region));
  }, [draft, snapshot.regions]);
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const revokePreparedUrl = useCallback(() => {
    if (!preparedUrlRef.current) return;
    URL.revokeObjectURL(preparedUrlRef.current);
    preparedUrlRef.current = null;
  }, []);

  const invalidateOutput = useCallback(() => {
    preparationRef.current += 1;
    revokePreparedUrl();
    setOutput((current) => (current.status === 'dirty' ? current : { status: 'dirty' }));
    setShareStatus(null);
  }, [revokePreparedUrl]);
  const replaceAsset = useCallback((nextAsset: ImageAsset | null) => {
    if (assetRef.current && assetRef.current !== nextAsset) {
      closeImageAsset(assetRef.current);
    }
    assetRef.current = nextAsset;
    setAsset(nextAsset);
  }, []);

  const commitEdit = useCallback(
    (next: EditorSnapshot) => {
      invalidateOutput();
      setHistory((current) => pushHistory(current, next));
    },
    [invalidateOutput],
  );

  const selectRegion = useCallback((id: string | null) => {
    setHistory((current) => ({
      ...current,
      present: { ...current.present, selectedRegionId: id },
    }));
  }, []);

  const resetForAsset = useCallback(
    (nextAsset: ImageAsset) => {
      ocrRequestEpochRef.current += 1;
      invalidateOutput();
      replaceAsset(nextAsset);
      setHistory(createHistory(initialSnapshot));
      setSuggestions([]);
      setDraft(null);
      setError(null);
      setOcrStatus({ status: 'ready' });
    },
    [invalidateOutput, replaceAsset],
  );

  const resetEditor = useCallback(() => {
    editorEpochRef.current += 1;
    ocrRequestEpochRef.current += 1;
    invalidateOutput();
    replaceAsset(null);
    setHistory(createHistory(initialSnapshot));
    setSuggestions([]);
    setDraft(null);
    setError(null);
    setOcrStatus({ status: 'initial' });
  }, [invalidateOutput, replaceAsset]);

  const importFile = useCallback(
    async (file: File) => {
      const importEpoch = ++editorEpochRef.current;
      setError(null);
      try {
        const nextAsset = await loadImageAsset(file);
        if (importEpoch !== editorEpochRef.current) {
          closeImageAsset(nextAsset);
          return;
        }
        resetForAsset(nextAsset);
      } catch (caught) {
        if (importEpoch !== editorEpochRef.current) return;
        setError(caught instanceof AppError ? caught.code : 'import-failed');
      }
    },
    [resetForAsset],
  );

  useEffect(
    () => () => {
      editorEpochRef.current += 1;
      ocrRequestEpochRef.current += 1;
      closeImageAsset(assetRef.current);
      assetRef.current = null;
    },
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!asset || !canvas) return;
    drawBaseImage(canvas, asset);
  }, [asset]);

  useEffect(() => {
    function onPaste(event: ClipboardEvent): void {
      const file = Array.from(event.clipboardData?.files ?? []).find((item) =>
        item.type.startsWith('image/'),
      );
      if (file) void importFile(file);
    }
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [importFile]);

  useEffect(
    () => () => {
      preparationRef.current += 1;
      revokePreparedUrl();
    },
    [revokePreparedUrl],
  );

  const addRegion = useCallback(
    (region: RedactionRegion) => {
      if (!asset) return;
      const bounded = clampRect(region, asset);
      if (!isMeaningfulRect(bounded, Math.min(MIN_REDACTION_SIZE, asset.width, asset.height)))
        return;
      commitEdit({
        regions: [
          ...snapshot.regions,
          {
            ...region,
            ...bounded,
          },
        ],
        selectedRegionId: region.id,
      });
    },
    [asset, commitEdit, snapshot.regions],
  );

  const createManualRedaction = useCallback(() => {
    if (!asset) return;
    const width = Math.min(asset.width, Math.max(MIN_REDACTION_SIZE, asset.width / 4));
    const height = Math.min(asset.height, Math.max(MIN_REDACTION_SIZE, asset.height / 4));
    addRegion({
      id: regionId(),
      x: (asset.width - width) / 2,
      y: (asset.height - height) / 2,
      width,
      height,
      mode,
      source: 'manual',
    });
  }, [addRegion, asset, mode]);

  const removeSelected = useCallback(() => {
    if (!snapshot.selectedRegionId) return;
    commitEdit({
      regions: snapshot.regions.filter((region) => region.id !== snapshot.selectedRegionId),
      selectedRegionId: null,
    });
  }, [commitEdit, snapshot.regions, snapshot.selectedRegionId]);

  const clearAll = useCallback(() => {
    if (snapshot.regions.length === 0) return;
    commitEdit(initialSnapshot);
  }, [commitEdit, snapshot.regions.length]);

  const undo = useCallback(() => {
    if (!canUndo) return;
    invalidateOutput();
    setHistory((current) => undoHistory(current));
  }, [canUndo, invalidateOutput]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    invalidateOutput();
    setHistory((current) => redoHistory(current));
  }, [canRedo, invalidateOutput]);

  const updateSelected = useCallback(
    (transform: (region: RedactionRegion) => RedactionRegion) => {
      if (!snapshot.selectedRegionId) return;
      const selected = snapshot.regions.find((region) => region.id === snapshot.selectedRegionId);
      if (!selected) return;
      const updated = transform(selected);
      if (sameGeometry(selected, updated)) return;
      commitEdit({
        regions: snapshot.regions.map((region) => (region.id === selected.id ? updated : region)),
        selectedRegionId: selected.id,
      });
    },
    [commitEdit, snapshot.regions, snapshot.selectedRegionId],
  );

  const moveSelected = useCallback(
    (delta: Point) => {
      if (!asset) return;
      updateSelected((region) => ({ ...region, ...moveRect(region, delta, asset) }));
    },
    [asset, updateSelected],
  );

  const resizeSelected = useCallback(
    (widthDelta: number, heightDelta: number) => {
      if (!asset) return;
      updateSelected((region) => {
        let next = region;
        if (widthDelta !== 0) {
          next = {
            ...next,
            ...resizeRect(next, 'east', { x: next.x + next.width + widthDelta, y: next.y }, asset),
          };
        }
        if (heightDelta !== 0) {
          next = {
            ...next,
            ...resizeRect(
              next,
              'south',
              { x: next.x, y: next.y + next.height + heightDelta },
              asset,
            ),
          };
        }
        return next;
      });
    },
    [asset, updateSelected],
  );

  const runSuggestions = useCallback(async () => {
    if (!asset) return;
    const requestEpoch = ++ocrRequestEpochRef.current;
    const requestedAsset = asset;
    setOcrStatus({ status: 'checking' });
    setSuggestions([]);
    try {
      const detected = await getLocalOcrSuggestions(requestedAsset);
      if (requestEpoch !== ocrRequestEpochRef.current || assetRef.current !== requestedAsset) {
        return;
      }
      setSuggestions(detected);
      setOcrStatus(
        detected.length ? { status: 'found', count: detected.length } : { status: 'none' },
      );
    } catch {
      if (requestEpoch !== ocrRequestEpochRef.current || assetRef.current !== requestedAsset) {
        return;
      }
      setSuggestions([]);
      setOcrStatus({ status: 'unavailable' });
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

  const prepareOutput = useCallback(async () => {
    if (!asset || snapshot.regions.length === 0) return;
    const preparation = ++preparationRef.current;
    revokePreparedUrl();
    setShareStatus(null);
    setOutput({ status: 'preparing' });
    try {
      const file = await prepareRedactedFile(asset, {
        format: exportFormat,
        quality: jpegQuality,
        regions: snapshot.regions,
      });
      if (preparation !== preparationRef.current) return;
      const objectUrl = URL.createObjectURL(file);
      if (preparation !== preparationRef.current) {
        URL.revokeObjectURL(objectUrl);
        return;
      }
      preparedUrlRef.current = objectUrl;
      setOutput({ status: 'ready', file, objectUrl });
    } catch (caught) {
      if (preparation !== preparationRef.current) return;
      setOutput({
        status: 'error',
        code: caught instanceof AppError ? caught.code : 'prepare-failed',
      });
    }
  }, [asset, exportFormat, jpegQuality, revokePreparedUrl, snapshot.regions]);

  const downloadPrepared = useCallback(() => {
    if (output.status !== 'ready') return;
    const anchor = document.createElement('a');
    anchor.href = output.objectUrl;
    anchor.download = output.file.name;
    anchor.rel = 'noreferrer';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  }, [output]);

  const sharePrepared = useCallback(async () => {
    if (output.status !== 'ready') return;
    const shareData = { files: [output.file] };
    if (!navigator.canShare?.(shareData)) {
      setShareStatus('unsupported');
      return;
    }
    try {
      await navigator.share(shareData);
      setShareStatus('complete');
    } catch (caught) {
      setShareStatus(isAbortError(caught) ? 'cancelled' : 'failed');
    }
  }, [output]);

  const stats = useMemo(() => {
    if (!asset) return copy.noImage;
    return `${asset.width} × ${asset.height}px · ${(asset.bytes / 1024 / 1024).toFixed(2)} MB · ${snapshot.regions.length}`;
  }, [asset, copy.noImage, snapshot.regions.length]);

  const previewForInteraction = useCallback(
    (interaction: Interaction, point: Point): RedactionRegion => {
      if (!asset) throw new Error('Image asset is required for a pointer interaction.');
      if (interaction.kind === 'create') {
        return {
          id: 'draft-region',
          ...clampRect(normalizeRect(interaction.start, point), asset),
          mode,
          source: 'manual',
        };
      }
      if (interaction.kind === 'move') {
        return {
          ...interaction.region,
          ...moveRect(
            interaction.region,
            { x: point.x - interaction.start.x, y: point.y - interaction.start.y },
            asset,
          ),
        };
      }
      return {
        ...interaction.region,
        ...resizeRect(interaction.region, interaction.handle, point, asset),
      };
    },
    [asset, mode],
  );

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>): void {
    if (!asset || !layerRef.current || (event.pointerType === 'mouse' && event.button !== 0))
      return;
    const point = sourcePoint(event, layerRef.current, asset);
    const target = event.target instanceof HTMLElement ? event.target : null;
    const regionIdValue = target?.closest<HTMLElement>('[data-region-id]')?.dataset.regionId;
    const selected = regionIdValue
      ? snapshot.regions.find((region) => region.id === regionIdValue)
      : undefined;
    const handleValue = target?.closest<HTMLElement>('[data-resize-handle]')?.dataset.resizeHandle;
    const handle = resizeHandles.find((item) => item === handleValue);

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    if (selected) {
      selectRegion(selected.id);
      interactionRef.current = handle
        ? { kind: 'resize', start: point, region: selected, handle }
        : { kind: 'move', start: point, region: selected };
      setDraft(selected);
      return;
    }

    interactionRef.current = { kind: 'create', start: point };
    setDraft({
      id: 'draft-region',
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
      mode,
      source: 'manual',
    });
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>): void {
    if (!asset || !layerRef.current || !interactionRef.current) return;
    setDraft(
      previewForInteraction(interactionRef.current, sourcePoint(event, layerRef.current, asset)),
    );
  }

  function finishPointerInteraction(
    event: React.PointerEvent<HTMLDivElement>,
    commit: boolean,
  ): void {
    if (!asset || !layerRef.current || !interactionRef.current) return;
    const interaction = interactionRef.current;
    interactionRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const finalRegion = previewForInteraction(
      interaction,
      sourcePoint(event, layerRef.current, asset),
    );
    setDraft(null);
    if (!commit) return;
    if (interaction.kind === 'create') {
      if (isMeaningfulRect(finalRegion, MIN_REDACTION_SIZE)) {
        addRegion({ ...finalRegion, id: regionId() });
      }
      return;
    }
    if (!sameGeometry(interaction.region, finalRegion)) {
      commitEdit({
        regions: snapshot.regions.map((region) =>
          region.id === interaction.region.id ? finalRegion : region,
        ),
        selectedRegionId: interaction.region.id,
      });
    }
  }

  return (
    <section id="editor" className="editor-section" aria-labelledby="editor-title">
      <div className="toolbar import-toolbar" role="group" aria-label={copy.importGroup}>
        <h2 id="editor-title">{copy.title}</h2>
        <input
          ref={fileInputRef}
          className="file-input"
          data-testid="file-input"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) void importFile(file);
            event.currentTarget.value = '';
          }}
        />
        <button className="primary" type="button" onClick={() => fileInputRef.current?.click()}>
          {copy.selectScreenshot}
        </button>
        {asset ? (
          <button type="button" onClick={resetEditor}>
            {copy.resetEditor}
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="notice error" role="alert">
          <p>{copy.errors[error]}</p>
          <button type="button" onClick={() => fileInputRef.current?.click()}>
            {copy.retryImport}
          </button>
        </div>
      ) : null}
      <p className="notice">{copy.localOnlyNotice}</p>

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
                const file = Array.from(event.dataTransfer.files).find((item) =>
                  item.type.startsWith('image/'),
                );
                if (file) void importFile(file);
                else if (event.dataTransfer.files.length > 0) setError('unsupported-type');
              }}
            >
              <div>
                <strong>{copy.dropTitle}</strong>
                <p>{copy.dropBody}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="toolbar" aria-label={copy.editorControls}>
                <label>
                  {copy.modeLabel}{' '}
                  <select
                    value={mode}
                    onChange={(event) => setMode(event.target.value as RedactionMode)}
                  >
                    <option value="cover">{copy.coverMode}</option>
                    <option value="pixelate">{copy.pixelateMode}</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => setZoom((value) => Math.max(0.2, value - 0.1))}
                >
                  {copy.zoomOut}
                </button>
                <button type="button" onClick={() => setZoom(1)}>
                  {copy.zoomReset}
                </button>
                <button type="button" onClick={() => setZoom((value) => Math.min(3, value + 0.1))}>
                  {copy.zoomIn}
                </button>
              </div>
              <div className="canvas-shell">
                <div
                  className="canvas-wrap"
                  style={{ width: asset.width * zoom + 48, height: asset.height * zoom + 48 }}
                >
                  <canvas
                    ref={canvasRef}
                    className="editor-canvas"
                    width={asset.width}
                    height={asset.height}
                    style={{ width: asset.width * zoom, height: asset.height * zoom }}
                    aria-label={copy.previewCanvas}
                  />
                  <div
                    ref={layerRef}
                    className="region-layer"
                    role="group"
                    aria-label={copy.drawRegions}
                    tabIndex={0}
                    style={{ width: asset.width * zoom, height: asset.height * zoom }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={(event) => finishPointerInteraction(event, true)}
                    onPointerCancel={(event) => finishPointerInteraction(event, false)}
                    onKeyDown={(event) => {
                      if (event.key === 'Delete' || event.key === 'Backspace') {
                        event.preventDefault();
                        removeSelected();
                      } else if (event.key === 'ArrowLeft') {
                        event.preventDefault();
                        moveSelected({ x: -8, y: 0 });
                      } else if (event.key === 'ArrowRight') {
                        event.preventDefault();
                        moveSelected({ x: 8, y: 0 });
                      } else if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        moveSelected({ x: 0, y: -8 });
                      } else if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        moveSelected({ x: 0, y: 8 });
                      } else if (
                        (event.metaKey || event.ctrlKey) &&
                        event.key.toLowerCase() === 'z'
                      ) {
                        event.preventDefault();
                        if (event.shiftKey) redo();
                        else undo();
                      }
                    }}
                  >
                    {visibleRegions.map((region, index) => {
                      const isSelected = snapshot.selectedRegionId === region.id;
                      return (
                        <div
                          key={region.id}
                          className={`region-box ${region.mode} ${isSelected ? 'selected' : ''}`}
                          data-region-id={region.id}
                          style={{
                            left: region.x * zoom,
                            top: region.y * zoom,
                            width: region.width * zoom,
                            height: region.height * zoom,
                          }}
                        >
                          <button
                            type="button"
                            className="region-body"
                            aria-label={`${copy.regionsTitle} ${index + 1}: ${copy.source[region.source]}, ${
                              copy.mode[region.mode]
                            }`}
                            onClick={() => selectRegion(region.id)}
                          />
                          {isSelected
                            ? resizeHandles.map((handle) => (
                                <span
                                  key={handle}
                                  className={`region-handle handle-${handle}`}
                                  data-resize-handle={handle}
                                  aria-hidden="true"
                                />
                              ))
                            : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <aside className="side-panel" aria-label={copy.reviewExport}>
          <p className="meta">{stats}</p>
          <div className="history-actions">
            <button type="button" disabled={!canUndo} onClick={undo}>
              {copy.undo}
            </button>
            <button type="button" disabled={!canRedo} onClick={redo}>
              {copy.redo}
            </button>
            {asset ? (
              <button type="button" onClick={createManualRedaction}>
                {copy.addManualRedaction}
              </button>
            ) : null}
            <button type="button" disabled={!snapshot.selectedRegionId} onClick={removeSelected}>
              {copy.removeSelected}
            </button>
            <button
              className="danger"
              type="button"
              disabled={!snapshot.regions.length}
              onClick={clearAll}
            >
              {copy.clearAll}
            </button>
          </div>

          {snapshot.selectedRegionId ? (
            <div className="region-adjustments" role="group" aria-label={copy.manualEdit}>
              <h3>{copy.manualEdit}</h3>
              <div>
                <button type="button" onClick={() => moveSelected({ x: -8, y: 0 })}>
                  {copy.moveLeft}
                </button>
                <button type="button" onClick={() => moveSelected({ x: 8, y: 0 })}>
                  {copy.moveRight}
                </button>
                <button type="button" onClick={() => moveSelected({ x: 0, y: -8 })}>
                  {copy.moveUp}
                </button>
                <button type="button" onClick={() => moveSelected({ x: 0, y: 8 })}>
                  {copy.moveDown}
                </button>
                <button type="button" onClick={() => resizeSelected(8, 0)}>
                  {copy.makeWider}
                </button>
                <button type="button" onClick={() => resizeSelected(-8, 0)}>
                  {copy.makeNarrower}
                </button>
                <button type="button" onClick={() => resizeSelected(0, 8)}>
                  {copy.makeTaller}
                </button>
                <button type="button" onClick={() => resizeSelected(0, -8)}>
                  {copy.makeShorter}
                </button>
              </div>
            </div>
          ) : null}

          <h3>{copy.ocrTitle}</h3>
          <p className="meta" role="status">
            {ocrStatusText(copy, ocrStatus)}
          </p>
          <button
            className="ocr-review-action"
            type="button"
            disabled={!asset || ocrStatus.status === 'checking'}
            onClick={runSuggestions}
          >
            {copy.reviewSuggestions}
          </button>
          <ul className="panel-list" aria-label={copy.detectionSuggestions}>
            {suggestions.map((suggestion) => (
              <li key={suggestion.id}>
                <strong>{copy.suggestionKind[suggestion.kind]}</strong>
                <p className="meta">{suggestion.text}</p>
                <button
                  type="button"
                  disabled={!asset}
                  onClick={() => acceptSuggestion(suggestion)}
                >
                  {copy.addRedaction}
                </button>
              </li>
            ))}
          </ul>

          <h3>{copy.regionsTitle}</h3>
          <ul className="panel-list" aria-label={copy.regionsList}>
            {snapshot.regions.length === 0 ? <li className="meta">{copy.noRegions}</li> : null}
            {snapshot.regions.map((region, index) => (
              <li key={region.id}>
                <button type="button" onClick={() => selectRegion(region.id)}>
                  {copy.regionsTitle} {index + 1}: {Math.round(region.width)} ×{' '}
                  {Math.round(region.height)} · {copy.mode[region.mode]}
                </button>
              </li>
            ))}
          </ul>

          <h3>{copy.exportTitle}</h3>
          <div className="control-row">
            <label htmlFor="format">{copy.format}</label>
            <select
              id="format"
              value={exportFormat}
              onChange={(event) => {
                invalidateOutput();
                setExportFormat(event.target.value as ExportOptions['format']);
              }}
            >
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPEG</option>
            </select>
          </div>
          {exportFormat === 'image/jpeg' ? (
            <div className="control-row">
              <label htmlFor="quality">
                {copy.quality} {Math.round(jpegQuality * 100)}%
              </label>
              <input
                id="quality"
                type="range"
                min="0.6"
                max="0.98"
                step="0.01"
                value={jpegQuality}
                onChange={(event) => {
                  invalidateOutput();
                  setJpegQuality(Number(event.target.value));
                }}
              />
            </div>
          ) : null}
          {output.status === 'error' ? (
            <p className="notice error" role="alert">
              {copy.errors[output.code]}
            </p>
          ) : null}
          {output.status === 'ready' ? (
            <p className="notice" role="status">
              {copy.prepared}
            </p>
          ) : null}
          {shareStatus ? (
            <p className="notice" role="status">
              {copy.shareStatus[shareStatus]}
            </p>
          ) : null}
          <div className="export-actions">
            <button
              className="primary"
              type="button"
              disabled={!asset || snapshot.regions.length === 0 || output.status === 'preparing'}
              onClick={() => void prepareOutput()}
            >
              {output.status === 'preparing'
                ? copy.preparing
                : output.status === 'ready' || output.status === 'error'
                  ? copy.prepareAgain
                  : copy.prepare}
            </button>
            <button type="button" disabled={output.status !== 'ready'} onClick={downloadPrepared}>
              {copy.download}
            </button>
            <button
              type="button"
              disabled={output.status !== 'ready'}
              onClick={() => void sharePrepared()}
            >
              {copy.share}
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
