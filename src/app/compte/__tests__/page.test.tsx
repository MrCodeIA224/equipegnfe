import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ComptePage from '../page';

const pushMock = vi.fn();
const requestEmailChangeMock = vi.fn();
const confirmEmailChangeMock = vi.fn();
const updateUserMock = vi.fn();
const authMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('@/lib/api', () => ({
  authApi: {
    requestEmailChange: (...args: unknown[]) => requestEmailChangeMock(...args),
    confirmEmailChange: (...args: unknown[]) => confirmEmailChangeMock(...args),
  },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => authMock(),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

describe('ComptePage', () => {
  beforeEach(() => {
    pushMock.mockReset();
    requestEmailChangeMock.mockReset();
    confirmEmailChangeMock.mockReset();
    updateUserMock.mockReset();
    authMock.mockReset().mockReturnValue({
      user: { id: 1, username: 'client1', email: 'client1@test.gn' },
      updateUser: updateUserMock,
    });
  });

  it('redirects to login when there is no authenticated user', () => {
    authMock.mockReturnValue({ user: null, updateUser: updateUserMock });
    render(<ComptePage />);
    expect(pushMock).toHaveBeenCalledWith('/auth/login?redirect=/compte');
  });

  it('shows the current account email', () => {
    render(<ComptePage />);
    expect(screen.getByText('client1@test.gn')).toBeInTheDocument();
  });

  it('does not call the API when fields are empty', async () => {
    const user = userEvent.setup();
    render(<ComptePage />);
    await user.click(screen.getByRole('button', { name: 'Envoyer le code de validation' }));
    expect(requestEmailChangeMock).not.toHaveBeenCalled();
  });

  it('requests the change and shows the OTP step with the simulated code', async () => {
    requestEmailChangeMock.mockResolvedValue({
      data: { message: 'Code envoyé.', simulated_otp: '5678' },
    });
    const user = userEvent.setup();
    render(<ComptePage />);

    await user.type(screen.getByLabelText('Confirmez votre email actuel'), 'client1@test.gn');
    await user.type(screen.getByLabelText('Nouvelle adresse email'), 'nouveau@test.gn');
    await user.click(screen.getByRole('button', { name: 'Envoyer le code de validation' }));

    await waitFor(() => expect(requestEmailChangeMock).toHaveBeenCalledWith({
      current_email: 'client1@test.gn', new_email: 'nouveau@test.gn',
    }));
    expect(await screen.findByText('5678')).toBeInTheDocument();
  });

  it('confirms the OTP and updates the auth context', async () => {
    requestEmailChangeMock.mockResolvedValue({ data: { message: 'Code envoyé.', simulated_otp: '5678' } });
    confirmEmailChangeMock.mockResolvedValue({ data: { id: 1, username: 'client1', email: 'nouveau@test.gn' } });
    const user = userEvent.setup();
    render(<ComptePage />);

    await user.type(screen.getByLabelText('Confirmez votre email actuel'), 'client1@test.gn');
    await user.type(screen.getByLabelText('Nouvelle adresse email'), 'nouveau@test.gn');
    await user.click(screen.getByRole('button', { name: 'Envoyer le code de validation' }));
    await screen.findByLabelText('Code de vérification');

    await user.type(screen.getByLabelText('Code de vérification'), '5678');
    await user.click(screen.getByRole('button', { name: 'Valider' }));

    await waitFor(() => expect(confirmEmailChangeMock).toHaveBeenCalledWith('5678'));
    expect(updateUserMock).toHaveBeenCalledWith({ id: 1, username: 'client1', email: 'nouveau@test.gn' });
  });
});
