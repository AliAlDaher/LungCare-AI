import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';

/* ──────────── types ──────────── */
interface FormData {
  age: string; gender: string; ethnicity: string; insurance: string;
  smokingHistory: string; packYears: string; familyHistory: string;
  tumorSize: string; location: string; ecog: string; treatment: string;
  diabetes: boolean; hypertension: boolean; heartDisease: boolean;
  chronicLung: boolean; kidneyDisease: boolean; autoimmune: boolean; otherComorbidity: boolean;
  systolicBP: string; diastolicBP: string; pulse: string;
  hemoglobin: string; wbc: string; platelets: string; albumin: string;
  alp: string; alt: string; ast: string; creatinine: string;
  ldh: string; calcium: string; glucose: string; sodium: string;
  potassium: string; phosphorus: string;
}

const initialForm: FormData = {
  age: '', gender: '', ethnicity: '', insurance: '',
  smokingHistory: '', packYears: '', familyHistory: '',
  tumorSize: '', location: '', ecog: '', treatment: '',
  diabetes: false, hypertension: false, heartDisease: false,
  chronicLung: false, kidneyDisease: false, autoimmune: false, otherComorbidity: false,
  systolicBP: '', diastolicBP: '', pulse: '',
  hemoglobin: '', wbc: '', platelets: '', albumin: '',
  alp: '', alt: '', ast: '', creatinine: '',
  ldh: '', calcium: '', glucose: '', sodium: '',
  potassium: '', phosphorus: '',
};

const sections = [
  { id: 'demographics', label: 'Demographics' },
  { id: 'risk', label: 'Risk Factors' },
  { id: 'tumor', label: 'Tumor & Disease' },
  { id: 'comorbidities', label: 'Comorbidities' },
  { id: 'vitals', label: 'Vital Signs' },
  { id: 'labs', label: 'Lab Results' },
];

/* ──────────── helpers ──────────── */
const sectionFields: Record<string, (keyof FormData)[]> = {
  demographics: ['age', 'gender', 'ethnicity', 'insurance'],
  risk: ['smokingHistory', 'packYears', 'familyHistory'],
  tumor: ['tumorSize', 'location', 'ecog', 'treatment'],
  comorbidities: ['diabetes','hypertension','heartDisease','chronicLung','kidneyDisease','autoimmune','otherComorbidity'],
  vitals: ['systolicBP', 'diastolicBP', 'pulse'],
  labs: ['hemoglobin','wbc','platelets','albumin','alp','alt','ast','creatinine','ldh','calcium','glucose','sodium','potassium','phosphorus'],
};

function computeProgress(form: FormData): number {
  const allFields = Object.values(sectionFields).flat();
  let filled = 0;
  for (const key of allFields) {
    const v = form[key];
    if (typeof v === 'boolean') { /* toggles always count */ filled++; }
    else if (typeof v === 'string' && v.trim() !== '') filled++;
  }
  return Math.round((filled / allFields.length) * 100);
}

/* ──────────── Fallback simulation ──────────── */
function simulatePrediction(form: FormData) {
  const tumor = parseFloat(form.tumorSize) || 30;
  const pack = parseFloat(form.packYears) || 10;
  const age = parseFloat(form.age) || 55;
  const ecog = parseInt(form.ecog) || 1;

  let score = 0;
  score += tumor < 20 ? 0 : tumor < 40 ? 1 : tumor < 60 ? 2 : 3;
  score += pack < 10 ? 0 : pack < 30 ? 1 : 2;
  score += age < 50 ? 0 : age < 65 ? 1 : 2;
  score += ecog >= 3 ? 2 : ecog >= 2 ? 1 : 0;

  const stages = ['I', 'II', 'III', 'IV'] as const;
  let stageIdx = Math.min(3, Math.floor(score / 2.5));

  // probabilities
  const probs = { I: 0, II: 0, III: 0, IV: 0 };
  const base = [0, 0, 0, 0];
  base[stageIdx] = 0.5;
  const remaining = 0.5;
  for (let i = 0; i < 4; i++) {
    if (i !== stageIdx) {
      const dist = Math.abs(i - stageIdx);
      base[i] = remaining * (dist === 1 ? 0.45 : dist === 2 ? 0.35 : 0.2) / (dist === 1 ? (stageIdx === 0 || stageIdx === 3 ? 1 : 2) : 1);
    }
  }
  const sum = base.reduce((a, b) => a + b, 0);
  stages.forEach((s, i) => { probs[s] = Math.round((base[i] / sum) * 1000) / 10; });

  const survBase = [60, 42, 28, 12];
  const survival = +(survBase[stageIdx] + (Math.random() * 10 - 5)).toFixed(1);

  const importances = [
    { name: 'Tumor Size', val: +(0.18 + Math.random() * 0.08).toFixed(3) },
    { name: 'Pack-Years', val: +(0.14 + Math.random() * 0.06).toFixed(3) },
    { name: 'Age', val: +(0.12 + Math.random() * 0.05).toFixed(3) },
    { name: 'ECOG Status', val: +(0.10 + Math.random() * 0.05).toFixed(3) },
    { name: 'Albumin', val: +(0.07 + Math.random() * 0.04).toFixed(3) },
    { name: 'Hemoglobin', val: +(0.05 + Math.random() * 0.04).toFixed(3) },
    { name: 'LDH', val: +(0.04 + Math.random() * 0.03).toFixed(3) },
    { name: 'Smoking History', val: +(0.03 + Math.random() * 0.03).toFixed(3) },
  ].sort((a, b) => b.val - a.val);

  return {
    predicted_stage: stages[stageIdx],
    stage_probabilities: probs,
    predicted_survival_months: survival,
    feature_importances: importances,
    model_version: 'client-sim-v1',
    simulated: true,
  };
}

