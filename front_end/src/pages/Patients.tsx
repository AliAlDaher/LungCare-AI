import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, User, Stethoscope
} from 'lucide-react';
import { useAuth } from '../App';
import { 
  fetchPatientsRoster, 
  registerNewPatient, 
  fetchPatientPredictionsHistory
} from '../services/patients';
import type { Patient, PredictionRecord } from '../services/patients';

// Import extracted sub-components
import { AddPatientModal } from '../components/patients/AddPatientModal';
import { PatientSidebar } from '../components/patients/PatientSidebar';
import { TimelinePanel } from '../components/patients/TimelinePanel';
import { ReportOverlay } from '../components/patients/ReportOverlay';


const Patients: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';
  
  // State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('All');
  
  // Selected Patient & Prediction History
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [history, setHistory] = useState<PredictionRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<PredictionRecord | null>(null);
  


  // New Patient Form Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // Fetch all patients
  const fetchPatients = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchPatientsRoster();
      setPatients(data.patients || []);

      
      // Auto-select first patient if available and none selected yet
      if (data.patients && data.patients.length > 0 && !selectedPatient) {
        setSelectedPatient(data.patients[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not connect to Flask backend server. Ensure it is running on port 5174.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch selected patient prediction history
  const fetchPatientHistory = async (patientId: string) => {
    setHistoryLoading(true);
    setHistory([]);
    try {
      const data = await fetchPatientPredictionsHistory(patientId);
      setHistory(data.history || []);
    } catch (err) {
      console.error('Error fetching patient prediction timeline:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientHistory(selectedPatient.patient_id);
    } else {
      setHistory([]);
    }
  }, [selectedPatient]);

  // Handle registering a new patient
  const handleAddPatientSubmit = async (name: string, age: number, gender: string) => {
    setAddError('');
    setAddLoading(true);
    try {
      const data = await registerNewPatient(name, age, gender);
      const added: Patient = data.patient;
      setPatients(prev => [added, ...prev]);
      setSelectedPatient(added);
      setShowAddModal(false);
    } catch (err: any) {
      console.error(err);
      setAddError(err.message || 'Error connecting to Flask backend server.');
      throw err;
    } finally {
      setAddLoading(false);
    }
  };

  // Pre-fill prediction forms and navigate
  const handleRunPrediction = (patient: Patient) => {
    navigate('/predict', {
      state: {
        prefillPatient: {
          patientId: patient.patient_id,
          name: patient.name,
          age: String(patient.age),
          gender: patient.gender
        }
      }
    });
  };



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

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem' }}>
      
      {/* 1. Header Banner */}
      <div style={{
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 900,
            letterSpacing: '-1px',
            background: 'linear-gradient(135deg, #fff 60%, var(--teal))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 4
          }}>
            Patient Health Directory
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Manage patient records and view prediction history.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary" 
            style={{ 
              padding: '10px 18px', 
              fontSize: '0.82rem',
              fontWeight: 700
            }}
          >
            <Plus size={16} /> Register New Patient
          </button>
        </div>
      </div>



      {/* Main Workspace Layout: Grid Split */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '360px 1fr', 
        gap: 30,
        alignItems: 'flex-start'
      }}>
        
        {/* SIDEBAR: PATIENTS LIST */}
        <PatientSidebar
          patients={patients}
          selectedPatient={selectedPatient}
          onSelectPatient={setSelectedPatient}
          loading={loading}
          error={error}
          onRetry={fetchPatients}
          search={search}
          onSearchChange={setSearch}
          genderFilter={genderFilter}
          onGenderFilterChange={setGenderFilter}
        />

        {/* MAIN PANEL: PATIENT PROFILE & TIMELINE */}
        <main>
          {selectedPatient ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
              
              {/* PROFILE SUMMARY CARD */}
              <div className="card" style={{ 
                padding: '2rem',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Background decorative glows */}
                <div style={{
                  position: 'absolute', right: '-10%', top: '-20%',
                  width: 300, height: 300, borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(0,201,177,0.04) 0%, transparent 70%)',
                  pointerEvents: 'none'
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 38, height: 38, borderRadius: 10,
                        background: 'rgba(0,201,177,0.1)', border: '1px solid rgba(0,201,177,0.2)',
                        color: 'var(--teal)'
                      }}>
                        <User size={18} />
                      </span>
                      <div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>{selectedPatient.name}</h2>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: 0.5 }}>
                          SYSTEM ID: {selectedPatient.patient_id}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      gap: 20, 
                      fontSize: '0.8rem', 
                      color: 'var(--text-secondary)',
                      marginTop: 14,
                      fontWeight: 600
                    }}>
                      <div>Gender: <strong style={{ color: '#fff' }}>{selectedPatient.gender}</strong></div>
                      <div>Age: <strong style={{ color: '#fff' }}>{selectedPatient.age} years</strong></div>
                      <div>Registered: <strong style={{ color: '#fff' }}>{formatDate(selectedPatient.created_at)}</strong></div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleRunPrediction(selectedPatient)}
                    className="btn-primary"
                    style={{ 
                      alignSelf: 'center', 
                      background: 'linear-gradient(135deg, var(--teal), var(--blue))',
                      border: 'none',
                      boxShadow: '0 4px 15px -4px rgba(0,201,177,0.4)',
                      padding: '12px 22px',
                      fontSize: '0.8rem',
                      fontWeight: 700
                    }}
                  >
                    <Stethoscope size={15} /> Run Diagnostic Prediction
                  </button>
                </div>
              </div>

              {/* TIMELINE SECTION */}
              <TimelinePanel
                selectedPatient={selectedPatient}
                history={history}
                historyLoading={historyLoading}
                onRunPrediction={handleRunPrediction}
                onReviewReport={setSelectedReport}
              />

            </div>
          ) : (
            /* EMPTY INITIAL STATE */
            <div className="card" style={{ 
              padding: '6rem 2rem', 
              textAlign: 'center',
              border: '1px dashed rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.005)'
            }}>
              <Stethoscope size={48} style={{ color: 'var(--teal)', opacity: 0.15, marginBottom: 18, display: 'inline-block' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: 6 }}>No Selected Patient</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 400, margin: '0 auto 20px', lineHeight: 1.5 }}>
                Select a patient from the list to view their prediction history, or add a new patient.
              </p>
              <button 
                onClick={() => setShowAddModal(true)}
                className="btn-primary"
                style={{ padding: '10px 20px', fontSize: '0.8rem', fontWeight: 700 }}
              >
                <Plus size={16} /> Register New Patient
              </button>
            </div>
          )}
        </main>

      </div>

      {/* 3. MODAL DIALOGS */}
      
      {/* ADD PATIENT MODAL */}
      {showAddModal && (
        <AddPatientModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddPatientSubmit}
          addLoading={addLoading}
          addError={addError}
        />
      )}

      {/* FULL HISTORICAL REPORT OVERLAY */}
      {selectedReport && (
        <ReportOverlay
          record={selectedReport}
          onClose={() => setSelectedReport(null)}
          isDoctor={isDoctor}
        />
      )}

      {/* Global CSS styles injected for animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        
        .card-hover-highlight:hover {
          background: rgba(255, 255, 255, 0.035) !important;
          border-color: rgba(0, 201, 177, 0.15) !important;
          box-shadow: 0 4px 20px -8px rgba(0,201,177,0.1) !important;
        }

        /* custom scrollbar */
        ::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      `}</style>

    </div>
  );
};

export default Patients;
