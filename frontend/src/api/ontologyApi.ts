import axios from 'axios';

const api = axios.create({ baseURL: '/api/ontology' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface FormFieldDef {
  type: 'datatype' | 'object';
  prop: string;
  localName: string;
  label?: string;
  range?: string;
  comment?: string;
}

export interface IndividualSuggestion {
  uri: string;
  label: string;
}

export async function getStudentFields(degree: string): Promise<FormFieldDef[]> {
  const { data } = await api.get<FormFieldDef[]>('/fields/student', { params: { degree } });
  return data;
}

export async function getVkrFields(): Promise<FormFieldDef[]> {
  const { data } = await api.get<FormFieldDef[]>('/fields/vkr');
  return data;
}

export async function searchIndividuals(classUri: string, search: string): Promise<IndividualSuggestion[]> {
  const { data } = await api.get<IndividualSuggestion[]>('/individuals', {
    params: { classUri, search },
  });
  return data;
}

export async function searchPropertyValues(propUri: string, search: string): Promise<IndividualSuggestion[]> {
  const { data } = await api.get<{ value: string }[]>('/property-values', {
    params: { propUri, search },
  });
  // Map value→label and value→uri so Autocomplete component works uniformly
  return data.map(d => ({ uri: d.value, label: d.value }));
}
