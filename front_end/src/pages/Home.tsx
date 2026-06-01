import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers, Clock, Lightbulb, ShieldCheck, BarChart3, FileDown, ArrowRight
} from 'lucide-react';

const features = [
  {
    icon: <Layers size={22} />,
    title: 'Stage Prediction',
    desc: 'Classify lung cancer into Stage I–IV using trained ML models on 50k patient records.',
    color: 'var(--teal)',
  },
  {
    icon: <Clock size={22} />,
    title: 'Survival Estimation',
    desc: 'Estimate predicted survival time in months based on clinical and demographic inputs.',
    color: 'var(--blue)',
  },
  {
    icon: <Lightbulb size={22} />,
    title: 'Explainability',
    desc: 'Understand which features drove the prediction with ranked feature importance bars.',
    color: 'var(--amber)',
  },
  {
    icon: <ShieldCheck size={22} />,
    title: 'Input Validation',
    desc: 'Smart form validation ensures clinical values stay within realistic medical ranges.',
    color: 'var(--mint)',
  },
  {
    icon: <BarChart3 size={22} />,
    title: 'Probability Distribution',
    desc: 'View classification confidence across all four stages with probability bars.',
    color: 'var(--violet)',
  },
  {
    icon: <FileDown size={22} />,
    title: 'Report Export',
    desc: 'Export results as HTML reports, print to PDF, or copy structured JSON data.',
    color: 'var(--coral)',
  },
];

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      {/* Hero */}
      <section style={{
        textAlign: 'center',
        padding: '5rem 0 4rem',
        animation: 'fadeInUp 0.6s ease forwards',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 16px',
          borderRadius: 20,
          background: 'rgba(0,201,177,0.1)',
          border: '1px solid rgba(0,201,177,0.2)',
          marginBottom: 24,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--teal)', letterSpacing: 1, textTransform: 'uppercase' }}>
            Graduation Project — AI-Powered Clinical Tool
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
          fontWeight: 900,
          letterSpacing: -1.5,
          lineHeight: 1.1,
          marginBottom: 16,
          background: 'linear-gradient(135deg, #fff 40%, var(--teal))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Lung Cancer Stage<br/>Prediction System
        </h1>

        <p style={{
          fontSize: '1.05rem',
          color: 'var(--text-secondary)',
          maxWidth: 560,
          margin: '0 auto 2.5rem',
          lineHeight: 1.7,
        }}>
          A machine-learning clinical decision support tool trained on 50,000 synthetic patient records.
          Enter patient data — get instant stage classification, survival estimation, and explainability.
        </p>

        <button
          className="btn-primary"
          onClick={() => navigate('/predict')}
          style={{ fontSize: '1rem', padding: '16px 36px' }}
        >
          New Patient Prediction <ArrowRight size={18} />
        </button>
      </section>

      {/* Feature Cards */}
      <section style={{ paddingBottom: '4rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {features.map((f, i) => (
            <div
              key={f.title}
              className="card"
              style={{
                animation: `fadeInUp 0.5s ease ${i * 0.08}s forwards`,
                opacity: 0,
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: `${f.color}15`,
                border: `1px solid ${f.color}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: f.color,
                marginBottom: 16,
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 8, letterSpacing: -0.3 }}>
                {f.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
