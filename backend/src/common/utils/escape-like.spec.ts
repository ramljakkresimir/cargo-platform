import { escapeLikePattern } from './escape-like';

describe('escapeLikePattern', () => {
  it('escapes percent signs', () => {
    expect(escapeLikePattern('100%')).toBe('100\\%');
  });

  it('escapes underscores', () => {
    expect(escapeLikePattern('a_b')).toBe('a\\_b');
  });

  it('escapes backslashes', () => {
    expect(escapeLikePattern('a\\b')).toBe('a\\\\b');
  });

  it('escapes backslash before the character it introduces (order matters)', () => {
    expect(escapeLikePattern('\\%')).toBe('\\\\\\%');
  });

  it('leaves ordinary text untouched', () => {
    expect(escapeLikePattern('Sarajevo')).toBe('Sarajevo');
  });

  it('handles an empty string', () => {
    expect(escapeLikePattern('')).toBe('');
  });
});
