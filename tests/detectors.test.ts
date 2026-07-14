import { describe, expect, it } from 'vitest';
import { findSensitivePatterns, observationsToSuggestions } from '../src/domain/detectors';
import type { TextObservation } from '../src/domain/types';

describe('findSensitivePatterns', () => {
  describe('email detection', () => {
    it('finds plain email addresses', () => {
      const matches = findSensitivePatterns('Contact us at hello@example.com for help.');
      expect(matches).toHaveLength(1);
      expect(matches[0].kind).toBe('email');
      expect(matches[0].text).toBe('hello@example.com');
    });

    it('finds multiple emails in one string', () => {
      const matches = findSensitivePatterns('From: a@b.io To: c@d.org');
      const emails = matches.filter((m) => m.kind === 'email');
      expect(emails).toHaveLength(2);
    });

    it('does not flag strings without @ sign', () => {
      const matches = findSensitivePatterns('visit our website at example.com');
      expect(matches.filter((m) => m.kind === 'email')).toHaveLength(0);
    });
  });

  describe('phone detection', () => {
    it('finds North American phone numbers', () => {
      const matches = findSensitivePatterns('Call us at +1 (415) 555-0198.');
      expect(matches.some((m) => m.kind === 'phone')).toBe(true);
    });

    it('finds phone without country code', () => {
      const matches = findSensitivePatterns('(800) 555-1234');
      expect(matches.some((m) => m.kind === 'phone')).toBe(true);
    });
  });

  describe('IPv4 detection', () => {
    it('finds valid IPv4 addresses', () => {
      const matches = findSensitivePatterns('Server at 203.0.113.42 is responding.');
      expect(matches.some((m) => m.kind === 'ipv4')).toBe(true);
    });

    it('does not flag out-of-range octets', () => {
      const matches = findSensitivePatterns('Version 999.256.0.1 is invalid');
      expect(matches.filter((m) => m.kind === 'ipv4')).toHaveLength(0);
    });

    it('finds loopback address', () => {
      const matches = findSensitivePatterns('Connected to 127.0.0.1');
      expect(matches.some((m) => m.kind === 'ipv4')).toBe(true);
    });
  });

  describe('URL with query string detection', () => {
    it('finds HTTPS URLs with query strings', () => {
      const matches = findSensitivePatterns('Reset at https://example.com/reset?token=abc123');
      expect(matches.some((m) => m.kind === 'url-query')).toBe(true);
    });

    it('does not flag URLs without query strings', () => {
      const matches = findSensitivePatterns('See https://example.com/docs for more.');
      expect(matches.filter((m) => m.kind === 'url-query')).toHaveLength(0);
    });
  });

  describe('token / long ID detection', () => {
    it('finds token-prefixed identifiers', () => {
      const matches = findSensitivePatterns('Bearer ghp_abcdefghijklmnopqrst');
      expect(matches.some((m) => m.kind === 'token')).toBe(true);
    });

    it('finds long random-looking IDs (20+ chars)', () => {
      const matches = findSensitivePatterns('ID: abcdefghijklmnopqrstu12345');
      expect(matches.some((m) => m.kind === 'token')).toBe(true);
    });

    it('does not flag short words', () => {
      const matches = findSensitivePatterns('hello world');
      expect(matches.filter((m) => m.kind === 'token')).toHaveLength(0);
    });
  });

  describe('payment card detection', () => {
    it('finds a valid Luhn-passing card number', () => {
      const matches = findSensitivePatterns('Card: 4242 4242 4242 4242');
      expect(matches.some((m) => m.kind === 'payment-card')).toBe(true);
    });

    it('does not flag sequences that fail Luhn', () => {
      // 1234 5678 9012 3456 sums to 64 mod 10 ≠ 0, fails Luhn
      const matches = findSensitivePatterns('Bad: 1234 5678 9012 3456');
      expect(matches.filter((m) => m.kind === 'payment-card')).toHaveLength(0);
    });
  });

  describe('empty and whitespace inputs', () => {
    it('returns empty array for empty string', () => {
      expect(findSensitivePatterns('')).toHaveLength(0);
    });

    it('returns empty array for whitespace-only string', () => {
      expect(findSensitivePatterns('   ')).toHaveLength(0);
    });
  });

  describe('result ordering', () => {
    it('sorts results by index', () => {
      const text = 'hello@example.com 203.0.113.1 end';
      const matches = findSensitivePatterns(text);
      for (let i = 1; i < matches.length; i++) {
        expect(matches[i].index).toBeGreaterThanOrEqual(matches[i - 1].index);
      }
    });
  });
});

describe('observationsToSuggestions', () => {
  const boxA: TextObservation = {
    text: 'email me at demo@example.com',
    box: { x: 0, y: 0, width: 400, height: 24 },
    confidence: 0.9,
  };

  it('returns a suggestion with the correct kind', () => {
    const suggestions = observationsToSuggestions([boxA]);
    expect(suggestions.some((s) => s.kind === 'email')).toBe(true);
  });

  it('produces suggestions with positive dimensions', () => {
    const suggestions = observationsToSuggestions([boxA]);
    for (const s of suggestions) {
      expect(s.width).toBeGreaterThan(0);
      expect(s.height).toBeGreaterThan(0);
    }
  });

  it('clips confidence to [0, 1]', () => {
    const obs: TextObservation = {
      text: 'hi@test.com',
      box: { x: 0, y: 0, width: 100, height: 20 },
      confidence: 1.5,
    };
    const suggestions = observationsToSuggestions([obs]);
    for (const s of suggestions) {
      expect(s.confidence).toBeLessThanOrEqual(1);
      expect(s.confidence).toBeGreaterThanOrEqual(0);
    }
  });

  it('returns empty array for observations with no sensitive patterns', () => {
    const obs: TextObservation = {
      text: 'Hello world',
      box: { x: 0, y: 0, width: 100, height: 20 },
    };
    expect(observationsToSuggestions([obs])).toHaveLength(0);
  });

  it('produces unique IDs across multiple observations', () => {
    const obs1: TextObservation = { text: 'a@b.com', box: { x: 0, y: 0, width: 100, height: 20 } };
    const obs2: TextObservation = { text: 'c@d.org', box: { x: 0, y: 20, width: 100, height: 20 } };
    const suggestions = observationsToSuggestions([obs1, obs2]);
    const ids = suggestions.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
