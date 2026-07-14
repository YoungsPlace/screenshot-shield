// Shared localization contract — Lane B replaces this stub with full copy.
// Lane A defines the type shape; Lane B implements all three locales.

export type Locale = 'ko' | 'en' | 'zh';

export type MarketingCopy = {
  // Hero
  readonly heroEyebrow: string;
  readonly heroHeadline: string;
  readonly heroLede: string;
  readonly ctaPrimary: string;
  readonly ctaLoading: string;
  readonly ctaSecondary: string;
  readonly trust: readonly string[];
  // Demo (RedactionDemo)
  readonly demoEyebrow: string;
  readonly demoTitle: string;
  readonly demoBefore: string;
  readonly demoAfter: string;
  readonly demoAnnotationBefore: string;
  readonly demoAnnotationAfter: string;
  // Privacy proof
  readonly proofEyebrow: string;
  readonly proofHeadline: string;
  readonly proofItems: readonly {
    readonly num: string;
    readonly title: string;
    readonly body: string;
  }[];
  // Workflow
  readonly workflowEyebrow: string;
  readonly workflowHeadline: string;
  readonly workflowSteps: readonly { readonly title: string; readonly body: string }[];
  // Detectors
  readonly detectorsEyebrow: string;
  readonly detectorsHeadline: string;
  readonly detectorsLede: string;
  readonly detectorItems: readonly {
    readonly label: string;
    readonly example: string;
    readonly note: string;
  }[];
  // Limitations
  readonly limitsEyebrow: string;
  readonly limitsHeadline: string;
  readonly limits: readonly string[];
  // FAQ
  readonly faqEyebrow: string;
  readonly faqHeadline: string;
  readonly faqItems: readonly { readonly question: string; readonly answer: string }[];
  // Final CTA
  readonly finalEyebrow: string;
  readonly finalHeadline: string;
  readonly finalCta: string;
};

export const localeOptions = [
  { value: 'ko' as const, label: '한국어', shortLabel: 'KO' },
  { value: 'en' as const, label: 'English', shortLabel: 'EN' },
  { value: 'zh' as const, label: '中文', shortLabel: '中文' },
] as const satisfies readonly { value: Locale; label: string; shortLabel: string }[];

export function detectInitialLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en';
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith('ko')) return 'ko';
  if (lang.startsWith('zh')) return 'zh';
  return 'en';
}

