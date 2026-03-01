import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendCode, verifyCode } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

type Step = 'email' | 'code';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await sendCode(email);
      setStep('code');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error ?? 'Ошибка отправки кода';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, email: userEmail } = await verifyCode(email, code);
      login(token, userEmail);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error ?? 'Неверный код';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login">
      <div className="login__box">
        <h1 className="login__title">Вход в систему</h1>

        {step === 'email' ? (
          <form className="login__form" onSubmit={handleSendCode}>
            <label className="login__label">
              Почта НГУ (@g.nsu.ru)
              <input
                className="login__input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@g.nsu.ru"
                required
                autoFocus
              />
            </label>
            {error && <p className="login__error">{error}</p>}
            <button className="login__btn" type="submit" disabled={loading}>
              {loading ? 'Отправка...' : 'Получить код'}
            </button>
          </form>
        ) : (
          <form className="login__form" onSubmit={handleVerify}>
            <p className="login__hint">Код отправлен на <strong>{email}</strong></p>
            <label className="login__label">
              Код из письма
              <input
                className="login__input"
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                required
                autoFocus
              />
            </label>
            {error && <p className="login__error">{error}</p>}
            <button className="login__btn" type="submit" disabled={loading}>
              {loading ? 'Проверка...' : 'Войти'}
            </button>
            <button
              className="login__back"
              type="button"
              onClick={() => { setStep('email'); setError(null); setCode(''); }}
            >
              ← Изменить почту
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
