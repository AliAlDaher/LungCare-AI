import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { RefreshCw, Activity, AlertCircle } from 'lucide-react';
import type { Stage, PatientRow } from '../services/patients';
import { fetchAnalytics } from '../services/patients';

// Import extracted sub-components
import { AnalyticsFilters } from '../components/analytics/AnalyticsFilters';
import { AnalyticsMetricCards } from '../components/analytics/AnalyticsMetricCards';
import { AnalyticsCharts } from '../components/analytics/AnalyticsCharts';
import { PatientSandbox } from '../components/analytics/PatientSandbox';

const TOTAL_COUNT = 50000;

const AnalyticsDashboard: React.FC = () => {
  // Filter state
  const [activeStage, setActiveStage] = useState<Stage | 'All'>('All');
  const [activeGender, setActiveGender] = useState<'All' | 'Male' | 'Female'>('All');
  const [activeSmoking, setActiveSmoking] = useState<'All' | 'Never' | 'Former' | 'Current'>('All');
  const [activeTreatment, setActiveTreatment] = useState<string>('All');
  const [activeLocation, setActiveLocation] = useState<string>('All');

  // API data state
  const [apiData, setApiData] = useState<PatientRow[] | null>(null);
  const [totalMatching, setTotalMatching] = useState<number>(TOTAL_COUNT);
  const [aggregates, setAggregates] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [expandedMetric, setExpandedMetric] = useState<'none' | 'patients' | 'age' | 'survival' | 'tumor'>('none');
  const [tooltipInfo, setTooltipInfo] = useState<{ title: string; details: string[] } | null>(null);
  const [rotating, setRotating] = useState(false);

  // Fetch analytics data from backend
  useEffect(() => {
    let active = true;
    const loadRealAnalytics = async () => {
      setApiLoading(true);
      setError(null);
      try {
        const res = await fetchAnalytics({
          stage: activeStage,
          gender: activeGender,
          smoking: activeSmoking,
          treatment: activeTreatment,
          location: activeLocation,
        });
        if (active) {
          setApiData(res.patients);
          setTotalMatching(res.total_matching);
          setAggregates(res.aggregates || null);
        }
      } catch (err) {
        console.error("Failed to fetch backend analytics:", err);
        if (active) {
          setApiData([]);
          setError("Failed to load analytics data from the backend server. Please verify the Flask service is running on http://127.0.0.1:5174.");
        }
      } finally {
        if (active) {
          setApiLoading(false);
        }
      }
    };

    loadRealAnalytics();
    return () => {
      active = false;
    };
  }, [activeStage, activeGender, activeSmoking, activeTreatment, activeLocation]);

  // Reset all filters
  const handleResetFilters = () => {
    setRotating(true);
    setActiveStage('All');
    setActiveGender('All');
    setActiveSmoking('All');
    setActiveTreatment('All');
    setActiveLocation('All');
    setExpandedMetric('none');
    setTooltipInfo(null);
    setTimeout(() => setRotating(false), 600);
  };

  // Working dataset from API
  const data = useMemo(() => {
    return apiData || [];
  }, [apiData]);

  // Compute aggregate stats
  const stats = useMemo(() => {
    const sampleN = data.length;
    const n = apiData !== null ? totalMatching : sampleN;
    if (sampleN === 0) return { n: 0, avgAge: '0.0', avgSurv: '0.0', avgTumor: '0.0' };
    const avgAge = aggregates ? aggregates.avg_age.toFixed(1) : (data.reduce((s, p) => s + p.age, 0) / sampleN).toFixed(1);
    const avgSurv = aggregates ? aggregates.avg_survival.toFixed(1) : (data.reduce((s, p) => s + p.survivalMonths, 0) / sampleN).toFixed(1);
    const avgTumor = aggregates ? aggregates.avg_tumor_size.toFixed(1) : (data.reduce((s, p) => s + p.tumorSize, 0) / sampleN).toFixed(1);
    return { n, avgAge, avgSurv, avgTumor };
  }, [data, apiData, totalMatching, aggregates]);

  // Generate insight text based on current filters
  const aiInsight = useMemo(() => {
    if (data.length === 0) {
      return {
        title: "No Data Available",
        text: "No patient records match the current filter criteria.",
        alert: "rgba(239, 68, 68, 0.15)",
        border: "rgba(239, 68, 68, 0.3)",
        color: "var(--coral)",
        suggestion: "Try resetting or adjusting the filters to see results."
      };
    }

    const surv = parseFloat(stats.avgSurv);
    const tumor = parseFloat(stats.avgTumor);
    
    let title = "Cohort Summary";
    let text = "Analytics are calculated from all matching patient records.";
    let alert = "rgba(79, 142, 247, 0.08)";
    let border = "rgba(79, 142, 247, 0.2)";
    let color = "var(--blue)";
    let suggestion = "Consider filtering by stage or treatment to explore specific subgroups.";

    if (activeStage === 'I') {
      title = "Stage I Cohort — Early Stage";
      text = `Early-stage cases with average tumor size ${tumor.toFixed(1)} mm. Average survival: ${surv.toFixed(1)} months. Surgery is the most common treatment approach.`;
      alert = "rgba(110, 231, 183, 0.08)";
      border = "rgba(110, 231, 183, 0.2)";
      color = "var(--mint)";
      suggestion = "Early-stage patients generally have the best outcomes, especially with surgical treatment.";
    } else if (activeStage === 'II') {
      title = "Stage II Cohort — Intermediate Stage";
      text = `Intermediate cases showing moderate progression. Average survival: ${surv.toFixed(1)} months. Treatment often combines surgery with chemotherapy.`;
      alert = "rgba(79, 142, 247, 0.08)";
      border = "rgba(79, 142, 247, 0.25)";
      color = "var(--blue)";
      suggestion = "Stage II patients typically receive combined treatment approaches.";
    } else if (activeStage === 'III') {
      title = "Stage III Cohort — Advanced Stage";
      text = `Locally advanced cases with significant tumor involvement. Average survival: ${surv.toFixed(1)} months. Multi-modal treatment is common.`;
      alert = "rgba(255, 179, 71, 0.08)";
      border = "rgba(255, 179, 71, 0.25)";
      color = "var(--amber)";
      suggestion = "Stage III patients often receive combined chemotherapy and radiation.";
    } else if (activeStage === 'IV') {
      title = "Stage IV Cohort — Metastatic";
      text = `Late-stage cases with metastatic spread. Average survival: ${surv.toFixed(1)} months. Treatment focuses on systemic therapies.`;
      alert = "rgba(255, 107, 107, 0.08)";
      border = "rgba(255, 107, 107, 0.25)";
      color = "var(--coral)";
      suggestion = "Systemic treatments and palliative care are the primary approaches for Stage IV.";
    }

    if (activeSmoking === 'Current') {
      text += " Active smoking is associated with worse treatment outcomes in this cohort.";
    }
    if (activeTreatment === 'Immunotherapy') {
      text += " Immunotherapy patients in this group show varied response rates.";
    }

    return { title, text, alert, border, color, suggestion };
  }, [data, activeStage, activeSmoking, activeTreatment, stats]);

  // Tooltip handler
  const showTooltip = useCallback((title: string, details: string[]) => {
    setTooltipInfo({ title, details });
  }, []);

  return (
    <div className="page" style={{ maxWidth: 1420 }}>
      <div style={{ animation: 'fadeInUp 0.4s ease forwards' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p className="section-title" style={{ color: 'var(--teal)', fontSize: '0.72rem', letterSpacing: 2 }}>Analytics Workspace</p>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: -0.8, background: 'linear-gradient(135deg, #ffffff 60%, var(--teal))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Dataset Dashboard
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>Exploration and filters for 50,000 synthetic patient records</p>
          </div>

          {/* Dynamic Action Buttons */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {apiLoading && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 10,
                background: 'rgba(0, 201, 177, 0.08)',
                border: '1px solid rgba(0, 201, 177, 0.2)',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--teal)'
              }}>
                Querying real dataset...
              </div>
            )}

            <button
              onClick={handleResetFilters}
              className="btn-secondary"
              style={{
                padding: '10px 16px',
                fontSize: '0.8rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.03)'
              }}
            >
              <RefreshCw
                size={14}
                className={rotating ? 'spin-anim' : ''}
                style={{ transition: 'transform 0.5s ease' }}
              />
              Reset Filters
            </button>
          </div>
        </div>

        {/* Filters */}
        <AnalyticsFilters
          activeStage={activeStage}
          setActiveStage={(s) => { setActiveStage(s); setTooltipInfo(null); }}
          activeGender={activeGender}
          setActiveGender={(g) => { setActiveGender(g); setTooltipInfo(null); }}
          activeSmoking={activeSmoking}
          setActiveSmoking={(sm) => { setActiveSmoking(sm); setTooltipInfo(null); }}
          activeTreatment={activeTreatment}
          setActiveTreatment={(t) => { setActiveTreatment(t); setTooltipInfo(null); }}
          activeLocation={activeLocation}
          setActiveLocation={(l) => { setActiveLocation(l); setTooltipInfo(null); }}
        />

        {error ? (
          <div className="card animate-fadeInUp" style={{
            background: 'rgba(239, 68, 68, 0.08)',
            borderColor: 'rgba(239, 68, 68, 0.25)',
            borderWidth: '1px',
            borderRadius: '14px',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            marginTop: 20,
            marginBottom: 20,
            boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)'
          }}>
            <AlertCircle size={40} style={{ color: 'var(--coral)', marginBottom: 12, display: 'inline-block' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--coral)' }}>
              Analytics Connection Failed
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 6, maxWidth: 500, margin: '6px auto 0', lineHeight: 1.5 }}>
              {error}
            </p>
          </div>
        ) : apiLoading && apiData === null ? (
          <div className="card animate-fadeInUp" style={{
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '5rem 2rem',
            textAlign: 'center',
            marginTop: 20,
            marginBottom: 20
          }}>
            <div className="loading-spinner" style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '3px solid rgba(0, 201, 177, 0.1)',
              borderTopColor: 'var(--teal)',
              animation: 'spin 1s linear infinite',
              display: 'inline-block',
              marginBottom: 16
            }} />
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Loading analytics data...</p>
          </div>
        ) : (
          <>
            {/* Cohort insight */}
            <div className="card" style={{
              background: aiInsight.alert,
              borderColor: aiInsight.border,
              borderWidth: '1px',
              borderRadius: '14px',
              padding: '1rem 1.25rem',
              display: 'flex',
              gap: '14px',
              alignItems: 'flex-start',
              marginBottom: 20,
              boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.03)',
                color: aiInsight.color,
                flexShrink: 0
              }}>
                <Activity size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: aiInsight.color, letterSpacing: -0.2 }}>
                  {aiInsight.title}
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 4 }}>
                  {aiInsight.text}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <span style={{
                    display: 'inline-flex',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: '#fff',
                    background: 'rgba(255,255,255,0.08)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  }}>Note</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{aiInsight.suggestion}</span>
                </div>
              </div>
            </div>

            {/* KPI cards */}
            <AnalyticsMetricCards
              stats={stats}
              data={data}
              totalCount={TOTAL_COUNT}
              expandedMetric={expandedMetric}
              setExpandedMetric={setExpandedMetric}
              aggregates={aggregates}
            />

            {/* Charts */}
            <AnalyticsCharts
              data={data}
              activeStage={activeStage}
              showTooltip={showTooltip}
              aggregates={aggregates}
            />

            {/* Patient table */}
            <PatientSandbox
              data={data}
              activeStage={activeStage}
            />
          </>
        )}

        {/* Detail tooltip */}
        {tooltipInfo && (
          <div className="card tooltip-panel animate-fadeInUp" style={{
            background: 'rgba(0, 201, 177, 0.07)',
            border: '1px solid rgba(0, 201, 177, 0.25)',
            boxShadow: '0 10px 40px -10px rgba(0,201,177,0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            borderRadius: '14px',
            padding: '1.25rem'
          }}>
            <div>
              <p style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--teal)', marginBottom: 4 }}>
                🔍 Detail: {tooltipInfo.title}
              </p>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 6 }}>
                {tooltipInfo.details.map(d => (
                  <span key={d} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{d}</span>
                ))}
              </div>
            </div>
            <button
              className="btn-secondary"
              onClick={() => setTooltipInfo(null)}
              style={{ padding: '6px 14px', fontSize: '0.78rem', border: '1px solid rgba(0,201,177,0.3)', background: 'rgba(0,201,177,0.05)', color: 'var(--teal)' }}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out forwards;
        }
        .spin-anim {
          animation: spin 0.6s linear;
        }
        .loading-spinner {
          display: inline-block;
        }
        .patient-hover:hover {
          background: rgba(255, 255, 255, 0.04) !important;
          border-color: rgba(0, 201, 177, 0.15) !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 15px -4px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
};

export default AnalyticsDashboard;