const en: MarketingCopy = {
  heroEyebrow: 'Private screenshot redaction',
  heroHeadline: 'Screenshot Shield',
  heroLede:
    'Paste or drop a screenshot, mark sensitive regions, export a clean copy — entirely in your browser.',
  ctaPrimary: 'Open local editor',
  ctaLoading: 'Preparing editor…',
  ctaSecondary: 'See privacy model',
  trust: ['No upload endpoint', 'Manual fallback always available', 'Fresh-canvas export'],
  demoEyebrow: 'Synthetic preview',
  demoTitle: 'See the share-safe version first',
  demoBefore: 'Before',
  demoAfter: 'After',
  demoAnnotationBefore:
    'Sensitive text remains visible until you review suggestions and add regions.',
  demoAnnotationAfter: 'Opaque marks replace sensitive regions in the preview and export.',
  proofEyebrow: 'Local-only proof',
  proofHeadline: 'Designed for short-lived, in-memory work.',
  proofItems: [
    {
      num: '01',
      title: 'Same browser session',
      body: 'Imported images are decoded in memory and never written to localStorage, IndexedDB, or remote storage.',
    },
    {
      num: '02',
      title: 'Same-origin assets',
      body: 'Detection helpers load from the built site. Manual redaction remains usable if OCR support is unavailable.',
    },
    {
      num: '03',
      title: 'New export bytes',
      body: 'Downloads are rendered from a fresh canvas as PNG or JPEG, avoiding reuse of the original file and its metadata.',
    },
  ],
  workflowEyebrow: 'Three-step workflow',
  workflowHeadline: 'From risky capture to reviewed share copy.',
  workflowSteps: [
    {
      title: 'Import locally',
      body: 'Paste, drop, or pick a screenshot. Decoded in memory — never stored by the site.',
    },
    {
      title: 'Review suggestions',
      body: 'Use local pattern/OCR suggestions as a checklist, then draw or adjust rectangles yourself.',
    },
    {
      title: 'Export a clean copy',
      body: 'Download a freshly rendered PNG or JPEG with opaque or irreversible pixelated redactions.',
    },
  ],
  detectorsEyebrow: 'Suggestion coverage',
  detectorsHeadline: 'Detectors give you a checklist, not a promise.',
  detectorsLede:
    'OCR-assisted suggestions focus on patterns commonly leaked in product, support, and engineering screenshots. You stay in control before export.',
  detectorItems: [
    {
      label: 'Email addresses',
      example: 'teammate@example.test',
      note: 'Highlights common mailbox formats in screenshots and chat exports.',
    },
    {
      label: 'Phone numbers',
      example: '+1 (415) 555-0189',
      note: 'Flags likely international and North American phone-like strings.',
    },
    {
      label: 'Payment-card-like numbers',
      example: '4242 4242 4242 4242',
      note: 'Looks for grouped card-shaped numbers; review before sharing.',
    },
    {
      label: 'IPv4 addresses',
      example: '203.0.113.42',
      note: 'Finds dotted network addresses that can reveal infrastructure details.',
    },
    {
      label: 'URLs with query strings',
      example: 'https://app.example.test/reset?token=demo',
      note: 'Targets links where query values may carry session or invite data.',
    },
    {
      label: 'Long IDs and tokens',
      example: 'sk_live_demo_7f4c2d9a01b8e3',
      note: 'Suggests high-entropy identifiers without claiming every secret is found.',
    },
  ],
  limitsEyebrow: 'Honest limits',
  limitsHeadline: 'Reduces sharing risk; does not replace manual review.',
  limits: [
    'Low-contrast, rotated, or stylized text can evade OCR or pattern checks.',
    'Faces, diagrams, custom IDs, and visual secrets require manual rectangle redaction.',
    'Pixelation is only safe when the export renderer applies irreversible blocks to a fresh canvas.',
    'Always inspect the final preview before publishing or attaching a screenshot.',
  ],
  faqEyebrow: 'FAQ',
  faqHeadline: 'Privacy and workflow details.',
  faqItems: [
    {
      question: 'Do screenshots upload anywhere?',
      answer:
        'No upload endpoint is part of the app. Import, detection review, drawing, and export run in the browser with same-origin assets only.',
    },
    {
      question: 'Is OCR required before I can redact?',
      answer:
        'No. OCR only assists with suggestions. Manual rectangles remain available when OCR cannot initialize.',
    },
    {
      question: 'Can detection miss sensitive text?',
      answer:
        'Yes. Screenshot Shield is a review aid, not a guarantee. Inspect the preview and add manual regions for anything sensitive.',
    },
    {
      question: 'Does export keep the original file metadata?',
      answer:
        'Export is produced from a fresh canvas so the downloaded PNG or JPEG is newly encoded instead of reusing the original file bytes.',
    },
  ],
  finalEyebrow: 'Ready when your screenshot is',
  finalHeadline: 'Open the editor, mark what matters, export a safer copy.',
  finalCta: 'Start redacting locally',
};

