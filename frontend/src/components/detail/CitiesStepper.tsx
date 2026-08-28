import { useId, useState } from 'react';
import { ChevronDownIcon } from '../Icons';
import { DetailRouteCity } from './types';

interface Props {
  cities: DetailRouteCity[];
}

const COLLAPSE_THRESHOLD = 6;

function StepperNode({ city, isEndpoint, isStart, isEnd }: { city: DetailRouteCity; isEndpoint: boolean; isStart: boolean; isEnd: boolean }) {
  return (
    <div className={`detail-stepper-node${isEndpoint ? ' endpoint' : ''}${isStart ? ' start' : ''}${isEnd ? ' end' : ''}`}>
      <span className="detail-stepper-dot" />
      <span className="detail-stepper-label">{city.name}</span>
    </div>
  );
}

// Dot+label stepper for the cities a route passes through. Renders as a horizontal row on
// desktop and a vertical list on mobile — purely via CSS (flex-direction swap on
// .detail-stepper at the mobile breakpoint), no separate markup per orientation.
//
// Past 6 cities, the row always shows the first two + a "+N" pill + the last two — the
// pill's own label never changes, clicking it only toggles a full-list grid rendered
// below the row (not inline), so the row itself never reflows.
export default function CitiesStepper({ cities }: Props) {
  const [expanded, setExpanded] = useState(false);
  const gridId = useId();

  if (cities.length === 0) return null;

  const shouldCollapse = cities.length > COLLAPSE_THRESHOLD;
  const lastIndex = cities.length - 1;

  const row = shouldCollapse
    ? [cities[0], cities[1], null, cities[lastIndex - 1], cities[lastIndex]]
    : cities;
  const rowLastIndex = row.length - 1;

  return (
    <>
      <div className="detail-stepper" role="list">
        {row.map((city, i) => (
          <div className="detail-stepper-item" role="listitem" key={city?.id ?? 'more'}>
            {i > 0 && <span className="detail-stepper-connector" aria-hidden="true" />}
            {city === null ? (
              <button
                type="button"
                className="detail-stepper-more"
                onClick={() => setExpanded((e) => !e)}
                aria-expanded={expanded}
                aria-controls={gridId}
              >
                +{cities.length - 4}
                <ChevronDownIcon size={13} className={`detail-stepper-more-chevron${expanded ? ' open' : ''}`} />
              </button>
            ) : (
              <StepperNode city={city} isEndpoint={i === 0 || i === rowLastIndex} isStart={i === 0} isEnd={i === rowLastIndex} />
            )}
          </div>
        ))}
      </div>

      {shouldCollapse && (
        <div className={`detail-cities-expand${expanded ? ' open' : ''}`} id={gridId}>
          <div className="detail-cities-expand-inner">
            <div className="detail-cities-grid">
              {cities.map((city, i) => {
                const isEndpoint = i === 0 || i === lastIndex;
                return (
                  <div className={`detail-cities-grid-item${isEndpoint ? ' endpoint' : ''}${i === 0 ? ' start' : ''}${i === lastIndex ? ' end' : ''}`} key={city.id}>
                    <span className="detail-cities-grid-dot" />
                    <span>
                      {city.name}
                      {city.country && <span className="detail-cities-grid-country"> {city.country}</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
