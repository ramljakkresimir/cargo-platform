import CompanyAvatar from '../CompanyAvatar';
import RatingStars from '../RatingStars';
import { Company, RatingSummary } from '../../types';
import { DetailPriceBlock } from './types';
import { companyTypeLabel } from '../../constants/postTypes';

interface Props {
  company: Company;
  ratingSummary: RatingSummary | null;
  priceBlock?: DetailPriceBlock;
  isOwner: boolean;
  onContact: () => void;
}

export default function ContactCard({ company, ratingSummary, priceBlock, isOwner, onContact }: Props) {
  return (
    <div className="detail-card detail-contact-card">
      <h2 className="sr-only">Kontakt</h2>
      {priceBlock && (
        <>
          <div className="detail-price-row">
            <div>
              <span className="detail-price-label">Ponuđena cijena</span>
              <div className="detail-price-value">{priceBlock.value}</div>
            </div>
            <span className="detail-price-sublabel">{priceBlock.sublabel}</span>
          </div>
          <div className="detail-contact-divider" />
        </>
      )}

      <div className="detail-company-row">
        <CompanyAvatar name={company.companyName} className="detail-company-avatar" />
        <div>
          <div className="detail-company-name">{company.companyName}</div>
          <div className="detail-company-type">{companyTypeLabel(company.companyType)}</div>
        </div>
      </div>

      <div className="detail-rating-row">
        <RatingStars average={ratingSummary?.average ?? null} count={ratingSummary?.count ?? 0} size={15} />
      </div>

      <div className="detail-contact-divider" />

      <div className="detail-contact-fields">
        <div className="detail-contact-field">
          <span className="detail-fact-label">Lokacija</span>
          <span className="detail-contact-value">{company.city}, {company.country}</span>
        </div>
        {company.phone && (
          <div className="detail-contact-field">
            <span className="detail-fact-label">Telefon</span>
            <a className="detail-contact-value link" href={`tel:${company.phone}`}>{company.phone}</a>
          </div>
        )}
        {company.email && (
          <div className="detail-contact-field">
            <span className="detail-fact-label">E-mail</span>
            <a className="detail-contact-value link breakable" href={`mailto:${company.email}`}>{company.email}</a>
          </div>
        )}
      </div>

      {!isOwner && (
        <>
          <button type="button" className="detail-contact-primary" onClick={onContact}>
            Pošalji poruku
          </button>
          <p className="detail-contact-response-note">Obično odgovara u roku od nekoliko sati.</p>
        </>
      )}
    </div>
  );
}
