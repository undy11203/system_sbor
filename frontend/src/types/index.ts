export interface SparqlQueryRequest {
  query: string;
}

export interface AskQueryResponse {
  result: boolean;
}

export interface Individual {
  individual: string;
  label: string;
}

export type SparqlResult = Record<string, string>;

export interface ClassHierarchyEntry {
  class: string;
  parent?: string;
}

export interface ClassTreeNode {
  uri: string;
  label: string;
  children: ClassTreeNode[];
}

export interface FormFieldOption {
  uri: string;
  label: string;
}

export interface FormField {
  uri: string;
  type: 'datatype' | 'object';
  inputType: 'text' | 'number' | 'date' | 'checkbox' | 'select';
  label: string;
  range?: string;
  comment?: string;
  required?: boolean;
  options?: FormFieldOption[];
}

export interface FormSchema {
  classUri: string;
  className: string;
  description?: string;
  fields: FormField[];
}
