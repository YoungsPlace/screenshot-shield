/* global document, navigator, URL, window */
(() => {
  const copy = {
    en: {
      pageTitle: 'Screenshot Shield — The launch story',
      skip: 'Skip to the live demo',
      share: 'Share',
      kicker: 'The launch story',
      title: 'The screenshot looked safe. Until you zoomed in.',
      lede: 'Support tickets, product updates, and launch posts leak more than we notice. Screenshot Shield makes the final privacy check visual, local, and fast.',
      try: 'Try the live editor',
      product: 'Open the product',
      signalUpload: 'upload endpoints',
      signalMemory: 'session memory',
      signalExport: 'export bytes',
      previewEyebrow: 'Interactive preview',
      previewTitle: 'What changes before you share',
      previewAria: 'Choose preview state',
      before: 'Before',
      after: 'After',
      navBrief: 'Launch brief',
      navAssets: 'Assets',
      navReview: 'Review',
      document: 'Partner announcement',
      draft: 'Local draft',
      owner: 'Owner',
      email: 'Email',
      phone: 'Phone',
      token: 'Invite token',
      note: 'Public note',
      noteValue: 'Ready for design review',
      previewCaption:
        'Toggle the preview. The share-safe copy replaces selected regions before export.',
      whyKicker: 'Why we built it',
      whyTitle: 'Privacy tools should feel like part of publishing.',
      whyBody:
        'Redaction is usually treated as cleanup after the work is finished. We moved it into the sharing moment, where the risk is easiest to understand.',
      storyOneTitle: 'See the leak',
      storyOneBody: 'A realistic before-and-after view makes hidden identifiers obvious.',
      storyTwoTitle: 'Keep control',
      storyTwoBody: 'Suggestions are a checklist. You decide every final region.',
      storyThreeTitle: 'Export new bytes',
      storyThreeBody:
        'A fresh canvas creates a new PNG or JPEG instead of reusing the source file.',
      manifesto: 'Your screenshot should not need to visit a server to become safer.',
      demoKicker: 'Live, not a mockup',
      demoTitle: 'Try the real editor here.',
      demoBody:
        'Choose a screenshot below. The embedded editor uses the same local-only workflow as the main product. Nothing is uploaded by this page.',
      demoBadge: 'Running locally in this tab',
      openTab: 'Open in a new tab',
      frameTitle: 'Live Screenshot Shield editor',
      shareKicker: 'Built to pass along',
      shareTitle: 'Share the story, not a privacy promise.',
      shareBody:
        'The product is a review aid with honest limits. The useful claim is simple: your source image stays in your browser.',
      shareStory: 'Share this launch',
      start: 'Start redacting',
      footer: 'Local screenshot redaction. No upload endpoint.',
      shared: 'Share sheet opened.',
      copied: 'Launch link copied.',
      shareText: 'Try Screenshot Shield, a local-only screenshot redactor.',
    },
    ko: {
      pageTitle: 'Screenshot Shield — 출시 스토리',
      skip: '실제 데모로 이동',
      share: '공유',
      kicker: '출시 스토리',
      title: '안전해 보이던 스크린샷. 확대하기 전까지는.',
      lede: '고객 지원, 제품 업데이트, 출시 게시물에는 생각보다 많은 정보가 숨어 있습니다. Screenshot Shield는 마지막 프라이버시 검토를 시각적이고 빠르게, 브라우저 안에서 처리합니다.',
      try: '실제 편집기 체험',
      product: '제품 페이지 열기',
      signalUpload: '업로드 엔드포인트',
      signalMemory: '세션 메모리',
      signalExport: '새 내보내기',
      previewEyebrow: '인터랙티브 미리보기',
      previewTitle: '공유 전 무엇이 달라지는지 확인하세요',
      previewAria: '미리보기 상태 선택',
      before: '가리기 전',
      after: '가린 후',
      navBrief: '출시 요약',
      navAssets: '자료',
      navReview: '검토',
      document: '파트너 발표 자료',
      draft: '로컬 초안',
      owner: '담당자',
      email: '이메일',
      phone: '전화번호',
      token: '초대 토큰',
      note: '공개 메모',
      noteValue: '디자인 검토 준비 완료',
      previewCaption:
        '전후 상태를 바꿔보세요. 공유용 사본은 선택한 영역을 내보내기 전에 대체합니다.',
      whyKicker: '만든 이유',
      whyTitle: '프라이버시 도구도 게시 과정의 일부여야 합니다.',
      whyBody:
        '가리기는 보통 모든 작업이 끝난 뒤의 정리로 취급됩니다. 우리는 위험을 가장 쉽게 이해할 수 있는 공유 순간으로 이 과정을 옮겼습니다.',
      storyOneTitle: '노출 확인',
      storyOneBody: '현실적인 전후 화면으로 숨어 있던 식별 정보를 바로 확인합니다.',
      storyTwoTitle: '최종 결정은 직접',
      storyTwoBody: '제안은 체크리스트일 뿐입니다. 마지막 영역은 사용자가 결정합니다.',
      storyThreeTitle: '새 파일로 내보내기',
      storyThreeBody: '원본을 재사용하지 않고 새 캔버스에서 PNG 또는 JPEG를 만듭니다.',
      manifesto: '스크린샷을 더 안전하게 만들기 위해 서버로 보낼 필요는 없습니다.',
      demoKicker: '목업이 아닌 실제 기능',
      demoTitle: '이 페이지에서 실제 편집기를 써보세요.',
      demoBody:
        '아래에서 스크린샷을 선택하세요. 임베드된 편집기는 제품과 같은 로컬 전용 흐름을 사용하며 이미지를 업로드하지 않습니다.',
      demoBadge: '이 탭의 브라우저에서 로컬 실행 중',
      openTab: '새 탭에서 열기',
      frameTitle: 'Screenshot Shield 실제 편집기',
      shareKicker: '공유하기 위해 만든 이야기',
      shareTitle: '과장된 약속 대신 실제 이야기를 공유하세요.',
      shareBody:
        '이 제품은 솔직한 한계를 가진 검토 보조 도구입니다. 핵심은 단순합니다. 원본 이미지는 브라우저를 떠나지 않습니다.',
      shareStory: '출시 스토리 공유',
      start: '가리기 시작',
      footer: '로컬 스크린샷 가리기. 업로드 엔드포인트 없음.',
      shared: '공유 창을 열었습니다.',
      copied: '출시 링크를 복사했습니다.',
      shareText: '브라우저 로컬에서 동작하는 Screenshot Shield를 체험해보세요.',
    },
    zh: {
      pageTitle: 'Screenshot Shield — 发布故事',
      skip: '跳到实时演示',
      share: '分享',
      kicker: '发布故事',
      title: '截图看起来很安全。直到你放大查看。',
      lede: '客服工单、产品更新和发布动态中隐藏的信息比想象中更多。Screenshot Shield 让最后一步隐私检查直观、快速，并且完全在浏览器本地完成。',
      try: '体验实时编辑器',
      product: '打开产品页面',
      signalUpload: '上传接口',
      signalMemory: '会话内存',
      signalExport: '全新导出',
      previewEyebrow: '互动预览',
      previewTitle: '看看分享前发生了什么变化',
      previewAria: '选择预览状态',
      before: '遮盖前',
      after: '遮盖后',
      navBrief: '发布摘要',
      navAssets: '素材',
      navReview: '检查',
      document: '合作伙伴公告',
      draft: '本地草稿',
      owner: '负责人',
      email: '邮箱',
      phone: '电话',
      token: '邀请令牌',
      note: '公开备注',
      noteValue: '已准备好设计评审',
      previewCaption: '切换前后状态。分享副本会在导出前替换选中的敏感区域。',
      whyKicker: '为什么做它',
      whyTitle: '隐私工具也应该成为发布流程的一部分。',
      whyBody:
        '遮盖通常被当成工作完成后的清理。我们把它放到分享发生的那一刻，因为此时最容易理解真正的风险。',
      storyOneTitle: '看见泄露',
      storyOneBody: '真实的前后对比让隐藏的标识信息一目了然。',
      storyTwoTitle: '保留控制权',
      storyTwoBody: '建议只是检查清单，每个最终区域都由你决定。',
      storyThreeTitle: '导出全新文件',
      storyThreeBody: '全新画布生成新的 PNG 或 JPEG，不复用源文件。',
      manifesto: '为了让截图更安全，不应该先把它发送到服务器。',
      demoKicker: '不是模型，是真实功能',
      demoTitle: '直接在此体验真实编辑器。',
      demoBody: '在下方选择一张截图。嵌入编辑器使用与主产品相同的纯本地流程，本页面不会上传图像。',
      demoBadge: '正在此标签页的浏览器中本地运行',
      openTab: '在新标签页打开',
      frameTitle: 'Screenshot Shield 实时编辑器',
      shareKicker: '为传播而设计',
      shareTitle: '分享真实故事，而不是夸大的隐私承诺。',
      shareBody: '这是一款有明确局限的审查辅助工具。核心主张很简单：源图像始终留在你的浏览器中。',
      shareStory: '分享发布故事',
      start: '开始遮盖',
      footer: '本地截图遮盖，无上传接口。',
      shared: '已打开分享面板。',
      copied: '发布链接已复制。',
      shareText: '体验完全在浏览器本地运行的 Screenshot Shield。',
    },
  };

  const localeButtons = [...document.querySelectorAll('[data-locale]')];
  const preview = document.querySelector('[data-preview]');
  const shareButtons = [...document.querySelectorAll('[data-share]')];
  const shareStatus = document.querySelector('[data-share-status]');
  let locale = detectLocale();

  function detectLocale() {
    const language = (navigator.language || '').toLowerCase();
    if (language.startsWith('ko')) return 'ko';
    if (language.startsWith('zh')) return 'zh';
    return 'en';
  }

  function renderLocale(nextLocale) {
    locale = nextLocale;
    const strings = copy[locale];
    document.documentElement.lang = locale;
    document.title = strings.pageTitle;

    document.querySelectorAll('[data-copy]').forEach((element) => {
      const key = element.dataset.copy;
      if (key && strings[key]) element.textContent = strings[key];
    });
    document.querySelectorAll('[data-copy-aria]').forEach((element) => {
      const key = element.dataset.copyAria;
      if (key && strings[key]) element.setAttribute('aria-label', strings[key]);
    });
    document.querySelectorAll('[data-copy-title]').forEach((element) => {
      const key = element.dataset.copyTitle;
      if (key && strings[key]) element.setAttribute('title', strings[key]);
    });
    localeButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.locale === locale));
    });
  }

  localeButtons.forEach((button) => {
    button.addEventListener('click', () => renderLocale(button.dataset.locale));
  });

  document.querySelectorAll('[data-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      const after = button.dataset.mode === 'after';
      preview.classList.toggle('is-after', after);
      document.querySelectorAll('[data-mode]').forEach((candidate) => {
        candidate.setAttribute('aria-pressed', String(candidate === button));
      });
    });
  });

  async function copyLink(url) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return;
    }
    const input = document.createElement('textarea');
    input.value = url;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.append(input);
    input.select();
    document.execCommand('copy');
    input.remove();
  }

  shareButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const strings = copy[locale];
      const url = new URL('./launch.html', window.location.href).href;
      try {
        if (navigator.share) {
          await navigator.share({ title: strings.pageTitle, text: strings.shareText, url });
          shareStatus.textContent = strings.shared;
        } else {
          await copyLink(url);
          shareStatus.textContent = strings.copied;
        }
      } catch (error) {
        if (error?.name !== 'AbortError') {
          await copyLink(url);
          shareStatus.textContent = strings.copied;
        }
      }
    });
  });

  renderLocale(locale);
})();
