import { useState, useEffect, useRef, useCallback } from 'react';
import { citiesService } from '../services/cities.service';
import { City } from '../types';

interface Props {
  value: City | null;
  onChange: (city: City | null) => void;
  placeholder?: string;
  required?: boolean;
  country?: string;
}

export default function CityAutocomplete({
  value,
  onChange,
  placeholder = 'Type city name…',
  required = false,
  country,
}: Props) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<City[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When a city is already selected, don't search
  const isSelected = value !== null;

  const search = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setOptions([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      try {
        const res = await citiesService.search({ search: q, country, limit: 20 });
        setOptions(res.data);
        setOpen(true);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [country],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 250);
  };

  const handleSelect = (city: City) => {
    onChange(city);
    setQuery('');
    setOpen(false);
    setOptions([]);
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
    setOpen(false);
    setOptions([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="city-autocomplete" ref={containerRef}>
      {isSelected ? (
        <div className="city-autocomplete-input-wrap">
          <input
            readOnly
            value={`${value.name}, ${value.country}`}
            style={{ background: '#f9fafb' }}
          />
          <button type="button" className="city-clear-btn" onClick={handleClear}>
            ✕
          </button>
        </div>
      ) : (
        <>
          <input
            value={query}
            onChange={handleInputChange}
            placeholder={placeholder}
            required={required}
            autoComplete="off"
          />
          {loading && (
            <div className="city-dropdown">
              <div className="city-no-results">Searching…</div>
            </div>
          )}
          {!loading && open && (
            <div className="city-dropdown">
              {options.length === 0 ? (
                <div className="city-no-results">No cities found</div>
              ) : (
                options.map((city) => (
                  <div
                    key={city.id}
                    className="city-option"
                    onMouseDown={() => handleSelect(city)}
                  >
                    {city.name}
                    <span className="city-option-country">{city.country}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
