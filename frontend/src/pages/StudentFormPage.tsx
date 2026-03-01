import { useEffect, useState } from 'react';
import axios from 'axios';
import { getStudentFields, getVkrFields, searchIndividuals, searchPropertyValues } from '../api/ontologyApi';
import type { FormFieldDef, IndividualSuggestion } from '../api/ontologyApi';
import { submitApplication } from '../api/applicationApi';
import Autocomplete from '../components/Autocomplete';
import './StudentFormPage.css';

type Degree = 'Бакалавриат' | 'Магистратура';

export default function StudentFormPage() {
  const [degree, setDegree] = useState<Degree>('Бакалавриат');
  const [fields, setFields] = useState<FormFieldDef[]>([]);
  const [vkrFields, setVkrFields] = useState<FormFieldDef[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [studentUri, setStudentUri] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // propUri → literal value (student datatype fields)
  const [studentDatatype, setStudentDatatype] = useState<Record<string, string>>({});
  // propUri → individual URI (student object fields)
  const [studentObject, setStudentObject] = useState<Record<string, string>>({});
  // propUri → literal value (VKR datatype fields)
  const [vkrDatatype, setVkrDatatype] = useState<Record<string, string>>({});
  // propUri → individual URI (VKR object fields)
  const [vkrObject, setVkrObject] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoading(true);
    setError('');
    setStudentDatatype({});
    setStudentObject({});
    setVkrDatatype({});
    setVkrObject({});
    Promise.all([getStudentFields(degree), getVkrFields()])
      .then(([studentData, vkrData]) => {
        setFields(studentData);
        setVkrFields(vkrData);
        if (studentData.length === 0 && vkrData.length === 0) {
          setError('Поля не найдены — возможно, онтология не содержит данных класса ' + degree);
        }
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
        console.error('[StudentFormPage] ошибка загрузки полей:', err);
      })
      .finally(() => setLoading(false));
  }, [degree]);

  // ── handlers ─────────────────────────────────────────────────────────────

  function onStudentDatatype(propUri: string, value: string) {
    setStudentDatatype(prev => ({ ...prev, [propUri]: value }));
  }

  function onStudentObject(propUri: string, individualUri: string) {
    setStudentObject(prev => ({ ...prev, [propUri]: individualUri }));
  }

  function onVkrDatatype(propUri: string, value: string) {
    setVkrDatatype(prev => ({ ...prev, [propUri]: value }));
  }

  function onVkrObject(propUri: string, individualUri: string) {
    setVkrObject(prev => ({ ...prev, [propUri]: individualUri }));
  }

  // ── fetchers ──────────────────────────────────────────────────────────────

  function makeIndividualFetcher(classUri: string) {
    return (query: string): Promise<IndividualSuggestion[]> =>
      searchIndividuals(classUri, query);
  }

  function makeValueFetcher(propUri: string) {
    return (query: string): Promise<IndividualSuggestion[]> =>
      searchPropertyValues(propUri, query);
  }

  // ── submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await submitApplication({ degree, studentDatatype, studentObject, vkrDatatype, vkrObject });
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
              setStudentDatatype({});
              setStudentObject({});
              setVkrDatatype({});
              setVkrObject({});
            }}>
              Подать ещё одну заявку
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── field rendering helper ────────────────────────────────────────────────

  function renderField(
    f: FormFieldDef,
    onDatatype: (propUri: string, value: string) => void,
    onObject: (propUri: string, uri: string) => void,
  ) {
    return (
      <div key={f.prop} className="sf__field">
        <label className="sf__label">{f.label ?? f.localName}</label>
        {f.comment && <span className="sf__hint">{f.comment}</span>}
        {f.type === 'object' && f.range ? (
          <Autocomplete
            placeholder="Начните вводить ФИО..."
            fetchSuggestions={makeIndividualFetcher(f.range)}
            onSelect={(uri) => onObject(f.prop, uri)}
          />
        ) : (
          <Autocomplete
            placeholder={f.label ?? f.localName}
            fetchSuggestions={makeValueFetcher(f.prop)}
            onSelect={(_, label) => onDatatype(f.prop, label)}
          />
        )}
      </div>
    );
  }

  const datatypeFields = fields.filter(f => f.type === 'datatype');
  const objectFields   = fields.filter(f => f.type === 'object');

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

      {loading && <p className="sf__loading">Загрузка полей формы...</p>}
      {error && <p className="sf__error">{error}</p>}

      {!loading && !error && (
        <form className="sf__form" onSubmit={handleSubmit} key={degree}>

          {datatypeFields.length > 0 && (
            <section className="sf__section">
              <h2 className="sf__section-title">Данные студента</h2>
              {datatypeFields.map(f => renderField(f, onStudentDatatype, onStudentObject))}
            </section>
          )}

          {objectFields.length > 0 && (
            <section className="sf__section">
              <h2 className="sf__section-title">Руководители</h2>
              <p className="sf__section-hint">
                Начните вводить ФИО — система предложит варианты из базы кафедры.
              </p>
              {objectFields.map(f => renderField(f, onStudentDatatype, onStudentObject))}
            </section>
          )}

          {vkrFields.length > 0 && (
            <section className="sf__section">
              <h2 className="sf__section-title">Тема ВКР</h2>
              {vkrFields.map(f => renderField(f, onVkrDatatype, onVkrObject))}
            </section>
          )}

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
