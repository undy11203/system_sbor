import axios from 'axios';

const api = axios.create({ baseURL: '/api/forms' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface FormFieldSpec {
  prop: string;
  propUri: string;
  entity: 'student' | 'vkr';
  type: 'datatype' | 'object';
  label: string;
  required: boolean;
  hint?: string;
  range?: string;
  rangeUri?: string;
}

export interface FormSection {
  title: string;
  fields: FormFieldSpec[];
}

export interface FormSchema {
  namespace: string;
  sections: FormSection[];
}

export async function getFormSchema(): Promise<FormSchema> {
  const { data } = await api.get<FormSchema>('/schema');
  return data;
}
