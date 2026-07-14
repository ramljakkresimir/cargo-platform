/**
 * Escapes Postgres LIKE/ILIKE wildcard metacharacters (%, _, \) in user-supplied
 * search text so they're matched literally instead of acting as wildcards.
 * Parameter binding already prevents SQL injection — this only fixes wildcard injection
 * (e.g. searching "100%" unexpectedly matching every row containing "100").
 */
export function escapeLikePattern(term: string): string {
  return term.replace(/[\\%_]/g, (char) => `\\${char}`);
}
