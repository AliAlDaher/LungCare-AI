import React, { useState, useMemo } from 'react';
import { Stethoscope, Search } from 'lucide-react';
import type { PatientRow } from '../../services/patients';


export interface PatientSandboxProps {
  data: PatientRow[];
  activeStage: string;
}

export const PatientSandbox: React.FC<PatientSandboxProps> = ({
  data,
  activeStage,
}) => {
  const [patSearchText, setPatSearchText] = useState('');

  // Generate search data for patient table
  const samplePatientDetails = useMemo(() => {
    return data.slice(0, 5).map((p, idx) => {
      const idSeed = (idx + 1) * 37 + (activeStage.charCodeAt(0) || 65) + data.length;
      const patId = `LC-${20000 + (idSeed % 80000)}`;
      return {
        patId,
        name: `Patient ${patId}`,
        age: p.age,
        gender: p.gender,
        smoking: p.smoking,
        treatment: p.treatment,
        location: p.location,
        stage: p.stage,
        survival: p.survivalMonths,
        tumor: p.tumorSize,
        comorbidities: p.comorbidities
      };
    });
  }, [data, activeStage]);

  const filteredSamplePatients = useMemo(() => {
    if (!patSearchText.trim()) return samplePatientDetails;
    const q = patSearchText.toLowerCase();
    return samplePatientDetails.filter(p =>
      p.patId.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.treatment.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      p.smoking.toLowerCase().includes(q)
    );
  }, [samplePatientDetails, patSearchText]);

  return (
    <div className="card animate-fadeInUp" style={{
      background: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.05)',
      padding: '1.5rem',
      borderRadius: '16px',
      marginBottom: 20
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(0, 201, 177, 0.1)',
            color: 'var(--teal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Stethoscope size={16} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>Patient Records</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>First 5 records in the current filtered cohort</p>
          </div>
        </div>

        {/* Registry search input */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search registry (e.g. Surgery, Never)..."
            value={patSearchText}
            onChange={e => setPatSearchText(e.target.value)}
            style={{
              paddingLeft: 34,
              paddingRight: 12,
              paddingTop: 8,
              paddingBottom: 8,
              fontSize: '0.8rem',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.03)',
              borderColor: 'rgba(255,255,255,0.06)'
            }}
          />
        </div>
      </div>

      {/* Patient card grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
        {filteredSamplePatients.length > 0 ? (
          filteredSamplePatients.map((pat) => (
            <div key={pat.patId} style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              borderRadius: '12px',
              padding: '12px 14px',
              position: 'relative',
              transition: 'all 0.2s',
            }}
            className="patient-hover"
            >
              {/* Top patient details */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 0.5 }}>{pat.patId}</span>
                <span style={{
                  display: 'inline-flex',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  background: pat.stage === 'I' ? 'rgba(110,231,183,0.1)' : pat.stage === 'II' ? 'rgba(79,142,247,0.1)' : pat.stage === 'III' ? 'rgba(255,179,71,0.1)' : 'rgba(255,107,107,0.1)',
                  color: pat.stage === 'I' ? 'var(--mint)' : pat.stage === 'II' ? 'var(--blue)' : pat.stage === 'III' ? 'var(--amber)' : 'var(--coral)',
                  border: `1px solid ${pat.stage === 'I' ? 'rgba(110,231,183,0.2)' : pat.stage === 'II' ? 'rgba(79,142,247,0.2)' : pat.stage === 'III' ? 'rgba(255,179,71,0.2)' : 'rgba(255,107,107,0.2)'}`
                }}>Stage {pat.stage}</span>
              </div>

              <h5 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{pat.name}</h5>

              {/* Attributes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Demographics:</span>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{pat.age} yr, {pat.gender}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Smoking:</span>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{pat.smoking}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Tumor Load:</span>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{pat.tumor} mm</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Primary Rx:</span>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{pat.treatment}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Survival Prediction:</span>
                  <span style={{ color: 'var(--teal)', fontWeight: 700 }}>{pat.survival} months</span>
                </div>
              </div>

              {/* Comorbidities list tags */}
              {pat.comorbidities.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                  {pat.comorbidities.slice(0, 2).map((c) => (
                    <span key={c} style={{ fontSize: '0.58rem', fontWeight: 600, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.04)', padding: '1px 5px', borderRadius: '3px' }}>
                      {c}
                    </span>
                  ))}
                  {pat.comorbidities.length > 2 && (
                    <span style={{ fontSize: '0.58rem', fontWeight: 600, color: 'var(--text-muted)' }}>+{pat.comorbidities.length - 2}</span>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            No patients match the current filters.
          </div>
        )}
      </div>
    </div>
  );
};
