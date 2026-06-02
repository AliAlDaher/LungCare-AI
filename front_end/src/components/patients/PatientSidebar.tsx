import React, { useMemo } from 'react';
import { Search, User, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import type { Patient } from '../../services/patients';

export interface PatientSidebarProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
  loading: boolean;
  error: string;
  onRetry: () => void;
  search: string;
  onSearchChange: (search: string) => void;
  genderFilter: string;
  onGenderFilterChange: (gender: string) => void;
}

export const PatientSidebar: React.FC<PatientSidebarProps> = ({
  patients,
  selectedPatient,
  onSelectPatient,
  loading,
  error,
  onRetry,
  search,
  onSearchChange,
  genderFilter,
  onGenderFilterChange,
}) => {
  // Format timestamp helper
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

  // Filter patients locally
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                            p.patient_id.toLowerCase().includes(search.toLowerCase());
      
      const matchesGender = genderFilter === 'All' || 
                            p.gender.toLowerCase() === genderFilter.toLowerCase();
      
      return matchesSearch && matchesGender;
    });
  }, [patients, search, genderFilter]);

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Controls Card */}
      <div className="card" style={{ padding: '1.25rem' }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search patient or ID..." 
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            style={{ paddingLeft: 34, fontSize: '0.82rem' }}
          />
        </div>
        
        {/* Gender Filters */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['All', 'Male', 'Female'].map(g => (
            <button
              key={g}
              onClick={() => onGenderFilterChange(g)}
              style={{
                flex: 1,
                background: genderFilter === g ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${genderFilter === g ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)'}`,
                color: genderFilter === g ? '#fff' : 'var(--text-muted)',
                borderRadius: 6,
                padding: '6px 0',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Roster list */}
      <div style={{ 
        maxHeight: 'calc(100vh - 320px)', 
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        paddingRight: 4
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <RefreshCw size={20} className="animate-spin" style={{ animation: 'spin 1.5s linear infinite', marginBottom: 10, display: 'inline-block' }} />
            <p style={{ fontSize: '0.8rem' }}>Loading clinical registry...</p>
          </div>
        ) : error ? (
          <div style={{ 
            background: 'rgba(255,107,107,0.04)', 
            border: '1px solid rgba(255,107,107,0.15)',
            borderRadius: 10,
            padding: '1.25rem',
            textAlign: 'center',
            color: 'var(--coral)'
          }}>
            <AlertCircle size={24} style={{ marginBottom: 8, display: 'inline-block' }} />
            <p style={{ fontSize: '0.8rem', fontWeight: 600 }}>{error}</p>
            <button 
              onClick={onRetry}
              style={{ 
                marginTop: 10, 
                background: 'rgba(255,107,107,0.1)', 
                border: '1px solid rgba(255,107,107,0.2)',
                color: 'var(--coral)',
                borderRadius: 6,
                padding: '4px 12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Retry Connection
            </button>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <User size={28} style={{ opacity: 0.2, marginBottom: 8, display: 'inline-block' }} />
            <p style={{ fontSize: '0.8rem' }}>No patients found.</p>
          </div>
        ) : (
          filteredPatients.map(p => {
            const isSelected = selectedPatient?.patient_id === p.patient_id;
            return (
              <div
                key={p.patient_id}
                onClick={() => onSelectPatient(p)}
                className="card"
                style={{
                  padding: '1rem',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(0, 201, 177, 0.04)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isSelected ? 'rgba(0, 201, 177, 0.3)' : 'rgba(255,255,255,0.06)'}`,
                  transform: isSelected ? 'translateX(4px)' : 'none',
                  boxShadow: isSelected ? '0 4px 20px -4px rgba(0,201,177,0.15)' : 'none',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 700, 
                    color: isSelected ? '#fff' : 'var(--text-primary)'
                  }}>
                    {p.name}
                  </span>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--text-muted)',
                    letterSpacing: 0.5
                  }}>
                    {p.patient_id}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  <span>{p.gender} • {p.age} yrs</span>
                  <span style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={11} /> {formatDate(p.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
