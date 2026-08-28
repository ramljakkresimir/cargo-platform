import { Link } from 'react-router-dom';
import DetailHeaderCard from './DetailHeaderCard';
import RouteMapCard from './RouteMapCard';
import NotesCard from './NotesCard';
import ContactCard from './ContactCard';
import CompanyRatingCard from './CompanyRatingCard';
import MobileActionBar from './MobileActionBar';
import { DetailData } from './types';

interface Props {
  data: DetailData;
  backHref: string;
  backLabel: string;
}

export default function DetailView({ data, backHref, backLabel }: Props) {
  const showRatingCard = !data.isOwner && data.isLoggedIn;
  const showMobileBar = !data.isOwner && Boolean(data.company);

  return (
    <div className={`detail-page accent-${data.accent}`}>
      <Link to={backHref} className="back-link">← {backLabel}</Link>

      <DetailHeaderCard
        modeLabel={data.modeLabel}
        status={data.status}
        statusLabel={data.statusLabel}
        extraPillLabel={data.extraPillLabel}
        originLabel={data.originLabel}
        originSubLabel={data.originSubLabel}
        destinationLabel={data.destinationLabel}
        destinationSubLabel={data.destinationSubLabel}
        connectorMidLabel={data.connectorMidLabel}
        distanceKm={data.distanceKm}
        factTiles={data.factTiles}
        isOwner={data.isOwner}
        ownerActions={data.ownerActions}
      />

      <div className={`detail-body${showMobileBar ? ' has-mobile-bar' : ''}`}>
        <RouteMapCard
          originLabel={data.originLabel}
          destinationLabel={data.destinationLabel}
          distanceKm={data.distanceKm}
          routeGeoJson={data.routeGeoJson}
          routeCities={data.routeCities}
          explainerLine={data.routeExplainerLine}
          hasDestination={data.hasDestinationCity}
        />

        <NotesCard title={data.notesTitle} body={data.notesBody} chips={data.chips} />

        {data.company && (
          <ContactCard
            company={data.company}
            ratingSummary={data.ratingSummary}
            priceBlock={data.priceBlock}
            isOwner={data.isOwner}
            onContact={data.onContact}
          />
        )}

        {showRatingCard && (
          <CompanyRatingCard
            score={data.myScore}
            onChange={data.onRate}
            disabled={data.ratingSubmitting}
            error={data.ratingError}
          />
        )}
      </div>

      {showMobileBar && (
        <MobileActionBar
          primary={data.mobileSummaryPrimary}
          secondary={data.mobileSummarySecondary}
          onContact={data.onContact}
        />
      )}
    </div>
  );
}
