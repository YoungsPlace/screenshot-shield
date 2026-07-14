// Shared localization contract for the marketing landing page.
// Lane A (MarketingLanding, RedactionDemo) consumes this; Lane B owns it.

export type Locale = 'ko' | 'en' | 'zh';

export const localeOptions: readonly { value: Locale; label: string; shortLabel: string }[] = [
  { value: 'ko', label: '한국어', shortLabel: 'KO' },
  { value: 'en', label: 'English', shortLabel: 'EN' },
  { value: 'zh', label: '中文', shortLabel: '中文' },
];

export function detectInitialLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en';
  const lang = (navigator.language ?? '').toLowerCase();
  if (lang.startsWith('ko')) return 'ko';
  if (lang.startsWith('zh')) return 'zh';
  return 'en';
}

// ── Types ────────────────────────────────────────────────────────────────────

export type DetectorItem = {
  readonly label: string;
  readonly example: string;
  readonly note: string;
};

export type FaqItem = {
  readonly question: string;
  readonly answer: string;
};

export type WorkflowStep = {
  readonly title: string;
  readonly body: string;
};

export type ProofItem = {
  readonly step: string;
  readonly heading: string;
  readonly body: string;
};
export type DemoRow = {
  readonly label: string;
  readonly value: string;
  readonly sensitive?: boolean;
};

export type MarketingCopy = {
  readonly hero: {
    readonly eyebrow: string;
    readonly title: string;
    readonly lede: string;
    readonly primaryCta: string;
    readonly primaryCtaLoading: string;
    readonly secondaryLink: string;
    readonly launchStory: string;
    readonly trustBadges: readonly string[];
  };
  readonly demo: {
    readonly eyebrow: string;
    readonly heading: string;
    readonly toggleBefore: string;
    readonly toggleAfter: string;
    readonly annotationBefore: string;
    readonly annotationAfter: string;
    readonly previewGroupLabel: string;
    readonly screenshotLabel: string;
    readonly sidebarItems: readonly string[];
    readonly documentTitle: string;
    readonly status: string;
    readonly rows: readonly DemoRow[];
    readonly redactedValue: string;
  };
  readonly proof: {
    readonly eyebrow: string;
    readonly heading: string;
    readonly items: readonly ProofItem[];
  };
  readonly workflow: {
    readonly eyebrow: string;
    readonly heading: string;
    readonly steps: readonly WorkflowStep[];
  };
  readonly detectors: {
    readonly eyebrow: string;
    readonly heading: string;
    readonly intro: string;
    readonly items: readonly DetectorItem[];
  };
  readonly limitations: {
    readonly eyebrow: string;
    readonly heading: string;
    readonly items: readonly string[];
  };
  readonly faq: {
    readonly eyebrow: string;
    readonly heading: string;
    readonly items: readonly FaqItem[];
  };
  readonly finalCta: {
    readonly eyebrow: string;
    readonly heading: string;
    readonly button: string;
  };
};

// ── Copy ─────────────────────────────────────────────────────────────────────

