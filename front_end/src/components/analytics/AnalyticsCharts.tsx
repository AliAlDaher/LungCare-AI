import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Filler,
  Title, Tooltip as ChartTooltip, Legend
} from 'chart.js';
import type { ChartEvent, ActiveElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import type { PatientRow, Stage } from '../../services/patients';
const STAGES: Stage[] = ['I', 'II', 'III', 'IV'];

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Filler, Title, ChartTooltip, Legend);

// Chart defaults
ChartJS.defaults.color = '#94a3b8';
ChartJS.defaults.font.family = "'DM Sans', sans-serif";
ChartJS.defaults.font.size = 11;
if (ChartJS.defaults.plugins.legend) {
  ChartJS.defaults.plugins.legend.display = false;
}

const grid = { color: 'rgba(255,255,255,0.03)', drawTicks: false };
const noTicks = { display: false as const };
const barRadius = 6;

const PALETTE = {
  teal: '#00c9b1', blue: '#4f8ef7', mint: '#6ee7b7', amber: '#ffb347',
  coral: '#ff6b6b', violet: '#a78bfa', sky: '#38bdf8', rose: '#fb7185',
};

const stageGradients = [
  ['rgba(110, 231, 183, 0.8)', 'rgba(0, 201, 177, 0.15)'], // Stage I: Mint to Teal
  ['rgba(79, 142, 247, 0.8)', 'rgba(59, 130, 246, 0.15)'], // Stage II: Blue to Light Blue
  ['rgba(255, 179, 71, 0.8)', 'rgba(245, 158, 11, 0.15)'], // Stage III: Amber to Orange
  ['rgba(255, 107, 107, 0.8)', 'rgba(239, 68, 68, 0.15)']  // Stage IV: Coral to Deep Red
];

const getStageGradient = (ctx: CanvasRenderingContext2D, chartArea: { top: number; bottom: number }, index: number) => {
  const grad = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  const colorPair = stageGradients[index % 4];
  grad.addColorStop(0, colorPair[0]);
  grad.addColorStop(1, colorPair[1]);
  return grad;
};

const getComorGradient = (ctx: CanvasRenderingContext2D, chartArea: { left: number; right: number }) => {
  const grad = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
  grad.addColorStop(0, 'rgba(167, 139, 250, 0.8)');
  grad.addColorStop(1, 'rgba(79, 142, 247, 0.15)');
  return grad;
};

const getAreaGradient = (ctx: CanvasRenderingContext2D, chartArea: { top: number; bottom: number }) => {
  const grad = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  grad.addColorStop(0, 'rgba(0, 201, 177, 0.25)');
  grad.addColorStop(1, 'rgba(0, 201, 177, 0.005)');
  return grad;
};

/* Custom Tooltip Styling matching our dark glassmorphic look */
const customTooltipOpts = {
  enabled: true,
  backgroundColor: 'rgba(11, 19, 38, 0.96)',
  titleColor: '#f1f5f9',
  bodyColor: '#e2e8f0',
  borderColor: 'rgba(255, 255, 255, 0.08)',
  borderWidth: 1,
  padding: 12,
  cornerRadius: 10,
  titleFont: { family: "'DM Sans', sans-serif", weight: 'bold' as const, size: 12 },
  bodyFont: { family: "'DM Sans', sans-serif", size: 11 },
  displayColors: true,
  usePointStyle: true,
  boxWidth: 7,
  boxHeight: 7,
  boxPadding: 4,
};

