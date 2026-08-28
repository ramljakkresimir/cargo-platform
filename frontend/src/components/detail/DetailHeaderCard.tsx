import { useState } from 'react';
import NavDropdown from '../NavDropdown';
import { MoreIcon } from '../Icons';
import { DetailFactTile, DetailOwnerActions } from './types';

interface Props {
  modeLabel: string;
  statusLabel: string;
  status: string;
  extraPillLabel?: string;
  originLabel: string;
  originSubLabel: string;
  destinationLabel: string;
  destinationSubLabel: string;
  connectorMidLabel: string;
  distanceKm?: number | null;
  factTiles: DetailFactTile[];
  isOwner: boolean;
  ownerActions?: DetailOwnerActions;
}

const SAVE_TITLE = 'Spremanje oglasa uskoro dostupno';

export default function DetailHeaderCard({
  modeLabel,
  statusLabel,
  status,
  extraPillLabel,
  originLabel,
  originSubLabel,
  destinationLabel,
  destinationSubLabel,
  connectorMidLabel,
  distanceKm,
  factTiles,
  isOwner,
  ownerActions,
}: Props) {
  const [shareLabel, setShareLabel] = useState('Podijeli');

  const handleShare = async () => {
    const shareData = { title: document.title, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      // User cancelled the native share sheet, or it's unsupported — fall through to copy.
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareLabel('Kopirano!');
      setTimeout(() => setShareLabel('Podijeli'), 2000);
    } catch {
      // Clipboard access denied — nothing more we can do without a fake success state.
    }
  };

  return (
    <div className={`detail-card detail-header-card status-${status}`}>
      <div className="detail-pills-row">
        <div className="detail-pills">
          <span className="detail-pill mode">{modeLabel}</span>
          <span className={`detail-pill status-${status}`}>{statusLabel}</span>
          {extraPillLabel && <span className="detail-pill accent">{extraPillLabel}</span>}
        </div>

        <div className="detail-header-actions">
          {isOwner && ownerActions ? (
            <>
              <div className="detail-header-actions-desktop">
                {ownerActions.onClose && (
                  <button
                    type="button"
                    className="detail-header-btn"
                    onClick={ownerActions.onClose}
                    disabled={ownerActions.closeLoading}
                  >
                    {ownerActions.closeLoading ? 'Zatvaranje...' : 'Zatvori oglas'}
                  </button>
                )}
                <button type="button" className="detail-header-btn" onClick={handleShare}>
                  {shareLabel}
                </button>
                <button type="button" className="detail-header-btn" onClick={ownerActions.onEdit}>
                  Uredi
                </button>
                <button type="button" className="detail-header-btn danger" onClick={ownerActions.onDelete}>
                  Obriši
                </button>
              </div>
              <div className="detail-header-actions-mobile">
                <NavDropdown
                  label={<MoreIcon size={18} />}
                  showChevron={false}
                  align="right"
                  ariaLabel="Više opcija"
                  triggerClassName="detail-header-more-trigger"
                  renderPanel={(close) => (
                    <>
                      {ownerActions.onClose && (
                        <button
                          type="button"
                          className="nav-dropdown-simple-item"
                          disabled={ownerActions.closeLoading}
                          onClick={() => {
                            close();
                            ownerActions.onClose?.();
                          }}
                        >
                          {ownerActions.closeLoading ? 'Zatvaranje...' : 'Zatvori oglas'}
                        </button>
                      )}
                      <button
                        type="button"
                        className="nav-dropdown-simple-item"
                        onClick={() => {
                          close();
                          handleShare();
                        }}
                      >
                        {shareLabel}
                      </button>
                      <button
                        type="button"
                        className="nav-dropdown-simple-item"
                        onClick={() => {
                          close();
                          ownerActions.onEdit();
                        }}
                      >
                        Uredi
                      </button>
                      <div className="nav-dropdown-divider" />
                      <button
                        type="button"
                        className="nav-dropdown-simple-item danger"
                        onClick={() => {
                          close();
                          ownerActions.onDelete();
                        }}
                      >
                        Obriši
                      </button>
                    </>
                  )}
                />
              </div>
            </>
          ) : (
            <>
              <div className="detail-header-actions-desktop">
                <button type="button" className="detail-header-btn" title={SAVE_TITLE}>
                  Sačuvaj
                </button>
                <button type="button" className="detail-header-btn" onClick={handleShare}>
                  {shareLabel}
                </button>
              </div>
              <div className="detail-header-actions-mobile">
                <NavDropdown
                  label={<MoreIcon size={18} />}
                  showChevron={false}
                  align="right"
                  ariaLabel="Više opcija"
                  triggerClassName="detail-header-more-trigger"
                  renderPanel={(close) => (
                    <>
                      <button
                        type="button"
                        className="nav-dropdown-simple-item"
                        title={SAVE_TITLE}
                        onClick={close}
                      >
                        Sačuvaj
                      </button>
                      <button
                        type="button"
                        className="nav-dropdown-simple-item"
                        onClick={() => {
                          close();
                          handleShare();
                        }}
                      >
                        {shareLabel}
                      </button>
                    </>
                  )}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="detail-route-headline">
        <div className="detail-route-side">
          <h1 className="detail-route-city">{originLabel}</h1>
          <p className="detail-route-subline">{originSubLabel}</p>
        </div>
        <div className="detail-route-connector">
          {distanceKm != null && <span className="detail-route-distance">~ {distanceKm} km</span>}
          <span className="detail-route-connector-line" aria-hidden="true" />
          <span className="detail-route-connector-mid">{connectorMidLabel}</span>
        </div>
        <div className="detail-route-side right">
          <div className="detail-route-city">{destinationLabel}</div>
          <p className="detail-route-subline">{destinationSubLabel}</p>
        </div>
      </div>

      <div className="detail-fact-tiles">
        {factTiles.map((tile, i) => (
          <div className="detail-fact-tile" key={i}>
            <span className="detail-fact-label">{tile.label}</span>
            <span className="detail-fact-value">{tile.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