/* ──────────── Input helpers ──────────── */
const Field: React.FC<{
  label: string;
  name: keyof FormData;
  form: FormData;
  onChange: (name: keyof FormData, val: string) => void;
  type?: string;
  placeholder?: string;
}> = ({ label, name, form, onChange, type = 'text', placeholder }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    <input
      className="form-input"
      type={type}
      placeholder={placeholder || label}
      value={form[name] as string}
      onChange={e => onChange(name, e.target.value)}
    />
  </div>
);

const Select: React.FC<{
  label: string;
  name: keyof FormData;
  form: FormData;
  onChange: (name: keyof FormData, val: string) => void;
  options: string[];
}> = ({ label, name, form, onChange, options }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    <select
      className="form-select"
      value={form[name] as string}
      onChange={e => onChange(name, e.target.value)}
    >
      <option value="">Select {label}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const Toggle: React.FC<{
  label: string;
  name: keyof FormData;
  checked: boolean;
  onChange: (name: keyof FormData, val: boolean) => void;
}> = ({ label, name, checked, onChange }) => (
  <div className="toggle-row">
    <span className="toggle-label">{label}</span>
    <label className="toggle-switch">
      <input type="checkbox" checked={checked} onChange={e => onChange(name, e.target.checked)} />
      <span className="toggle-slider" />
    </label>
  </div>
);

/* ──────────── COMPONENT ──────────── */
const PredictPatient: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>(initialForm);
  const [activeSection, setActiveSection] = useState('demographics');
  const [submitting, setSubmitting] = useState(false);

  const progress = useMemo(() => computeProgress(form), [form]);

  const handleChange = useCallback((name: keyof FormData, val: string | boolean) => {
    setForm(prev => ({ ...prev, [name]: val }));
  }, []);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('http://localhost:5174/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      navigate('/results', { state: { prediction: data, formData: form } });
    } catch {
      const simulated = simulatePrediction(form);
      navigate('/results', { state: { prediction: simulated, formData: form } });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', maxWidth: 1300, margin: '0 auto', padding: '2rem', gap: 32 }}>
      {/* Sticky Sidebar */}
      <aside style={{
        position: 'sticky',
        top: 80,
        alignSelf: 'flex-start',
        width: 220,
        minWidth: 220,
        flexShrink: 0,
      }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 }}>
            Sections
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                style={{
                  background: activeSection === s.id ? 'rgba(0,201,177,0.1)' : 'transparent',
                  border: 'none',
                  borderLeft: `3px solid ${activeSection === s.id ? 'var(--teal)' : 'transparent'}`,
                  color: activeSection === s.id ? 'var(--teal)' : 'var(--text-secondary)',
                  padding: '8px 12px',
                  borderRadius: '0 6px 6px 0',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Progress */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Progress</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--teal)' }}>{progress}%</span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </aside>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* Demographics */}
        <section id="demographics" className="card" onFocus={() => setActiveSection('demographics')}>
          <p className="section-title">Demographics</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            <Field label="Age" name="age" form={form} onChange={handleChange} type="number" placeholder="e.g. 58" />
            <Select label="Gender" name="gender" form={form} onChange={handleChange} options={['Male', 'Female']} />
            <Select label="Ethnicity" name="ethnicity" form={form} onChange={handleChange} options={['Caucasian', 'African American', 'Hispanic', 'Asian', 'Other']} />
            <Select label="Insurance Type" name="insurance" form={form} onChange={handleChange} options={['Private', 'Medicare', 'Medicaid', 'Uninsured']} />
          </div>
        </section>

        {/* Risk Factors */}
        <section id="risk" className="card" onFocus={() => setActiveSection('risk')}>
          <p className="section-title">Risk Factors</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            <Select label="Smoking History" name="smokingHistory" form={form} onChange={handleChange} options={['Never', 'Former', 'Current']} />
            <Field label="Pack-Years" name="packYears" form={form} onChange={handleChange} type="number" placeholder="e.g. 20" />
            <Select label="Family History" name="familyHistory" form={form} onChange={handleChange} options={['Yes', 'No']} />
          </div>
        </section>

        {/* Tumor & Disease */}
        <section id="tumor" className="card" onFocus={() => setActiveSection('tumor')}>
          <p className="section-title">Tumor & Disease</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            <Field label="Tumor Size (mm)" name="tumorSize" form={form} onChange={handleChange} type="number" placeholder="e.g. 35" />
            <Select label="Tumor Location" name="location" form={form} onChange={handleChange} options={['Upper Lobe', 'Middle Lobe', 'Lower Lobe', 'Main Bronchus']} />
            <Select label="ECOG Performance Status" name="ecog" form={form} onChange={handleChange} options={['0', '1', '2', '3', '4']} />
            <Select label="Treatment" name="treatment" form={form} onChange={handleChange} options={['Surgery', 'Chemotherapy', 'Radiation', 'Targeted Therapy', 'Immunotherapy', 'Combined']} />
          </div>
        </section>

        {/* Comorbidities */}
        <section id="comorbidities" className="card" onFocus={() => setActiveSection('comorbidities')}>
          <p className="section-title">Comorbidities</p>
          <div style={{ maxWidth: 400 }}>
            <Toggle label="Diabetes" name="diabetes" checked={form.diabetes} onChange={(n, v) => handleChange(n, v)} />
            <Toggle label="Hypertension" name="hypertension" checked={form.hypertension} onChange={(n, v) => handleChange(n, v)} />
            <Toggle label="Heart Disease" name="heartDisease" checked={form.heartDisease} onChange={(n, v) => handleChange(n, v)} />
            <Toggle label="Chronic Lung Disease" name="chronicLung" checked={form.chronicLung} onChange={(n, v) => handleChange(n, v)} />
            <Toggle label="Kidney Disease" name="kidneyDisease" checked={form.kidneyDisease} onChange={(n, v) => handleChange(n, v)} />
            <Toggle label="Autoimmune Disease" name="autoimmune" checked={form.autoimmune} onChange={(n, v) => handleChange(n, v)} />
            <Toggle label="Other" name="otherComorbidity" checked={form.otherComorbidity} onChange={(n, v) => handleChange(n, v)} />
          </div>
        </section>

        {/* Vital Signs */}
        <section id="vitals" className="card" onFocus={() => setActiveSection('vitals')}>
          <p className="section-title">Vital Signs</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            <Field label="Systolic BP" name="systolicBP" form={form} onChange={handleChange} type="number" placeholder="e.g. 120" />
            <Field label="Diastolic BP" name="diastolicBP" form={form} onChange={handleChange} type="number" placeholder="e.g. 80" />
            <Field label="Pulse (bpm)" name="pulse" form={form} onChange={handleChange} type="number" placeholder="e.g. 72" />
          </div>
        </section>

        {/* Lab Results */}
        <section id="labs" className="card" onFocus={() => setActiveSection('labs')}>
          <p className="section-title">Lab Results</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            <Field label="Hemoglobin (g/dL)" name="hemoglobin" form={form} onChange={handleChange} type="number" placeholder="13.5" />
            <Field label="WBC (×10³/µL)" name="wbc" form={form} onChange={handleChange} type="number" placeholder="7.0" />
            <Field label="Platelets (×10³/µL)" name="platelets" form={form} onChange={handleChange} type="number" placeholder="250" />
            <Field label="Albumin (g/dL)" name="albumin" form={form} onChange={handleChange} type="number" placeholder="4.0" />
            <Field label="ALP (U/L)" name="alp" form={form} onChange={handleChange} type="number" placeholder="70" />
            <Field label="ALT (U/L)" name="alt" form={form} onChange={handleChange} type="number" placeholder="25" />
            <Field label="AST (U/L)" name="ast" form={form} onChange={handleChange} type="number" placeholder="28" />
            <Field label="Creatinine (mg/dL)" name="creatinine" form={form} onChange={handleChange} type="number" placeholder="1.0" />
            <Field label="LDH (U/L)" name="ldh" form={form} onChange={handleChange} type="number" placeholder="200" />
            <Field label="Calcium (mg/dL)" name="calcium" form={form} onChange={handleChange} type="number" placeholder="9.5" />
            <Field label="Glucose (mg/dL)" name="glucose" form={form} onChange={handleChange} type="number" placeholder="100" />
            <Field label="Sodium (mEq/L)" name="sodium" form={form} onChange={handleChange} type="number" placeholder="140" />
            <Field label="Potassium (mEq/L)" name="potassium" form={form} onChange={handleChange} type="number" placeholder="4.2" />
            <Field label="Phosphorus (mg/dL)" name="phosphorus" form={form} onChange={handleChange} type="number" placeholder="3.5" />
          </div>
        </section>

        {/* Submit */}
        <button className="btn-primary" type="submit" disabled={submitting} style={{ alignSelf: 'flex-end', padding: '16px 40px' }}>
          {submitting ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 18, height: 18, border: '3px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff', borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
              }} />
              Analyzing…
            </span>
          ) : (
            <><Send size={16}/> Submit Prediction</>
          )}
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </form>
    </div>
  );
};

export default PredictPatient;
