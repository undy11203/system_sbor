import axios from 'axios';
import type { SparqlQueryRequest, AskQueryResponse, SparqlResult, Individual, ClassHierarchyEntry, FormSchema } from '../types';

const api = axios.create({
  baseURL: '/api/sparql',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function executeQuery(query: string): Promise<SparqlResult[]> {
  const { data } = await api.post<SparqlResult[]>('/query', { query } as SparqlQueryRequest);
  return data;
}

export async function executeAskQuery(query: string): Promise<boolean> {
  const { data } = await api.post<AskQueryResponse>('/ask', { query } as SparqlQueryRequest);
  return data.result;
}

export async function getAllClasses(): Promise<string[]> {
  const { data } = await api.get<string[]>('/classes');
  return data;
}

export async function getClassHierarchy(): Promise<ClassHierarchyEntry[]> {
  const { data } = await api.get<ClassHierarchyEntry[]>('/class-hierarchy');
  return data;
}

export async function getIndividuals(classUri: string): Promise<Individual[]> {
  const { data } = await api.get<Individual[]>('/individuals', {
    params: { classUri },
  });
  return data;
}

export async function getFormSchema(classUri: string): Promise<FormSchema> {
  const { data } = await api.get<FormSchema>('/form-schema', {
    params: { classUri },
  });
  return data;
}

export async function saveIndividual(
  classUri: string,
  datatypeProperties: Record<string, string>,
  objectProperties: Record<string, string>,
  objectRanges: Record<string, string>
): Promise<{ uri: string; status: string }> {
  const { data } = await api.post<{ uri: string; status: string }>('/individual', {
    classUri,
    datatypeProperties,
    objectProperties,
    objectRanges,
  });
  return data;
}
