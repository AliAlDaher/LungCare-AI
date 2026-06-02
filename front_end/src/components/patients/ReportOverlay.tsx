import React from 'react';
import { X, BarChart2 } from 'lucide-react';
import type { PredictionRecord } from '../../services/patients';

export interface ReportOverlayProps {
  record: PredictionRecord;
  onClose: () => void;
  isDoctor: boolean;
}

export const ReportOverlay: React.FC<ReportOverlayProps> = ({
  record,
  onClose,
  isDoctor,
}) => {
  // Format helpers
  const formatDate = (isoString: string) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  // Get stage badge styling
  const getStageStyle = (stage: string) => {
    const s = stage?.toUpperCase() || '';
    if (s.includes('I') && !s.includes('V') && !s.includes('I')) { // Stage I
      return { bg: 'rgba(0, 201, 177, 0.1)', border: 'rgba(0, 201, 177, 0.25)', color: 'var(--teal)' };
    } else if (s === 'STAGE II' || s === 'II') {
      return { bg: 'rgba(79, 142, 247, 0.1)', border: 'rgba(79, 142, 247, 0.25)', color: 'var(--blue)' };
    } else if (s === 'STAGE III' || s === 'III') {
      return { bg: 'rgba(247, 185, 85, 0.1)', border: 'rgba(247, 185, 85, 0.25)', color: '#f7b955' };
    } else { // Stage IV
      return { bg: 'rgba(255, 107, 107, 0.1)', border: 'rgba(255, 107, 107, 0.25)', color: 'var(--coral)' };
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.2s ease forwards'
    }}>
      <div className="card" style={{
        width: '90%', maxWidth: 780,
        maxHeight: '85vh',
        overflowY: 'auto',
        padding: '2rem',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 24px 64px -16px rgba(0,0,0,0.7)',
        position: 'relative',
        animation: 'scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
      }}>
        {/* Close */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute', right: 20, top: 20,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '50%', color: 'var(--text-muted)',
            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
            zIndex: 10
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
        >
          <X size={14} />
        </button>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          Historical Diagnostic Report
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '1.5rem', display: 'flex', gap: 10 }}>
          <span>ID: {record.patient_id}</span>
          <span>•</span>
          <span>Test Date: {formatDate(record.prediction_date)} {formatTime(record.prediction_date)}</span>
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Prediction Summary */}
          <div className="card" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--teal)', margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>Prediction Summary</h4>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 8 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Predicted Cancer Stage:</span>
              <strong style={{ fontSize: '0.85rem', color: getStageStyle(record.predicted_stage).color }}>{record.predicted_stage}</strong>
            </div>

            {isDoctor && (
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 8 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Predicted Survival months:</span>
                <strong style={{ fontSize: '0.85rem', color: '#fff' }}>{record.predicted_survival_months} Months</strong>
              </div>
            )}

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Stage Probabilities:</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {Object.entries(record.stage_probabilities || {}).map(([stage, prob]) => (
                  <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.74rem' }}>
                    <span style={{ width: 64, color: 'var(--text-secondary)' }}>{stage}:</span>
                    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: getStageStyle(stage).color, width: `${prob}%` }} />
                    </div>
                    <span style={{ width: 36, textAlign: 'right', fontWeight: 700, color: '#fff' }}>{prob}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Lab Parameters */}
          <div className="card" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.01)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--blue)', margin: 0, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Vitals & Blood Test Measurements</h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '8px 16px', 
              fontSize: '0.78rem',
              maxHeight: 180,
              overflowY: 'auto',
              paddingRight: 4
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Tumor Size:</span>
                <strong style={{ color: '#fff' }}>{record.input_data?.tumorSize || 'N/A'} mm</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Treatment:</span>
                <strong style={{ color: '#fff' }}>{record.input_data?.treatment || 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>ECOG Status:</span>
                <strong style={{ color: '#fff' }}>{record.input_data?.ecog || 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Systolic BP:</span>
                <strong style={{ color: '#fff' }}>{record.input_data?.systolicBP || 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Hemoglobin:</span>
                <strong style={{ color: '#fff' }}>{record.input_data?.hemoglobin || 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>WBC:</span>
                <strong style={{ color: '#fff' }}>{record.input_data?.wbc || 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Platelets:</span>
                <strong style={{ color: '#fff' }}>{record.input_data?.platelets || 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Albumin:</span>
                <strong style={{ color: '#fff' }}>{record.input_data?.albumin || 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>LDH Level:</span>
                <strong style={{ color: '#fff' }}>{record.input_data?.ldh || 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Glucose:</span>
                <strong style={{ color: '#fff' }}>{record.input_data?.glucose || 'N/A'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Personalized AI Feature Importance */}
        <div className="card" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.005)' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <BarChart2 size={14} color="var(--teal)" /> Key Factors Driving This Assessment
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(record.feature_importances || []).slice(0, 5).map((feat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.76rem' }}>
                <span style={{ width: 130, color: 'var(--text-secondary)', fontWeight: 600 }}>{feat.name}:</span>
                <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--teal), var(--blue))', width: `${feat.val * 100 * 3}%` }} />
                </div>
                <span style={{ width: 44, color: 'var(--text-muted)', textAlign: 'right', fontFamily: 'monospace' }}>
                  {+(feat.val).toFixed(3)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
