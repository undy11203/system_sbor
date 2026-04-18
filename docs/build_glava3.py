# -*- coding: utf-8 -*-
"""
build_glava3.py  –  Глава 3: Реализация системы
Генерирует Шабанов_глава3.docx
Запускать ПОСЛЕ gen_diagrams.py
"""

from docx import Document
from docx.shared import Pt, Cm, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import os

FONT = "Times New Roman"
SIZE = 14
LINE_SPACING = 18
DOCS_DIR = os.path.dirname(os.path.abspath(__file__))


def set_font(run, bold=False):
    run.font.name = FONT
    run.font.size = Pt(SIZE)
    run.bold = bold
    r = run._r
    rPr = r.find(qn("w:rPr"))
    if rPr is None:
        rPr = OxmlElement("w:rPr")
        r.insert(0, rPr)
    rFonts = OxmlElement("w:rFonts")
    rFonts.set(qn("w:ascii"), FONT)
    rFonts.set(qn("w:hAnsi"), FONT)
    rFonts.set(qn("w:cs"), FONT)
    rPr.insert(0, rFonts)


def para(doc, text, bold=False, align=WD_ALIGN_PARAGRAPH.JUSTIFY,
         first_indent=True, space_before=0, space_after=0):
    p = doc.add_paragraph()
    p.alignment = align
    fmt = p.paragraph_format
    fmt.line_spacing = Pt(LINE_SPACING)
    fmt.space_before = Pt(space_before)
    fmt.space_after = Pt(space_after)
    if first_indent:
        fmt.first_line_indent = Cm(1.25)
    run = p.add_run(text)
    set_font(run, bold=bold)
    return p


def heading(doc, text, level=1):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER if level == 1 else WD_ALIGN_PARAGRAPH.LEFT
    fmt = p.paragraph_format
    fmt.line_spacing = Pt(LINE_SPACING)
    fmt.space_before = Pt(12 if level == 1 else 6)
    fmt.space_after = Pt(6)
    fmt.first_line_indent = Cm(0)
    run = p.add_run(text)
    set_font(run, bold=True)
    return p


def fig_caption(doc, text):
    """Подпись к рисунку — по центру, курсив."""
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    fmt = p.paragraph_format
    fmt.line_spacing = Pt(LINE_SPACING)
    fmt.space_before = Pt(2)
    fmt.space_after = Pt(8)
    fmt.first_line_indent = Cm(0)
    run = p.add_run(text)
    run.font.name = FONT
    run.font.size = Pt(12)
    run.italic = True


def insert_image(doc, filename, width_cm=14):
    """Вставить PNG из папки docs по имени файла."""
    path = os.path.join(DOCS_DIR, filename)
    if not os.path.exists(path):
        para(doc, f"[Изображение не найдено: {filename}]", bold=True)
        return
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Cm(0)
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run()
    run.add_picture(path, width=Cm(width_cm))


def screenshot_placeholder(doc, fig_num, description):
    """Заглушка для скриншота интерфейса."""
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Cm(0)
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(2)
    # Рамка-заглушка (светло-серый текст)
    run = p.add_run(f"[ Рисунок {fig_num} — {description} ]")
    run.font.name = FONT
    run.font.size = Pt(12)
    run.font.color.rgb = RGBColor(0xAA, 0xAA, 0xAA)
    run.italic = True


