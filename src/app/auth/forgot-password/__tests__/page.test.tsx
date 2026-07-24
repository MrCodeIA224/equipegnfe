import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPasswordPage from '../page';

const pushMock = vi.fn();
const requestPasswordResetMock = vi.fn();
const confirmPasswordResetMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('@/lib/api', () => ({
  authApi: {
    requestPasswordReset: (...args: unknown[]) => requestPasswordResetMock(...args),
    confirmPasswordReset: (...args: unknown[]) => confirmPasswordResetMock(...args),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    pushMock.mockReset();
    requestPasswordResetMock.mockReset();
    confirmPasswordResetMock.mockReset();
  });

  it('renders the email step first', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.queryByLabelText('Code de vérification')).not.toBeInTheDocument();
  });

  it('does not call the API when the email is empty', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);
    await user.click(screen.getByRole('button', { name: 'Envoyer le code' }));
    expect(requestPasswordResetMock).not.toHaveBeenCalled();
  });

  it('moves to the OTP step and shows the simulated code on success', async () => {
    requestPasswordResetMock.mockResolvedValue({
      data: { message: 'Code envoyé.', simulated_otp: '1234' },
    });
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText('Email'), 'client1@test.gn');
    await user.click(screen.getByRole('button', { name: 'Envoyer le code' }));

    await waitFor(() => expect(requestPasswordResetMock).toHaveBeenCalledWith('client1@test.gn'));
    expect(await screen.findByText('1234')).toBeInTheDocument();
    expect(screen.getByLabelText('Code de vérification')).toBeInTheDocument();
  });

  it('confirms the reset and redirects to login', async () => {
    requestPasswordResetMock.mockResolvedValue({ data: { message: 'Code envoyé.', simulated_otp: '1234' } });
    confirmPasswordResetMock.mockResolvedValue({ data: { message: 'Mot de passe réinitialisé.' } });
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText('Email'), 'client1@test.gn');
    await user.click(screen.getByRole('button', { name: 'Envoyer le code' }));
    await screen.findByLabelText('Code de vérification');

    await user.type(screen.getByLabelText('Code de vérification'), '1234');
    await user.type(screen.getByLabelText('Nouveau mot de passe'), 'NewPass@2024');
    await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'NewPass@2024');
    await user.click(screen.getByRole('button', { name: 'Réinitialiser le mot de passe' }));

    await waitFor(() => expect(confirmPasswordResetMock).toHaveBeenCalledWith({
      email: 'client1@test.gn', otp_code: '1234',
      new_password: 'NewPass@2024', new_password2: 'NewPass@2024',
    }));
    expect(pushMock).toHaveBeenCalledWith('/auth/login');
  });
});