export interface AnalyticsChartsProps {
  data: PatientRow[];
  activeStage: string;
  showTooltip: (title: string, details: string[]) => void;
  aggregates?: any;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  data,
  activeStage,
  showTooltip,
  aggregates,
}) => {
  /* Chart click handler custom helper */
  const onChartClick = (
    chartLabel: string,
    labels: string[],
    dataset: number[],
    elements: ActiveElement[]
  ) => {
    if (elements.length > 0) {
      const idx = elements[0].index;
      const label = labels[idx];
      const value = dataset[idx];
      const total = dataset.reduce((a, b) => a + b, 0);
      showTooltip(`${chartLabel}: ${label}`, [
        `Active Cohort Count: ${value.toLocaleString()} cases`,
        `Subset Ratio: ${((value / Math.max(1, total)) * 100).toFixed(1)}%`,
        `Scope: Staging [${activeStage === 'All' ? 'All Stages' : `Stage ${activeStage}`}]`,
      ]);
    }
  };

  /* Chart options generators */
  const getBarOpts = (chartLabel: string, labels: string[], values: number[]) => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600 },
    plugins: {
      legend: { display: false },
      tooltip: customTooltipOpts,
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10, family: "'DM Sans', sans-serif" }, color: '#94a3b8' },
        border: { display: false }
      },
      y: {
        grid,
        ticks: noTicks,
        border: { display: false }
      }
    },
    onClick: (_e: ChartEvent, els: ActiveElement[]) => onChartClick(chartLabel, labels, values, els),
  });

  const getDoughnutOpts = (chartLabel: string, labels: string[], values: number[]) => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    animation: { duration: 600 },
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          padding: 8,
          usePointStyle: true,
          pointStyle: 'circle' as const,
          font: { size: 9, family: "'DM Sans', sans-serif", weight: 600 },
          color: '#94a3b8'
        }
      },
      tooltip: customTooltipOpts,
    },
    onClick: (_e: ChartEvent, els: ActiveElement[]) => onChartClick(chartLabel, labels, values, els),
  });

  /* Chart 1: Stage Distribution */
  const stageDistLabels = STAGES;
  const stageDistValues = useMemo(() => {
    if (aggregates && aggregates.stage_dist) {
      return stageDistLabels.map(s => aggregates.stage_dist[s] || 0);
    }
    return stageDistLabels.map(s => data.filter(p => p.stage === s).length);
  }, [data, stageDistLabels, aggregates]);
  const stageDistChart = {
    labels: stageDistLabels.map(s => `Stage ${s}`),
    datasets: [{
      data: stageDistValues,
      backgroundColor: (context: any) => {
        const { ctx, chartArea } = context.chart;
        if (!chartArea) return 'rgba(0,0,0,0)';
        return getStageGradient(ctx, chartArea, context.dataIndex);
      },
      borderColor: [PALETTE.mint, PALETTE.blue, PALETTE.amber, PALETTE.coral],
      borderWidth: 1.5,
      borderRadius: barRadius,
      borderSkipped: false as const,
    }],
  };

  /* Chart 2: Gender Split */
  const genderLabels = ['Male', 'Female'];
  const genderValues = useMemo(() => {
    if (aggregates && aggregates.gender_dist) {
      return genderLabels.map(g => aggregates.gender_dist[g] || 0);
    }
    return genderLabels.map(g => data.filter(p => p.gender === g).length);
  }, [data, aggregates]);
  const genderChart = {
    labels: genderLabels,
    datasets: [{
      data: genderValues,
      backgroundColor: ['rgba(79, 142, 247, 0.85)', 'rgba(167, 139, 250, 0.85)'],
      borderWidth: 0,
      hoverOffset: 6
    }],
  };

  /* Calculated metrics for Doughnut Center Overlays */
  const doughnutMetrics = useMemo(() => {
    const total = Math.max(1, genderValues.reduce((a, b) => a + b, 0));
    
    // Gender Split Metrics
    const topGender = genderValues[0] >= genderValues[1] ? 'Male' : 'Female';
    const topGenderPct = ((Math.max(...genderValues) / total) * 100).toFixed(0);

    // Treatment Metrics
    const treatments = ['Surgery', 'Chemotherapy', 'Radiation', 'Targeted Therapy', 'Immunotherapy', 'Combined'];
    let treatmentVals: number[] = [];
    if (aggregates && aggregates.treatment_dist) {
      treatmentVals = treatments.map(t => aggregates.treatment_dist[t] || 0);
    } else {
      treatmentVals = treatments.map(t => data.filter(p => p.treatment === t).length);
    }
    const topTreatIdx = treatmentVals.indexOf(Math.max(...treatmentVals));
    const topTreat = treatments[topTreatIdx] || 'None';
    const topTreatPct = ((Math.max(...treatmentVals) / total) * 100).toFixed(0);

    // Location Metrics
    const locations = ['Upper Lobe', 'Middle Lobe', 'Lower Lobe', 'Main Bronchus'];
    let locVals: number[] = [];
    if (aggregates && aggregates.location_dist) {
      locVals = locations.map(l => aggregates.location_dist[l] || 0);
    } else {
      locVals = locations.map(l => data.filter(p => p.location === l).length);
    }
    const topLocIdx = locVals.indexOf(Math.max(...locVals));
    const topLoc = locations[topLocIdx] || 'None';
    const topLocPct = ((Math.max(...locVals) / total) * 100).toFixed(0);

    return {
      topGender, topGenderPct,
      topTreat, topTreatPct,
      topLoc, topLocPct,
      treatmentVals, locVals
    };
  }, [data, genderValues, aggregates]);

  /* Chart 3: Avg survival by stage */
  const avgSurvByStage = useMemo(() => {
    if (aggregates && aggregates.avg_survival_by_stage) {
      return aggregates.avg_survival_by_stage;
    }
    return STAGES.map(s => {
      const rows = data.filter(p => p.stage === s);
      return rows.length ? +(rows.reduce((a, p) => a + p.survivalMonths, 0) / rows.length).toFixed(1) : 0;
    });
  }, [data, aggregates]);
  const survChart = {
    labels: STAGES.map(s => `Stage ${s}`),
    datasets: [{
      data: avgSurvByStage,
      backgroundColor: (context: any) => {
        const { ctx, chartArea } = context.chart;
        if (!chartArea) return 'rgba(0,0,0,0)';
        return getStageGradient(ctx, chartArea, context.dataIndex);
      },
      borderColor: [PALETTE.mint, PALETTE.blue, PALETTE.amber, PALETTE.coral],
      borderWidth: 1.5,
      borderRadius: barRadius,
      borderSkipped: false as const,
    }],
  };

  /* Chart 4: Treatment distribution */
  const treatmentLabels = ['Surgery', 'Chemotherapy', 'Radiation', 'Targeted Therapy', 'Immunotherapy', 'Combined'];
  const treatmentChart = {
    labels: treatmentLabels,
    datasets: [{
      data: doughnutMetrics.treatmentVals,
      backgroundColor: [
        'rgba(0, 201, 177, 0.85)',
        'rgba(79, 142, 247, 0.85)',
        'rgba(255, 179, 71, 0.85)',
        'rgba(167, 139, 250, 0.85)',
        'rgba(255, 107, 107, 0.85)',
        'rgba(110, 231, 183, 0.85)'
      ],
      borderWidth: 0,
      hoverOffset: 6
    }],
  };

  /* Chart 5: Tumor Location */
  const locLabels = ['Upper Lobe', 'Middle Lobe', 'Lower Lobe', 'Main Bronchus'];
  const locChart = {
    labels: locLabels,
    datasets: [{
      data: doughnutMetrics.locVals,
      backgroundColor: [
        'rgba(56, 189, 248, 0.85)',
        'rgba(110, 231, 183, 0.85)',
        'rgba(255, 179, 71, 0.85)',
        'rgba(251, 113, 133, 0.85)'
      ],
      borderWidth: 0,
      hoverOffset: 6
    }],
  };

  /* Chart 6: Age Group Area Chart */
  const ageGroups = ['30-39', '40-49', '50-59', '60-69', '70-79', '80+'];
  const ageGroupValues = useMemo(() => {
    if (aggregates && aggregates.age_dist) {
      return aggregates.age_dist;
    }
    return ageGroups.map(g => {
      const lo = parseInt(g.replace('+', '').split('-')[0]);
      const hi = g.includes('+') ? 200 : parseInt(g.split('-')[1]);
      return data.filter(p => p.age >= lo && p.age <= hi).length;
    });
  }, [data, aggregates]);
  const ageChart = {
    labels: ageGroups,
    datasets: [{
      data: ageGroupValues,
      fill: true,
      backgroundColor: (context: any) => {
        const { ctx, chartArea } = context.chart;
        if (!chartArea) return 'rgba(0,0,0,0)';
        return getAreaGradient(ctx, chartArea);
      },
      borderColor: PALETTE.teal,
      borderWidth: 2.5,
      pointBackgroundColor: '#ffffff',
      pointBorderColor: PALETTE.teal,
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.38,
    }],
  };

  /* Chart 7: Comorbidity Prevalence horizontal bar */
  const comorLabels = ['Diabetes', 'Hypertension', 'Heart Disease', 'Chronic Lung', 'Kidney Disease', 'Autoimmune', 'Other'];
  const comorValues = useMemo(() => {
    if (aggregates && aggregates.comorbidities_dist) {
      return comorLabels.map(c => aggregates.comorbidities_dist[c] || 0);
    }
    return comorLabels.map(c => data.filter(p => p.comorbidities.includes(c)).length);
  }, [data, aggregates]);
  const comorChart = {
    labels: comorLabels,
    datasets: [{
      data: comorValues,
      backgroundColor: (context: any) => {
        const { ctx, chartArea } = context.chart;
        if (!chartArea) return 'rgba(0,0,0,0)';
        return getComorGradient(ctx, chartArea);
      },
      borderColor: PALETTE.violet,
      borderWidth: 1,
      borderRadius: barRadius,
      borderSkipped: false as const,
    }],
  };

  /* Calculate smoking stats */
  const smokingLabels = ['Never', 'Former', 'Current'];
  const smokingValues = useMemo(() => {
    if (aggregates && aggregates.smoking_dist) {
      return smokingLabels.map(s => aggregates.smoking_dist[s] || 0);
    }
    return smokingLabels.map(s => data.filter(p => p.smoking === s).length);
  }, [data, aggregates]);
  const smokingTotal = useMemo(() => Math.max(1, ...smokingValues), [smokingValues]);

  return (
    <>
      {/* Chart row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 20 }}>
        {/* Chart 1: Stage Distribution */}
        <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="section-title" style={{ margin: 0 }}>Stage Distribution</span>
            <span className="badge badge-teal" style={{ fontSize: '0.62rem' }}>Interactive Click</span>
          </div>
          <div className="chart-container" style={{ height: 260 }}>
            <Bar data={stageDistChart} options={getBarOpts('Stage', stageDistLabels.map(s => `Stage ${s}`), stageDistValues) as any} />
          </div>
        </div>

        {/* Chart 2: Gender Split */}
        <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '16px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="section-title" style={{ margin: 0 }}>Gender Split</span>
            <span className="badge badge-blue" style={{ fontSize: '0.62rem' }}>Interactive Click</span>
          </div>
          <div className="chart-container" style={{ height: 260, position: 'relative' }}>
            <Doughnut data={genderChart} options={getDoughnutOpts('Gender', genderLabels, genderValues) as any} />
            {/* Dynamic Center Ring Metric Overlay */}
            <div style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <p style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -0.5 }}>
                {doughnutMetrics.topGenderPct}%
              </p>
              <p style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.5, marginTop: 1 }}>
                {doughnutMetrics.topGender}
              </p>
            </div>
          </div>
        </div>

        {/* Chart 3: Smoking History Custom bars */}
        <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="section-title" style={{ margin: 0 }}>Smoking History</span>
            <span className="badge badge-amber" style={{ fontSize: '0.62rem' }}>Dynamic Bar</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 10 }}>
            {smokingLabels.map((s, i) => (
              <div key={s}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{s}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: [PALETTE.mint, PALETTE.amber, PALETTE.coral][i] }}>
                    {smokingValues[i].toLocaleString()} <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.72rem' }}>({((smokingValues[i] / Math.max(1, data.length)) * 100).toFixed(1)}%)</span>
                  </span>
                </div>
                <div
                  style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.04)', overflow: 'hidden', cursor: 'pointer' }}
                  onClick={() => showTooltip(`Smoking History: ${s}`, [
                    `Count: ${smokingValues[i].toLocaleString()} patients`,
                    `Cohorts Ratio: ${((smokingValues[i] / Math.max(1, data.length)) * 100).toFixed(1)}%`
                  ])}
                >
                  <div style={{
                    width: `${(smokingValues[i] / smokingTotal) * 100}%`,
                    height: '100%',
                    borderRadius: 5,
                    background: [PALETTE.mint, PALETTE.amber, PALETTE.coral][i],
                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 20 }}>
        {/* Chart 4: Average Survival */}
        <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="section-title" style={{ margin: 0 }}>Avg Survival by Stage</span>
            <span className="badge badge-amber" style={{ fontSize: '0.62rem' }}>Comparative</span>
          </div>
          <div className="chart-container" style={{ height: 260 }}>
            <Bar data={survChart} options={{
              ...getBarOpts('Avg Survival', STAGES.map(s => `Stage ${s}`), avgSurvByStage),
              scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10, family: "'DM Sans', sans-serif" }, color: '#94a3b8' }, border: { display: false } },
                y: { grid, ticks: noTicks, border: { display: false }, title: { display: true, text: 'Months', font: { size: 9, family: "'DM Sans', sans-serif" }, color: '#64748b' } },
              },
            } as any} />
          </div>
        </div>

        {/* Chart 5: Treatment Distribution */}
        <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '16px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="section-title" style={{ margin: 0 }}>Treatment Distribution</span>
            <span className="badge badge-violet" style={{ fontSize: '0.62rem' }}>Therapies</span>
          </div>
          <div className="chart-container" style={{ height: 260, position: 'relative' }}>
            <Doughnut data={treatmentChart} options={getDoughnutOpts('Treatment', treatmentLabels, doughnutMetrics.treatmentVals) as any} />
            {/* Dynamic Center Ring Metric Overlay */}
            <div style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <p style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -0.5 }}>
                {doughnutMetrics.topTreatPct}%
              </p>
              <p style={{
                fontSize: '0.58rem',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                fontWeight: 800,
                letterSpacing: 0.5,
                maxWidth: 95,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginTop: 1
              }}>
                {doughnutMetrics.topTreat}
              </p>
            </div>
          </div>
        </div>

        {/* Chart 6: Tumor Anatomical Location */}
        <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '16px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="section-title" style={{ margin: 0 }}>Anatomical Tumor Location</span>
            <span className="badge badge-mint" style={{ fontSize: '0.62rem' }}>Lobe Splits</span>
          </div>
          <div className="chart-container" style={{ height: 260, position: 'relative' }}>
            <Doughnut data={locChart} options={getDoughnutOpts('Location', locLabels, doughnutMetrics.locVals) as any} />
            {/* Dynamic Center Ring Metric Overlay */}
            <div style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <p style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -0.5 }}>
                {doughnutMetrics.topLocPct}%
              </p>
              <p style={{
                fontSize: '0.58rem',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                fontWeight: 800,
                letterSpacing: 0.5,
                maxWidth: 95,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginTop: 1
              }}>
                {doughnutMetrics.topLoc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart row 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20, marginBottom: 20 }}>
        {/* Chart 7: Age Group Line Chart */}
        <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '16px' }}>
          <span className="section-title" style={{ marginBottom: 12, display: 'block' }}>Age Group Prevalence</span>
          <div className="chart-container" style={{ height: 260 }}>
            <Line data={ageChart} options={{
              responsive: true,
              maintainAspectRatio: false,
              animation: { duration: 600 },
              plugins: {
                legend: { display: false },
                tooltip: customTooltipOpts,
              },
              scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10, family: "'DM Sans', sans-serif" }, color: '#94a3b8' }, border: { display: false } },
                y: { grid, ticks: noTicks, border: { display: false } }
              },
              onClick: (_e: ChartEvent, els: ActiveElement[]) => onChartClick('Age Group', ageGroups, ageGroupValues, els),
            } as any} />
          </div>
        </div>

        {/* Chart 8: Comorbidities Horizontal Bar Chart */}
        <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '16px' }}>
          <span className="section-title" style={{ marginBottom: 12, display: 'block' }}>Comorbidity Prevalence</span>
          <div className="chart-container" style={{ height: 260 }}>
            <Bar data={comorChart} options={{
              ...getBarOpts('Comorbidity', comorLabels, comorValues),
              indexAxis: 'y' as const,
              scales: {
                y: { grid: { display: false }, ticks: { font: { size: 9, family: "'DM Sans', sans-serif", weight: 600 }, color: '#94a3b8' }, border: { display: false } },
                x: { grid, ticks: noTicks, border: { display: false } }
              },
            } as any} />
          </div>
        </div>
      </div>
    </>
  );
};
