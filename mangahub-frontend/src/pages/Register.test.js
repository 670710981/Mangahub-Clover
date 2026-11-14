import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Register from './Register.jsx'

const mockRegister = jest.fn()

jest.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({ register: mockRegister }),
}))

test('shows a validation message for an invalid email without calling register', () => {
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>,
  )

  fireEvent.change(screen.getByPlaceholderText('ชื่อที่แสดง'), {
    target: { value: 'Test user' },
  })
  fireEvent.change(screen.getByPlaceholderText('อีเมล'), {
    target: { value: 'not-an-email' },
  })
  fireEvent.change(screen.getByPlaceholderText('รหัสผ่าน (8 ตัวขึ้นไป)'), {
    target: { value: 'password123' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'สมัครสมาชิก' }))

  expect(screen.getByText('รูปแบบอีเมลไม่ถูกต้อง')).toBeInTheDocument()
  expect(mockRegister).not.toHaveBeenCalled()
})
