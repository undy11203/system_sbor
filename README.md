# Система сбора информации о студентах

Интеллектуальное веб-приложение для автоматизации документооборота кафедры, связанного со студентами, практиками и ВКР.

## Архитектура системы

### Технологический стек
- **Frontend**: React + TypeScript
- **Backend**: Python + FastAPI
- **Database**: PostgreSQL
- **Ontology**: GraphDB/OWL
- **File Storage**: MinIO
- **Containerization**: Docker + Docker Compose

### Основные подсистемы

1. **Веб-интерфейс** - взаимодействие с пользователем, динамические формы
2. **Слой динамического формирования форм** - построение форм на основе онтологии
3. **Модуль генерации документов** - генерация DOCX/PDF по шаблонам
4. **Онтология и база знаний** - описание сущностей и проверка согласованности
5. **Q/A-модуль** - помощь пользователям на естественном языке
6. **Интеграционный слой** - обмен данными с внешними системами

## Документы, поддерживаемые в MVP

- Заявление на практику
- Заявление на ВКР
- Индивидуальное задание
- Отчёт по практике
- Отзыв руководителя практики

## Установка и запуск

```bash
# Клонирование репозитория
git clone <repository-url>
cd system_sbor

# Запуск в Docker
docker-compose up -d

# Локальная разработка
## Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

## Frontend
cd frontend
npm install
npm run dev
```

## Структура проекта

```
system_sbor/
├── backend/          # FastAPI backend
├── frontend/         # React frontend
├── ontology/         # OWL онтология
├── templates/        # DOCX шаблоны документов
├── docker-compose.yml
└── README.md
```
