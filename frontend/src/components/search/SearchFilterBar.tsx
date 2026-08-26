import { FormEvent, useEffect, useState } from 'react';
import CityAutocomplete from '../CityAutocomplete';
import { ChevronDownIcon, XIcon } from '../Icons';
import { SearchChipConfig, SearchFieldConfig, SearchMode } from './types';

interface Props {
  mode: SearchMode;
  fields: SearchFieldConfig[];
  chips: SearchChipConfig[];
  onSubmit: () => void;
  onReset: () => void;
}

function fieldHasValue(field: SearchFieldConfig): boolean {
  if (field.type === 'city') return field.value !== null;
  return field.value !== '';
}

function renderField(field: SearchFieldConfig, idSuffix: string) {
  const filled = fieldHasValue(field);

  if (field.type === 'city') {
    return (
      <label className="search-field" key={`${field.key}-${idSuffix}`}>
        <span className="search-field-label">{field.label}</span>
        <CityAutocomplete value={field.value} onChange={field.onChange} placeholder={field.placeholder} />
      </label>
    );
  }

  if (field.type === 'date') {
    return (
      <label className="search-field" key={`${field.key}-${idSuffix}`}>
        <span className="search-field-label">{field.label}</span>
        <input type="date" value={field.value} onChange={(e) => field.onChange(e.target.value)} />
      </label>
    );
  }

  return (
    <label className={`search-field${filled ? '' : ' is-placeholder'}`} key={`${field.key}-${idSuffix}`}>
      <span className="search-field-label">{field.label}</span>
      <span className="search-field-select-wrap">
        <select value={field.value} onChange={(e) => field.onChange(e.target.value)}>
          <option value="">{field.placeholder ?? 'Sve vrste'}</option>
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon size={14} className="search-field-chevron" />
      </span>
    </label>
  );
}

export default function SearchFilterBar({ mode, fields, chips, onSubmit, onReset }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const accent = mode === 'vehicles' ? 'blue' : 'teal';

  // The first two fields are always the two location fields (Polazište/Odredište or
  // Utovar/Istovar) — those stay visible on mobile (via CSS, in the grid below); every
  // field after them moves into the "Više filtera" sheet on mobile. Holds for both
  // modes given the field order in the spec.
  const advancedFields = fields.slice(2);
  const activeAdvancedCount = advancedFields.filter(fieldHasValue).length;

  useEffect(() => {
    if (!sheetOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheetOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [sheetOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSheetOpen(false);
    onSubmit();
  };

  return (
    <>
      <div className={`search-filter-card accent-${accent}`}>
        <form onSubmit={handleSubmit}>
          <div className={`search-filter-fields mode-${mode}`}>
            {fields.map((f) => renderField(f, 'grid'))}
            <button type="submit" className="search-filter-submit">
              Pretraži
            </button>
          </div>

          <div className="search-filter-mobile-row">
            <button type="button" className="search-more-filters-btn" onClick={() => setSheetOpen(true)}>
              Više filtera{activeAdvancedCount > 0 ? ` (${activeAdvancedCount})` : ''}
            </button>
            <button type="button" className="search-reset-link" onClick={onReset}>
              Poništi
            </button>
          </div>
          <button type="submit" className="search-filter-submit-mobile">
            Pretraži
          </button>

          <div className="search-filter-chips-row">
            <div className="search-chips" role="group" aria-label="Brzi filtri">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  className={`search-chip${chip.active ? ' active' : ''}`}
                  aria-pressed={chip.active}
                  onClick={chip.onClick}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <button type="button" className="search-reset-link" onClick={onReset}>
              Poništi filtre
            </button>
          </div>
        </form>
      </div>

      <div className={`search-chips-scroll accent-${accent}`} role="group" aria-label="Brzi filtri">
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className={`search-chip${chip.active ? ' active' : ''}`}
            aria-pressed={chip.active}
            onClick={chip.onClick}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {sheetOpen && (
        <div className={`search-sheet-backdrop accent-${accent}`} onClick={() => setSheetOpen(false)}>
          <div className="search-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="search-sheet-header">
              <h3>Više filtera</h3>
              <button
                type="button"
                className="search-sheet-close"
                aria-label="Zatvori"
                onClick={() => setSheetOpen(false)}
              >
                <XIcon size={18} />
              </button>
            </div>
            <div className="search-sheet-fields">{advancedFields.map((f) => renderField(f, 'sheet'))}</div>
            <button type="button" className="search-sheet-apply" onClick={() => setSheetOpen(false)}>
              Primijeni
            </button>
          </div>
        </div>
      )}
    </>
  );
}
