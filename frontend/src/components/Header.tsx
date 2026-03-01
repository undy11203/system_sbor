import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

export default function Header() {
  const { email, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="header">
      <div className="header__top">
        <div className="header__logo">
          <NavLink to="/">Система генерации документов</NavLink>
        </div>
        {email && (
          <div className="header__user">
            <span className="header__email">{email}</span>
            <button className="header__logout" onClick={handleLogout}>Выйти</button>
          </div>
        )}
      </div>
      <nav className="header__nav">
        <NavLink to="/" end>Главная</NavLink>
        <NavLink to="/form">Подать заявление</NavLink>
      </nav>
    </header>
  );
}
