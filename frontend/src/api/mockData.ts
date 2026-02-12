import type { Document, DocumentTypeConfig, QAResponse } from '../types';

// Моковые документы
export const MOCK_DOCUMENTS: Document[] = [
  {
    id: '1',
    title: 'Заявление на тему ВКР',
    type: 'application',
    typeName: 'Заявление',
    status: 'approved',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    studentId: '1',
    studentName: 'Иванов Иван Иванович',
    supervisorId: '2',
    supervisorName: 'Петров Петр Петрович',
    content: {
      topic: 'Разработка системы управления базами данных',
      relevance: 'Актуальность темы обусловлена...',
      goals: 'Создание эффективной системы...',
    },
    comments: [
      {
        id: 'c1',
        authorId: '2',
        authorName: 'Петров Петр Петрович',
        authorRole: 'teacher',
        text: 'Тема утверждена. Рекомендую начать с анализа предметной области.',
        createdAt: '2024-01-20T14:30:00Z',
      },
    ],
  },
  {
    id: '2',
    title: 'План работы над ВКР',
    type: 'plan',
    typeName: 'План работы',
    status: 'review',
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-02-05T16:00:00Z',
    studentId: '1',
    studentName: 'Иванов Иван Иванович',
    supervisorId: '2',
    supervisorName: 'Петров Петр Петрович',
    content: {
      semester: 'весенний',
      stages: '1. Анализ (февраль)\n2. Проектирование (март)\n3. Реализация (апрель)',
    },
    comments: [
      {
        id: 'c2',
        authorId: '2',
        authorName: 'Петров Петр Петрович',
        authorRole: 'teacher',
        text: 'Необходимо добавить более детальное расписание по неделям.',
        createdAt: '2024-02-05T16:00:00Z',
      },
    ],
  },
  {
    id: '3',
    title: 'Отзыв на ВКР студента Сидорова',
    type: 'review',
    typeName: 'Отзыв',
    status: 'draft',
    createdAt: '2024-02-10T11:00:00Z',
    updatedAt: '2024-02-10T11:00:00Z',
    studentId: '3',
    studentName: 'Сидоров Алексей Алексеевич',
    supervisorId: '2',
    supervisorName: 'Петров Петр Петрович',
  },
];

// Конфигурации типов документов (структуры форм)
export const DOCUMENT_TYPE_CONFIGS: Record<string, DocumentTypeConfig> = {
  application: {
    id: 'application',
    name: 'Заявление',
    description: 'Заявление на тему выпускной квалификационной работы',
    fields: [
      {
        name: 'topic',
        label: 'Тема ВКР',
        type: 'text',
        required: true,
        placeholder: 'Введите тему выпускной работы',
        validation: {
          min: 10,
          max: 200,
          message: 'Тема должна содержать от 10 до 200 символов',
        },
      },
      {
        name: 'type',
        label: 'Тип работы',
        type: 'select',
        required: true,
        options: [
          { value: 'theoretical', label: 'Теоретическая' },
          { value: 'practical', label: 'Прикладная' },
          { value: 'development', label: 'Разработка ПО' },
        ],
      },
      {
        name: 'relevance',
        label: 'Актуальность темы',
        type: 'textarea',
        required: true,
        placeholder: 'Опишите актуальность выбранной темы...',
        validation: {
          min: 50,
          message: 'Опишите актуальность подробнее (минимум 50 символов)',
        },
      },
      {
        name: 'goals',
        label: 'Цели и задачи',
        type: 'textarea',
        required: true,
        placeholder: 'Перечислите цели и задачи работы...',
      },
      {
        name: 'hasAgreement',
        label: 'Согласовано с руководителем',
        type: 'checkbox',
        required: true,
      },
    ],
  },
  plan: {
    id: 'plan',
    name: 'План работы',
    description: 'Календарный план выполнения ВКР',
    fields: [
      {
        name: 'semester',
        label: 'Семестр',
        type: 'select',
        required: true,
        options: [
          { value: 'fall', label: 'Осенний' },
          { value: 'spring', label: 'Весенний' },
        ],
      },
      {
        name: 'startDate',
        label: 'Дата начала',
        type: 'date',
        required: true,
      },
      {
        name: 'endDate',
        label: 'Дата окончания',
        type: 'date',
        required: true,
      },
      {
        name: 'stages',
        label: 'Этапы работы',
        type: 'textarea',
        required: true,
        placeholder: 'Опишите основные этапы работы по месяцам...',
      },
      {
        name: 'deadlines',
        label: 'Контрольные сроки',
        type: 'textarea',
        required: false,
        placeholder: 'Укажите ключевые контрольные точки...',
      },
    ],
  },
  review: {
    id: 'review',
    name: 'Отзыв',
    description: 'Отзыв руководителя на выпускную работу',
    fields: [
      {
        name: 'quality',
        label: 'Качество работы',
        type: 'select',
        required: true,
        options: [
          { value: 'excellent', label: 'Отлично' },
          { value: 'good', label: 'Хорошо' },
          { value: 'satisfactory', label: 'Удовлетворительно' },
        ],
      },
      {
        name: 'content',
        label: 'Содержание отзыва',
        type: 'textarea',
        required: true,
        placeholder: 'Напишите развёрнутый отзыв о работе студента...',
        validation: {
          min: 100,
          message: 'Отзыв должен быть развёрнутым (минимум 100 символов)',
        },
      },
      {
        name: 'recommendations',
        label: 'Рекомендации',
        type: 'textarea',
        required: false,
        placeholder: 'Укажите рекомендации по доработке (если есть)...',
      },
    ],
  },
};

// Моковые ответы Q/A
export const MOCK_QA_RESPONSES: Record<string, QAResponse> = {
  'формат темы': {
    answer: 'Формат темы ВКР должен соответствовать ГОСТ 7.32-2017. Тема должна:\n\n1. Начинаться с глагола (Разработка, Исследование, Анализ, Создание...)\n2. Содержать объект и предмет исследования\n3. Быть конкретной и измеримой\n4. Не превышать 200 символов\n\nПример хорошей темы: "Разработка системы управления базами данных для автоматизации учёта студентов"',
    suggestions: [
      'Проверьте, что тема начинается с глагола',
      'Убедитесь, что указан объект автоматизации',
      'Избегайте общих формулировок',
    ],
    confidence: 0.95,
  },
  'актуальность': {
    answer: 'Актуальность темы обосновывается следующими факторами:\n\n1. Практическая значимость проблемы\n2. Отсутствие эффективных решений\n3. Соответствие современным требованиям\n4. Потребность в автоматизации\n\nВ актуальности должно быть не менее 3-4 абзацев с конкретными примерами и статистикой.',
    suggestions: [
      'Приведите статистические данные',
      'Укажите конкретные проблемы без автоматизации',
      'Опишите последствия нерешённой проблемы',
    ],
    confidence: 0.88,
  },
  default: {
    answer: 'Спасибо за вопрос! Для получения точного ответа, пожалуйста, уточните:\n\n- Какой тип документа вас интересует?\n- О каком конкретном разделе идёт речь?\n- Есть ли у вас черновик текста?',
    suggestions: [
      'Задайте более конкретный вопрос',
      'Укажите тип документа',
      'Приложите текст для проверки',
    ],
    confidence: 0.5,
  },
};

// Имитация задержки API
export const mockDelay = (ms: number = 500) => 
  new Promise(resolve => setTimeout(resolve, ms));