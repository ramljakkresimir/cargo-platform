import { Company, RatingSummary, RouteCoordinate } from '../../types';

export type DetailMode = 'vehicle' | 'cargo';
export type DetailAccent = 'blue' | 'teal';

export interface DetailFactTile {
  label: string;
  value: string;
}

export interface DetailChip {
  label: string;
  tone: 'neutral' | 'accent';
}

export interface DetailPriceBlock {
  value: string;
  sublabel: string;
}

export interface DetailRouteCity {
  id: string;
  name: string;
  country?: string;
}

export interface DetailOwnerActions {
  onEdit: () => void;
  onClose?: () => void;
  closeLoading?: boolean;
  onDelete: () => void;
}

export interface DetailData {
  mode: DetailMode;
  accent: DetailAccent;
  modeLabel: string;
  status: string;
  statusLabel: string;
  extraPillLabel?: string;

  originLabel: string;
  originSubLabel: string;
  destinationLabel: string;
  destinationSubLabel: string;
  connectorMidLabel: string;
  distanceKm?: number | null;

  factTiles: DetailFactTile[];

  notesTitle: string;
  notesBody?: string | null;
  chips: DetailChip[];

  routeCities: DetailRouteCity[];
  routeGeoJson?: RouteCoordinate[] | null;
  hasDestinationCity: boolean;
  routeExplainerLine: string;

  company?: Company | null;
  ratingSummary: RatingSummary | null;
  priceBlock?: DetailPriceBlock;

  isOwner: boolean;
  ownerActions?: DetailOwnerActions;
  isLoggedIn: boolean;

  myScore: number;
  onRate: (score: number) => void;
  ratingSubmitting: boolean;
  ratingError?: string;

  onContact: () => void;

  mobileSummaryPrimary: string;
  mobileSummarySecondary: string;
}
