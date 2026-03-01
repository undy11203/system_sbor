import axios from 'axios';

const api = axios.create({ baseURL: '/api/auth' });

export async function sendCode(email: string): Promise<void> {
  await api.post('/send-code', { email });
}

export async function verifyCode(email: string, code: string): Promise<{ token: string; email: string }> {
  const { data } = await api.post<{ token: string; email: string }>('/verify', { email, code });
  return data;
}
