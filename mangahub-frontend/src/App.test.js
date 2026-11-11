import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the original MangaHub navigation structure with manga styling', () => {
  render(<App />);

  expect(screen.getByRole('navigation')).toHaveTextContent(/MANGA\s*HUB/i);
  expect(screen.getByRole('link', { name: 'หน้าแรก' })).toHaveAttribute('href', '#home');
  expect(screen.getByRole('link', { name: 'หนังใหม่' })).toHaveAttribute('href', '#latest');
  expect(screen.getByRole('link', { name: 'รายการโปรด' })).toHaveAttribute('href', '#favorites');
  expect(screen.getByRole('button', { name: 'เข้าสู่ระบบ' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /ดูหนังดี ๆ ไปด้วยกัน/i })).toBeInTheDocument();
});
