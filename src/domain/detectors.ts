import type { Rect, SensitivePatternKind, SensitiveSuggestion, TextObservation } from './types';

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_RE = /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b/g;
const IPV4_RE = /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g;
const URL_QUERY_RE = /\bhttps?:\/\/[^\s?#]+\?[^\s]+/gi;
const TOKEN_RE =
  /\b(?:[A-Za-z0-9_-]{20,}|(?:sk|pk|ghp|gho|ghu|ghs|xoxb|ya29)[A-Za-z0-9_-]{10,})\b/g;
const CARD_CANDIDATE_RE = /\b(?:\d[ -]*?){13,19}\b/g;

interface PatternMatch {
  kind: SensitivePatternKind;
  text: string;
  index: number;
}

function luhnValid(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let doubleNext = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (doubleNext) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleNext = !doubleNext;
  }
  return sum % 10 === 0;
}

function matchesForRegex(text: string, kind: SensitivePatternKind, regex: RegExp): PatternMatch[] {
  return Array.from(text.matchAll(regex), (match) => ({
    kind,
    text: match[0],
    index: match.index ?? 0,
  }));
}

export function findSensitivePatterns(text: string): PatternMatch[] {
  const matches = [
    ...matchesForRegex(text, 'email', EMAIL_RE),
    ...matchesForRegex(text, 'phone', PHONE_RE),
    ...matchesForRegex(text, 'ipv4', IPV4_RE),
    ...matchesForRegex(text, 'url-query', URL_QUERY_RE),
    ...matchesForRegex(text, 'token', TOKEN_RE),
    ...Array.from(text.matchAll(CARD_CANDIDATE_RE), (match) => ({
      kind: 'payment-card' as const,
      text: match[0],
      index: match.index ?? 0,
    })).filter((match) => luhnValid(match.text)),
  ];

  return matches.sort(
    (first, second) => first.index - second.index || first.kind.localeCompare(second.kind),
  );
}

function boxForMatch(observation: TextObservation, match: PatternMatch): Rect {
  const textLength = Math.max(observation.text.length, 1);
  const startRatio = Math.max(0, Math.min(1, match.index / textLength));
  const endRatio = Math.max(
    startRatio,
    Math.min(1, (match.index + match.text.length) / textLength),
  );
  return {
    x: observation.box.x + observation.box.width * startRatio,
    y: observation.box.y,
    width: Math.max(8, observation.box.width * (endRatio - startRatio)),
    height: observation.box.height,
  };
}

export function observationsToSuggestions(observations: TextObservation[]): SensitiveSuggestion[] {
  return observations.flatMap((observation, observationIndex) =>
    findSensitivePatterns(observation.text).map((match, matchIndex) => ({
      id: `suggestion-${observationIndex}-${matchIndex}-${match.kind}`,
      kind: match.kind,
      text: match.text,
      confidence: Math.min(1, Math.max(0, observation.confidence ?? 0.7)),
      ...boxForMatch(observation, match),
    })),
  );
}
