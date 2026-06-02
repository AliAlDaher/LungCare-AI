import React, { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import {
  Activity, TrendingUp, Lightbulb, FileDown, Printer, Copy, ClipboardList, ArrowLeft
} from 'lucide-react';

// Types
interface Prediction {
  predicted_stage: string;
  stage_probabilities: Record<string, number>;
  predicted_survival_months: number;
  feature_importances: { name: string; val: number }[];
  model_version: string;
}

const stageColors: Record<string, string> = {
  I: 'var(--mint)', II: 'var(--blue)', III: 'var(--amber)', IV: 'var(--coral)',
};

function riskBadge(months: number) {
  if (months >= 40) return { label: 'Favorable', cls: 'badge-mint' };
  if (months >= 20) return { label: 'Intermediate', cls: 'badge-amber' };
  return { label: 'Guarded', cls: 'badge-coral' };
}

const keyLabels: Record<string, string> = {
  age: 'Age', gender: 'Gender', ethnicity: 'Ethnicity', insurance: 'Insurance',
  smokingHistory: 'Smoking', packYears: 'Pack-Years', familyHistory: 'Family Hx',
  tumorSize: 'Tumor Size', location: 'Location', ecog: 'ECOG', treatment: 'Treatment',
};

// Main component
const Results: React.FC = () => {
  const { state } = useLocation() as { state: { prediction: Prediction; formData: Record<string, unknown> } | null };
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';

  if (!state?.prediction) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: '6rem' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>No prediction data found.</p>
        <button className="btn-primary" onClick={() => navigate('/predict')}>Go to Prediction Form</button>
      </div>
    );
  }

  const { prediction, formData } = state;
  const risk = riskBadge(prediction.predicted_survival_months);
  const maxImportance = Math.max(...prediction.feature_importances.map(f => f.val));

  // Export helpers
  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(prediction, null, 2));
    alert('JSON copied to clipboard!');
  };

  const handlePrint = () => window.print();

  const handleExportHTML = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>LungCare AI Report</title>
