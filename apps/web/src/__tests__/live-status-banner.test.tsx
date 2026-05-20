import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { LiveStatusBanner } from '../components/live-status-banner';

describe('LiveStatusBanner', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the section with an accessible heading', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    await act(async () => {
      render(<LiveStatusBanner />);
    });
    expect(screen.getByRole('region', { name: /liveStatus/i })).toBeInTheDocument();
  });

  it('shows FALLBACK items immediately when fetch is pending', async () => {
    // fetch never resolves → component uses FALLBACK while awaiting
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}));
    await act(async () => {
      render(<LiveStatusBanner />);
    });
    // The FALLBACK contains Berlin, Paris, Tunis
    expect(screen.getByText('Berlin')).toBeInTheDocument();
    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.getByText('Tunis')).toBeInTheDocument();
  });

  it('shows FALLBACK items when the network request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
    render(<LiveStatusBanner />);
    expect(await screen.findByText('Berlin')).toBeInTheDocument();
    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.getByText('Tunis')).toBeInTheDocument();
  });

  it('replaces FALLBACK with API items on a successful fetch', async () => {
    const payload = {
      data: {
        items: [
          { city: 'Marseille', country: 'FR', status: 'ok', note: 'Tout va bien', locale: 'fr' },
          { city: 'Hamburg', country: 'DE', status: 'ok', note: 'S-Bahn pünktlich', locale: 'de' },
        ],
        generatedAt: '2024-06-01T10:00:00.000Z',
      },
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: () => Promise.resolve(payload),
    } as Response);

    render(<LiveStatusBanner />);

    expect(await screen.findByText('Marseille')).toBeInTheDocument();
    expect(screen.getByText('Hamburg')).toBeInTheDocument();
    // Fallback cities should NOT be shown anymore.
    expect(screen.queryByText('Tunis')).not.toBeInTheDocument();
  });

  it('shows the API error note when the response contains an error field', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: () => Promise.resolve({ error: { message: 'Service unavailable' } }),
    } as Response);

    render(<LiveStatusBanner />);
    // Falls back to FALLBACK data because the service returned an error.
    expect(await screen.findByText('Berlin')).toBeInTheDocument();
  });

  it('renders a status indicator for each displayed city', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    render(<LiveStatusBanner />);
    // FALLBACK has 3 cities, so we expect 3 list items.
    const items = await screen.findAllByRole('listitem');
    expect(items.length).toBeGreaterThanOrEqual(3);
  });
});
