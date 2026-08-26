import { useEffect, useMemo, useState } from 'react';
import { cargoPostsService } from '../services/cargoPosts.service';
import { CargoPost, PaginatedResult, City } from '../types';
import SearchPageHeader from '../components/search/SearchPageHeader';
import SearchFilterBar from '../components/search/SearchFilterBar';
import SearchResultsBar from '../components/search/SearchResultsBar';
import ResultCard from '../components/search/ResultCard';
import EmptyState from '../components/EmptyState';
import { SearchChipConfig, SearchFieldConfig, SortValue, ResultCardData } from '../components/search/types';
import { CARGO_TYPES, VEHICLE_TYPES, cargoTypeLabel, vehicleTypeLabel } from '../constants/postTypes';
import { formatDate, formatPostedAt, todayLocalDateString, addDaysLocalDateString } from '../utils/dateUtils';
import { useCityDistances, pairKey } from '../hooks/useCityDistances';

const LIMIT = 10;

interface ActiveFilters {
  loadingCityId: string;
  unloadingCityId: string;
  loadingDate: string;
  loadingDateTo: string;
  cargoType: string;
  requiredVehicleType: string;
}

const emptyActiveFilters: ActiveFilters = {
  loadingCityId: '',
  unloadingCityId: '',
  loadingDate: '',
  loadingDateTo: '',
  cargoType: '',
  requiredVehicleType: '',
};

function loadingLabel(post: CargoPost): string {
  return post.loadingCity?.name || post.loadingLocation || '—';
}

function unloadingLabel(post: CargoPost): string {
  return post.unloadingCity?.name || post.unloadingLocation || '—';
}

function cargoCountLabel(n: number): string {
  return n === 1 ? `${n} oglas pronađen` : `${n} oglasa pronađena`;
}