const ko: MarketingCopy = {
  heroEyebrow: '프라이버시 스크린샷 편집',
  heroHeadline: 'Screenshot Shield',
  heroLede:
    '스크린샷을 붙여넣거나 드래그해 민감 정보를 가리고, 깨끗한 사본을 브라우저 내에서 내보내세요.',
  ctaPrimary: '로컬 편집기 열기',
  ctaLoading: '편집기 준비 중…',
  ctaSecondary: '프라이버시 모델 보기',
  trust: ['업로드 없음', '수동 편집 항상 가능', '새 캔버스로 내보내기'],
  demoEyebrow: '가상 미리보기',
  demoTitle: '공유 안전 버전을 먼저 확인하세요',
  demoBefore: '편집 전',
  demoAfter: '편집 후',
  demoAnnotationBefore: '검토 및 영역 추가 전까지 민감 텍스트가 그대로 표시됩니다.',
  demoAnnotationAfter: '미리보기와 내보내기에서 민감 영역이 불투명하게 처리됩니다.',
  proofEyebrow: '로컬 전용 증명',
  proofHeadline: '단기 인메모리 작업을 위한 설계.',
  proofItems: [
    {
      num: '01',
      title: '동일 브라우저 세션',
      body: '가져온 이미지는 메모리에서만 처리되며 localStorage, IndexedDB, 원격 저장소에 저장되지 않습니다.',
    },
    {
      num: '02',
      title: '동일 출처 자산',
      body: '감지 도우미는 빌드된 사이트에서 로드됩니다. OCR을 사용할 수 없어도 수동 편집은 항상 가능합니다.',
    },
    {
      num: '03',
      title: '새 내보내기 바이트',
      body: '다운로드는 새 캔버스에서 PNG 또는 JPEG로 렌더링되어 원본 파일 및 메타데이터 재사용을 방지합니다.',
    },
  ],
  workflowEyebrow: '3단계 워크플로',
  workflowHeadline: '위험한 캡처에서 검토된 공유 사본으로.',
  workflowSteps: [
    {
      title: '로컬 가져오기',
      body: '스크린샷을 붙여넣거나 드래그하세요. 메모리에서 디코딩되며 사이트에 저장되지 않습니다.',
    },
    {
      title: '제안 검토',
      body: '로컬 패턴/OCR 제안을 체크리스트로 활용하고, 직접 사각형을 그리거나 조정하세요.',
    },
    {
      title: '깨끗한 사본 내보내기',
      body: '불투명 또는 비가역 픽셀 처리된 새 PNG 또는 JPEG를 다운로드하세요.',
    },
  ],
  detectorsEyebrow: '제안 적용 범위',
  detectorsHeadline: '감지기는 체크리스트이지 보장이 아닙니다.',
  detectorsLede:
    'OCR 보조 제안은 제품, 지원, 엔지니어링 스크린샷에서 자주 노출되는 패턴에 집중합니다. 내보내기 전 모든 영역을 직접 제어합니다.',
  detectorItems: [
    {
      label: '이메일 주소',
      example: 'teammate@example.test',
      note: '스크린샷과 채팅 내보내기에서 일반적인 메일함 형식을 강조합니다.',
    },
    {
      label: '전화번호',
      example: '+1 (415) 555-0189',
      note: '국제 및 북미 전화번호 형식으로 추정되는 문자열을 표시합니다.',
    },
    {
      label: '결제 카드 유사 번호',
      example: '4242 4242 4242 4242',
      note: '카드 형태의 그룹화된 숫자를 찾습니다. 공유 전 검토하세요.',
    },
    {
      label: 'IPv4 주소',
      example: '203.0.113.42',
      note: '인프라 세부 정보를 노출할 수 있는 점 표기 네트워크 주소를 찾습니다.',
    },
    {
      label: '쿼리 문자열이 있는 URL',
      example: 'https://app.example.test/reset?token=demo',
      note: '쿼리 값에 세션 또는 초대 데이터가 포함될 수 있는 링크를 대상으로 합니다.',
    },
    {
      label: '긴 ID 및 토큰',
      example: 'sk_live_demo_7f4c2d9a01b8e3',
      note: '모든 비밀이 발견된다고 주장하지 않고 높은 엔트로피 식별자를 제안합니다.',
    },
  ],
  limitsEyebrow: '솔직한 한계',
  limitsHeadline: '공유 위험을 줄이지만 수동 검토를 대체하지 않습니다.',
  limits: [
    '낮은 대비, 회전, 스타일화된 텍스트는 OCR 또는 패턴 검사를 피할 수 있습니다.',
    '얼굴, 다이어그램, 커스텀 ID, 시각적 비밀은 수동 사각형 편집이 필요합니다.',
    '픽셀화는 내보내기 렌더러가 새 캔버스에 비가역 블록을 적용할 때만 안전합니다.',
    '공유하거나 첨부하기 전에 항상 최종 미리보기를 검토하세요.',
  ],
  faqEyebrow: 'FAQ',
  faqHeadline: '프라이버시 및 워크플로 세부사항.',
  faqItems: [
    {
      question: '스크린샷이 어딘가에 업로드되나요?',
      answer:
        '앱에는 업로드 엔드포인트가 없습니다. 가져오기, 감지 검토, 그리기, 내보내기 모두 동일 출처 자산만으로 브라우저에서 실행됩니다.',
    },
    {
      question: 'OCR이 없으면 편집할 수 없나요?',
      answer:
        '아닙니다. OCR은 제안을 보조할 뿐입니다. OCR이 초기화되지 않아도 수동 사각형은 항상 사용할 수 있습니다.',
    },
    {
      question: '감지기가 민감 텍스트를 놓칠 수 있나요?',
      answer:
        '네. Screenshot Shield는 검토 보조 도구이며 보장이 아닙니다. 미리보기를 검토하고 민감한 부분에 수동으로 영역을 추가하세요.',
    },
    {
      question: '내보내기에 원본 파일 메타데이터가 유지되나요?',
      answer:
        '내보내기는 새 캔버스에서 생성되므로 다운로드되는 PNG 또는 JPEG는 원본 파일 바이트를 재사용하지 않고 새로 인코딩됩니다.',
    },
  ],
  finalEyebrow: '스크린샷이 준비되면 바로 시작',
  finalHeadline: '편집기 열기, 중요한 부분 표시, 안전한 사본 내보내기.',
  finalCta: '로컬에서 편집 시작',
};

