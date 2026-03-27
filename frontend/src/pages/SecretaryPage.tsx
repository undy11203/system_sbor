import { useEffect, useState } from 'react';
import axios from 'axios';
import { getFormSchema, type FormFieldSpec, type FormSection } from '../api/formSchemaApi';
import { searchPropertyValues } from '../api/ontologyApi';
import { submitApplication } from '../api/applicationApi';
import Autocomplete from '../components/Autocomplete';
import './StudentFormPage.css';

const SCHEMA_TYPE = 'supervisor-ngu';

export default function SecretaryPage() {
  const [sections, setSections] = useState<FormSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoading(true);
    setError('');
    getFormSchema(SCHEMA_TYPE)
      .then(schema => setSections(schema.sections))
      .catch(err => {
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          if (status === 401) {
            setError('Ошибка авторизации (401) — попробуйте выйти и войти заново');
          } else if (!err.response) {
            setError('Сервер недоступен — убедитесь, что бэкенд запущен');
          } else {
            setError(`Ошибка ${status}: ${err.message}`);
          }
        } else {
          setError('Неизвестная ошибка: ' + String(err));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function onValue(field: FormFieldSpec, literal: string) {
    setValues(prev => ({ ...prev, [field.propUri]: literal }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await submitApplication({ degree: 'Руководитель_от_НГУ', values }, SCHEMA_TYPE);
      setSubmitted(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.error ?? err.message;
        setError(`Ошибка отправки: ${msg}`);
      } else {
        setError('Неизвестная ошибка при отправке');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setSubmitted(false);
    setError('');
    setValues({});
  }

  if (submitted) {
    return (
      <div className="sf">
        <div className="sf__success">
          <h2>Руководитель добавлен</h2>
          <p>Данные сохранены в систему.</p>
          <div className="sf__success-actions">
            <button className="sf__btn sf__btn--primary" onClick={reset}>
              Добавить ещё одного руководителя
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderField(field: FormFieldSpec) {
    const fetcher = (query: string) => searchPropertyValues(field.propUri, query);
    return (
      <div key={field.propUri} className="sf__field">
        <label className="sf__label">
          {field.label}
          {field.required && <span className="sf__required"> *</span>}
        </label>
        {field.hint && <span className="sf__hint">{field.hint}</span>}
        <Autocomplete
          placeholder={field.hint ?? 'Начните вводить...'}
          fetchSuggestions={fetcher}
          onSelect={(_uri, label) => onValue(field, label)}
          onChange={(val) => onValue(field, val)}
        />
      </div>
    );
  }

  return (
    <div className="sf">
      <h1 className="sf__title">Добавление руководителя ВКР</h1>

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
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