export default function CargoListPage() {
  const [loadingCityFilter, setLoadingCityFilter] = useState<City | null>(null);
  const [unloadingCityFilter, setUnloadingCityFilter] = useState<City | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [cargoTypeFilter, setCargoTypeFilter] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('');
  const [sort, setSort] = useState<SortValue>('newest');

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(emptyActiveFilters);
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<PaginatedResult<CargoPost> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [prevFilters, setPrevFilters] = useState(activeFilters);
  const [prevPage, setPrevPage] = useState(page);
  if (activeFilters !== prevFilters || page !== prevPage) {
    setPrevFilters(activeFilters);
    setPrevPage(page);
    setLoading(true);
    setError('');
  }

  const fetchPosts = async () => {
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (activeFilters.loadingCityId) params.loadingCityId = activeFilters.loadingCityId;
      if (activeFilters.unloadingCityId) params.unloadingCityId = activeFilters.unloadingCityId;
      if (activeFilters.loadingDate) params.loadingDate = activeFilters.loadingDate;
      if (activeFilters.loadingDateTo) params.loadingDateTo = activeFilters.loadingDateTo;
      if (activeFilters.cargoType) params.cargoType = activeFilters.cargoType;
      if (activeFilters.requiredVehicleType) params.requiredVehicleType = activeFilters.requiredVehicleType;
      const res = await cargoPostsService.getAll(params);
      setResult(res.data);
    } catch {
      setError('Nije moguće učitati oglase tereta.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilters, page]);

  const commit = (overrides: Partial<ActiveFilters> = {}) => {
    setPage(1);
    setActiveFilters({
      loadingCityId: loadingCityFilter?.id || '',
      unloadingCityId: unloadingCityFilter?.id || '',
      loadingDate: dateFilter,
      loadingDateTo: dateToFilter,
      cargoType: cargoTypeFilter,
      requiredVehicleType: vehicleTypeFilter,
      ...overrides,
    });
  };

  const handleReset = () => {
    setLoadingCityFilter(null);
    setUnloadingCityFilter(null);
    setDateFilter('');
    setDateToFilter('');
    setCargoTypeFilter('');
    setVehicleTypeFilter('');
    setPage(1);
    setActiveFilters(emptyActiveFilters);
  };

  const today = todayLocalDateString();
  const weekEnd = addDaysLocalDateString(today, 6);
  const isTodayActive = dateFilter === today && dateToFilter === today;
  const isWeekActive = dateFilter === today && dateToFilter === weekEnd;

  const applyDateChip = (from: string, to: string) => {
    setDateFilter(from);
    setDateToFilter(to);
    commit({ loadingDate: from, loadingDateTo: to });
  };
  const clearDateChip = () => {
    setDateFilter('');
    setDateToFilter('');
    commit({ loadingDate: '', loadingDateTo: '' });
  };
  const applyCargoTypeChip = (value: string) => {
    setCargoTypeFilter(value);
    commit({ cargoType: value });
  };
  const clearCargoTypeChip = () => {
    setCargoTypeFilter('');
    commit({ cargoType: '' });
  };

  const chips: SearchChipConfig[] = [
    {
      key: 'today',
      label: 'Danas',
      active: isTodayActive,
      onClick: () => (isTodayActive ? clearDateChip() : applyDateChip(today, today)),
    },
    {
      key: 'week',
      label: 'Ovaj tjedan',
      active: isWeekActive,
      onClick: () => (isWeekActive ? clearDateChip() : applyDateChip(today, weekEnd)),
    },
    {
      key: 'palletized',
      label: 'Paleta',
      active: cargoTypeFilter === 'palletized',
      onClick: () => (cargoTypeFilter === 'palletized' ? clearCargoTypeChip() : applyCargoTypeChip('palletized')),
    },
    {
      key: 'liquid',
      label: 'Tekućina',
      active: cargoTypeFilter === 'liquid',
      onClick: () => (cargoTypeFilter === 'liquid' ? clearCargoTypeChip() : applyCargoTypeChip('liquid')),
    },
    {
      key: 'bulk',
      label: 'Rasuti teret',
      active: cargoTypeFilter === 'bulk',
      onClick: () => (cargoTypeFilter === 'bulk' ? clearCargoTypeChip() : applyCargoTypeChip('bulk')),
    },
  ];

  const fields: SearchFieldConfig[] = [
    { key: 'loading', type: 'city', label: 'Utovar', value: loadingCityFilter, onChange: setLoadingCityFilter, placeholder: 'npr. Sarajevo' },
    { key: 'unloading', type: 'city', label: 'Istovar', value: unloadingCityFilter, onChange: setUnloadingCityFilter, placeholder: 'npr. Zagreb' },
    { key: 'date', type: 'date', label: 'Datum utovara', value: dateFilter, onChange: setDateFilter },
    {
      key: 'cargoType',
      type: 'select',
      label: 'Vrsta tereta',
      value: cargoTypeFilter,
      onChange: setCargoTypeFilter,
      options: CARGO_TYPES,
      placeholder: 'Sve vrste',
    },
    {
      key: 'vehicleType',
      type: 'select',
      label: 'Vrsta vozila',
      value: vehicleTypeFilter,
      onChange: setVehicleTypeFilter,
      options: VEHICLE_TYPES,
      placeholder: 'Sve vrste',
    },
  ];

  const posts = useMemo(() => result?.data ?? [], [result]);

  const distancePairs = useMemo(
    () =>
      posts
        .filter((p) => p.loadingCityId && p.unloadingCityId)
        .map((p) => ({ fromCityId: p.loadingCityId as string, toCityId: p.unloadingCityId as string })),
    [posts],
  );
  const distances = useCityDistances(distancePairs);

  const distanceForPost = (post: CargoPost): number | null | undefined => {
    if (!post.loadingCityId || !post.unloadingCityId) return undefined;
    return distances.get(pairKey(post.loadingCityId, post.unloadingCityId));
  };

  const sortedPosts = useMemo(() => {
    const arr = [...posts];
    if (sort === 'date') {
      arr.sort((a, b) => a.loadingDate.localeCompare(b.loadingDate));
    } else if (sort === 'distance') {
      arr.sort((a, b) => {
        const da = distanceForPost(a);
        const db = distanceForPost(b);
        if (da == null && db == null) return 0;
        if (da == null) return 1;
        if (db == null) return -1;
        return da - db;
      });
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, sort, distances]);

  const cards: ResultCardData[] = sortedPosts.map((post) => {
    const dist = distanceForPost(post);
    return {
      id: post.id,
      href: `/cargo/${post.id}`,
      companyName: post.company?.companyName || '—',
      companyCity: post.company?.city,
      badges: [
        ...(post.cargoType ? [{ label: cargoTypeLabel(post.cargoType), tone: 'accent' as const }] : []),
        ...(post.requiredVehicleType ? [{ label: vehicleTypeLabel(post.requiredVehicleType), tone: 'neutral' as const }] : []),
        ...(post.weight ? [{ label: `${post.weight} t`, tone: 'neutral' as const }] : []),
      ],
      originLabel: loadingLabel(post),
      destinationLabel: unloadingLabel(post),
      dateLabel: `Utovar ${formatDate(post.loadingDate)}`,
      distanceKm: dist ?? null,
      postedAtLabel: formatPostedAt(post.createdAt),
      priceLabel: post.price ? `€${post.price}` : null,
      ownerUserId: post.company?.userId,
      listingType: 'cargo' as const,
    };
  });

  return (
    <div className="search-page">
      <SearchPageHeader
        accent="teal"
        pillLabel="Tereti"
        title="Dostupni tereti"
        primaryLabel="+ Objavi teret"
        primaryHref="/cargo/new"
      />

      <SearchFilterBar mode="cargo" fields={fields} chips={chips} onSubmit={() => commit()} onReset={handleReset} />

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading">Učitavanje...</div>}

      {!loading && (
        <>
          <SearchResultsBar
            countLabel={cargoCountLabel(result?.total ?? 0)}
            sort={sort}
            onSortChange={setSort}
            dateSortLabel="Datum utovara"
          />

          {cards.length === 0 ? (
            <EmptyState
              message="Nema tereta koji odgovara odabranim filtrima. Pokušajte proširiti pretragu."
              action={
                <button type="button" className="btn-secondary" onClick={handleReset}>
                  Poništi filtre
                </button>
              }
            />
          ) : (
            <div className="search-results-list">
              {cards.map((card) => (
                <ResultCard key={card.id} data={card} accent="teal" />
              ))}
            </div>
          )}

          {result && result.totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
                ← Prethodna
              </button>
              <span className="pagination-info">
                Stranica {result.page} od {result.totalPages} &nbsp;·&nbsp; {result.total} rezultata
              </span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= result.totalPages}>
                Sljedeća →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
