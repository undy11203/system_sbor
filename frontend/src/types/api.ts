// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  details?: string;
}

// Q/A Types
export interface QARequest {
  question: string;
  context?: string;
  documentType?: string;
}

export interface QAResponse {
  answer: string;
  suggestions?: string[];
  confidence: number;
}

// Ontology types
export interface OntologyStructure {
  documentType: string;
  fields: {
    name: string;
    type: string;
    label: string;
    required: boolean;
    constraints?: Record<string, unknown>;
  }[];
  rules: {
    field: string;
    condition: string;
    message: string;
  }[];
}