def add_table_caption(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    fmt = p.paragraph_format
    fmt.line_spacing = Pt(LINE_SPACING)
    fmt.space_before = Pt(6)
    fmt.space_after = Pt(3)
    fmt.first_line_indent = Cm(0)
    run = p.add_run(text)
    set_font(run, bold=True)


def add_simple_table(doc, headers, rows):
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = "Table Grid"
    hdr_cells = table.rows[0].cells
    for i, h in enumerate(headers):
        hdr_cells[i].text = h
        for p in hdr_cells[i].paragraphs:
            for run in p.runs:
                run.font.name = FONT
                run.font.size = Pt(11)
                run.bold = True
    for r_idx, row_data in enumerate(rows):
        row_cells = table.rows[r_idx + 1].cells
        for c_idx, cell_text in enumerate(row_data):
            row_cells[c_idx].text = cell_text
            for p in row_cells[c_idx].paragraphs:
                for run in p.runs:
                    run.font.name = FONT
                    run.font.size = Pt(10)


def set_margins(doc):
    for section in doc.sections:
        section.top_margin    = Cm(2.0)
        section.bottom_margin = Cm(2.0)
        section.left_margin   = Cm(3.0)
        section.right_margin  = Cm(1.5)


# ──────────────────────────────────────────────────────────────────────────────
doc = Document()
set_margins(doc)

# ══════════════════════════════════════════════════════════════════════════════
# ГЛАВА 3
# ══════════════════════════════════════════════════════════════════════════════

heading(doc, "ГЛАВА 3. РЕАЛИЗАЦИЯ СИСТЕМЫ", level=1)

para(doc,
     "В данной главе описывается практическая реализация разработанной системы сбора информации "
     "о студентах для автоматизации документооборота кафедры. Рассматриваются ключевые "
     "технические решения, применённые при реализации серверной части, пользовательского "
     "интерфейса и сервиса отправки уведомлений, а также приводится описание сценариев "
     "работы системы.")

# ──────────────────────────────────────────────────────────────────────────────
heading(doc, "3.1 Реализация серверной части", level=2)

para(doc,
     "Серверная часть системы реализована на платформе Spring Boot 3.x (Java 17) и включает "
     "несколько слоёв: конфигурационный, слой сервисов и слой REST-контроллеров. Сборка "
     "проекта осуществляется с помощью Maven; точкой входа служит класс BackendApplication "
     "с аннотацией @SpringBootApplication. Сервер стартует на порту 8080 (настраивается "
     "через server.port в application.properties).")

para(doc,
     "Конфигурация приложения хранится в файле application.properties и включает: адрес "
     "SPARQL-эндпоинта Apache Jena Fuseki (fuseki.sparql.endpoint), адрес эндпоинта для "
     "SPARQL UPDATE-операций (fuseki.update.endpoint), базовое пространство имён онтологии "
     "(ontology.base-namespace), параметры подключения к PostgreSQL (spring.datasource.*), "
     "настройки SMTP-сервера (spring.mail.*), параметры JWT-токена (jwt.secret, "
     "jwt.expiration-hours) и список email-адресов секретарей (auth.secretary-emails). "
     "Использование переменных окружения (${DB_URL}, ${MAIL_PASSWORD} и др.) обеспечивает "
     "гибкость развёртывания без изменения исходного кода.")

para(doc,
     "На рисунке 3.1 представлена общая архитектура системы, включающая уровни "
     "Frontend, Backend, хранилищ данных и внешних сервисов.")

insert_image(doc, "diag_architecture.png", width_cm=15)
fig_caption(doc, "Рисунок 3.1 — Архитектура системы")

# 3.1.1
heading(doc, "3.1.1 Модуль аутентификации", level=2)

para(doc,
     "Аутентификация пользователей реализована по схеме «email + одноразовый код». "
     "Класс AuthService содержит метод sendVerificationCode(String email), который "
     "проверяет принадлежность адреса допустимому домену (@g.nsu.ru) или списку "
     "секретарей, генерирует шестизначный числовой код с помощью SecureRandom "
     "и сохраняет его в базе данных PostgreSQL через CodeStorageService. Код действует "
     "10 минут; периодическая задача @Scheduled(fixedRate=300000) удаляет просроченные "
     "записи из таблицы verification_codes.")

para(doc,
     "Метод verifyCode(String email, String code) проверяет корректность введённого кода. "
     "При успехе роль пользователя определяется методом resolveRole: если email совпадает "
     "с одним из секретарских адресов — присваивается роль SECRETARY, иначе — STUDENT. "
     "Далее JwtService.generateToken() формирует JWT-токен с вложенными claims email и role; "
     "токен возвращается клиенту в теле JSON-ответа AuthResponse.")

para(doc,
     "Все последующие запросы к защищённым эндпоинтам проходят через фильтр "
     "JwtAuthFilter, который извлекает токен из заголовка Authorization: Bearer <token>, "
     "верифицирует подпись, читает email и role, формирует объект "
     "UsernamePasswordAuthenticationToken и помещает его в SecurityContextHolder. "
     "Политика сессий — STATELESS: сервер не хранит серверных сессий, что упрощает "
     "горизонтальное масштабирование.")

para(doc,
     "На рисунке 3.2 показана последовательность взаимодействия компонентов при "
     "аутентификации пользователя.")

insert_image(doc, "diag_auth.png", width_cm=14)
fig_caption(doc, "Рисунок 3.2 — Схема аутентификации пользователя")

para(doc,
     "Матрица доступа, объявленная в SecurityConfig, определяет следующие правила: "
     "эндпоинты /api/auth/** открыты без авторизации; /api/applications/** доступны "
     "ролям STUDENT и SECRETARY; /api/documents/** — только SECRETARY; "
     "/api/ontology/** — любому аутентифицированному пользователю. Ошибки 401 и 403 "
     "возвращают JSON с полем error вместо HTML-страницы Spring Security по умолчанию.")

para(doc, "На рисунке 3.3 представлена страница входа в систему с полем ввода "
     "email и формой ввода кода подтверждения.")

screenshot_placeholder(doc, "3.3", "Страница входа: ввод email и кода подтверждения")
fig_caption(doc, "Рисунок 3.3 — Страница входа в систему")

# 3.1.2
heading(doc, "3.1.2 Работа с онтологией (OntologyService)", level=2)

para(doc,
     "Класс OntologyService инкапсулирует все операции чтения из онтологии через "
     "SPARQL SELECT-запросы к Apache Jena Fuseki. Запросы формируются как многострочные "
     "строки (Java Text Blocks) и выполняются через QueryExecutionHTTP из библиотеки "
     "Apache Jena 4.x. Реализованы следующие методы:")

para(doc,
     "searchIndividuals(classUri, search) — поиск экземпляров класса по подстроке в "
     "значении свойства ФИО с использованием SPARQL-функции CONTAINS(LCASE(...)). "
     "Запрос применяет UNION-шаблон для охвата прямых экземпляров класса и экземпляров "
     "подклассов, что необходимо для онтологии НГУ-кафедры. Возвращает не более 10 "
     "результатов в формате {uri, label}.")

para(doc,
     "listStudents(ns, degreeLocalNames, fioUri) — формирует список всех студентов "
     "путём UNION-запроса по классам Бакалавриат и Магистратура. Для каждого экземпляра "
     "возвращается URI, ФИО (OPTIONAL) и строка со степенью обучения (BIND(... AS ?degree)). "
     "listIndividuals(classUri, mainNamePropUri) — аналогичный метод для произвольного "
     "класса (используется для перечисления руководителей от НГУ).")

para(doc,
     "getLiteralValue и getObjectValue — методы чтения одного значения свойства для "
     "заданного экземпляра. getObjectValue поддерживает флаг reversed=true для обратных "
     "троек вида <объект> <свойство> <субъект>, что необходимо, например, для получения "
     "руководителя студента через свойство на_НГУ_практике_у.")

para(doc,
     "getIndividualProperties(individualUri, propUris) — загружает сразу несколько "
     "литеральных свойств одним SPARQL SELECT-запросом с OPTIONAL-блоками, что "
     "минимизирует число сетевых обращений к Fuseki при загрузке формы редактирования.")

# 3.1.3
heading(doc, "3.1.3 Запись данных в онтологию (ApplicationService)", level=2)

para(doc,
     "ApplicationService отвечает за создание и обновление экземпляров онтологии по "
     "данным, полученным от пользователя. На рисунке 3.4 показана последовательность "
     "обработки заявки студента — от HTTP-запроса до сохранения данных и отправки документов.")

insert_image(doc, "diag_submission.png", width_cm=15)
fig_caption(doc, "Рисунок 3.4 — Поток обработки заявки студента")

para(doc,
     "Метод submitStudent(req, schemaType, email) выполняет следующую последовательность "
     "действий:")

para(doc,
     "1. Из схемы формы (FormSchemaService.getSchema) извлекается поле, помеченное "
     "mainName: true. Значение этого поля (как правило, ФИО) очищается от пробелов и "
     "используется как локальное имя URI экземпляра. При отсутствии значения "
     "генерируется случайный восьмизначный суффикс через UUID.")

para(doc,
     "2. Формируется SPARQL INSERT DATA-запрос. Для каждого заполненного поля схемы "
     "в зависимости от типа (datatype/object) и флага reversed добавляется либо "
     "литеральная тройка (<uri> <prop> \"значение\"@ru), либо тройка с URI-объектом "
     "(<uri> <prop> <другой_uri>). Тип степени обучения (Бакалавриат / Магистратура) "
     "записывается как rdf:type.")

para(doc,
     "3. Запрос выполняется через UpdateExecHTTP к эндпоинту Fuseki /ontology/update.")

para(doc,
     "4. В таблицу student_submissions PostgreSQL добавляется запись со статусом PENDING, "
     "URI студента и email.")

para(doc,
     "5. Асинхронно (в блоке try/catch, не блокирующем ответ) вызывается "
     "DocumentFillService.generateZipViaHelper() и отправляется ZIP-архив документов "
     "на email студента через EmailService.sendDocuments().")

para(doc,
     "6. Запускается цепочка напоминаний через scheduleReminders().")

para(doc,
     "Метод updateEntry(uri, req, schemaType) реализует обновление существующего "
     "экземпляра с помощью составного SPARQL-запроса DELETE {} WHERE {} ; INSERT DATA {}. "
     "Для каждого поля схемы формируются OPTIONAL-паттерны в секции WHERE (чтобы "
     "удалить только существующие значения) и INSERT DATA с новыми значениями. Такой "
     "подход атомарен в рамках одного HTTP-запроса к Fuseki и исключает накопление "
     "дублирующих троек.")

# 3.1.4
heading(doc, "3.1.4 Генерация документов (DocumentFillService)", level=2)

para(doc,
     "DocumentFillService реализует автоматическое заполнение DOCX-шаблонов данными "
     "студента, хранящимися в Fuseki. Метод generateZipViaHelper(studentUri) выполняет "
     "следующие шаги:")

para(doc,
     "1. Запрос fetchStudentVars(studentUri) получает все атрибуты студента через "
     "SPARQL SELECT с OPTIONAL-блоками: ФИО, группа, место практики, приказ, наименование "
     "организации, профиль обучения, ФИО и должность руководителя от НГУ, ФИО и должность "
     "руководителя от организации.")

para(doc,
     "2. По rdf:type экземпляра определяется степень обучения (Бакалавриат или Магистратура). "
     "Для магистратуры дополнительно по значению поля профиль выбирается каталог шаблонов: "
     "masters/2nd_course/mda (для профиля МДА/КМИАД) или masters/2nd_course/tprs "
     "(для ТРПС). Для бакалавриата используется каталог bachelors/4th_course.")

para(doc,
     "3. Переменные из Fuseki передаются в DocumentService.generateForStudent() из "
     "библиотеки hepler — вспомогательного модуля, реализующего логику заполнения "
     "конкретных шаблонов документов (Заявление, Отзыв, Отчёт о практике и др.).")

para(doc,
     "4. Для склонения ФИО студента применяется библиотека Petrovich4j. Метод "
     "declineFio(fio, Case.Genitive) разбивает строку на три части (фамилия, имя, "
     "отчество), определяет гендер по отчеству с помощью petrovich.gender(), после чего "
     "склоняет каждую часть по нужному падежу. Пол студента также используется для "
     "формирования корректной гендерной формы слова «обучающийся/обучающаяся».")

para(doc,
     "5. Документы упаковываются в ZIP-архив (java.util.zip.ZipOutputStream) и возвращаются "
     "как массив байт, который затем прикрепляется к письму через MimeMessageHelper.")

para(doc,
     "Прямой метод generateZip() использует Apache POI (XWPFDocument) для замены "
     "плейсхолдеров в абзацах и ячейках таблиц документа. Метод replaceInRun() "
     "обходит все объекты XWPFRun документа и заменяет вхождения строк-плейсхолдеров "
     "(например, «имяСтудентаР») на реальные значения. Это позволяет редактировать "
     "шаблоны в MS Word без написания кода.")

# 3.1.5
heading(doc, "3.1.5 Схемы форм и PostgreSQL (FormSchemaService)", level=2)

para(doc,
     "Описания форм хранятся в таблице form_schemas PostgreSQL в виде JSON-строк "
     "(колонки type и schema_json). При первом запуске приложения FormSchemaService "
     "проверяет, пуста ли таблица, и если да — загружает схемы из YAML-файлов "
     "(form-schema.yaml, supervisor-ngu-schema.yaml), размещённых в classpath-ресурсах, "
     "сериализует их в JSON через ObjectMapper и сохраняет в БД.")

para(doc,
     "Метод getSchema(type) возвращает объект FormSchema, содержащий список разделов "
     "(FormSection) и полей (FormFieldSpec) с атрибутами: propUri (URI свойства "
     "онтологии), label (отображаемое имя), type (datatype/object), rangeUri (URI класса "
     "диапазона для object-полей), required, mainName (признак основного поля), "
     "reversed (направление тройки) и hint (подсказка для пользователя).")

para(doc,
     "На рисунке 3.5 представлена схема таблиц PostgreSQL, используемых в системе.")

insert_image(doc, "diag_db.png", width_cm=15)
fig_caption(doc, "Рисунок 3.5 — Схема таблиц PostgreSQL")

para(doc,
     "Такой подход позволяет добавлять новые типы документов и изменять состав полей "
     "форм без изменения исходного кода серверной части — достаточно обновить "
     "запись в таблице form_schemas.")

# ──────────────────────────────────────────────────────────────────────────────
heading(doc, "3.2 Реализация пользовательского интерфейса", level=2)

para(doc,
     "Клиентская часть системы реализована на React 19 с TypeScript. Сборка выполняется "
     "через Create React App (react-scripts 5). Приложение использует React Router для "
     "маршрутизации между страницами входа (LoginPage), формы студента (StudentFormPage) "
     "и кабинета секретаря (SecretaryPage). Взаимодействие с сервером осуществляется "
     "через библиотеку axios; JWT-токен хранится в localStorage и добавляется в заголовок "
     "Authorization всех исходящих запросов через axios-интерцептор.")

# 3.2.1
heading(doc, "3.2.1 Форма студента и автодополнение", level=2)

para(doc,
     "Страница StudentFormPage динамически строит форму на основе схемы, полученной "
     "от сервера. Хук useEffect загружает схему через getFormSchema(type), после чего "
     "компонент рендерит разделы и поля. Для каждого поля создаётся компонент FieldRow, "
     "который в зависимости от типа поля (datatype или object) подключает соответствующую "
     "функцию автодополнения: для object-полей — searchIndividuals(rangeUri, query), для "
     "datatype-полей — searchPropertyValues(propUri, query).")

para(doc,
     "Компонент Autocomplete реализует выпадающий список с подсказками. При вводе "
     "пользователем текста с задержкой 300 мс (debounce) выполняется запрос к серверу, "
     "результаты отображаются под полем ввода. Выбор подсказки фиксирует URI объекта "
     "(для object-полей) или строковое значение (для datatype-полей) в локальном состоянии "
     "компонента формы.")

para(doc,
     "Студент также выбирает степень обучения (Бакалавриат / Магистратура) через "
     "RadioGroup. При отправке формы вызывается submitApplication({ degree, values }, type), "
     "где values — словарь {propUri: value}. После успешного ответа отображается "
     "страница с подтверждением и информацией об отправленных документах.")

para(doc, "На рисунке 3.6 показана форма ввода данных студента с заполненными "
     "полями и раскрытым списком автодополнения для поля руководителя от НГУ.")

screenshot_placeholder(doc, "3.6", "Форма студента с автодополнением руководителя от НГУ")
fig_caption(doc, "Рисунок 3.6 — Форма ввода данных студента")

# 3.2.2
heading(doc, "3.2.2 Кабинет секретаря", level=2)

para(doc,
     "Страница SecretaryPage содержит три вкладки: «Добавить руководителя», "
     "«Руководители» и «Заявления студентов». Переключение вкладок реализовано "
     "через локальный стейт типа Tab.")

para(doc,
     "Вкладка «Добавить руководителя» использует компонент AddForm, который так же, "
     "как форма студента, динамически строится по схеме supervisor-ngu. Секретарь "
     "заполняет ФИО и должность руководителя; при отправке вызывается тот же "
     "эндпоинт POST /api/applications?type=supervisor-ngu.")

para(doc,
     "Вкладка «Руководители» загружает список экземпляров класса Руководитель_от_НГУ "
     "через GET /api/applications?type=supervisor-ngu. Для каждой записи доступна кнопка "
     "«Изменить», открывающая компонент EditForm. EditForm параллельно загружает схему и "
     "текущие значения свойств через Promise.all([getFormSchema, getEntry]), заполняет "
     "поля начальными значениями и при сохранении вызывает PUT /api/applications/entry.")

para(doc,
     "Вкладка «Заявления студентов» отображает список студентов с их статусом подачи "
     "бумажного заявления (PENDING / RECEIVED). Статусы загружаются параллельно для всех "
     "записей через Promise.all(...data.map(e => getSubmissionStatus(e.uri))). "
     "Для студентов в статусе PENDING отображается кнопка «Отметить получение», "
     "вызывающая POST /api/applications/receive?uri=... и переводящая запись в RECEIVED. "
     "Статус RECEIVED отображается зелёным бейджем, PENDING — серым.")

para(doc, "На рисунке 3.7 показан кабинет секретаря с открытой вкладкой "
     "«Заявления студентов», включающей статусы и кнопки управления.")

screenshot_placeholder(doc, "3.7", "Кабинет секретаря — вкладка «Заявления студентов»")
fig_caption(doc, "Рисунок 3.7 — Кабинет секретаря")

para(doc, "На рисунке 3.8 показана вкладка «Руководители» с формой редактирования записи.")

screenshot_placeholder(doc, "3.8", "Вкладка «Руководители» с формой редактирования")
fig_caption(doc, "Рисунок 3.8 — Редактирование записи руководителя")

# ──────────────────────────────────────────────────────────────────────────────
heading(doc, "3.3 Реализация сервиса уведомлений", level=2)

para(doc,
     "Механизм отправки напоминаний студентам реализован непосредственно в серверной "
     "части системы с использованием Spring TaskScheduler. После успешной обработки "
     "заявки студента метод scheduleReminders(studentUri, email, 1) запускает цепочку "
     "отложенных задач. На рисунке 3.9 представлена блок-схема цикла напоминаний.")

insert_image(doc, "diag_reminders.png", width_cm=10)
fig_caption(doc, "Рисунок 3.9 — Цикл напоминаний студенту")

para(doc,
     "Каждая задача планируется с задержкой REMINDER_INTERVAL_DAYS × 24 × 3600 секунд "
     "(по умолчанию 3 дня) через taskScheduler.schedule(Runnable, Instant). При срабатывании "
     "задачи из таблицы student_submissions читается текущий статус. Если статус "
     "RECEIVED — напоминание не отправляется и цепочка прерывается. Если статус "
     "PENDING и номер попытки не превышает MAX_REMINDERS (5) — "
     "EmailService.sendReminder(email, attempt) отправляет письмо, и рекурсивно "
     "планируется следующая задача с attempt+1.")

para(doc,
     "EmailService.sendReminder() формирует письмо SimpleMailMessage с темой "
     "«Напоминание #N — документы для практики» и текстом, содержащим номер попытки "
     "и инструкцию принести бумажное заявление на кафедру. Для отправки документов "
     "используется MimeMessage с вложением ZIP-архива через MimeMessageHelper. "
     "SMTP-соединение настроено через spring.mail.* в application.properties с поддержкой "
     "SSL (порт 465, smtp.gmail.com).")

para(doc,
     "Помимо сервиса напоминаний, в проекте развёрнут сервис koi-reminders на базе "
     "Spring Boot и Camunda BPM 7.x. Camunda предоставляет движок бизнес-процессов BPMN 2.0 "
     "и веб-консоль Cockpit для мониторинга активных экземпляров процессов. BPMN-схема "
     "описывает процесс обработки заявок на практику с событиями-таймерами для "
     "периодических напоминаний и условными переходами по статусу. Сервис подключается "
     "к собственной базе данных koi_reminders PostgreSQL для хранения состояния "
     "процессов Camunda.")

# ──────────────────────────────────────────────────────────────────────────────
heading(doc, "3.4 REST API системы", level=2)

para(doc,
     "Серверная часть предоставляет следующие REST-эндпоинты, сгруппированные "
     "по функциональным блокам:")

add_table_caption(doc, "Таблица 3.1 — REST API системы")
api_headers = ["Метод", "Путь", "Доступ", "Описание"]
api_rows = [
    ["POST", "/api/auth/send-code", "Открыт", "Отправить код подтверждения на email"],
    ["POST", "/api/auth/verify", "Открыт", "Проверить код, получить JWT-токен"],
    ["GET",  "/api/forms/{type}", "Авториз.", "Получить схему формы по типу"],
    ["POST", "/api/applications?type=", "STUDENT/SEC", "Создать запись (студент или руководитель)"],
    ["GET",  "/api/applications?type=", "STUDENT/SEC", "Список записей заданного типа"],
    ["GET",  "/api/applications/entry", "STUDENT/SEC", "Значения свойств одного экземпляра"],
    ["PUT",  "/api/applications/entry", "STUDENT/SEC", "Обновить свойства экземпляра"],
    ["GET",  "/api/applications/status", "STUDENT/SEC", "Статус подачи заявления студента"],
    ["POST", "/api/applications/receive", "SECRETARY", "Отметить заявление как полученное"],
    ["GET",  "/api/documents/generate?uri=", "SECRETARY", "Скачать ZIP с документами студента"],
    ["GET",  "/api/ontology/search", "Авториз.", "Поиск экземпляров класса по ФИО"],
    ["GET",  "/api/ontology/values", "Авториз.", "Поиск значений datatype-свойства"],
]
add_simple_table(doc, api_headers, api_rows)

para(doc,
     "Все ответы сервера возвращаются в формате JSON с кодировкой UTF-8. Ошибки "
     "валидации (400), авторизации (401) и доступа (403) возвращают объект "
     "{\"error\": \"...\"}. Обработка исключений централизована в классе "
     "GlobalExceptionHandler (@RestControllerAdvice), который перехватывает "
     "IllegalArgumentException, MethodArgumentNotValidException и RuntimeException.")

# ──────────────────────────────────────────────────────────────────────────────
heading(doc, "3.5 Демонстрация работы системы", level=2)

para(doc,
     "В данном разделе приведено описание ключевых сценариев работы разработанной "
     "системы на основе реальных данных кафедры.")

para(doc,
     "Сценарий 1: Регистрация студента и подача заявки. Студент открывает веб-приложение "
     "и вводит свой адрес электронной почты в домене @g.nsu.ru. Система генерирует "
     "шестизначный код подтверждения и отправляет его на указанный адрес. После "
     "ввода кода пользователь получает JWT-токен и переходит к форме заполнения данных. "
     "Форма отображает поля, загруженные из схемы: ФИО, группа, место практики, "
     "руководитель от НГУ (с автодополнением из онтологии) и другие. При отправке "
     "формы данные студента сохраняются в онтологии (Fuseki), генерируются документы "
     "и отправляются на email в виде ZIP-архива.")

para(doc, "На рисунке 3.10 показан экран успешной отправки заявки с сообщением "
     "о сгенерированных и отправленных документах.")

screenshot_placeholder(doc, "3.10", "Экран подтверждения после отправки заявки студентом")
fig_caption(doc, "Рисунок 3.10 — Подтверждение успешной подачи заявки")

para(doc,
     "Сценарий 2: Работа секретаря. Секретарь входит в систему, используя свой "
     "email, занесённый в список auth.secretary-emails. На вкладке «Заявления студентов» "
     "отображается список всех студентов с их статусами. Для студентов со статусом "
     "«Ожидает» доступна кнопка «Отметить получение». После нажатия статус переходит "
     "в «Получено», цепочка напоминаний прекращается. Секретарь может также добавлять "
     "новых руководителей от НГУ через форму на вкладке «Добавить руководителя» и "
     "редактировать их данные через вкладку «Руководители».")

para(doc,
     "Сценарий 3: Напоминания. Если через 3 дня после подачи заявки статус студента "
     "остаётся PENDING, система автоматически отправляет письмо-напоминание. Цикл "
     "повторяется каждые 3 дня, но не более 5 раз. При смене статуса на RECEIVED "
     "очередное напоминание не отправляется.")

para(doc,
     "Сценарий 4: Добавление нового типа документа. Администратор добавляет новую "
     "запись в таблицу form_schemas PostgreSQL с описанием полей и их соответствием "
     "свойствам онтологии. После перезапуска приложения (или через API saveSchema) "
     "новый тип документа становится доступен без изменения исходного кода системы.")

# ──────────────────────────────────────────────────────────────────────────────
heading(doc, "3.6 Выводы по главе 3", level=2)

para(doc,
     "В данной главе была подробно описана реализация прототипа системы сбора информации "
     "о студентах для автоматизации документооборота кафедры. Серверная часть реализована "
     "на Spring Boot 3 с использованием Apache Jena Fuseki для хранения данных в онтологии, "
     "PostgreSQL для хранения кодов подтверждения и статусов заявлений, Spring Security "
     "с JWT для авторизации и Apache POI совместно с библиотекой Petrovich4j для "
     "генерации DOCX-документов.")

para(doc,
     "Пользовательский интерфейс реализован на React 19 с TypeScript и обеспечивает "
     "динамическое построение форм по схемам из базы данных, автодополнение полей "
     "из онтологии и ролевую навигацию. Механизм уведомлений реализован через "
     "Spring TaskScheduler с поддержкой до пяти напоминаний с интервалом в три дня, "
     "останавливаемых при получении бумажного заявления. Дополнительно развёрнут "
     "сервис koi-reminders на базе Camunda BPM для управления процессами через "
     "BPMN-схемы.")

para(doc,
     "Разработанная система обеспечивает полный цикл: от аутентификации студента и "
     "заполнения формы до автоматической генерации документов, их доставки на email "
     "и отслеживания статуса сдачи бумажных заявлений секретарём кафедры.")

# ──────────────────────────────────────────────────────────────────────────────
out_path = r"c:\Users\shaba\project\system_sbor\docs\Шабанов_глава3.docx"
doc.save(out_path)
print(f"Готово: {out_path}")
