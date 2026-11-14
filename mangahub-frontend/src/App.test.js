import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import App from './App.jsx'

test('renders the MangaHub navigation and home page', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )

  expect(screen.getByRole('link', { name: 'MangaHub' })).toHaveAttribute('href', '/')
  expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
  expect(screen.getByRole('link', { name: 'Manga' })).toHaveAttribute('href', '/manga')
  expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument()
})
