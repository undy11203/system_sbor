import axios from 'axios';

const api = axios.create({ baseURL: '/api/applications' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface SubmitApplicationRequest {
  degree: string;
  /** Flat map: full OWL property URI → value (literal or individual URI) */
  values: Record<string, string>;
}

export interface SubmitApplicationResponse {
  studentUri: string;
  vkrUri: string | null;
  status: string;
}

export async function submitApplication(req: SubmitApplicationRequest): Promise<SubmitApplicationResponse> {
  const { data } = await api.post<SubmitApplicationResponse>('', req);
  return data;
}
