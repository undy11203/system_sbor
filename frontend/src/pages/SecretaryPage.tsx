import { useEffect, useState } from 'react';
import axios from 'axios';
import { getFormSchema, type FormFieldSpec, type FormSection } from '../api/formSchemaApi';
import { searchIndividuals, searchPropertyValues } from '../api/ontologyApi';
import type { IndividualSuggestion } from '../api/ontologyApi';
import {
  submitApplication,
  listEntries,
  getEntry,
  updateEntry,
  type EntryItem,
  type EntryData,
} from '../api/applicationApi';
import Autocomplete from '../components/Autocomplete';
import './SecretaryPage.css';
import './StudentFormPage.css';

type Tab = 'add-supervisor' | 'list-supervisors' | 'list-students';

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

  function load() {
    setLoading(true);
    setError('');
    listEntries(schemaType)
      .then(setEntries)
      .catch(err => setError(axiosMsg(err, 'Ошибка загрузки')))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [schemaType]);

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
      {entries.map(entry => (
        <div key={entry.uri} className="sec__entry">
          <div className="sec__entry-info">
            <span className="sec__entry-label">{entry.label}</span>
            {entry.degree && <span className="sec__entry-degree">{entry.degree}</span>}
          </div>
          <button
            className="sf__btn sf__btn--secondary sec__edit-btn"
            onClick={() => setEditUri(entry.uri)}
          >
            Изменить
          </button>
        </div>
      ))}
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
