export type DocumentStatus = 'draft' | 'pending' | 'review' | 'approved' | 'rejected';
export type DocumentType = 'application' | 'review' | 'plan' | 'report' | 'thesis';

export interface Document {
  id: string;
  title: string;
  type: DocumentType;
  typeName: string;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
  studentId: string;
  studentName: string;
  supervisorId?: string;
  supervisorName?: string;
  content?: DocumentContent;
  comments?: Comment[];
}

export interface DocumentContent {
  [key: string]: string | number | boolean | Date | undefined;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'student' | 'teacher';
  text: string;
  createdAt: string;
}

export interface DocumentTypeConfig {
  id: DocumentType;
  name: string;
  description: string;
  fields: FormField[];
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'number' | 'email' | 'checkbox';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  dependsOn?: {
    field: string;
    value: string | boolean;
  };
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  application: 'Заявление',
  review: 'Отзыв',
  plan: 'План работы',
  report: 'Отчёт',
  thesis: 'ВКР (Выпускная квалификационная работа)',
};

export const STATUS_LABELS: Record<DocumentStatus, { label: string; color: string }> = {
  draft: { label: 'Черновик', color: '#9e9e9e' },
  pending: { label: 'На рассмотрении', color: '#ff9800' },
  review: { label: 'На доработке', color: '#2196f3' },
  approved: { label: 'Утверждён', color: '#4caf50' },
  rejected: { label: 'Отклонён', color: '#f44336' },
};