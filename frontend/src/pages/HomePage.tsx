import { Link } from 'react-router-dom';
import { TruckIcon, PackageIcon, ArrowRightIcon } from '../components/Icons';

export default function HomePage() {
  return (
    <div>
      <div className="hero">
        <h1>Pronađite prijevoz ili teret na svojoj ruti</h1>
        <p className="hero-subhead">
          CargoConnect povezuje tvrtke s dostupnim prijevoznim kapacitetom — brzo, jednostavno i izravno, bez posrednika.
        </p>

        <div className="hero-cta-grid">
          <Link to="/vehicles" className="cta-card accent-blue">
            <div className="cta-card-icon blue">
              <TruckIcon size={28} />
            </div>
            <div className="cta-card-title">Trebam prijevoz</div>
            <div className="cta-card-desc">
              Pronađite vozilo koje odgovara mjestu utovara i odredištu vašeg tereta.
            </div>
            <div className="cta-card-link blue">
              Pronađi prijevoz <ArrowRightIcon size={14} />
            </div>
          </Link>

          <Link to="/cargo" className="cta-card accent-teal">
            <div className="cta-card-icon teal">
              <PackageIcon size={28} />
            </div>
            <div className="cta-card-title">Imam vozilo</div>
            <div className="cta-card-desc">
              Pronađite teret koji odgovara ruti i slobodnom kapacitetu vašeg vozila.
            </div>
            <div className="cta-card-link teal">
              Pronađi teret <ArrowRightIcon size={14} />
            </div>
          </Link>
        </div>
      </div>

      <div className="steps-section">
        <div className="steps-grid">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-title">Odaberite što tražite</div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-title">Unesite polazište i odredište</div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-title">Kontaktirajte odgovarajuću tvrtku</div>
          </div>
        </div>
      </div>

      <div className="value-props-section">
        <div className="value-props">
          <div className="value-prop">
            <div className="value-prop-title">Provjerene tvrtke</div>
            <div className="value-prop-desc">Svaka objava povezana je s registriranim profilom tvrtke.</div>
          </div>
          <div className="value-prop">
            <div className="value-prop-title">Izravan kontakt</div>
            <div className="value-prop-desc">Razgovarajte izravno s drugom tvrtkom — bez posrednika.</div>
          </div>
          <div className="value-prop">
            <div className="value-prop-title">Stvarne rute</div>
            <div className="value-prop-desc">Pretražujte po gradovima koji su vama bitni.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
