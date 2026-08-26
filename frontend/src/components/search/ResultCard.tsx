import { Link } from 'react-router-dom';
import CompanyAvatar from '../CompanyAvatar';
import { ResultCardData, SearchAccent } from './types';

interface Props {
  data: ResultCardData;
  accent: SearchAccent;
}

// The whole card is a clickable surface (via the stretched cover link) while "Kontakt"
// and "Pregled" remain their own focusable controls layered above it — a plain <a>
// wrapping buttons would nest interactive elements, which is invalid and breaks
// keyboard/screen-reader navigation.
export default function ResultCard({ data, accent }: Props) {
  return (
    <article className={`search-result-card accent-${accent}`}>
      <Link
        to={data.href}
        className="search-result-cover-link"
        aria-label={`${data.companyName}: ${data.originLabel} → ${data.destinationLabel}`}
      />

      <div className="src-top">
        <div className="src-company">
          <CompanyAvatar name={data.companyName} />
          <div>
            <div className="src-company-name">{data.companyName}</div>
            <div className="src-company-sub">
              Provjerena tvrtka{data.companyCity ? ` · ${data.companyCity}` : ''}
            </div>
          </div>
        </div>
        <div className="src-badges">
          {data.badges.map((badge, i) => (
            <span key={i} className={`src-badge${badge.tone === 'accent' ? ' accent' : ''}`}>
              {badge.label}
            </span>
          ))}
        </div>
      </div>

      <div className="src-route">
        <div className="src-route-side">
          <div className="src-city">{data.originLabel}</div>
          <div className="src-meta">{data.dateLabel}</div>
        </div>
        <div className="src-connector" aria-hidden="true" />
        <div className="src-route-side right">
          <div className="src-city">{data.destinationLabel}</div>
          {data.distanceKm != null && <div className="src-meta">~ {data.distanceKm} km</div>}
        </div>
      </div>

      <div className="src-footer">
        <div className="src-posted">{data.postedAtLabel}</div>
        {data.priceLabel && <span className="src-price">{data.priceLabel}</span>}
        <div className="src-footer-actions">
          <Link to={`${data.href}#kontakt`} className="src-btn src-btn-outline">
            Kontakt
          </Link>
          <Link to={data.href} className="src-btn src-btn-dark">
            Pregled
          </Link>
        </div>
      </div>
    </article>
  );
}
