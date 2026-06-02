import React from 'react';
import { Filter } from 'lucide-react';
import type { Stage } from '../../services/patients';


export interface AnalyticsFiltersProps {
  activeStage: Stage | 'All';
  setActiveStage: (stage: Stage | 'All') => void;
  activeGender: 'All' | 'Male' | 'Female';
  setActiveGender: (gender: 'All' | 'Male' | 'Female') => void;
  activeSmoking: 'All' | 'Never' | 'Former' | 'Current';
  setActiveSmoking: (smoking: 'All' | 'Never' | 'Former' | 'Current') => void;
  activeTreatment: string;
  setActiveTreatment: (treatment: string) => void;
  activeLocation: string;
  setActiveLocation: (location: string) => void;
}

export const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
  activeStage,
  setActiveStage,
  activeGender,
  setActiveGender,
  activeSmoking,
  setActiveSmoking,
  activeTreatment,
  setActiveTreatment,
  activeLocation,
  setActiveLocation,
}) => {
  return (
    <div className="card" style={{
      background: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.05)',
      padding: '1.25rem',
      borderRadius: '16px',
      marginBottom: 20,
      boxShadow: '0 8px 32px 0 rgba(0,0,0,0.25)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Filter size={15} style={{ color: 'var(--teal)' }} />
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1.2 }}>
          Filters
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 12
      }}>
        {/* Filter 1: Stage */}
        <div className="form-group">
          <label className="form-label" style={{ fontSize: '0.68rem' }}>Stage Classification</label>
          <select
            className="form-select"
            style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', fontSize: '0.82rem', borderRadius: '8px' }}
            value={activeStage}
            onChange={e => { setActiveStage(e.target.value as Stage | 'All'); }}
          >
            <option value="All">All Stages (I - IV)</option>
            <option value="I">Stage I Only</option>
            <option value="II">Stage II Only</option>
            <option value="III">Stage III Only</option>
            <option value="IV">Stage IV Only</option>
          </select>
        </div>

        {/* Filter 2: Gender */}
        <div className="form-group">
          <label className="form-label" style={{ fontSize: '0.68rem' }}>Patient Gender</label>
          <select
            className="form-select"
            style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', fontSize: '0.82rem', borderRadius: '8px' }}
            value={activeGender}
            onChange={e => { setActiveGender(e.target.value as 'All' | 'Male' | 'Female'); }}
          >
            <option value="All">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        {/* Filter 3: Smoking History */}
        <div className="form-group">
          <label className="form-label" style={{ fontSize: '0.68rem' }}>Smoking History</label>
          <select
            className="form-select"
            style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', fontSize: '0.82rem', borderRadius: '8px' }}
            value={activeSmoking}
            onChange={e => { setActiveSmoking(e.target.value as 'All' | 'Never' | 'Former' | 'Current'); }}
          >
            <option value="All">All Histories</option>
            <option value="Never">Never Smoked</option>
            <option value="Former">Former Smoker</option>
            <option value="Current">Current Smoker</option>
          </select>
        </div>

        {/* Filter 4: Treatment */}
        <div className="form-group">
          <label className="form-label" style={{ fontSize: '0.68rem' }}>Prescribed Treatment</label>
          <select
            className="form-select"
            style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', fontSize: '0.82rem', borderRadius: '8px' }}
            value={activeTreatment}
            onChange={e => { setActiveTreatment(e.target.value); }}
          >
            <option value="All">All Treatments</option>
            <option value="Surgery">Surgery Only</option>
            <option value="Chemotherapy">Chemotherapy Only</option>
            <option value="Radiation">Radiation Only</option>
            <option value="Targeted Therapy">Targeted Therapy Only</option>
            <option value="Immunotherapy">Immunotherapy Only</option>
            <option value="Combined">Combined Regimen Only</option>
          </select>
        </div>

        {/* Filter 5: Anatomical Location */}
        <div className="form-group">
          <label className="form-label" style={{ fontSize: '0.68rem' }}>Tumor Location</label>
          <select
            className="form-select"
            style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', fontSize: '0.82rem', borderRadius: '8px' }}
            value={activeLocation}
            onChange={e => { setActiveLocation(e.target.value); }}
          >
            <option value="All">All Locations</option>
            <option value="Upper Lobe">Upper Lobe</option>
            <option value="Middle Lobe">Middle Lobe</option>
            <option value="Lower Lobe">Lower Lobe</option>
            <option value="Main Bronchus">Main Bronchus</option>
          </select>
        </div>
      </div>
    </div>
  );
};
