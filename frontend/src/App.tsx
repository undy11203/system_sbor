import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import StudentFormPage from './pages/StudentFormPage';
import SecretaryPage from './pages/SecretaryPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route path="/" element={<HomePage />} />
            <Route path="/form" element={<StudentFormPage />} />
            <Route path="/secretary" element={<SecretaryPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
