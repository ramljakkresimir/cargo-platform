import { City } from '../../types';

export interface SearchSelectOption {
  value: string;
  label: string;
}

export type SearchFieldConfig =
  | {
      key: string;
      type: 'city';
      label: string;
      value: City | null;
      onChange: (city: City | null) => void;
      placeholder?: string;
    }
  | {
      key: string;
      type: 'date';
      label: string;
      value: string;
      onChange: (value: string) => void;
    }
  | {
      key: string;
      type: 'select';
      label: string;
      value: string;
      onChange: (value: string) => void;
      options: SearchSelectOption[];
      placeholder?: string;
    };

export interface SearchChipConfig {
  key: string;
  label: string;
  active: boolean;
  onClick: () => void;
}

export type SearchAccent = 'blue' | 'teal';
export type SearchMode = 'vehicles' | 'cargo';

export interface ResultCardBadge {
  label: string;
  tone: 'neutral' | 'accent';
}

export interface ResultCardData {
  id: string;
  href: string;
  companyName: string;
  companyCity?: string | null;
  badges: ResultCardBadge[];
  originLabel: string;
  destinationLabel: string;
  dateLabel: string;
  distanceKm?: number | null;
  postedAtLabel: string;
  priceLabel?: string | null;
}

export type SortValue = 'newest' | 'date' | 'distance';
