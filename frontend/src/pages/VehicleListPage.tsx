import { useEffect, useMemo, useState } from 'react';
import { vehiclePostsService } from '../services/vehiclePosts.service';
import { VehiclePost, PaginatedResult, City } from '../types';
import SearchPageHeader from '../components/search/SearchPageHeader';
import SearchFilterBar from '../components/search/SearchFilterBar';
import SearchResultsBar from '../components/search/SearchResultsBar';
import ResultCard from '../components/search/ResultCard';
import EmptyState from '../components/EmptyState';
import { SearchChipConfig, SearchFieldConfig, SortValue, ResultCardData } from '../components/search/types';
import { VEHICLE_TYPES, vehicleTypeLabel } from '../constants/postTypes';
import { formatDate, formatPostedAt, todayLocalDateString, addDaysLocalDateString } from '../utils/dateUtils';
import { useCityDistances, pairKey } from '../hooks/useCityDistances';

const LIMIT = 10;

interface ActiveFilters {
  originCityId: string;
  destinationCityId: string;
  availableFromDate: string;
  availableFromDateTo: string;
  vehicleType: string;
}

const emptyActiveFilters: ActiveFilters = {
  originCityId: '',
  destinationCityId: '',
  availableFromDate: '',
  availableFromDateTo: '',
  vehicleType: '',
};

function originLabel(post: VehiclePost): string {
  return post.originCity?.name || post.availableLocation || '—';
}

function destLabel(post: VehiclePost): string {
  return post.destinationCity?.name || post.destinationPreference || '—';
}

function vehicleCountLabel(n: number): string {
  return n === 1 ? `${n} vozilo dostupno` : `${n} vozila dostupna`;
}

export default function VehicleListPage() {
  const [originCityFilter, setOriginCityFilter] = useState<City | null>(null);
  const [destCityFilter, setDestCityFilter] = useState<City | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('');
  const [sort, setSort] = useState<SortValue>('newest');

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(emptyActiveFilters);
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<PaginatedResult<VehiclePost> | null>(null);
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
      if (activeFilters.originCityId) params.originCityId = activeFilters.originCityId;
      if (activeFilters.destinationCityId) params.destinationCityId = activeFilters.destinationCityId;
      if (activeFilters.availableFromDate) params.availableFromDate = activeFilters.availableFromDate;
      if (activeFilters.availableFromDateTo) params.availableFromDateTo = activeFilters.availableFromDateTo;
      if (activeFilters.vehicleType) params.vehicleType = activeFilters.vehicleType;
      const res = await vehiclePostsService.getAll(params);
      setResult(res.data);
    } catch {
      setError('Nije moguće učitati oglase vozila.');
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
      originCityId: originCityFilter?.id || '',
      destinationCityId: destCityFilter?.id || '',
      availableFromDate: dateFilter,
      availableFromDateTo: dateToFilter,
      vehicleType: vehicleTypeFilter,
      ...overrides,
    });
  };

  const handleReset = () => {
    setOriginCityFilter(null);
    setDestCityFilter(null);
    setDateFilter('');
    setDateToFilter('');
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
    commit({ availableFromDate: from, availableFromDateTo: to });
  };
  const clearDateChip = () => {
    setDateFilter('');
    setDateToFilter('');
    commit({ availableFromDate: '', availableFromDateTo: '' });
  };
  const applyTypeChip = (value: string) => {
    setVehicleTypeFilter(value);
    commit({ vehicleType: value });
  };
  const clearTypeChip = () => {
    setVehicleTypeFilter('');
    commit({ vehicleType: '' });
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
      key: 'truck',
      label: 'Kamion',
      active: vehicleTypeFilter === 'truck',
      onClick: () => (vehicleTypeFilter === 'truck' ? clearTypeChip() : applyTypeChip('truck')),
    },
    {
      key: 'van',
      label: 'Kombi',
      active: vehicleTypeFilter === 'van',
      onClick: () => (vehicleTypeFilter === 'van' ? clearTypeChip() : applyTypeChip('van')),
    },
    {
      key: 'refrigerated',
      label: 'Hladnjača',
      active: vehicleTypeFilter === 'refrigerated_truck',
      onClick: () =>
        vehicleTypeFilter === 'refrigerated_truck' ? clearTypeChip() : applyTypeChip('refrigerated_truck'),
    },
  ];

  const fields: SearchFieldConfig[] = [
    { key: 'origin', type: 'city', label: 'Polazište', value: originCityFilter, onChange: setOriginCityFilter, placeholder: 'npr. Banja Luka' },
    { key: 'destination', type: 'city', label: 'Odredište', value: destCityFilter, onChange: setDestCityFilter, placeholder: 'npr. Split' },
    { key: 'date', type: 'date', label: 'Dostupno od', value: dateFilter, onChange: setDateFilter },
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
        .filter((p) => p.originCityId && p.destinationCityId)
        .map((p) => ({ fromCityId: p.originCityId as string, toCityId: p.destinationCityId as string })),
    [posts],
  );
  const distances = useCityDistances(distancePairs);

  const distanceForPost = (post: VehiclePost): number | null | undefined => {
    if (!post.originCityId || !post.destinationCityId) return undefined;
    return distances.get(pairKey(post.originCityId, post.destinationCityId));
  };

  const sortedPosts = useMemo(() => {
    const arr = [...posts];
    if (sort === 'date') {
      arr.sort((a, b) => a.availableFromDate.localeCompare(b.availableFromDate));
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
      href: `/vehicles/${post.id}`,
      companyName: post.company?.companyName || '—',
      companyCity: post.company?.city,
      badges: [
        { label: vehicleTypeLabel(post.vehicleType), tone: 'neutral' },
        ...(post.capacity ? [{ label: `${post.capacity} t`, tone: 'neutral' as const }] : []),
      ],
      originLabel: originLabel(post),
      destinationLabel: destLabel(post),
      dateLabel: formatDate(post.availableFromDate),
      distanceKm: dist ?? null,
      postedAtLabel: formatPostedAt(post.createdAt),
    };
  });

  return (
    <div className="search-page">
      <SearchPageHeader
        accent="blue"
        pillLabel="Vozila"
        title="Dostupna vozila"
        primaryLabel="+ Objavi vozilo"
        primaryHref="/vehicles/new"
      />

      <SearchFilterBar mode="vehicles" fields={fields} chips={chips} onSubmit={() => commit()} onReset={handleReset} />

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading">Učitavanje...</div>}

      {!loading && (
        <>
          <SearchResultsBar
            countLabel={vehicleCountLabel(result?.total ?? 0)}
            sort={sort}
            onSortChange={setSort}
            dateSortLabel="Datum dostupnosti"
          />

          {cards.length === 0 ? (
            <EmptyState
              message="Nema vozila koje odgovara odabranim filtrima. Pokušajte proširiti pretragu."
              action={
                <button type="button" className="btn-secondary" onClick={handleReset}>
                  Poništi filtre
                </button>
              }
            />
          ) : (
            <div className="search-results-list">
              {cards.map((card) => (
                <ResultCard key={card.id} data={card} accent="blue" />
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
