import React, { useState, useMemo, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Filler,
  Title, Tooltip as ChartTooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Users, Calendar, Clock, Ruler, Info, Filter, RefreshCw,
  ChevronDown, ChevronUp, Search, Stethoscope, Activity
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Filler, Title, ChartTooltip, Legend);

/* ──────────── SYNTHETIC DATASET GENERATION ──────────── */
const TOTAL = 50000;
type Stage = 'I' | 'II' | 'III' | 'IV';
const STAGES: Stage[] = ['I', 'II', 'III', 'IV'];

// deterministic pseudo-random
function seededRand(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

interface PatientRow {
  stage: Stage;
  age: number;
  gender: 'Male' | 'Female';
  smoking: 'Never' | 'Former' | 'Current';
  treatment: string;
  location: string;
  survivalMonths: number;
  tumorSize: number;
  comorbidities: string[];
}

function generateDataset(): PatientRow[] {
  const rand = seededRand(42);
  const genders: ('Male' | 'Female')[] = ['Male', 'Female'];
  const smokingOpts: ('Never' | 'Former' | 'Current')[] = ['Never', 'Former', 'Current'];
  const treatments = ['Surgery', 'Chemotherapy', 'Radiation', 'Targeted Therapy', 'Immunotherapy', 'Combined'];
  const locations = ['Upper Lobe', 'Middle Lobe', 'Lower Lobe', 'Main Bronchus'];
  const comorArr = ['Diabetes', 'Hypertension', 'Heart Disease', 'Chronic Lung', 'Kidney Disease', 'Autoimmune', 'Other'];

  const rows: PatientRow[] = [];
  const stageWeights = [0.25, 0.30, 0.28, 0.17];
  for (let i = 0; i < TOTAL; i++) {
    const r = rand();
    let stage: Stage = 'I';
    let cum = 0;
    for (let j = 0; j < 4; j++) { cum += stageWeights[j]; if (r < cum) { stage = STAGES[j]; break; } }
    const sIdx = STAGES.indexOf(stage);
    const age = Math.round(35 + rand() * 50);
    const surv = Math.max(2, Math.round([55, 40, 25, 10][sIdx] + (rand() - 0.5) * 30));
    const tSize = Math.max(5, Math.round([18, 32, 50, 70][sIdx] + (rand() - 0.5) * 25));
    const combs: string[] = [];
    comorArr.forEach(c => { if (rand() < 0.18) combs.push(c); });

    rows.push({
      stage,
      age,
      gender: genders[rand() < 0.58 ? 0 : 1],
      smoking: smokingOpts[Math.min(2, Math.floor(rand() * 3))],
      treatment: treatments[Math.floor(rand() * treatments.length)],
      location: locations[Math.floor(rand() * locations.length)],
      survivalMonths: surv,
      tumorSize: tSize,
      comorbidities: combs,
    });
  }
  return rows;
}

const fullDataset = generateDataset();

const mockNames = [
  "Arthur Pendelton", "Sylvia Sterling", "Marcus Vance", "Evelyn Sterling", "Thomas Thorne",
  "Gregory House", "Allison Cameron", "Robert Chase", "Eric Foreman", "James Wilson",
  "Lisa Cuddy", "Remy Hadley", "Chris Taub", "Lawrence Kutner", "Amber Volakis",
  "Martha Masters", "Chi Park", "Jessica Adams", "Edward Vogler", "Stacy Warner"
];

/* ──────────── CHART DEFAULTS ──────────── */
ChartJS.defaults.color = '#94a3b8';
ChartJS.defaults.font.family = "'DM Sans', sans-serif";
ChartJS.defaults.font.size = 11;
ChartJS.defaults.plugins.legend!.display = false;

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

const getStageGradient = (ctx: CanvasRenderingContext2D, chartArea: any, index: number) => {
  const grad = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  const colorPair = stageGradients[index % 4];
  grad.addColorStop(0, colorPair[0]);
  grad.addColorStop(1, colorPair[1]);
  return grad;
};

const getComorGradient = (ctx: CanvasRenderingContext2D, chartArea: any) => {
  const grad = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
  grad.addColorStop(0, 'rgba(167, 139, 250, 0.8)');
  grad.addColorStop(1, 'rgba(79, 142, 247, 0.15)');
  return grad;
};

const getAreaGradient = (ctx: CanvasRenderingContext2D, chartArea: any) => {
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

/* ──────────── COMPONENT ──────────── */
const AnalyticsDashboard: React.FC = () => {
  /* Dynamic State Filters */
  const [activeStage, setActiveStage] = useState<Stage | 'All'>('All');
  const [activeGender, setActiveGender] = useState<'All' | 'Male' | 'Female'>('All');
  const [activeSmoking, setActiveSmoking] = useState<'All' | 'Never' | 'Former' | 'Current'>('All');
  const [activeTreatment, setActiveTreatment] = useState<string>('All');
  const [activeLocation, setActiveLocation] = useState<string>('All');

  const [expandedMetric, setExpandedMetric] = useState<'none' | 'patients' | 'age' | 'survival' | 'tumor'>('none');
  const [tooltipInfo, setTooltipInfo] = useState<{ title: string; details: string[] } | null>(null);
  const [patSearchText, setPatSearchText] = useState('');
  const [rotating, setRotating] = useState(false);

  /* Reset all filters utility */
  const handleResetFilters = () => {
    setRotating(true);
    setActiveStage('All');
    setActiveGender('All');
    setActiveSmoking('All');
    setActiveTreatment('All');
    setActiveLocation('All');
    setPatSearchText('');
    setExpandedMetric('none');
    setTooltipInfo(null);
    setTimeout(() => setRotating(false), 600);
  };

  /* Unified dynamic multi-dimensional dataset filter */
  const data = useMemo(() => {
    return fullDataset.filter(p => {
      if (activeStage !== 'All' && p.stage !== activeStage) return false;
      if (activeGender !== 'All' && p.gender !== activeGender) return false;
      if (activeSmoking !== 'All' && p.smoking !== activeSmoking) return false;
      if (activeTreatment !== 'All' && p.treatment !== activeTreatment) return false;
      if (activeLocation !== 'All' && p.location !== activeLocation) return false;
      return true;
    });
  }, [activeStage, activeGender, activeSmoking, activeTreatment, activeLocation]);

  /* dynamic cohort aggregated KPIs */
  const stats = useMemo(() => {
    const n = data.length;
    if (n === 0) return { n: 0, avgAge: '0.0', avgSurv: '0.0', avgTumor: '0.0' };
    const avgAge = (data.reduce((s, p) => s + p.age, 0) / n).toFixed(1);
    const avgSurv = (data.reduce((s, p) => s + p.survivalMonths, 0) / n).toFixed(1);
    const avgTumor = (data.reduce((s, p) => s + p.tumorSize, 0) / n).toFixed(1);
    return { n, avgAge, avgSurv, avgTumor };
  }, [data]);

  /* Dynamic AI Heuristic Clinical Insight generator */
  const aiInsight = useMemo(() => {
    if (data.length === 0) {
      return {
        title: "Undefined Cohort Profile",
        text: "The combination of active criteria yields 0 patient records. No active medical statistical inferences can be rendered.",
        alert: "rgba(239, 68, 68, 0.15)",
        border: "rgba(239, 68, 68, 0.3)",
        color: "var(--coral)",
        suggestion: "Refine or reset diagnostic filters to populate clinical data grids."
      };
    }

    const surv = parseFloat(stats.avgSurv);
    const tumor = parseFloat(stats.avgTumor);
    
    let title = "General Research Cohort Baseline Summary";
    let text = `Aggregated screening of ${data.length.toLocaleString()} cases indicates highly balanced demographic profiles. Broad clinical trends correlate tumor load strictly with localized staging parameters.`;
    let alert = "rgba(79, 142, 247, 0.08)";
    let border = "rgba(79, 142, 247, 0.2)";
    let color = "var(--blue)";
    let suggestion = "Standard oncology guidelines recommend NGS screening (EGFR, ALK, ROS1) for progressive tissue typings.";

    if (activeStage === 'I') {
      title = "Stage I Cohort Analysis — Favorable Cure Profile";
      text = `Early-stage localized carcinomas (Avg size: ${tumor.toFixed(1)} mm). Prognosis is excellent (Avg survival: ${surv.toFixed(1)} months). Surgery holds strong dominance as primary curative intervention.`;
      alert = "rgba(110, 231, 183, 0.08)";
      border = "rgba(110, 231, 183, 0.2)";
      color = "var(--mint)";
      suggestion = "Clinical Recommendation: Complete surgical resection where margins permit; minimize systemic interventions unless high-risk path features emerge.";
    } else if (activeStage === 'II') {
      title = "Stage II Cohort Analysis — Intermediate Progression Profile";
      text = `Localized progression noted with moderate regional node involvement. Intermediate survival averages ${surv.toFixed(1)} months. Integrated surgery and systemic chemotherapy protocols prevail.`;
      alert = "rgba(79, 142, 247, 0.08)";
      border = "rgba(79, 142, 247, 0.25)";
      color = "var(--blue)";
      suggestion = "Clinical Recommendation: Assess feasibility of surgical resection followed aggressively by adjuvant cisplatin-based chemotherapy or targeted therapies.";
    } else if (activeStage === 'III') {
      title = "Stage III Cohort Analysis — Advanced Localized Challenge";
      text = `Locally advanced pathology representing high nodal involvement and complex tumor boundaries. Average survival is restricted to ${surv.toFixed(1)} months. Multi-modal sequencing strategies are required.`;
      alert = "rgba(255, 179, 71, 0.08)";
      border = "rgba(255, 179, 71, 0.25)";
      color = "var(--amber)";
      suggestion = "Clinical Recommendation: Concurrent chemotherapy and external-beam radiation followed by consolidative durvalumab immunotherapy.";
    } else if (activeStage === 'IV') {
      title = "Stage IV Cohort Analysis — Metastatic Intervention Profile";
      text = `Advanced metastatic dissemination. Primary focus rests on systemic control (Avg survival: ${surv.toFixed(1)} months). High therapeutic reliance on targeted small-molecules and checkpoint inhibitors.`;
      alert = "rgba(255, 107, 107, 0.08)";
      border = "rgba(255, 107, 107, 0.25)";
      color = "var(--coral)";
      suggestion = "Clinical Recommendation: Perform rapid genomic panels. Favor immunotherapy combo or EGFR/ALK/KRAS TKI treatments. Integrate palliative care in concurrent layers.";
    }

    if (activeSmoking === 'Current') {
      text += " Active tobacco use is strongly correlated with co-existing pulmonary impairments (COPD) and decreased chemotherapeutic tolerability.";
    }
    if (activeTreatment === 'Immunotherapy') {
      text += " Immunotherapeutic intervention in this cohort targets PD-1/PD-L1 axes to generate durable clinical responses.";
    }

    return { title, text, alert, border, color, suggestion };
  }, [data, activeStage, activeSmoking, activeTreatment, stats]);

  /* Patient Registry Live Sandbox Search Data generator */
  const samplePatientDetails = useMemo(() => {
    return data.slice(0, 5).map((p, idx) => {
      const idSeed = (idx + 1) * 37 + (activeStage.charCodeAt(0) || 65) + data.length;
      const nameIdx = idSeed % mockNames.length;
      const patId = `LC-${20000 + (idSeed % 80000)}`;
      return {
        patId,
        name: mockNames[nameIdx],
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

  /* Toggle expansion metrics */
  const handleToggleMetric = (metric: 'patients' | 'age' | 'survival' | 'tumor') => {
    setExpandedMetric(expandedMetric === metric ? 'none' : metric);
  };

  /* Show visual bottom interactive tooltips */
  const showTooltip = useCallback((title: string, details: string[]) => {
    setTooltipInfo({ title, details });
  }, []);

  /* Chart click handler custom helper */
  const onChartClick = useCallback((
    _event: any, elements: any[], chartLabel: string, labels: string[], dataset: number[]
  ) => {
    if (elements.length > 0) {
      const idx = elements[0].index;
      const label = labels[idx];
      const value = dataset[idx];
      showTooltip(`${chartLabel}: ${label}`, [
        `Active Cohort Count: ${value.toLocaleString()} cases`,
        `Subset Ratio: ${((value / Math.max(1, data.length)) * 100).toFixed(1)}%`,
        `Scope: Staging [${activeStage === 'All' ? 'All Stages' : `Stage ${activeStage}`}]`,
      ]);
    }
  }, [data.length, activeStage, showTooltip]);

  /* Chart 1: Stage Distribution */
  const stageDistLabels = STAGES;
  const stageDistValues = stageDistLabels.map(s => data.filter(p => p.stage === s).length);
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
  const genderValues = genderLabels.map(g => data.filter(p => p.gender === g).length);
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
    const total = Math.max(1, data.length);
    
    // Gender Split Metrics
    const topGender = genderValues[0] >= genderValues[1] ? 'Male' : 'Female';
    const topGenderPct = ((Math.max(...genderValues) / total) * 100).toFixed(0);

    // Treatment Metrics
    const treatments = ['Surgery', 'Chemotherapy', 'Radiation', 'Targeted Therapy', 'Immunotherapy', 'Combined'];
    const treatmentVals = treatments.map(t => data.filter(p => p.treatment === t).length);
    const topTreatIdx = treatmentVals.indexOf(Math.max(...treatmentVals));
    const topTreat = treatments[topTreatIdx] || 'None';
    const topTreatPct = ((Math.max(...treatmentVals) / total) * 100).toFixed(0);

    // Location Metrics
    const locations = ['Upper Lobe', 'Middle Lobe', 'Lower Lobe', 'Main Bronchus'];
    const locVals = locations.map(l => data.filter(p => p.location === l).length);
    const topLocIdx = locVals.indexOf(Math.max(...locVals));
    const topLoc = locations[topLocIdx] || 'None';
    const topLocPct = ((Math.max(...locVals) / total) * 100).toFixed(0);

    return {
      topGender, topGenderPct,
      topTreat, topTreatPct,
      topLoc, topLocPct,
      treatmentVals, locVals
    };
  }, [data, genderValues]);

  /* Chart 3: Avg survival by stage */
  const avgSurvByStage = STAGES.map(s => {
    const rows = data.filter(p => p.stage === s);
    return rows.length ? +(rows.reduce((a, p) => a + p.survivalMonths, 0) / rows.length).toFixed(1) : 0;
  });
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
  const ageGroupValues = ageGroups.map(g => {
    const [lo] = g.replace('+', '').split('-').map(Number);
    const hi = g.includes('+') ? 200 : parseInt(g.split('-')[1]);
    return data.filter(p => p.age >= lo && p.age <= hi).length;
  });
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
  const comorValues = comorLabels.map(c => data.filter(p => p.comorbidities.includes(c)).length);
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

  /* Chart options generators */
  const barOpts = (chartLabel: string, labels: string[], values: number[]) => ({
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
    onClick: (_e: any, els: any[]) => onChartClick(_e, els, chartLabel, labels, values),
  });

  const doughnutOpts = (chartLabel: string, labels: string[], values: number[]) => ({
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
    onClick: (_e: any, els: any[]) => onChartClick(_e, els, chartLabel, labels, values),
  });

  /* Calculate smoking stats */
  const smokingLabels = ['Never', 'Former', 'Current'];
  const smokingValues = smokingLabels.map(s => data.filter(p => p.smoking === s).length);
  const smokingTotal = Math.max(1, ...smokingValues);

  return (
    <div className="page" style={{ maxWidth: 1420 }}>
      <div style={{ animation: 'fadeInUp 0.4s ease forwards' }}>

        {/* ──────────── TOP HEADER SECTION ──────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p className="section-title" style={{ color: 'var(--teal)', fontSize: '0.72rem', letterSpacing: 2 }}>Analytics Workspace</p>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: -0.8, background: 'linear-gradient(135deg, #ffffff 60%, var(--teal))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Dataset Dashboard
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>Exploration and filters for 50,000 synthetic patient records</p>
          </div>

          {/* Dynamic Action Buttons */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
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

        {/* ──────────── MULTI-DIMENSIONAL GLASS FILTER BOARD ──────────── */}
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
              Dynamic Cohort Filtering
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
                onChange={e => { setActiveStage(e.target.value as Stage | 'All'); setTooltipInfo(null); }}
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
                onChange={e => { setActiveGender(e.target.value as any); setTooltipInfo(null); }}
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
                onChange={e => { setActiveSmoking(e.target.value as any); setTooltipInfo(null); }}
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
                onChange={e => { setActiveTreatment(e.target.value); setTooltipInfo(null); }}
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
                onChange={e => { setActiveLocation(e.target.value); setTooltipInfo(null); }}
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

        {/* ──────────── AI CLINICAL COHORT ANALYZER ──────────── */}
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
              }}>Clinical Note</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{aiInsight.suggestion}</span>
            </div>
          </div>
        </div>

        {/* ──────────── INTERACTIVE KPI METRIC CARDS ──────────── */}
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
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>Cohort representation count</p>
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
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>Demographic mean age</p>
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
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>Median clinical timeline</p>
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
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>Tumor longest diameter</p>
          </div>
        </div>

        {/* ──────────── DETAILED METRIC DRAWERS ──────────── */}
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
                <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: PALETTE.teal, marginBottom: 8 }}>Total Patients Cohort Breakdown</h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Cohort Percentage Ratio</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>
                      {((data.length / TOTAL) * 100).toFixed(1)}% <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>of database</span>
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Stage I - II Distribution</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 800, color: PALETTE.mint, marginTop: 4 }}>
                      {(data.filter(p => p.stage === 'I' || p.stage === 'II').length).toLocaleString()} cases
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Stage III - IV Distribution</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 800, color: PALETTE.coral, marginTop: 4 }}>
                      {(data.filter(p => p.stage === 'III' || p.stage === 'IV').length).toLocaleString()} cases
                    </p>
                  </div>
                </div>
              </div>
            )}
            {expandedMetric === 'age' && (
              <div>
                <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: PALETTE.blue, marginBottom: 8 }}>Cohort Age Distribution & Guidelines</h5>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  The demographic mean age sits at {stats.avgAge} years old. Lung cancer diagnosis typically peaks in patients aged between 60 to 75. 
                  Early screening via Low-Dose CT (LDCT) is clinically indicated starting at age 50 for individuals with significant smoking histories.
                </p>
              </div>
            )}
            {expandedMetric === 'survival' && (
              <div>
                <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: PALETTE.amber, marginBottom: 8 }}>Clinical Survival Estimation Insights</h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>High Survival Timeline (&gt; 36 mo)</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 800, color: PALETTE.mint, marginTop: 4 }}>
                      {(data.filter(p => p.survivalMonths >= 36).length).toLocaleString()} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>patients</span>
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Moderate Survival Timeline (12-36 mo)</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 800, color: PALETTE.amber, marginTop: 4 }}>
                      {(data.filter(p => p.survivalMonths >= 12 && p.survivalMonths < 36).length).toLocaleString()} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>patients</span>
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Critical Prognosis Timeline (&lt; 12 mo)</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 800, color: PALETTE.coral, marginTop: 4 }}>
                      {(data.filter(p => p.survivalMonths < 12).length).toLocaleString()} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>patients</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
            {expandedMetric === 'tumor' && (
              <div>
                <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: PALETTE.violet, marginBottom: 8 }}>Oncology Tumor Staging Benchmarks (AJCC Guidelines)</h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                  <div style={{ background: 'rgba(255,255,255,0.01)', padding: '8px 12px', borderRadius: '6px' }}>
                    <p style={{ fontSize: '0.68rem', color: PALETTE.mint, fontWeight: 700 }}>T1 Classification (&lt; 30mm)</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: 4 }}>{(data.filter(p => p.tumorSize < 30).length).toLocaleString()} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>cases</span></p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.01)', padding: '8px 12px', borderRadius: '6px' }}>
                    <p style={{ fontSize: '0.68rem', color: PALETTE.blue, fontWeight: 700 }}>T2 Classification (30 - 50mm)</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: 4 }}>{(data.filter(p => p.tumorSize >= 30 && p.tumorSize < 50).length).toLocaleString()} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>cases</span></p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.01)', padding: '8px 12px', borderRadius: '6px' }}>
                    <p style={{ fontSize: '0.68rem', color: PALETTE.amber, fontWeight: 700 }}>T3 Classification (50 - 70mm)</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: 4 }}>{(data.filter(p => p.tumorSize >= 50 && p.tumorSize < 70).length).toLocaleString()} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>cases</span></p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.01)', padding: '8px 12px', borderRadius: '6px' }}>
                    <p style={{ fontSize: '0.68rem', color: PALETTE.coral, fontWeight: 700 }}>T4 Classification (&gt; 70mm)</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: 4 }}>{(data.filter(p => p.tumorSize >= 70).length).toLocaleString()} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>cases</span></p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ──────────── VISUAL CHART SECTION - ROW 1 ──────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 20 }}>
          {/* Chart 1: Stage Distribution */}
          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="section-title" style={{ margin: 0 }}>Stage Distribution</span>
              <span className="badge badge-teal" style={{ fontSize: '0.62rem' }}>Interactive Click</span>
            </div>
            <div className="chart-container" style={{ height: 260 }}>
              <Bar data={stageDistChart} options={barOpts('Stage', stageDistLabels.map(s => `Stage ${s}`), stageDistValues) as never} />
            </div>
          </div>

          {/* Chart 2: Gender Split */}
          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '16px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="section-title" style={{ margin: 0 }}>Gender Split</span>
              <span className="badge badge-blue" style={{ fontSize: '0.62rem' }}>Interactive Click</span>
            </div>
            <div className="chart-container" style={{ height: 260, position: 'relative' }}>
              <Doughnut data={genderChart} options={doughnutOpts('Gender', genderLabels, genderValues) as never} />
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

        {/* ──────────── VISUAL CHART SECTION - ROW 2 ──────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 20 }}>
          {/* Chart 4: Average Survival */}
          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="section-title" style={{ margin: 0 }}>Avg Survival by Stage</span>
              <span className="badge badge-amber" style={{ fontSize: '0.62rem' }}>Comparative</span>
            </div>
            <div className="chart-container" style={{ height: 260 }}>
              <Bar data={survChart} options={{
                ...barOpts('Avg Survival', STAGES.map(s => `Stage ${s}`), avgSurvByStage),
                scales: {
                  x: { grid: { display: false }, ticks: { font: { size: 10, family: "'DM Sans', sans-serif" }, color: '#94a3b8' }, border: { display: false } },
                  y: { grid, ticks: noTicks, border: { display: false }, title: { display: true, text: 'Months', font: { size: 9, family: "'DM Sans', sans-serif" }, color: '#64748b' } },
                },
              } as never} />
            </div>
          </div>

          {/* Chart 5: Treatment Distribution */}
          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '16px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="section-title" style={{ margin: 0 }}>Treatment Distribution</span>
              <span className="badge badge-violet" style={{ fontSize: '0.62rem' }}>Therapies</span>
            </div>
            <div className="chart-container" style={{ height: 260, position: 'relative' }}>
              <Doughnut data={treatmentChart} options={doughnutOpts('Treatment', treatmentLabels, doughnutMetrics.treatmentVals) as never} />
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
              <Doughnut data={locChart} options={doughnutOpts('Location', locLabels, doughnutMetrics.locVals) as never} />
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

        {/* ──────────── VISUAL CHART SECTION - ROW 3 ──────────── */}
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
                onClick: (_e: any, els: any[]) => onChartClick(_e, els, 'Age Group', ageGroups, ageGroupValues),
              } as never} />
            </div>
          </div>

          {/* Chart 8: Comorbidities Horizontal Bar Chart */}
          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '16px' }}>
            <span className="section-title" style={{ marginBottom: 12, display: 'block' }}>Comorbidity Prevalence</span>
            <div className="chart-container" style={{ height: 260 }}>
              <Bar data={comorChart} options={{
                ...barOpts('Comorbidity', comorLabels, comorValues),
                indexAxis: 'y' as const,
                scales: {
                  y: { grid: { display: false }, ticks: { font: { size: 9, family: "'DM Sans', sans-serif", weight: 600 }, color: '#94a3b8' }, border: { display: false } },
                  x: { grid, ticks: noTicks, border: { display: false } }
                },
              } as never} />
            </div>
          </div>
        </div>

        {/* ──────────── MOCK LIVE PATIENT REGISTRY SANDBOX ──────────── */}
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
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>Live Patient Registry Sandbox</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Displays first 5 records in current active filtered cohort</p>
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

          {/* Paginated patient card grids */}
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
                No active matching sandbox patients in filtered scope.
              </div>
            )}
          </div>
        </div>

        {/* ──────────── FLOATING DETAILED CHART CLICK TOOLTIP PANEL ──────────── */}
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
                🔍 Clinical Insight: {tooltipInfo.title}
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
              Dismiss Insight
            </button>
          </div>
        )}
      </div>

      {/* Embedded CSS for animations and custom styles */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out forwards;
        }
        .spin-anim {
          transform: rotate(360deg);
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
