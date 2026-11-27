# Система сбора информации о студентах

Веб-приложение для автоматизации документооборота кафедры: сбора информации о студентах, практиках и ВКР, работы с OWL-онтологией и формирования DOCX-документов. В системе предусмотрены роли студента и секретаря, авторизация по коду из письма и JWT.

## Технологии

- **Backend:** Java 17, Spring Boot 3.2, Maven, Spring Security, Spring Data JPA.
- **Frontend:** React 18, TypeScript, Vite.
- **Данные:** PostgreSQL, Apache Jena Fuseki, OWL/SPARQL.
- **Документы:** Apache POI и DOCX-шаблоны.

## Требования

Для локальной разработки необходимы:

- Java 17;
- Maven 3.9+;
- Node.js 20+ и npm;
- PostgreSQL;
- Docker с Docker Compose для запуска Fuseki.

## Запуск

### 1. Запуск Fuseki

Из корня репозитория:

```bash
docker compose up -d
```

В текущей конфигурации Compose запускает **только Fuseki**. Backend закомментирован в `docker-compose.yml`, а frontend и PostgreSQL как Docker-сервисы не настроены.

После запуска доступны:

- веб-интерфейс Fuseki: <http://localhost:3030/>;
- SPARQL endpoint: <http://localhost:3030/ontology/sparql>;
- SPARQL Update: <http://localhost:3030/ontology/update>.

Онтология загружается из `hepler/src/main/resources/main_students_all.owl`.

### 2. Подготовка PostgreSQL

Создайте базу данных:

```bash
createdb system_sbor
```

По умолчанию backend использует `jdbc:postgresql://localhost:5432/system_sbor`. Параметры подключения можно переопределить переменными окружения:

```bash
export DB_URL=jdbc:postgresql://localhost:5432/system_sbor
export DB_USERNAME=postgres
export DB_PASSWORD='<пароль>'
```

### 3. Настройка backend

Для отправки писем и работы JWT задайте собственные значения:

```bash
export MAIL_USERNAME='<адрес отправителя>'
export MAIL_PASSWORD='<пароль приложения SMTP>'
export JWT_SECRET='<случайный секрет длиной не менее 32 символов>'
```

При необходимости адреса Fuseki также можно изменить:

```bash
export FUSEKI_ENDPOINT=http://localhost:3030/ontology/sparql
export FUSEKI_UPDATE_ENDPOINT=http://localhost:3030/ontology/update
```

Остальные настройки находятся в `backend/src/main/resources/application.properties`.

### 4. Запуск backend

Backend зависит от локального Maven-модуля `helper`, поэтому сначала установите его в локальный репозиторий Maven, а затем запустите приложение:

```bash
mvn -f hepler/pom.xml install
cd backend
mvn spring-boot:run
```

Backend будет доступен по адресу <http://localhost:8080>.

### 5. Запуск frontend

В отдельном терминале:

```bash
cd frontend
npm install
npm run dev
```

Frontend откроется на <http://localhost:5173>. Запросы к `/api` проксируются Vite на `http://localhost:8080`.

## Сборка и проверка

Backend:

```bash
cd backend
mvn test
mvn package
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

## Основные каталоги

```text
system_sbor/
├── backend/                  # Spring Boot backend
│   └── src/main/resources/
│       ├── templates/        # DOCX-шаблоны документов
│       └── application.properties
├── frontend/                 # React + TypeScript frontend
├── hepler/                   # Maven-модуль helper и исходные OWL-онтологии
│   └── src/main/resources/main_students_all.owl
├── jena/                     # Docker-образ Apache Jena Fuseki
├── docker-compose.yml        # Запуск Fuseki
└── README.md
```
