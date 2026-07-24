import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationBell from '../NotificationBell';

const unreadCountMock = vi.fn();
const listMock = vi.fn();
const markReadMock = vi.fn();
const markAllReadMock = vi.fn();

vi.mock('@/lib/api', () => ({
  notificationApi: {
    unreadCount: (...args: unknown[]) => unreadCountMock(...args),
    list: (...args: unknown[]) => listMock(...args),
    markRead: (...args: unknown[]) => markReadMock(...args),
    markAllRead: (...args: unknown[]) => markAllReadMock(...args),
  },
}));

const authMock = vi.fn();
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => authMock(),
}));

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    unreadCountMock.mockReset().mockResolvedValue({ data: { unread_count: 0 } });
    listMock.mockReset().mockResolvedValue({ data: { results: [] } });
    markReadMock.mockReset().mockResolvedValue({});
    markAllReadMock.mockReset().mockResolvedValue({});
    authMock.mockReset().mockReturnValue({ user: { id: 1, username: 'client1' } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when there is no authenticated user', () => {
    authMock.mockReturnValue({ user: null });
    const { container } = render(<NotificationBell />);
    expect(container).toBeEmptyDOMElement();
  });

  it('polls the unread count and displays a badge', async () => {
    unreadCountMock.mockResolvedValue({ data: { unread_count: 3 } });
    render(<NotificationBell />);

    await act(async () => { await vi.advanceTimersByTimeAsync(25000); });
    expect(await screen.findByText('3')).toBeInTheDocument();
  });

  it('loads and displays notifications when opened', async () => {
    listMock.mockResolvedValue({
      data: { results: [{ id: 1, title: 'Commande confirmée', message: 'Détails', notification_type: 'ORDER_STATUS', is_read: false, created_at: new Date().toISOString() }] },
    });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<NotificationBell />);

    await user.click(screen.getByLabelText('Notifications'));
    expect(await screen.findByText('Commande confirmée')).toBeInTheDocument();
  });

  it('marks a notification read on click', async () => {
    listMock.mockResolvedValue({
      data: { results: [{ id: 1, title: 'Commande confirmée', message: 'Détails', notification_type: 'ORDER_STATUS', is_read: false, created_at: new Date().toISOString() }] },
    });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<NotificationBell />);

    await user.click(screen.getByLabelText('Notifications'));
    const item = await screen.findByText('Commande confirmée');
    await user.click(item);

    await waitFor(() => expect(markReadMock).toHaveBeenCalledWith(1));
  });
});
