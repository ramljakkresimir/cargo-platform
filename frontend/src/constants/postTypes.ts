export const CARGO_TYPES = [
  { value: 'general', label: 'Opći teret' },
  { value: 'palletized', label: 'Paletizirano' },
  { value: 'bulk', label: 'Rasuti teret' },
  { value: 'liquid', label: 'Tekućina' },
  { value: 'refrigerated', label: 'Rashlađeno' },
  { value: 'hazardous', label: 'Opasne tvari' },
  { value: 'oversized', label: 'Nadgabaritno' },
];

export const VEHICLE_TYPES = [
  { value: 'truck', label: 'Kamion' },
  { value: 'van', label: 'Kombi' },
  { value: 'semi_truck', label: 'Tegljač' },
  { value: 'refrigerated_truck', label: 'Hladnjača' },
  { value: 'flatbed', label: 'Niskopodna prikolica' },
  { value: 'tanker', label: 'Cisterna' },
];

export function cargoTypeLabel(value?: string | null): string {
  if (!value) return '—';
  return CARGO_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function vehicleTypeLabel(value?: string | null): string {
  if (!value) return '—';
  return VEHICLE_TYPES.find((t) => t.value === value)?.label ?? value;
}