<style>body{font-family:system-ui,sans-serif;max-width:800px;margin:2rem auto;color:#1e293b}
h1{color:#0f172a}table{width:100%;border-collapse:collapse;margin:1rem 0}
td,th{border:1px solid #e2e8f0;padding:8px 12px;text-align:left}
th{background:#f8fafc}.bar{height:20px;background:#0ea5e9;border-radius:4px}</style></head>
<body><h1>LungCare AI — Prediction Report</h1>
<p><strong>Model:</strong> ${prediction.model_version}</p>
<h2>Predicted Stage: ${prediction.predicted_stage}</h2>
<table><tr><th>Stage</th><th>Probability</th></tr>
${Object.entries(prediction.stage_probabilities).map(([s, p]) => `<tr><td>${s}</td><td>${p}%</td></tr>`).join('')}
</table>
<h2>Survival: ${prediction.predicted_survival_months} months (${risk.label})</h2>
<h2>Feature Importances</h2><table><tr><th>Feature</th><th>Importance</th></tr>
${prediction.feature_importances.map(f => `<tr><td>${f.name}</td><td>${f.val}</td></tr>`).join('')}
</table></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'lungcare_report.html'; a.click();
    URL.revokeObjectURL(url);
  };

  const summaryEntries = Object.entries(formData)
    .filter(([k, v]) => keyLabels[k] && v !== '' && v !== false)
    .map(([k, v]) => [keyLabels[k], String(v)]);

  const survivalPct = Math.min(100, (prediction.predicted_survival_months / 72) * 100);

  return (
    <div className="page" ref={printRef} style={{ maxWidth: 1000 }}>
      <button className="btn-secondary" onClick={() => navigate('/predict')} style={{ marginBottom: 24 }}>
        <ArrowLeft size={16}/> New Prediction
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Panel 1: Input Summary */}
        <div className="card" style={{ animation: 'fadeInUp 0.4s ease forwards' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <ClipboardList size={18} style={{ color: 'var(--text-muted)' }} />
            <span className="section-title" style={{ margin: 0 }}>Patient Input Summary</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {summaryEntries.map(([label, val]) => (
              <div key={label} style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 8,
                padding: '8px 12px',
              }}>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</p>
                <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2 + 3: Stage & Survival side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>

          {/* Predicted Stage */}
          <div className="card" style={{ animation: 'fadeInUp 0.5s ease forwards' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Activity size={18} style={{ color: 'var(--text-muted)' }} />
              <span className="section-title" style={{ margin: 0 }}>Predicted Stage</span>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80, height: 80,
                borderRadius: 20,
                background: `${stageColors[prediction.predicted_stage] || 'var(--teal)'}18`,
                border: `2px solid ${stageColors[prediction.predicted_stage] || 'var(--teal)'}40`,
                fontSize: '2rem',
                fontWeight: 900,
                color: stageColors[prediction.predicted_stage] || 'var(--teal)',
              }}>
                {prediction.predicted_stage}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(prediction.stage_probabilities).map(([stage, prob]) => (
                <div key={stage}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: stage === prediction.predicted_stage ? stageColors[stage] : 'var(--text-secondary)' }}>
                      Stage {stage}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: stage === prediction.predicted_stage ? stageColors[stage] : 'var(--text-muted)' }}>
                      {prob}%
                    </span>
                  </div>
                  <div style={{
                    width: '100%', height: 8, borderRadius: 4,
                    background: 'rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${prob}%`,
                      height: '100%',
                      borderRadius: 4,
                      background: stageColors[stage] || 'var(--teal)',
                      opacity: stage === prediction.predicted_stage ? 1 : 0.4,
                      transition: 'width 1s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Predicted Survival */}
          {isDoctor ? (
            <div className="card" style={{ animation: 'fadeInUp 0.55s ease forwards' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <TrendingUp size={18} style={{ color: 'var(--text-muted)' }} />
                <span className="section-title" style={{ margin: 0 }}>Survival Estimate</span>
              </div>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: -2, color: 'var(--text-primary)' }}>
                  {prediction.predicted_survival_months}
                </span>
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', marginLeft: 6, fontWeight: 600 }}>months</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <span className={`badge ${risk.cls}`}>{risk.label} Prognosis</span>
              </div>
              {/* Gradient range marker */}
              <div style={{ position: 'relative', height: 28, borderRadius: 8, overflow: 'hidden', background: 'linear-gradient(90deg, var(--coral), var(--amber), var(--mint))' }}>
                <div style={{
                  position: 'absolute',
                  left: `${survivalPct}%`,
                  top: 0,
                  transform: 'translateX(-50%)',
                  width: 4,
                  height: '100%',
                  background: '#fff',
                  borderRadius: 2,
                  boxShadow: '0 0 10px rgba(255,255,255,0.8)',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--coral)', fontWeight: 600 }}>0 mo</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--mint)', fontWeight: 600 }}>72+ mo</span>
              </div>
            </div>
          ) : (
            <div className="card" style={{ 
              animation: 'fadeInUp 0.55s ease forwards', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              background: 'radial-gradient(circle at 50% 50%, rgba(79, 142, 247, 0.05) 0%, transparent 80%), var(--bg-card)',
              border: '1px solid rgba(79, 142, 247, 0.15)'
            }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(79, 142, 247, 0.1)',
                border: '1px solid rgba(79, 142, 247, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--blue)',
                marginBottom: 18,
                boxShadow: '0 0 20px -5px rgba(79, 142, 247, 0.3)'
              }}>
                <ClipboardList size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: -0.4 }}>
                Prediction Summary
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 320, marginBottom: 16 }}>
              Survival data is restricted to physician accounts. Please consult your doctor for detailed prognosis information.
              </p>
              <div style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--blue)',
                background: 'rgba(79, 142, 247, 0.08)',
                border: '1px solid rgba(79, 142, 247, 0.18)',
                padding: '6px 14px',
                borderRadius: '20px',
                textTransform: 'uppercase',
                letterSpacing: 0.5
              }}>
                Ask Your Doctor
              </div>
            </div>
          )}
        </div>

        {/* Panel 4: Explainability */}
        <div className="card" style={{ animation: 'fadeInUp 0.6s ease forwards' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Lightbulb size={18} style={{ color: 'var(--text-muted)' }} />
            <span className="section-title" style={{ margin: 0 }}>Key Factors</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {prediction.feature_importances.map((f, i) => {
              const pct = (f.val / maxImportance) * 100;
              const barColors = ['var(--teal)', 'var(--blue)', 'var(--violet)', 'var(--amber)', 'var(--mint)', 'var(--coral)', '#818cf8', '#38bdf8'];
              return (
                <div key={f.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{f.name}</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: barColors[i % barColors.length] }}>{f.val.toFixed(3)}</span>
                  </div>
                  <div style={{ width: '100%', height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      borderRadius: 5,
                      background: barColors[i % barColors.length],
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel 5: Export (Doctor only — UC7) */}
        {isDoctor ? (
          <div className="card" style={{ animation: 'fadeInUp 0.65s ease forwards' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <FileDown size={18} style={{ color: 'var(--text-muted)' }} />
              <span className="section-title" style={{ margin: 0 }}>Export Results</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <button className="btn-secondary" onClick={handleExportHTML}>
                <FileDown size={15}/> Export HTML
              </button>
              <button className="btn-secondary" onClick={handlePrint}>
                <Printer size={15}/> Print to PDF
              </button>
              <button className="btn-secondary" onClick={handleCopyJSON}>
                <Copy size={15}/> Copy JSON
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ animation: 'fadeInUp 0.65s ease forwards', opacity: 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileDown size={18} style={{ color: 'var(--text-muted)' }} />
              <span className="section-title" style={{ margin: 0 }}>Export Results</span>
              <span className="badge badge-amber" style={{ marginLeft: 8 }}>Doctor Only</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 8 }}>
              Report export is available for Doctor accounts. Contact your physician to obtain an exported report.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;