const zh: MarketingCopy = {
  heroEyebrow: '本地截图脱敏',
  heroHeadline: 'Screenshot Shield',
  heroLede: '粘贴或拖入截图，标记敏感区域，在浏览器内导出干净的副本——全程本地处理。',
  ctaPrimary: '打开本地编辑器',
  ctaLoading: '编辑器准备中…',
  ctaSecondary: '查看隐私模型',
  trust: ['无上传端点', '始终支持手动标注', '全新画布导出'],
  demoEyebrow: '合成预览',
  demoTitle: '先查看分享安全版本',
  demoBefore: '处理前',
  demoAfter: '处理后',
  demoAnnotationBefore: '在审查建议并添加区域之前，敏感文本仍然可见。',
  demoAnnotationAfter: '预览和导出中，敏感区域已被不透明标记替代。',
  proofEyebrow: '纯本地证明',
  proofHeadline: '专为短暂的内存操作而设计。',
  proofItems: [
    {
      num: '01',
      title: '同一浏览器会话',
      body: '导入的图像仅在内存中解码，不会写入 localStorage、IndexedDB 或远程存储。',
    },
    {
      num: '02',
      title: '同源资产',
      body: '检测助手从构建站点加载。即使 OCR 不可用，手动标注仍然可用。',
    },
    {
      num: '03',
      title: '全新导出字节',
      body: '下载内容从全新画布渲染为 PNG 或 JPEG，避免重用原始文件及其元数据。',
    },
  ],
  workflowEyebrow: '三步工作流',
  workflowHeadline: '从高风险截图到经过审查的分享副本。',
  workflowSteps: [
    { title: '本地导入', body: '粘贴、拖入或选取截图。在内存中解码，网站不会存储。' },
    { title: '审查建议', body: '将本地模式/OCR 建议作为核查清单，然后自行绘制或调整矩形。' },
    { title: '导出干净副本', body: '下载带有不透明或不可逆像素化标注的全新 PNG 或 JPEG。' },
  ],
  detectorsEyebrow: '建议覆盖范围',
  detectorsHeadline: '检测器提供核查清单，不作保证。',
  detectorsLede:
    'OCR 辅助建议专注于产品、支持和工程截图中常见的泄露模式。导出前由您完全掌控每个区域。',
  detectorItems: [
    {
      label: '电子邮件地址',
      example: 'teammate@example.test',
      note: '在截图和聊天导出中高亮常见邮箱格式。',
    },
    {
      label: '电话号码',
      example: '+1 (415) 555-0189',
      note: '标记可能的国际和北美电话格式字符串。',
    },
    {
      label: '类似支付卡号码',
      example: '4242 4242 4242 4242',
      note: '查找分组的卡片形状数字，分享前请审查。',
    },
    {
      label: 'IPv4 地址',
      example: '203.0.113.42',
      note: '查找可能暴露基础设施详情的点分网络地址。',
    },
    {
      label: '含查询字符串的 URL',
      example: 'https://app.example.test/reset?token=demo',
      note: '针对查询值可能包含会话或邀请数据的链接。',
    },
    {
      label: '长 ID 和令牌',
      example: 'sk_live_demo_7f4c2d9a01b8e3',
      note: '建议高熵标识符，不声称能发现所有机密。',
    },
  ],
  limitsEyebrow: '诚实的限制',
  limitsHeadline: '降低分享风险，但不能替代手动审查。',
  limits: [
    '低对比度、旋转或风格化文字可能绕过 OCR 或模式检查。',
    '面部、图表、自定义 ID 和视觉机密需要手动矩形标注。',
    '只有当导出渲染器对全新画布应用不可逆块时，像素化才是安全的。',
    '发布或附加截图前，请始终检查最终预览。',
  ],
  faqEyebrow: '常见问题',
  faqHeadline: '隐私与工作流详情。',
  faqItems: [
    {
      question: '截图会上传到任何地方吗？',
      answer: '应用没有上传端点。导入、检测审查、绘制和导出均通过同源资产在浏览器中运行。',
    },
    {
      question: '没有 OCR 就无法标注吗？',
      answer: '不是。OCR 仅辅助提供建议。即使 OCR 无法初始化，手动矩形标注始终可用。',
    },
    {
      question: '检测器会漏掉敏感文字吗？',
      answer:
        '会。Screenshot Shield 是审查辅助工具，不是保证。请检查预览，并为任何敏感内容手动添加区域。',
    },
    {
      question: '导出会保留原始文件元数据吗？',
      answer: '导出从全新画布生成，下载的 PNG 或 JPEG 是重新编码的，不会重用原始文件字节。',
    },
  ],
  finalEyebrow: '截图准备好了就开始',
  finalHeadline: '打开编辑器，标记重要内容，导出更安全的副本。',
  finalCta: '在本地开始脱敏',
};

export const marketingCopy: Record<Locale, MarketingCopy> = { en, ko, zh };
