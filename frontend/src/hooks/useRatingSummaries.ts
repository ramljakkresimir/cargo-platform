import { useEffect, useMemo, useState } from 'react';
import { ratingsService } from '../services/ratings.service';
import { RatingSummary } from '../types';

const EMPTY_SUMMARIES: Map<string, RatingSummary> = new Map();

// Batches a rating-average lookup for a page of result cards into one request, mirroring
// useCityDistances(). Loads asynchronously after the initial render — callers just get an
// empty map until it resolves, so a slow/failed lookup never blocks or breaks card rendering.
export function useRatingSummaries(
  userIds: (string | null | undefined)[],
): Map<string, RatingSummary> {
  const ids = useMemo(
    () => Array.from(new Set(userIds.filter((id): id is string => Boolean(id)))),
    [userIds],
  );
  const key = ids.join(',');
  const [summaries, setSummaries] = useState<Map<string, RatingSummary>>(EMPTY_SUMMARIES);

  useEffect(() => {
    if (ids.length === 0) return;
    let cancelled = false;
    ratingsService
      .getSummaries(ids)
      .then((res) => {
        if (cancelled) return;
        setSummaries(new Map(res.data.results.map((r) => [r.userId, r])));
      })
      .catch(() => {
        // Rating is a non-essential enhancement — fail silently, cards just hide the line.
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // No ids to resolve — return a stable empty map instead of routing through state.
  return ids.length === 0 ? EMPTY_SUMMARIES : summaries;
}
