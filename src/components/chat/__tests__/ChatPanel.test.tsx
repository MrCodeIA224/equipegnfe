import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatPanel from '../ChatPanel';

const openMock = vi.fn();
const getMessagesMock = vi.fn();
const sendMessageMock = vi.fn();

vi.mock('@/lib/api', () => ({
  chatApi: {
    open: (...args: unknown[]) => openMock(...args),
    getMessages: (...args: unknown[]) => getMessagesMock(...args),
    sendMessage: (...args: unknown[]) => sendMessageMock(...args),
  },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, username: 'client1' } }),
}));

describe('ChatPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    openMock.mockReset().mockResolvedValue({ data: { id: 7, client: 1, assignee: 2 } });
    getMessagesMock.mockReset().mockResolvedValue({ data: { results: [] } });
    sendMessageMock.mockReset().mockResolvedValue({
      data: { id: 100, conversation: 7, sender: 1, sender_name: 'client1', body: 'Bonjour', created_at: new Date().toISOString() },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens the conversation for the order on mount', async () => {
    render(<ChatPanel orderType="DELIVERY" orderId={42} />);
    await waitFor(() => expect(openMock).toHaveBeenCalledWith('DELIVERY', 42));
  });

  it('shows an error message when the conversation cannot be opened', async () => {
    openMock.mockRejectedValue(new Error('not found'));
    render(<ChatPanel orderType="DELIVERY" orderId={42} />);
    expect(await screen.findByText(/pas encore disponible/)).toBeInTheDocument();
  });

  it('polls and displays messages once the conversation is open', async () => {
    getMessagesMock.mockResolvedValue({
      data: { results: [{ id: 1, conversation: 7, sender: 2, sender_name: 'Livreur', body: 'Je suis en route', created_at: new Date().toISOString() }] },
    });
    render(<ChatPanel orderType="DELIVERY" orderId={42} />);

    await waitFor(() => expect(openMock).toHaveBeenCalled());
    await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
    expect(await screen.findByText('Je suis en route')).toBeInTheDocument();
  });

  it('sends a message and appends it to the list', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChatPanel orderType="DELIVERY" orderId={42} />);
    await waitFor(() => expect(openMock).toHaveBeenCalled());

    const input = await screen.findByPlaceholderText('Écrire un message...');
    await user.type(input, 'Bonjour');
    await user.click(screen.getByLabelText('Envoyer'));

    await waitFor(() => expect(sendMessageMock).toHaveBeenCalledWith(7, 'Bonjour'));
    expect(await screen.findByText('Bonjour')).toBeInTheDocument();
  });
});
