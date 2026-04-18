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
  status: string;
}

export async function submitApplication(
  req: SubmitApplicationRequest,
  type = 'student',
): Promise<SubmitApplicationResponse> {
  const { data } = await api.post<SubmitApplicationResponse>('', req, { params: { type } });
  return data;
}

export interface EntryItem {
  uri: string;
  label: string;
  degree?: string;
}

export interface EntryData {
  values: Record<string, string>;
  labels: Record<string, string>;
}

export async function listEntries(type: string): Promise<EntryItem[]> {
  const { data } = await api.get<EntryItem[]>('', { params: { type } });
  return data;
}

export async function getEntry(uri: string, type: string): Promise<EntryData> {
  const { data } = await api.get<EntryData>('/entry', { params: { type, uri } });
  return data;
}

export async function updateEntry(
  uri: string,
  req: SubmitApplicationRequest,
  type: string,
): Promise<void> {
  await api.put('/entry', req, { params: { type, uri } });
}

export async function markReceived(uri: string): Promise<void> {
  await api.post('/receive', null, { params: { uri } });
}

export async function getSubmissionStatus(uri: string): Promise<string> {
  const { data } = await api.get<{ status: string }>('/status', { params: { uri } });
  return data.status;
}
