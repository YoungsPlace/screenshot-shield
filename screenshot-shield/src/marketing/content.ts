export type DetectorItem = {
  readonly label: string;
  readonly example: string;
  readonly note: string;
};

export type FaqItem = {
  readonly question: string;
  readonly answer: string;
};

export const detectorItems: readonly DetectorItem[] = [
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
] as const;

export const faqItems: readonly FaqItem[] = [
  {
    question: 'Do screenshots upload anywhere?',
    answer:
      'No upload endpoint is part of the app. Import, detection review, drawing, and export are designed to run in the browser with same-origin assets only.',
  },
  {
    question: 'Is OCR required before I can redact?',
    answer:
      'No. OCR only assists with suggestions. Manual rectangles are the reliable path and remain available when OCR cannot initialize.',
  },
  {
    question: 'Can detection miss sensitive text?',
    answer:
      'Yes. Screenshot Shield is a review aid, not a guarantee. You should inspect the preview and add manual regions for anything sensitive.',
  },
  {
    question: 'Does export keep the original file metadata?',
    answer:
      'Export is produced from a fresh canvas so the downloaded PNG or JPEG is newly encoded instead of reusing the original file bytes.',
  },
] as const;

export const workflowSteps = [
  {
    title: 'Import locally',
    body: 'Paste, drop, or pick a screenshot. It is decoded in memory and never stored by the site.',
  },
  {
    title: 'Review suggestions',
    body: 'Use local pattern/OCR suggestions as a checklist, then draw or adjust rectangles yourself.',
  },
  {
    title: 'Export a clean copy',
    body: 'Download a freshly rendered PNG or JPEG with opaque or irreversible pixelated redactions.',
  },
] as const;
