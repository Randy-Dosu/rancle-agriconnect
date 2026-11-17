import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { cropLabel, kg, money } from '../format.js';

const STEPS = [
  {
    title: 'Farmers list their harvest',
    body: 'Record crop, grade, quantity, farm-gate price and region in under a minute — even from a phone in the field.',
  },
  {
    title: 'Buyers publish what they need',
    body: 'Processors and export agencies post volumes, grades, target prices and delivery windows.',
  },
  {
    title: 'AgriConnect scores the match',
    body: 'We surface the best pairings by crop, grade, price headroom, quantity and distance — then the two sides talk directly.',
  },
  {
    title: 'Deals close in GHS',
    body: 'Inquiries move from pending to accepted to completed, giving both sides a record of every trade.',
  },
];

const FEATURES = [
  {
    icon: '🎯',
    title: 'Transparent matching',
    body: 'Every match carries a score you can reason about: quantity fit, price headroom, region and grade.',
  },
  {
    icon: '📈',
    title: 'Real market signals',
    body: 'Farm-gate prices per kilogram sit next to buyer target prices, so nobody negotiates blind.',
  },
  {
    icon: '🧾',
    title: 'One deal trail',
    body: 'Inquiries, accepted volumes and committed value are tracked per processor and exporter.',
  },
  {
    icon: '🇬🇭',
    title: 'Built for Ghana',
    body: 'All 16 regions, GHS pricing and the crops that actually move: cocoa, cashew, shea, maize, soya and more.',
  },
];

const SHOWCASE_MATCHES = [
  { crop: 'maize', region: 'Ashanti', price: 2.4, target: 2.65, score: 94 },
  { crop: 'cocoa', region: 'Western North', price: 42.5, target: 45, score: 91 },
  { crop: 'cashew', region: 'Bono East', price: 9.8, target: 10.5, score: 88 },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <>
      <section className="hero">
        <div className="container inner">
          <div>
            <span className="hero-eyebrow">🇬🇭 Ghana agri-trade network</span>
            <h1 className="mt-2">From farm gate to export contract.</h1>
            <p className="lead">
              AgriConnect connects farmers directly to processing companies and export agencies.
              Publish your harvest, post what you need to buy, and let transparent matching close
              the gap — no middlemen guessing at prices.
            </p>
            <div className="cta-row">
              {user ? (
                <Link to="/dashboard" className="btn lg">Go to your dashboard</Link>
              ) : (
                <>
                  <Link to="/register" className="btn lg">Create a free account</Link>
                  <Link to="/marketplace" className="btn lg outline-light">Browse the marketplace</Link>
                </>
              )}
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <strong>16</strong>
                <span>regions covered</span>
              </div>
              <div className="hero-stat">
                <strong>GHS</strong>
                <span>priced per kg</span>
              </div>
              <div className="hero-stat">
                <strong>4</strong>
                <span>deal stages tracked</span>
              </div>
            </div>
          </div>

          <aside className="hero-panel" aria-label="Example matches">
            <div className="hero-panel-title">Live match preview</div>
            {SHOWCASE_MATCHES.map((m) => (
              <div className="match-row" key={m.crop}>
                <span aria-hidden="true">🌿</span>
                <span>
                  <strong style={{ display: 'block', fontSize: '0.88rem' }}>{cropLabel(m.crop)}</strong>
                  <span className="tiny muted">
                    {m.region} · {money(m.price)}/kg → buyer target {money(m.target)}
                  </span>
                </span>
                <span className="match-score">{m.score}%</span>
              </div>
            ))}
            <p className="tiny" style={{ color: '#a7f3d0', marginTop: '0.6rem' }}>
              Scores are computed live from crop, grade, quantity, region and price headroom.
            </p>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">How it works</span>
            <h2 className="mt-1">Four steps from harvest to contract</h2>
            <p>
              AgriConnect replaces the phone-call grapevine with a shared record of supply, demand
              and agreed volumes.
            </p>
          </div>
          <div className="grid four">
            {STEPS.map((step, index) => (
              <article className="card step" key={step.title}>
                <div className="step-num">{index + 1}</div>
                <h3>{step.title}</h3>
                <p className="small muted mt-1">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: '#fff', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Why AgriConnect</span>
            <h2 className="mt-1">Built around the realities of Ghanaian agribusiness</h2>
          </div>
          <div className="grid two">
            {FEATURES.map((feature) => (
              <article className="card" key={feature.title}>
                <div className="feature-icon" aria-hidden="true">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p className="small muted mt-1">{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid two" style={{ alignItems: 'center', gap: '2.5rem' }}>
            <div>
              <span className="eyebrow">For farmers</span>
              <h2 className="mt-1">Sell at a price you can defend</h2>
              <p className="muted mt-2">
                List cocoa from Sefwi Wiawso, cashew from Techiman or maize from Ejisu with a
                farm-gate price you set. See which processors are buying, at what target price, and
                respond with a single click.
              </p>
              <ul className="small muted mt-2" style={{ paddingLeft: '1.1rem', lineHeight: 2 }}>
                <li>Track active, reserved and sold stock in one place</li>
                <li>Get ranked matches against live buyer demand</li>
                <li>Accept or decline offers with a clear audit trail</li>
              </ul>
            </div>
            <div className="card">
              <div className="between">
                <div>
                  <h3>Example lot</h3>
                  <p className="small muted">Yellow maize · Grade A · Ejisu, Ashanti</p>
                </div>
                <span className="badge green">Active</span>
              </div>
              <div className="grid two mt-2" style={{ gap: '0.75rem' }}>
                <div><span className="stat-label">Volume</span><div className="stat-value" style={{ fontSize: '1.2rem' }}>{kg(25000, { tonnes: true })}</div></div>
                <div><span className="stat-label">Farm-gate</span><div className="stat-value" style={{ fontSize: '1.2rem' }}>{money(2.4)}</div></div>
              </div>
              <div className="inquiry-quote mt-2">
                Golden Harvest Feed Mills wants 40 t at up to {money(2.65)}/kg — a 94% match.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>Ready to trade directly?</h2>
              <p className="small mt-1" style={{ color: '#bbf7d0', maxWidth: '52ch' }}>
                Create a farmer, processor or exporter account in under a minute. The demo dataset
                is already loaded with real market-shaped listings and demand.
              </p>
            </div>
            <div className="row wrap">
              <Link to="/register" className="btn lg" style={{ background: '#facc15', color: '#14532d' }}>
                Create your account
              </Link>
              <Link to="/marketplace" className="btn lg outline-light">Explore supply</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
