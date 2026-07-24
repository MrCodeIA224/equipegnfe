import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../page';

const pushMock = vi.fn();
const loginMock = vi.fn();
const loginApiMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: null, login: loginMock, logout: vi.fn(), updateUser: vi.fn() }),
}));

vi.mock('@/lib/api', () => ({
  authApi: { login: (...args: unknown[]) => loginApiMock(...args) },
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    pushMock.mockReset();
    loginMock.mockReset();
    loginApiMock.mockReset();
  });

  it('renders the login form', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: 'Connexion' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument();
  });

  it('does not call the API when submitted empty', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(loginApiMock).not.toHaveBeenCalled();
  });

  it('logs in and redirects on successful submit', async () => {
    loginApiMock.mockResolvedValue({
      data: {
        access: 'access-token',
        refresh: 'refresh-token',
        user: { id: 1, username: 'mamadou', first_name: 'Mamadou', role: 'CLIENT' },
      },
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email ou nom d'utilisateur"), 'mamadou@test.gn');
    await user.type(screen.getByLabelText('Mot de passe'), 'GnExpress@2024');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => expect(loginApiMock).toHaveBeenCalledWith('mamadou@test.gn', 'GnExpress@2024'));
    expect(loginMock).toHaveBeenCalledWith('access-token', 'refresh-token', expect.objectContaining({ username: 'mamadou' }));
    expect(pushMock).toHaveBeenCalled();
  });

  it('quick-access buttons prefill the client demo credentials', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.click(screen.getByRole('button', { name: 'Client' }));
    expect(screen.getByLabelText("Email ou nom d'utilisateur")).toHaveValue('mamadou@test.gn');
  });
});
