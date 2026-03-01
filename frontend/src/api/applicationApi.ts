import axios from 'axios';

const api = axios.create({ baseURL: '/api/applications' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface SubmitApplicationRequest {
  degree: string;
  /** Student DatatypeProperty values: full prop URI → literal value */
  studentDatatype: Record<string, string>;
  /** Student ObjectProperty values: full prop URI → individual URI */
  studentObject: Record<string, string>;
  /** VKR DatatypeProperty values: full prop URI → literal value */
  vkrDatatype: Record<string, string>;
  /** VKR ObjectProperty values: full prop URI → individual URI */
  vkrObject: Record<string, string>;
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
