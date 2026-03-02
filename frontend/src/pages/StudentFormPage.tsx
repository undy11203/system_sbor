import { useEffect, useState } from 'react';
import axios from 'axios';
import { getFormSchema, type FormFieldSpec, type FormSection } from '../api/formSchemaApi';
import { searchIndividuals, searchPropertyValues } from '../api/ontologyApi';
import type { IndividualSuggestion } from '../api/ontologyApi';
import { submitApplication } from '../api/applicationApi';
import Autocomplete from '../components/Autocomplete';
import './StudentFormPage.css';

type Degree = 'Бакалавриат' | 'Магистратура';

export default function StudentFormPage() {
  const [degree, setDegree] = useState<Degree>('Бакалавриат');
  const [sections, setSections] = useState<FormSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [studentUri, setStudentUri] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // propUri → value (literal for datatype fields, individual URI for object fields)
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoading(true);
    setError('');
    getFormSchema()
      .then(schema => {
        setSections(schema.sections);
      })
      .catch(err => {
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          if (status === 401) {
            setError('Ошибка авторизации (401) — попробуйте выйти и войти заново');
          } else if (status === 500) {
            const msg = err.response?.data?.error ?? 'внутренняя ошибка сервера';
            setError(`Ошибка сервера (500): ${msg}`);
          } else if (!err.response) {
            setError('Сервер недоступен — убедитесь, что бэкенд запущен на порту 8080');
          } else {
            setError(`Ошибка ${status}: ${err.message}`);
          }
        } else {
          setError('Неизвестная ошибка: ' + String(err));
        }
        console.error('[StudentFormPage] ошибка загрузки схемы:', err);
      })
      .finally(() => setLoading(false));
  }, []); // schema is degree-independent

  // ── handlers ─────────────────────────────────────────────────────────────

  function onValue(field: FormFieldSpec, uri: string, label: string) {
    // object fields store the individual URI, datatype fields store the literal
    const val = field.type === 'object' ? uri : label;
    setValues(prev => ({ ...prev, [field.propUri]: val }));
  }

  // ── submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await submitApplication({ degree, values });
      setStudentUri(res.studentUri);
      setSubmitted(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.error ?? err.message;
        setError(`Ошибка отправки: ${msg}`);
      } else {
        setError('Неизвестная ошибка при отправке');
      }
      console.error('[StudentFormPage] ошибка отправки:', err);
    } finally {
      setSubmitting(false);
    }
  }

  // ── download documents ────────────────────────────────────────────────────

  async function handleDownload() {
    if (!studentUri) return;
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/documents', {
        params: { studentUri },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'documents.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[StudentFormPage] ошибка скачивания:', err);
      setError('Не удалось скачать документы. Попробуйте позже.');
    } finally {
      setDownloading(false);
    }
  }

  // ── success screen ────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="sf">
        <div className="sf__success">
          <h2>Заявка принята</h2>
          <p>Данные записаны в систему. Ожидайте уведомления.</p>
          {error && <p className="sf__error">{error}</p>}
          <div className="sf__success-actions">
            <button
              className="sf__btn sf__btn--primary"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? 'Формирование...' : 'Скачать документы (ZIP)'}
            </button>
            <button className="sf__btn sf__btn--secondary" onClick={() => {
              setSubmitted(false);
              setStudentUri(null);
              setError('');
              setValues({});
            }}>
              Подать ещё одну заявку
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── field rendering helper ────────────────────────────────────────────────

  function makeFetcher(field: FormFieldSpec) {
    return (query: string): Promise<IndividualSuggestion[]> => {
      if (field.type === 'object' && field.rangeUri) {
        return searchIndividuals(field.rangeUri, query);
      }
      return searchPropertyValues(field.propUri, query);
    };
  }

  function renderField(field: FormFieldSpec) {
    return (
      <div key={field.propUri} className="sf__field">
        <label className="sf__label">
          {field.label}
          {field.required && <span className="sf__required"> *</span>}
        </label>
        {field.hint && <span className="sf__hint">{field.hint}</span>}
        <Autocomplete
          placeholder={'Начните вводить...'}
          fetchSuggestions={makeFetcher(field)}
          onSelect={(uri, label) => onValue(field, uri, label)}
        />
      </div>
    );
  }

  return (
    <div className="sf">
      <h1 className="sf__title">Заявление на практику</h1>

      <div className="sf__degree-tabs">
        {(['Бакалавриат', 'Магистратура'] as Degree[]).map(d => (
          <button
            key={d}
            type="button"
            className={`sf__degree-tab${degree === d ? ' sf__degree-tab--active' : ''}`}
            onClick={() => setDegree(d)}
          >
            {d}
          </button>
        ))}
      </div>

      {loading && <p className="sf__loading">Загрузка формы...</p>}
      {error && <p className="sf__error">{error}</p>}

      {!loading && !error && (
        <form className="sf__form" onSubmit={handleSubmit}>
          {sections.map(section => (
            <section key={section.title} className="sf__section">
              <h2 className="sf__section-title">{section.title}</h2>
              {section.fields.map(renderField)}
            </section>
          ))}

          <div className="sf__actions">
            <button className="sf__btn sf__btn--primary" type="submit" disabled={submitting}>
              {submitting ? 'Отправка...' : 'Отправить заявление'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
