import { Link } from 'react-router-dom';
import './HomePage.css';

export default function HomePage() {
  return (
    <div className="home">
      <h1>Система генерации документов</h1>
      <p className="home__subtitle">
        Платформа для автоматической генерации документов кафедры
      </p>

      <div className="home__cards">
        <Link to="/form" className="home__card">
          <h3>Подать заявление</h3>
          <p>Заполнить заявление на практику — форма формируется автоматически из онтологии</p>
        </Link>
      </div>
    </div>
  );
}
