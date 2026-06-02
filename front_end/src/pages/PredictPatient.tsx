import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Send, User, AlertCircle } from 'lucide-react';
import { requestPrediction } from '../services/predict';

// Types
interface FormData {
  patientId?: string;
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
  patientId: '',
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
  { id: 'demographics', label: 'Patient Information' },
  { id: 'risk', label: 'Lifestyle & Health Risks' },
  { id: 'tumor', label: 'Tumor Details' },
  { id: 'comorbidities', label: 'Pre-existing Conditions' },
  { id: 'vitals', label: 'Vital Signs' },
  { id: 'labs', label: 'Blood Test Results' },
];

// Helpers
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

// Input helpers
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

// Main component
const PredictPatient: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState<FormData>(initialForm);
  const [activeSection, setActiveSection] = useState('demographics');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Apply prefill if navigating from Patients roster page
  useEffect(() => {
    const prefill = location.state?.prefillPatient;
    if (prefill) {
      setForm(prev => ({
        ...prev,
        patientId: prefill.patientId,
        age: prefill.age || '',
        gender: prefill.gender || ''
      }));
    }
  }, [location.state]);

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
    setSubmitError(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const data = await requestPrediction(form, controller.signal);
      clearTimeout(timeout);
      navigate('/results', { state: { prediction: data, formData: form } });
    } catch {
      setSubmitError('Could not reach the prediction server. Please check that the backend is running and try again.');
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

        {submitError && (
          <div style={{
            background: 'rgba(255,107,107,0.1)',
            border: '1px solid rgba(255,107,107,0.25)',
            borderRadius: 12,
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: '0.85rem',
            color: 'var(--coral)',
            fontWeight: 600,
            animation: 'fadeInUp 0.3s ease forwards'
          }}>
            <AlertCircle size={16} />
            {submitError}
          </div>
        )}

        {form.patientId && (
          <div style={{
            background: 'rgba(0, 201, 177, 0.08)',
            border: '1px solid rgba(0, 201, 177, 0.25)',
            borderRadius: 12,
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: '0.85rem',
            color: '#fff',
            animation: 'fadeInUp 0.3s ease forwards'
          }}>
            <User size={16} color="var(--teal)" />
            <div style={{ flex: 1 }}>
              Linked to: <strong style={{ color: 'var(--teal)' }}>{location.state?.prefillPatient?.name || 'Selected Patient'}</strong> (ID: {form.patientId})
            </div>
            <button
              type="button"
              onClick={() => {
                setForm(prev => ({ ...prev, patientId: '' }));
              }}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.74rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 6,
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
            >
              Clear
            </button>
          </div>
        )}

        {/* Demographics */}
        <section id="demographics" className="card" onFocus={() => setActiveSection('demographics')}>
          <p className="section-title">Patient Information</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            <Field label="Age (Years)" name="age" form={form} onChange={handleChange} type="number" placeholder="e.g. 58" />
            <Select label="Gender" name="gender" form={form} onChange={handleChange} options={['Male', 'Female']} />
            <Select label="Ethnicity" name="ethnicity" form={form} onChange={handleChange} options={['Caucasian', 'African American', 'Hispanic', 'Asian', 'Other']} />
            <Select label="Insurance Plan Type" name="insurance" form={form} onChange={handleChange} options={['Private', 'Medicare', 'Medicaid', 'Uninsured']} />
          </div>
        </section>

        {/* Risk Factors */}
        <section id="risk" className="card" onFocus={() => setActiveSection('risk')}>
          <p className="section-title">Lifestyle & Health Risks</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            <Select label="Smoking History" name="smokingHistory" form={form} onChange={handleChange} options={['Never', 'Former', 'Current']} />
            <Field label="Smoking Exposure (Pack-Years)" name="packYears" form={form} onChange={handleChange} type="number" placeholder="e.g. 20" />
            <Select label="Family History of Cancer" name="familyHistory" form={form} onChange={handleChange} options={['Yes', 'No']} />
          </div>
        </section>

        {/* Tumor & Disease */}
        <section id="tumor" className="card" onFocus={() => setActiveSection('tumor')}>
          <p className="section-title">Tumor Details</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            <Field label="Tumor Size (in millimeters)" name="tumorSize" form={form} onChange={handleChange} type="number" placeholder="e.g. 35" />
            <Select label="Tumor Location" name="location" form={form} onChange={handleChange} options={['Upper Lobe', 'Middle Lobe', 'Lower Lobe', 'Main Bronchus']} />
            <Select label="Physical Activity Level (ECOG)" name="ecog" form={form} onChange={handleChange} options={['0 - Fully Active', '1 - Restricted Strenuous Work', '2 - Capable of Self-Care', '3 - Limited Self-Care', '4 - Completely Bedridden']} />
            <Select label="Treatment Method" name="treatment" form={form} onChange={handleChange} options={['Surgery', 'Chemotherapy', 'Radiation', 'Targeted Therapy', 'Immunotherapy', 'Combined']} />
          </div>
        </section>

        {/* Comorbidities */}
        <section id="comorbidities" className="card" onFocus={() => setActiveSection('comorbidities')}>
          <p className="section-title">Pre-existing Chronic Conditions</p>
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
            <Field label="Systolic BP (Pressure - top number)" name="systolicBP" form={form} onChange={handleChange} type="number" placeholder="e.g. 120" />
            <Field label="Diastolic BP (Pressure - bottom number)" name="diastolicBP" form={form} onChange={handleChange} type="number" placeholder="e.g. 80" />
            <Field label="Pulse (Beats per minute)" name="pulse" form={form} onChange={handleChange} type="number" placeholder="e.g. 72" />
          </div>
        </section>

        {/* Lab Results */}
        <section id="labs" className="card" onFocus={() => setActiveSection('labs')}>
          <p className="section-title">Blood Test Results</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            <Field label="Hemoglobin (Oxygen delivery)" name="hemoglobin" form={form} onChange={handleChange} type="number" placeholder="13.5" />
            <Field label="White Blood Cells (Immune cells)" name="wbc" form={form} onChange={handleChange} type="number" placeholder="7.0" />
            <Field label="Platelet Count (Blood clotting)" name="platelets" form={form} onChange={handleChange} type="number" placeholder="250" />
            <Field label="Albumin (Liver/kidney protein)" name="albumin" form={form} onChange={handleChange} type="number" placeholder="4.0" />
            <Field label="ALP (Liver enzyme test)" name="alp" form={form} onChange={handleChange} type="number" placeholder="70" />
            <Field label="ALT (Liver damage check)" name="alt" form={form} onChange={handleChange} type="number" placeholder="25" />
            <Field label="AST (Cell health marker)" name="ast" form={form} onChange={handleChange} type="number" placeholder="28" />
            <Field label="Creatinine (Kidney filter test)" name="creatinine" form={form} onChange={handleChange} type="number" placeholder="1.0" />
            <Field label="LDH (Tissue health test)" name="ldh" form={form} onChange={handleChange} type="number" placeholder="200" />
            <Field label="Calcium (Bone & nerve test)" name="calcium" form={form} onChange={handleChange} type="number" placeholder="9.5" />
            <Field label="Glucose (Blood sugar level)" name="glucose" form={form} onChange={handleChange} type="number" placeholder="100" />
            <Field label="Sodium (Hydration level)" name="sodium" form={form} onChange={handleChange} type="number" placeholder="140" />
            <Field label="Potassium (Heart rhythm check)" name="potassium" form={form} onChange={handleChange} type="number" placeholder="4.2" />
            <Field label="Phosphorus (Bone energy test)" name="phosphorus" form={form} onChange={handleChange} type="number" placeholder="3.5" />
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
