import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  getFormSchema,
  saveFormSchema,
  listSchemaTypes,
  type FormSchema,
  type FormSection,
  type FormFieldSpec,
} from '../api/formSchemaApi';
import { searchIndividuals, searchPropertyValues } from '../api/ontologyApi';
import type { IndividualSuggestion } from '../api/ontologyApi';
import {
  submitApplication,
  listEntries,
  getEntry,
  updateEntry,
  markReceived,
  getSubmissionStatus,
  type EntryItem,
  type EntryData,
} from '../api/applicationApi';
import Autocomplete from '../components/Autocomplete';
import './SecretaryPage.css';
import './StudentFormPage.css';

type Tab = 'add-supervisor' | 'list-supervisors' | 'list-students' | 'forms';

export default function SecretaryPage() {
  const [tab, setTab] = useState<Tab>('add-supervisor');

  return (
    <div className="sec">
      <h1 className="sf__title">Кабинет секретаря</h1>
      <div className="sec__tabs">
        <button
          className={`sec__tab${tab === 'add-supervisor' ? ' sec__tab--active' : ''}`}
          onClick={() => setTab('add-supervisor')}
        >
          Добавить руководителя
        </button>
        <button
          className={`sec__tab${tab === 'list-supervisors' ? ' sec__tab--active' : ''}`}
          onClick={() => setTab('list-supervisors')}
        >
          Руководители
        </button>
        <button
          className={`sec__tab${tab === 'list-students' ? ' sec__tab--active' : ''}`}
          onClick={() => setTab('list-students')}
        >
          Заявления студентов
        </button>
        <button
          className={`sec__tab${tab === 'forms' ? ' sec__tab--active' : ''}`}
          onClick={() => setTab('forms')}
        >
          Настройка форм
        </button>
      </div>

      {tab === 'add-supervisor' && (
        <AddForm schemaType="supervisor-ngu" degree="Руководитель_от_НГУ" onAdded={() => setTab('list-supervisors')} />
      )}
      {tab === 'list-supervisors' && (
        <EntryList schemaType="supervisor-ngu" degree="Руководитель_от_НГУ" />
      )}
      {tab === 'list-students' && (
        <EntryList schemaType="student" degree="" />
      )}
      {tab === 'forms' && <FormSchemaManager />}
    </div>
  );
}

/* ── Add form ─────────────────────────────────────────────────────────────── */

