import { Outlet } from 'react-router-dom';
import Header from './Header';
import './Layout.css';

export default function Layout() {
  return (
    <div className="app">
      <Header />
      <main className="layout__content">
        <Outlet />
      </main>
    </div>
  );
}
