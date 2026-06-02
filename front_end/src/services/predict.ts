import { apiRequest } from './api';

export interface PredictionResponse {
  predicted_stage: string;
  stage_probabilities: Record<string, number>;
  predicted_survival_months: number;
  feature_importances: Array<{ name: string; val: number }>;
  model_version: string;
  patient_id?: string;
  saved_to_db?: boolean;
}

export async function requestPrediction(formData: Record<string, any>, signal?: AbortSignal): Promise<PredictionResponse> {
  return apiRequest<PredictionResponse>('/predict', {
    method: 'POST',
    body: JSON.stringify(formData),
    signal,
  });
}
