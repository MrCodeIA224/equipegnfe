import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatDate, formatDateShort, truncate } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('resolves conflicting Tailwind classes (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('drops falsy values', () => {
    expect(cn('px-2', false && 'hidden', undefined, 'py-1')).toBe('px-2 py-1');
  });
});

describe('formatCurrency', () => {
  // Intl.NumberFormat('fr-GN') separe les milliers par une espace fine
  // insecable (U+202F), pas une espace normale ASCII - on ne teste donc que
  // les chiffres et le suffixe, pas le caractere separateur exact.
  it('formats a number with GNF suffix', () => {
    const result = formatCurrency(20000);
    expect(result).toContain('20');
    expect(result).toContain('000');
    expect(result.endsWith('GNF')).toBe(true);
  });

  it('formats a numeric string', () => {
    const result = formatCurrency('5000');
    expect(result).toContain('5');
    expect(result).toContain('000');
    expect(result.endsWith('GNF')).toBe(true);
  });

  it('falls back to 0 GNF for invalid input', () => {
    expect(formatCurrency('abc')).toBe('0 GNF');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('0 GNF');
  });
});

describe('formatDate / formatDateShort', () => {
  it('formats a date string without throwing', () => {
    expect(formatDate('2026-07-23T17:40:00Z')).toMatch(/2026/);
  });

  it('formats a short date string without throwing', () => {
    expect(formatDateShort('2026-07-23T17:40:00Z')).toMatch(/2026/);
  });
});

describe('truncate', () => {
  it('leaves short text untouched', () => {
    expect(truncate('Riz gras', 20)).toBe('Riz gras');
  });

  it('truncates long text and appends an ellipsis', () => {
    expect(truncate('Riz gras au poulet grille', 8)).toBe('Riz gras...');
  });
});