function AddForm({
  schemaType,
  degree,
  onAdded,
}: {
  schemaType: string;
  degree: string;
  onAdded: () => void;
}) {
  const [sections, setSections] = useState<FormSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoading(true);
    getFormSchema(schemaType)
      .then(s => setSections(s.sections))
      .catch(err => setError(axiosMsg(err, 'Ошибка загрузки формы')))
      .finally(() => setLoading(false));
  }, [schemaType]);

  function onValue(field: FormFieldSpec, uri: string, literal: string) {
    const val = field.type === 'object' ? uri : literal;
    setValues(prev => ({ ...prev, [field.propUri]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await submitApplication({ degree, values }, schemaType);
      setSubmitted(true);
    } catch (err) {
      setError(axiosMsg(err, 'Ошибка отправки'));
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="sf__success">
        <h2>Руководитель добавлен</h2>
        <div className="sf__success-actions">
          <button className="sf__btn sf__btn--primary" onClick={() => { setSubmitted(false); setValues({}); }}>
            Добавить ещё
          </button>
          <button className="sf__btn sf__btn--secondary" onClick={onAdded}>
            К списку
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {loading && <p className="sf__loading">Загрузка формы...</p>}
      {error && <p className="sf__error">{error}</p>}
      {!loading && !error && (
        <form className="sf__form" onSubmit={handleSubmit}>
          {sections.map(section => (
            <section key={section.title} className="sf__section">
              <h2 className="sf__section-title">{section.title}</h2>
              {section.fields.map(field => (
                <FieldRow
                  key={field.propUri}
                  field={field}
                  initialDisplay=""
                  onChange={(uri, literal) => onValue(field, uri, literal)}
                />
              ))}
            </section>
          ))}
          <div className="sf__actions">
            <button className="sf__btn sf__btn--primary" type="submit" disabled={submitting}>
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      )}
    </>
  );
}

/* ── Entry list ───────────────────────────────────────────────────────────── */

function EntryList({ schemaType, degree }: { schemaType: string; degree: string }) {
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editUri, setEditUri] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  const isStudents = schemaType === 'student';

  function load() {
    setLoading(true);
    setError('');
    listEntries(schemaType)
      .then(async (data) => {
        setEntries(data);
        if (isStudents) {
          const pairs = await Promise.all(
            data.map(e => getSubmissionStatus(e.uri).then(s => [e.uri, s] as const))
          );
          setStatuses(Object.fromEntries(pairs));
        }
      })
      .catch(err => setError(axiosMsg(err, 'Ошибка загрузки')))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [schemaType]);

  async function handleMarkReceived(uri: string) {
    await markReceived(uri);
    setStatuses(prev => ({ ...prev, [uri]: 'RECEIVED' }));
  }

  if (editUri) {
    return (
      <EditForm
        uri={editUri}
        schemaType={schemaType}
        degree={degree}
        onSaved={() => { setEditUri(null); load(); }}
        onCancel={() => setEditUri(null)}
      />
    );
  }

  return (
    <div className="sec__list">
      {loading && <p className="sf__loading">Загрузка...</p>}
      {error && <p className="sf__error">{error}</p>}
      {!loading && !error && entries.length === 0 && (
        <p className="sec__empty">Записи не найдены</p>
      )}
      {entries.map(entry => {
        const status = statuses[entry.uri];
        const received = status === 'RECEIVED';
        return (
          <div key={entry.uri} className="sec__entry">
            <div className="sec__entry-info">
              <span className="sec__entry-label">{entry.label}</span>
              {entry.degree && <span className="sec__entry-degree">{entry.degree}</span>}
              {isStudents && (
                <span className={`sec__entry-status${received ? ' sec__entry-status--received' : ''}`}>
                  {received ? 'Получено' : 'Ожидает'}
                </span>
              )}
            </div>
            <div className="sec__entry-actions">
              {isStudents && !received && (
                <button
                  className="sf__btn sf__btn--primary sec__receive-btn"
                  onClick={() => handleMarkReceived(entry.uri)}
                >
                  Отметить получение
                </button>
              )}
              <button
                className="sf__btn sf__btn--secondary sec__edit-btn"
                onClick={() => setEditUri(entry.uri)}
              >
                Изменить
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Edit form ────────────────────────────────────────────────────────────── */

function EditForm({
  uri,
  schemaType,
  degree,
  onSaved,
  onCancel,
}: {
  uri: string;
  schemaType: string;
  degree: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [sections, setSections] = useState<FormSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [labels, setLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoading(true);
    Promise.all([getFormSchema(schemaType), getEntry(uri, schemaType)])
      .then(([schema, entryData]: [{ sections: FormSection[] }, EntryData]) => {
        setSections(schema.sections);
        setValues(entryData.values);
        setLabels(entryData.labels);
      })
      .catch(err => setError(axiosMsg(err, 'Ошибка загрузки данных')))
      .finally(() => setLoading(false));
  }, [uri, schemaType]);

  function onValue(field: FormFieldSpec, uri: string, literal: string) {
    const val = field.type === 'object' ? uri : literal;
    setValues(prev => ({ ...prev, [field.propUri]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await updateEntry(uri, { degree, values }, schemaType);
      onSaved();
    } catch (err) {
      setError(axiosMsg(err, 'Ошибка сохранения'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button className="sec__back" type="button" onClick={onCancel}>← Назад</button>
      <h2 className="sec__edit-title">Редактирование записи</h2>
      {loading && <p className="sf__loading">Загрузка...</p>}
      {error && <p className="sf__error">{error}</p>}
      {!loading && !error && (
        <form className="sf__form" onSubmit={handleSubmit}>
          {sections.map(section => (
            <section key={section.title} className="sf__section">
              <h2 className="sf__section-title">{section.title}</h2>
              {section.fields.map(field => (
                <FieldRow
                  key={field.propUri + '|' + (labels[field.propUri] ?? values[field.propUri] ?? '')}
                  field={field}
                  initialDisplay={labels[field.propUri] ?? values[field.propUri] ?? ''}
                  onChange={(u, lit) => onValue(field, u, lit)}
                />
              ))}
            </section>
          ))}
          <div className="sf__actions">
            <button className="sf__btn sf__btn--secondary" type="button" onClick={onCancel}>
              Отмена
            </button>
            <button className="sf__btn sf__btn--primary" type="submit" disabled={submitting}>
              {submitting ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      )}
    </>
  );
}

/* ── Shared field row ─────────────────────────────────────────────────────── */

function FieldRow({
  field,
  initialDisplay,
  onChange,
}: {
  field: FormFieldSpec;
  initialDisplay: string;
  onChange: (uri: string, literal: string) => void;
}) {
  function makeFetcher(): (q: string) => Promise<IndividualSuggestion[]> {
    if (field.type === 'object' && field.rangeUri) {
      return (q) => searchIndividuals(field.rangeUri!, q);
    }
    return (q) => searchPropertyValues(field.propUri, q);
  }

  return (
    <div className="sf__field">
      <label className="sf__label">
        {field.label}
        {field.required && <span className="sf__required"> *</span>}
      </label>
      {field.hint && <span className="sf__hint">{field.hint}</span>}
      <Autocomplete
        initialValue={initialDisplay}
        placeholder={field.hint ?? 'Начните вводить...'}
        fetchSuggestions={makeFetcher()}
        onSelect={(uri, label) => onChange(uri, label)}
        onChange={(val) => onChange(val, val)}
      />
    </div>
  );
}

/* ── Form schema manager ──────────────────────────────────────────────────── */

function FormSchemaManager() {
  const [types, setTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    listSchemaTypes()
      .then(setTypes)
      .catch(() => setError('Ошибка загрузки списка типов'));
  }, []);

  function selectType(type: string) {
    setSelectedType(type);
    setError('');
    setSaved(false);
    setLoading(true);
    getFormSchema(type)
      .then(s => setSchema(structuredClone(s)))
      .catch(() => setError('Ошибка загрузки схемы'))
      .finally(() => setLoading(false));
  }

  async function handleSave() {
    if (!selectedType || !schema) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await saveFormSchema(selectedType, schema);
      setSaved(true);
    } catch {
      setError('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  function updateField(sIdx: number, fIdx: number, patch: Partial<FormFieldSpec>) {
    if (!schema) return;
    const next = structuredClone(schema);
    Object.assign(next.sections[sIdx].fields[fIdx], patch);
    setSchema(next);
    setSaved(false);
  }

  function removeField(sIdx: number, fIdx: number) {
    if (!schema) return;
    const next = structuredClone(schema);
    next.sections[sIdx].fields.splice(fIdx, 1);
    setSchema(next);
    setSaved(false);
  }

  function moveField(sIdx: number, fIdx: number, dir: -1 | 1) {
    if (!schema) return;
    const next = structuredClone(schema);
    const fields = next.sections[sIdx].fields;
    const target = fIdx + dir;
    if (target < 0 || target >= fields.length) return;
    [fields[fIdx], fields[target]] = [fields[target], fields[fIdx]];
    setSchema(next);
    setSaved(false);
  }

  function addField(sIdx: number) {
    if (!schema) return;
    const next = structuredClone(schema);
    next.sections[sIdx].fields.push({
      prop: '',
      propUri: '',
      entity: 'student',
      type: 'datatype',
      label: 'Новое поле',
      required: false,
      hint: '',
      range: '',
      rangeUri: '',
    });
    setSchema(next);
    setSaved(false);
  }

  function addSection() {
    if (!schema) return;
    const next = structuredClone(schema);
    next.sections.push({ title: 'Новый раздел', fields: [] });
    setSchema(next);
    setSaved(false);
  }

  function updateSectionTitle(sIdx: number, title: string) {
    if (!schema) return;
    const next = structuredClone(schema);
    next.sections[sIdx].title = title;
    setSchema(next);
    setSaved(false);
  }

  function removeSection(sIdx: number) {
    if (!schema) return;
    const next = structuredClone(schema);
    next.sections.splice(sIdx, 1);
    setSchema(next);
    setSaved(false);
  }

  return (
    <div className="fsm">
      <div className="fsm__sidebar">
        <p className="fsm__sidebar-title">Тип формы</p>
        {types.map(t => (
          <button
            key={t}
            className={`fsm__type-btn${selectedType === t ? ' fsm__type-btn--active' : ''}`}
            onClick={() => selectType(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="fsm__editor">
        {!selectedType && <p className="sec__empty">Выберите тип формы слева</p>}
        {loading && <p className="sf__loading">Загрузка...</p>}
        {error && <p className="sf__error">{error}</p>}

        {schema && !loading && (
          <>
            {schema.sections.map((section, sIdx) => (
              <div key={sIdx} className="fsm__section">
                <div className="fsm__section-header">
                  <input
                    className="fsm__section-title-input"
                    value={section.title}
                    onChange={e => updateSectionTitle(sIdx, e.target.value)}
                  />
                  <button
                    className="fsm__remove-btn"
                    title="Удалить раздел"
                    onClick={() => removeSection(sIdx)}
                  >✕</button>
                </div>

                {section.fields.map((field, fIdx) => (
                  <div key={fIdx} className="fsm__field">
                    <div className="fsm__field-row">
                      <label className="fsm__field-label">Название</label>
                      <input
                        className="fsm__input"
                        value={field.label}
                        onChange={e => updateField(sIdx, fIdx, { label: e.target.value })}
                      />
                    </div>
                    <div className="fsm__field-row">
                      <label className="fsm__field-label">Свойство (prop)</label>
                      <input
                        className="fsm__input"
                        value={field.prop}
                        onChange={e => updateField(sIdx, fIdx, { prop: e.target.value })}
                      />
                    </div>
                    <div className="fsm__field-row">
                      <label className="fsm__field-label">Тип</label>
                      <select
                        className="fsm__select"
                        value={field.type}
                        onChange={e => updateField(sIdx, fIdx, { type: e.target.value as 'datatype' | 'object' })}
                      >
                        <option value="datatype">datatype (текст)</option>
                        <option value="object">object (ссылка)</option>
                      </select>
                    </div>
                    {field.type === 'object' && (
                      <div className="fsm__field-row">
                        <label className="fsm__field-label">Класс диапазона (range)</label>
                        <input
                          className="fsm__input"
                          value={field.range ?? ''}
                          onChange={e => updateField(sIdx, fIdx, { range: e.target.value })}
                        />
                      </div>
                    )}
                    <div className="fsm__field-row">
                      <label className="fsm__field-label">Подсказка</label>
                      <input
                        className="fsm__input"
                        value={field.hint ?? ''}
                        onChange={e => updateField(sIdx, fIdx, { hint: e.target.value })}
                      />
                    </div>
                    <div className="fsm__field-row">
                      <label className="fsm__field-label">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={e => updateField(sIdx, fIdx, { required: e.target.checked })}
                        />
                        {' '}Обязательное
                      </label>
                    </div>
                    <div className="fsm__field-actions">
                      <button className="fsm__move-btn" onClick={() => moveField(sIdx, fIdx, -1)} disabled={fIdx === 0}>↑</button>
                      <button className="fsm__move-btn" onClick={() => moveField(sIdx, fIdx, 1)} disabled={fIdx === section.fields.length - 1}>↓</button>
                      <button className="fsm__remove-btn" onClick={() => removeField(sIdx, fIdx)}>✕ Удалить поле</button>
                    </div>
                  </div>
                ))}

                <button className="fsm__add-field-btn" onClick={() => addField(sIdx)}>
                  + Добавить поле
                </button>
              </div>
            ))}

            <button className="fsm__add-section-btn" onClick={addSection}>
              + Добавить раздел
            </button>

            <div className="fsm__save-row">
              {saved && <span className="fsm__saved-msg">Сохранено</span>}
              <button
                className="sf__btn sf__btn--primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Сохранение...' : 'Сохранить схему'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function axiosMsg(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    if (status === 401) return 'Ошибка авторизации — войдите заново';
    if (!err.response) return 'Сервер недоступен';
    return `Ошибка ${status}: ${err.response?.data?.error ?? err.message}`;
  }
  return fallback + ': ' + String(err);
}
