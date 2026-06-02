import { apiRequest } from './api';
export type Stage = 'I' | 'II' | 'III' | 'IV';

export interface PatientRow {
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

export interface Patient {
  id?: number;
  patient_id: string;
  name: string;
  age: number;
  gender: string;
  created_at: string;
}

export interface PredictionRecord {
  id?: number;
  patient_id: string;
  prediction_date: string;
  predicted_stage: string;
  predicted_survival_months: number;
  stage_probabilities: Record<string, number>;
  feature_importances: Array<{ name: string; val: number }>;
  input_data: Record<string, any>;
}

export interface PatientsResponse {
  patients: Patient[];
  mode: 'database' | 'demo_fallback';
  warning?: string;
}

export interface CreatePatientResponse {
  patient: Patient;
  mode: 'database' | 'demo_fallback';
  warning?: string;
}

export interface HistoryResponse {
  history: PredictionRecord[];
  mode: 'database' | 'demo_fallback';
}

export async function fetchPatientsRoster(): Promise<PatientsResponse> {
  return apiRequest<PatientsResponse>('/api/patients');
}

export async function registerNewPatient(name: string, age: number, gender: string): Promise<CreatePatientResponse> {
  return apiRequest<CreatePatientResponse>('/api/patients', {
    method: 'POST',
    body: JSON.stringify({ name, age, gender }),
  });
}

export async function fetchPatientPredictionsHistory(patientId: string): Promise<HistoryResponse> {
  return apiRequest<HistoryResponse>(`/api/patients/${patientId}/history`);
}

export interface AnalyticsAggregates {
  avg_age: number;
  avg_survival: number;
  avg_tumor_size: number;
  stage_dist: { [key: string]: number };
  gender_dist: { [key: string]: number };
  avg_survival_by_stage: number[];
  treatment_dist: { [key: string]: number };
  location_dist: { [key: string]: number };
  age_dist: number[];
  comorbidities_dist: { [key: string]: number };
  smoking_dist: { [key: string]: number };
  survival_dist: { [key: string]: number };
  tumor_dist: { [key: string]: number };
}

export interface AnalyticsResponse {
  patients: PatientRow[];
  total_matching: number;
  mode: 'database' | 'demo_fallback';
  aggregates?: AnalyticsAggregates;
}

export async function fetchAnalytics(filters: {
  stage: string;
  gender: string;
  smoking: string;
  treatment: string;
  location: string;
}): Promise<AnalyticsResponse> {
  const query = new URLSearchParams(filters).toString();
  return apiRequest<AnalyticsResponse>(`/api/analytics?${query}`);
}
