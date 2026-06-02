import React from 'react';
import { Activity, Clock, FileText, ArrowRight, RefreshCw, ChevronRight } from 'lucide-react';
import type { Patient, PredictionRecord } from '../../services/patients';

export interface TimelinePanelProps {
  selectedPatient: Patient;
  history: PredictionRecord[];
  historyLoading: boolean;
  onRunPrediction: (patient: Patient) => void;
  onReviewReport: (record: PredictionRecord) => void;
}

export const TimelinePanel: React.FC<TimelinePanelProps> = ({
  selectedPatient,
  history,
  historyLoading,
  onRunPrediction,
  onReviewReport,
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
    <div className="card" style={{ padding: '2rem' }}>
      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Activity size={16} color="var(--teal)" /> Prediction History
      </h3>

      {historyLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12, display: 'inline-block' }} />
          <p style={{ fontSize: '0.8rem' }}>Loading prediction history...</p>
        </div>
      ) : history.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '4rem 2rem', 
          borderRadius: 12,
          background: 'rgba(255,255,255,0.01)',
          border: '1px dashed rgba(255,255,255,0.05)'
        }}>
          <FileText size={32} style={{ opacity: 0.1, marginBottom: 12, display: 'inline-block' }} />
          <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 700, marginBottom: 4 }}>No Diagnostic History Yet</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', maxWidth: 350, margin: '0 auto 16px' }}>
            This patient is newly registered. Click the button above to run the machine learning diagnosis models and output predictions.
          </p>
          <button 
            onClick={() => onRunPrediction(selectedPatient)}
            style={{
              background: 'rgba(0, 201, 177, 0.1)',
              border: '1px solid rgba(0, 201, 177, 0.2)',
              color: 'var(--teal)',
              padding: '6px 16px',
              borderRadius: 8,
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            Run First Test <ArrowRight size={12} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {/* Vertical Timeline axis line */}
          <div style={{
            position: 'absolute', left: 16, top: 8, bottom: 8,
            width: 2, background: 'rgba(255,255,255,0.05)'
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {history.map((record, index) => {
              const styleMeta = getStageStyle(record.predicted_stage);
              return (
                <div 
                  key={index}
                  style={{ 
                    display: 'flex', 
                    gap: 20, 
                    position: 'relative',
                    animation: 'fadeInUp 0.3s ease forwards',
                    animationDelay: `${index * 0.05}s`
                  }}
                >
                  {/* Timeline node */}
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'var(--bg-primary)',
                    border: `2.5px solid ${styleMeta.color}`,
                    display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center',
                    color: styleMeta.color,
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    zIndex: 2,
                    flexShrink: 0
                  }}>
                    {record.predicted_stage.replace('Stage ', '')}
                  </div>

                  {/* Timeline Card */}
                  <div 
                    className="card-hover-highlight"
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.015)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: 12,
                      padding: '1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 700, 
                          color: styleMeta.color,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: styleMeta.bg,
                          border: `1px solid ${styleMeta.border}`,
                          letterSpacing: 0.3
                        }}>
                          Cancer Stage {record.predicted_stage.replace('Stage ', '')}
                        </span>

                        <span style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <Clock size={11} /> {formatDate(record.prediction_date)} {formatTime(record.prediction_date)}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Expected Survival Outlook: <strong style={{ color: '#fff' }}>{record.predicted_survival_months} Months</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => onReviewReport(record)}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        color: 'var(--text-secondary)',
                        padding: '8px 16px',
                        borderRadius: 8,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      Review Diagnostic Report <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
