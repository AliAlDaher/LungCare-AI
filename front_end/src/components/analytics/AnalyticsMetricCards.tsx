import React from 'react';
import { Users, Calendar, Clock, Ruler, ChevronDown } from 'lucide-react';
import type { PatientRow } from '../../services/patients';


const PALETTE = {
  teal: '#00c9b1',
  blue: '#4f8ef7',
  mint: '#6ee7b7',
  amber: '#ffb347',
  coral: '#ff6b6b',
  violet: '#a78bfa',
};

export interface AnalyticsMetricCardsProps {
  stats: {
    n: number;
    avgAge: string;
    avgSurv: string;
    avgTumor: string;
  };
  data: PatientRow[];
  totalCount: number;
  expandedMetric: 'none' | 'patients' | 'age' | 'survival' | 'tumor';
  setExpandedMetric: (metric: 'none' | 'patients' | 'age' | 'survival' | 'tumor') => void;
  aggregates?: any;
}

export const AnalyticsMetricCards: React.FC<AnalyticsMetricCardsProps> = ({
  stats,
  data,
  totalCount,
  expandedMetric,
  setExpandedMetric,
  aggregates,
}) => {
  const handleToggleMetric = (metric: 'patients' | 'age' | 'survival' | 'tumor') => {
    setExpandedMetric(expandedMetric === metric ? 'none' : metric);
  };

  return (
    <>
      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
        {/* KPI 1: Patients */}
        <div
          onClick={() => handleToggleMetric('patients')}
          className={`card kpi-card ${expandedMetric === 'patients' ? 'kpi-active' : ''}`}
          style={{
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            background: expandedMetric === 'patients' ? 'rgba(0, 201, 177, 0.08)' : 'var(--bg-card)',
            boxShadow: expandedMetric === 'patients' ? '0 0 25px -5px rgba(0, 201, 177, 0.2), inset 0 0 0 1.5px var(--teal)' : 'none',
            transform: expandedMetric === 'patients' ? 'translateY(-2px)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} style={{ color: PALETTE.teal }} />
              <span className="kpi-label" style={{ marginTop: 0 }}>Total Patients</span>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: expandedMetric === 'patients' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>
          <p className="kpi-value" style={{ color: PALETTE.teal }}>{stats.n.toLocaleString()}</p>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>Total Patients</p>
        </div>

        {/* KPI 2: Age */}
        <div
          onClick={() => handleToggleMetric('age')}
          className={`card kpi-card ${expandedMetric === 'age' ? 'kpi-active' : ''}`}
          style={{
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            background: expandedMetric === 'age' ? 'rgba(79, 142, 247, 0.08)' : 'var(--bg-card)',
            boxShadow: expandedMetric === 'age' ? '0 0 25px -5px rgba(79, 142, 247, 0.2), inset 0 0 0 1.5px var(--blue)' : 'none',
            transform: expandedMetric === 'age' ? 'translateY(-2px)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={16} style={{ color: PALETTE.blue }} />
              <span className="kpi-label" style={{ marginTop: 0 }}>Average Age</span>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: expandedMetric === 'age' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>
          <p className="kpi-value" style={{ color: PALETTE.blue }}>{stats.avgAge} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>yr</span></p>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>Average Age</p>
        </div>

        {/* KPI 3: Survival */}
        <div
          onClick={() => handleToggleMetric('survival')}
          className={`card kpi-card ${expandedMetric === 'survival' ? 'kpi-active' : ''}`}
          style={{
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            background: expandedMetric === 'survival' ? 'rgba(255, 179, 71, 0.08)' : 'var(--bg-card)',
            boxShadow: expandedMetric === 'survival' ? '0 0 25px -5px rgba(255, 179, 71, 0.2), inset 0 0 0 1.5px var(--amber)' : 'none',
            transform: expandedMetric === 'survival' ? 'translateY(-2px)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} style={{ color: PALETTE.amber }} />
              <span className="kpi-label" style={{ marginTop: 0 }}>Avg Survival</span>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: expandedMetric === 'survival' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>
          <p className="kpi-value" style={{ color: PALETTE.amber }}>{stats.avgSurv} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>mo</span></p>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>Avg. Survival</p>
        </div>

        {/* KPI 4: Tumor Size */}
        <div
          onClick={() => handleToggleMetric('tumor')}
          className={`card kpi-card ${expandedMetric === 'tumor' ? 'kpi-active' : ''}`}
          style={{
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            background: expandedMetric === 'tumor' ? 'rgba(167, 139, 250, 0.08)' : 'var(--bg-card)',
            boxShadow: expandedMetric === 'tumor' ? '0 0 25px -5px rgba(167, 139, 250, 0.2), inset 0 0 0 1.5px var(--violet)' : 'none',
            transform: expandedMetric === 'tumor' ? 'translateY(-2px)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ruler size={16} style={{ color: PALETTE.violet }} />
              <span className="kpi-label" style={{ marginTop: 0 }}>Avg Tumor Size</span>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: expandedMetric === 'tumor' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>
          <p className="kpi-value" style={{ color: PALETTE.violet }}>{stats.avgTumor} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>mm</span></p>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>Avg. Tumor Size</p>
        </div>
      </div>

      {/* Metric detail drawers */}
      {expandedMetric !== 'none' && (
        <div className="card animate-fadeIn" style={{
          background: 'rgba(10, 18, 36, 0.8)',
          border: '1px dashed rgba(255,255,255,0.08)',
          padding: '1.25rem',
          borderRadius: '12px',
          marginBottom: 20
        }}>
          {expandedMetric === 'patients' && (
            <div>
              <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: PALETTE.teal, marginBottom: 8 }}>Patient Breakdown</h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Percentage of Total</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>
                    {((stats.n / totalCount) * 100).toFixed(1)}% <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>of database</span>
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Stage I - II Distribution</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: PALETTE.mint, marginTop: 4 }}>
                    {(aggregates && aggregates.stage_dist
                      ? (aggregates.stage_dist['I'] || 0) + (aggregates.stage_dist['II'] || 0)
                      : data.filter(p => p.stage === 'I' || p.stage === 'II').length).toLocaleString()} cases
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Stage III - IV Distribution</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: PALETTE.coral, marginTop: 4 }}>
                    {(aggregates && aggregates.stage_dist
                      ? (aggregates.stage_dist['III'] || 0) + (aggregates.stage_dist['IV'] || 0)
                      : data.filter(p => p.stage === 'III' || p.stage === 'IV').length).toLocaleString()} cases
                  </p>
                </div>
              </div>
            </div>
          )}
          {expandedMetric === 'age' && (
            <div>
              <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: PALETTE.blue, marginBottom: 8 }}>Age Distribution</h5>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                The average age is {stats.avgAge} years old. Lung cancer diagnosis typically peaks in patients aged between 60 to 75. 
                Early screening via Low-Dose CT (LDCT) is clinically indicated starting at age 50 for individuals with significant smoking histories.
              </p>
            </div>
          )}
          {expandedMetric === 'survival' && (
            <div>
              <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: PALETTE.amber, marginBottom: 8 }}>Survival Insights</h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>High Survival Timeline (&gt; 36 mo)</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: PALETTE.mint, marginTop: 4 }}>
                    {(aggregates && aggregates.survival_dist
                      ? aggregates.survival_dist.high
                      : data.filter(p => p.survivalMonths >= 36).length).toLocaleString()} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>patients</span>
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Moderate Survival Timeline (12-36 mo)</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: PALETTE.amber, marginTop: 4 }}>
                    {(aggregates && aggregates.survival_dist
                      ? aggregates.survival_dist.moderate
                      : data.filter(p => p.survivalMonths >= 12 && p.survivalMonths < 36).length).toLocaleString()} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>patients</span>
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Short Survival (&lt; 12 mo)</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: PALETTE.coral, marginTop: 4 }}>
                    {(aggregates && aggregates.survival_dist
                      ? aggregates.survival_dist.short
                      : data.filter(p => p.survivalMonths < 12).length).toLocaleString()} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>patients</span>
                  </p>
                </div>
              </div>
            </div>
          )}
          {expandedMetric === 'tumor' && (
            <div>
              <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: PALETTE.violet, marginBottom: 8 }}>Tumor Size by Stage</h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div style={{ background: 'rgba(255,255,255,0.01)', padding: '8px 12px', borderRadius: '6px' }}>
                  <p style={{ fontSize: '0.68rem', color: PALETTE.mint, fontWeight: 700 }}>T1 Classification (&lt; 30mm)</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: 4 }}>{(aggregates && aggregates.tumor_dist ? aggregates.tumor_dist.t1 : data.filter(p => p.tumorSize < 30).length).toLocaleString()} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>cases</span></p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.01)', padding: '8px 12px', borderRadius: '6px' }}>
                  <p style={{ fontSize: '0.68rem', color: PALETTE.blue, fontWeight: 700 }}>T2 Classification (30 - 50mm)</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: 4 }}>{(aggregates && aggregates.tumor_dist ? aggregates.tumor_dist.t2 : data.filter(p => p.tumorSize >= 30 && p.tumorSize < 50).length).toLocaleString()} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>cases</span></p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.01)', padding: '8px 12px', borderRadius: '6px' }}>
                  <p style={{ fontSize: '0.68rem', color: PALETTE.amber, fontWeight: 700 }}>T3 Classification (50 - 70mm)</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: 4 }}>{(aggregates && aggregates.tumor_dist ? aggregates.tumor_dist.t3 : data.filter(p => p.tumorSize >= 50 && p.tumorSize < 70).length).toLocaleString()} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>cases</span></p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.01)', padding: '8px 12px', borderRadius: '6px' }}>
                  <p style={{ fontSize: '0.68rem', color: PALETTE.coral, fontWeight: 700 }}>T4 Classification (&gt; 70mm)</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: 4 }}>{(aggregates && aggregates.tumor_dist ? aggregates.tumor_dist.t4 : data.filter(p => p.tumorSize >= 70).length).toLocaleString()} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>cases</span></p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