export const marketingCopy: Record<Locale, MarketingCopy> = {
  // ── English ────────────────────────────────────────────────────────────────
  en: {
    hero: {
      eyebrow: 'Private screenshot redaction',
      title: 'Screenshot Shield — Clean it before you share it.',
      lede: 'Paste or drop a screenshot, review suggestions, draw redaction boxes, and export a freshly rendered file—entirely in your browser, nothing sent to a server.',
      primaryCta: 'Open local editor',
      primaryCtaLoading: 'Preparing editor',
      secondaryLink: 'See privacy model',
      launchStory: 'Read the launch story',
      trustBadges: ['No upload endpoint', 'Manual fallback always on', 'Fresh-canvas export'],
    },
    demo: {
      eyebrow: 'Synthetic preview',
      heading: 'See the share-safe version first',
      toggleBefore: 'Before',
      toggleAfter: 'After',
      annotationBefore:
        'Sensitive text remains visible until you review suggestions and add regions.',
      annotationAfter: 'Opaque marks replace sensitive regions in the preview and export.',
      previewGroupLabel: 'Choose preview state',
      screenshotLabel: 'synthetic screenshot',
      sidebarItems: ['Incident brief', 'Exports', 'Review'],
      documentTitle: 'Launch support packet',
      status: 'Local draft',
      rows: [
        { label: 'Owner', value: 'Mina Park' },
        { label: 'Email', value: 'mina.park@example.test', sensitive: true },
        { label: 'Phone', value: '+1 (415) 555-0198', sensitive: true },
        {
          label: 'Deploy URL',
          value: 'console.example.test/run?token=demo-secret',
          sensitive: true,
        },
        { label: 'Public note', value: 'Share launch crop with design review' },
      ],
      redactedValue: 'Redacted',
    },
    proof: {
      eyebrow: 'Local-only proof',
      heading: 'Designed for short-lived, in-memory work.',
      items: [
        {
          step: '0 uploads',
          heading: 'Same browser session',
          body: 'Imported images are decoded for editing and never written to localStorage, IndexedDB, or remote storage.',
        },
        {
          step: 'RAM only',
          heading: 'Same-origin assets',
          body: 'Detection helpers load from the built site. Manual redaction remains available even if OCR is unavailable.',
        },
        {
          step: 'New file',
          heading: 'New export bytes',
          body: 'Downloads are rendered from a fresh canvas as PNG or JPEG, avoiding original file metadata reuse.',
        },
      ],
    },
    workflow: {
      eyebrow: 'Three-step workflow',
      heading: 'From risky capture to reviewed share copy.',
      steps: [
        {
          title: 'Import locally',
          body: 'Paste, drop, or pick a screenshot. Decoded in memory, never stored by the site.',
        },
        {
          title: 'Review suggestions',
          body: 'Use local pattern/OCR suggestions as a checklist, then draw or adjust rectangles yourself.',
        },
        {
          title: 'Export a clean copy',
          body: 'Download a freshly rendered PNG or JPEG with opaque or pixelated redactions.',
        },
      ],
    },
    detectors: {
      eyebrow: 'Suggestion coverage',
      heading: 'Detectors give you a review checklist, not a promise.',
      intro:
        'OCR-assisted suggestions focus on patterns commonly leaked in product, support, and engineering screenshots. You control every region before export.',
      items: [
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
          label: 'Payment-card numbers',
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
          example: 'token_demo_7f4c2d9a01b8e3',
          note: 'Suggests high-entropy identifiers without claiming every secret is found.',
        },
      ],
    },
    limitations: {
      eyebrow: 'Honest limits',
      heading: 'Reduces risk. Manual review still matters.',
      items: [
        'Low-contrast, rotated, cropped, or stylized text can evade OCR or pattern checks.',
        'Faces, diagrams, custom IDs, and visual secrets require manual rectangle redaction.',
        'Pixelation is only safe when the renderer applies irreversible blocks to a fresh canvas.',
        'Always inspect the final preview before publishing or attaching a screenshot.',
      ],
    },
    faq: {
      eyebrow: 'FAQ',
      heading: 'Privacy and workflow details.',
      items: [
        {
          question: 'Do screenshots upload anywhere?',
          answer:
            'No upload endpoint is part of the app. Import, detection review, drawing, and export run in the browser with same-origin assets only.',
        },
        {
          question: 'Is OCR required before I can redact?',
          answer:
            'No. OCR only assists with suggestions. Manual rectangles are the reliable path and remain available when OCR cannot initialize.',
        },
        {
          question: 'Can detection miss sensitive text?',
          answer:
            'Yes. Screenshot Shield is a review aid, not a guarantee. Inspect the preview and add manual regions for anything sensitive.',
        },
        {
          question: 'Does export keep the original file metadata?',
          answer:
            'Export is produced from a fresh canvas, so the downloaded PNG or JPEG is newly encoded rather than reusing the original file bytes.',
        },
      ],
    },
    finalCta: {
      eyebrow: 'Ready when your screenshot is',
      heading: 'Open the editor, mark what matters, export a safer copy.',
      button: 'Start redacting locally',
    },
  },

  // ── Korean ─────────────────────────────────────────────────────────────────
  ko: {
    hero: {
      eyebrow: '브라우저 로컬 스크린샷 가리기',
      title: 'Screenshot Shield — 공유하기 전에, 먼저 가리세요.',
      lede: '스크린샷을 붙여넣거나 드래그해서 가져오세요. 제안된 항목을 검토하고 직접 영역을 그린 다음, 새로 렌더링된 파일을 내보냅니다. 모두 브라우저 안에서, 서버 전송 없이.',
      primaryCta: '로컬 편집기 열기',
      primaryCtaLoading: '편집기 준비 중',
      secondaryLink: '프라이버시 모델 보기',
      launchStory: '출시 스토리 보기',
      trustBadges: ['업로드 엔드포인트 없음', '수동 편집 항상 가능', '새 캔버스로 내보내기'],
    },
    demo: {
      eyebrow: '시뮬레이션 미리보기',
      heading: '공유 전, 안전한 버전을 먼저 확인하세요',
      toggleBefore: '이전',
      toggleAfter: '이후',
      annotationBefore: '제안을 검토하고 영역을 추가하기 전까지 민감한 정보가 그대로 보입니다.',
      annotationAfter: '불투명 마크가 민감한 영역을 미리보기와 내보내기에서 가립니다.',
      previewGroupLabel: '미리보기 상태 선택',
      screenshotLabel: '예시 스크린샷',
      sidebarItems: ['사고 요약', '내보내기', '검토'],
      documentTitle: '출시 지원 자료',
      status: '로컬 초안',
      rows: [
        { label: '담당자', value: '박민아' },
        { label: '이메일', value: 'mina.park@example.test', sensitive: true },
        { label: '전화번호', value: '+82 10-1234-5678', sensitive: true },
        {
          label: '배포 URL',
          value: 'console.example.test/run?token=demo-secret',
          sensitive: true,
        },
        { label: '공개 메모', value: '디자인 검토용 출시 화면 공유' },
      ],
      redactedValue: '가려짐',
    },
    proof: {
      eyebrow: '로컬 전용 보증',
      heading: '단기, 인메모리 작업을 위해 설계되었습니다.',
      items: [
        {
          step: '업로드 0',
          heading: '같은 브라우저 세션',
          body: '가져온 이미지는 메모리에서만 처리되며 localStorage, IndexedDB, 원격 저장소에 저장되지 않습니다.',
        },
        {
          step: 'RAM 전용',
          heading: '동일 출처 에셋',
          body: '감지 도우미는 빌드된 사이트에서 로드됩니다. OCR을 사용할 수 없어도 수동 편집은 항상 가능합니다.',
        },
        {
          step: '새 파일',
          heading: '새로운 내보내기 파일',
          body: '다운로드는 새 캔버스에서 PNG 또는 JPEG로 렌더링되며 원본 파일 메타데이터를 재사용하지 않습니다.',
        },
      ],
    },
    workflow: {
      eyebrow: '3단계 워크플로',
      heading: '위험한 캡처에서 검토된 공유 사본까지.',
      steps: [
        {
          title: '로컬로 가져오기',
          body: '스크린샷을 붙여넣거나 드래그하거나 선택하세요. 메모리에서 처리되며 사이트에 저장되지 않습니다.',
        },
        {
          title: '제안 검토하기',
          body: '로컬 패턴/OCR 제안을 체크리스트로 활용하고, 직접 사각형을 그리거나 조정하세요.',
        },
        {
          title: '깨끗한 사본 내보내기',
          body: '불투명하거나 픽셀화된 가리기가 적용된 새로 렌더링된 PNG 또는 JPEG를 다운로드하세요.',
        },
      ],
    },
    detectors: {
      eyebrow: '제안 커버리지',
      heading: '감지기는 검토 체크리스트를 제공할 뿐, 완벽한 보장이 아닙니다.',
      intro:
        'OCR 보조 제안은 제품, 지원, 엔지니어링 스크린샷에서 자주 유출되는 패턴에 집중합니다. 내보내기 전 모든 영역을 직접 제어할 수 있습니다.',
      items: [
        {
          label: '이메일 주소',
          example: 'teammate@example.test',
          note: '스크린샷과 채팅 내보내기에서 일반적인 메일박스 형식을 강조 표시합니다.',
        },
        {
          label: '전화번호',
          example: '+1 (415) 555-0189',
          note: '국제 및 북미 전화번호 형식으로 보이는 문자열을 표시합니다.',
        },
        {
          label: '결제 카드 번호',
          example: '4242 4242 4242 4242',
          note: '카드 형태로 묶인 숫자를 찾습니다. 공유 전 반드시 검토하세요.',
        },
        {
          label: 'IPv4 주소',
          example: '203.0.113.42',
          note: '인프라 정보를 노출할 수 있는 점 표기 네트워크 주소를 찾습니다.',
        },
        {
          label: '쿼리 문자열이 포함된 URL',
          example: 'https://app.example.test/reset?token=demo',
          note: '쿼리 값에 세션 또는 초대 데이터가 포함될 수 있는 링크를 대상으로 합니다.',
        },
        {
          label: '긴 ID 및 토큰',
          example: 'token_demo_7f4c2d9a01b8e3',
          note: '고엔트로피 식별자를 제안하지만 모든 비밀을 찾는다고 주장하지 않습니다.',
        },
      ],
    },
    limitations: {
      eyebrow: '솔직한 한계',
      heading: '공유 위험을 줄일 뿐, 수동 검토를 대체하지 않습니다.',
      items: [
        '대비가 낮거나 회전되거나 잘리거나 스타일화된 텍스트는 OCR이나 패턴 감지를 피할 수 있습니다.',
        '얼굴, 다이어그램, 커스텀 ID, 시각적 비밀은 수동 사각형 가리기가 필요합니다.',
        '픽셀화는 렌더러가 새 캔버스에 불가역적 블록을 적용할 때만 안전합니다.',
        '스크린샷을 게시하거나 첨부하기 전에 항상 최종 미리보기를 확인하세요.',
      ],
    },
    faq: {
      eyebrow: '자주 묻는 질문',
      heading: '프라이버시 및 워크플로 세부 사항.',
      items: [
        {
          question: '스크린샷이 어딘가에 업로드되나요?',
          answer:
            '앱에는 업로드 엔드포인트가 없습니다. 가져오기, 감지 검토, 그리기, 내보내기 모두 동일 출처 에셋을 사용하여 브라우저에서 실행됩니다.',
        },
        {
          question: '편집하기 전에 OCR이 필요한가요?',
          answer:
            '아니요. OCR은 제안 보조에만 사용됩니다. 수동 사각형이 안정적인 방법이며 OCR을 초기화할 수 없을 때도 사용할 수 있습니다.',
        },
        {
          question: '감지가 민감한 텍스트를 놓칠 수 있나요?',
          answer:
            '네. Screenshot Shield는 검토 보조 도구이지 보장이 아닙니다. 미리보기를 확인하고 민감한 항목에 수동 영역을 추가하세요.',
        },
        {
          question: '내보내기가 원본 파일 메타데이터를 유지하나요?',
          answer:
            '내보내기는 새 캔버스에서 생성되므로 다운로드된 PNG 또는 JPEG는 원본 파일 바이트를 재사용하지 않고 새로 인코딩됩니다.',
        },
      ],
    },
    finalCta: {
      eyebrow: '스크린샷이 준비되면 바로 시작하세요',
      heading: '편집기를 열고, 중요한 부분을 표시하고, 안전한 사본을 내보내세요.',
      button: '로컬에서 가리기 시작',
    },
  },

  // ── Simplified Chinese ──────────────────────────────────────────────────────
  zh: {
    hero: {
      eyebrow: '本地隐私截图编辑',
      title: 'Screenshot Shield — 分享之前，先遮盖敏感信息。',
      lede: '粘贴、拖入或选择截图，检查自动标记的敏感内容，手动划定遮盖区域，导出全新渲染的文件——全程在浏览器本地完成，无任何上传。',
      primaryCta: '打开本地编辑器',
      primaryCtaLoading: '编辑器准备中',
      secondaryLink: '了解隐私说明',
      launchStory: '阅读发布故事',
      trustBadges: ['无上传接口', '手动遮盖始终可用', '全新画布导出'],
    },
    demo: {
      eyebrow: '演示预览',
      heading: '分享前，先看安全版本',
      toggleBefore: '处理前',
      toggleAfter: '处理后',
      annotationBefore: '在检查建议并添加遮盖区域之前，敏感文本将保持可见。',
      annotationAfter: '不透明标记在预览和导出中替换敏感区域。',
      previewGroupLabel: '选择预览状态',
      screenshotLabel: '示例截图',
      sidebarItems: ['事件摘要', '导出', '检查'],
      documentTitle: '发布支持资料',
      status: '本地草稿',
      rows: [
        { label: '负责人', value: '林敏' },
        { label: '邮箱', value: 'lin.min@example.test', sensitive: true },
        { label: '电话', value: '+86 138 0013 8000', sensitive: true },
        {
          label: '部署链接',
          value: 'console.example.test/run?token=demo-secret',
          sensitive: true,
        },
        { label: '公开备注', value: '与设计评审共享发布截图' },
      ],
      redactedValue: '已遮盖',
    },
    proof: {
      eyebrow: '纯本地处理证明',
      heading: '专为短暂的内存操作而设计。',
      items: [
        {
          step: '0 次上传',
          heading: '同一浏览器会话',
          body: '导入的图像仅在内存中解码用于编辑，不会写入 localStorage、IndexedDB 或任何远程存储。',
        },
        {
          step: '仅内存',
          heading: '同源资源',
          body: '检测辅助工具从构建好的站点加载。即使 OCR 不可用，手动遮盖功能也始终可用。',
        },
        {
          step: '新文件',
          heading: '全新导出文件',
          body: '下载内容从全新画布渲染为 PNG 或 JPEG，不会复用原始文件的任何元数据。',
        },
      ],
    },
    workflow: {
      eyebrow: '三步工作流',
      heading: '从高风险截图到安全分享副本。',
      steps: [
        {
          title: '本地导入',
          body: '粘贴、拖入或选择截图，在内存中解码，不存储于任何地方。',
        },
        {
          title: '检查建议',
          body: '将本地模式/OCR 建议作为检查清单，然后亲自绘制或调整遮盖矩形。',
        },
        {
          title: '导出干净副本',
          body: '下载带有不透明或像素化遮盖的全新渲染 PNG 或 JPEG 文件。',
        },
      ],
    },
    detectors: {
      eyebrow: '检测覆盖范围',
      heading: '检测器提供检查清单，而非安全保证。',
      intro:
        'OCR 辅助建议专注于产品、支持和工程截图中常见的泄露模式。导出前，您可以控制每一个区域。',
      items: [
        {
          label: '电子邮件地址',
          example: 'teammate@example.test',
          note: '识别截图和聊天导出中的常见邮箱格式。',
        },
        {
          label: '电话号码',
          example: '+1 (415) 555-0189',
          note: '标记疑似国际和北美电话号码格式的字符串。',
        },
        {
          label: '支付卡号',
          example: '4242 4242 4242 4242',
          note: '查找分组的卡号格式数字，分享前请仔细核查。',
        },
        {
          label: 'IPv4 地址',
          example: '203.0.113.42',
          note: '查找可能泄露基础设施信息的点分十进制网络地址。',
        },
        {
          label: '含查询参数的 URL',
          example: 'https://app.example.test/reset?token=demo',
          note: '定位查询参数中可能含有会话或邀请数据的链接。',
        },
        {
          label: '长 ID 和令牌',
          example: 'token_demo_7f4c2d9a01b8e3',
          note: '建议标记高熵标识符，但不保证发现所有敏感内容。',
        },
      ],
    },
    limitations: {
      eyebrow: '诚实的局限性',
      heading: '降低分享风险，但不能替代人工审查。',
      items: [
        '低对比度、旋转、裁剪或风格化的文字可能躲过 OCR 和模式检测。',
        '人脸、图表、自定义 ID 和视觉敏感内容需要手动矩形遮盖。',
        '像素化遮盖仅在渲染器对全新画布应用不可逆块处理时才是安全的。',
        '发布或附加截图前，请务必检查最终预览。',
      ],
    },
    faq: {
      eyebrow: '常见问题',
      heading: '隐私与工作流详情。',
      items: [
        {
          question: '截图会上传到任何地方吗？',
          answer:
            '应用中没有上传接口。导入、检测审查、绘制遮盖和导出操作均在浏览器中使用同源资源完成。',
        },
        {
          question: '遮盖之前需要 OCR 吗？',
          answer:
            '不需要。OCR 仅用于辅助建议。手动矩形遮盖是可靠路径，即使 OCR 无法初始化也可使用。',
        },
        {
          question: '检测会漏掉敏感文字吗？',
          answer:
            '会。Screenshot Shield 是辅助审查工具，并非绝对保证。请检查预览并为敏感内容手动添加遮盖区域。',
        },
        {
          question: '导出文件会保留原始文件元数据吗？',
          answer:
            '导出由全新画布生成，下载的 PNG 或 JPEG 是重新编码的新文件，不会复用原始文件的任何字节。',
        },
      ],
    },
    finalCta: {
      eyebrow: '截图准备好了就可以开始',
      heading: '打开编辑器，标记关键内容，导出更安全的副本。',
      button: '开始本地遮盖处理',
    },
  },
};

// ── Backward-compatible named exports (English defaults) ──────────────────────
// Full localized copy is available via marketingCopy[locale].detectors.items etc.
export const detectorItems: readonly DetectorItem[] = marketingCopy.en.detectors.items;
export const faqItems: readonly FaqItem[] = marketingCopy.en.faq.items;
export const workflowSteps: readonly WorkflowStep[] = marketingCopy.en.workflow.steps;
