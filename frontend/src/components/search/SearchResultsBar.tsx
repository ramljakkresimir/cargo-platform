import { ChevronDownIcon } from '../Icons';
import { SortValue } from './types';

interface Props {
  countLabel: string;
  sort: SortValue;
  onSortChange: (value: SortValue) => void;
  dateSortLabel: string;
}

export default function SearchResultsBar({ countLabel, sort, onSortChange, dateSortLabel }: Props) {
  return (
    <div className="search-results-bar">
      <span className="search-results-count">{countLabel}</span>
      <label className="search-sort">
        <span className="search-sort-label">Sortiraj:</span>
        <span className="search-sort-select-wrap">
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortValue)}
            aria-label="Sortiraj rezultate"
          >
            <option value="newest">Najnovije</option>
            <option value="date">{dateSortLabel}</option>
            <option value="distance">Udaljenost</option>
          </select>
          <ChevronDownIcon size={13} className="search-sort-chevron" />
        </span>
      </label>
    </div>
  );
}
