import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeroSearch } from '../components/hero-search';

// Capture the router mock so we can assert navigation calls.
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

describe('HeroSearch', () => {
  beforeEach(() => {
    pushMock.mockReset();
    localStorage.clear();
  });

  it('renders the from/to autocomplete inputs', () => {
    render(<HeroSearch />);
    // The mock returns the translation key; PlacesAutocomplete uses
    // placeholder={t('fromPlaceholder')} → renders as "fromPlaceholder".
    expect(screen.getByPlaceholderText('fromPlaceholder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('toPlaceholder')).toBeInTheDocument();
  });

  it('renders the swap button', () => {
    render(<HeroSearch />);
    expect(screen.getByRole('button', { name: /swap/i })).toBeInTheDocument();
  });

  it('renders the depart/arrive mode toggles as a radio group', () => {
    render(<HeroSearch />);
    // The segmented control is a radiogroup of two radio buttons.
    expect(screen.getByRole('radiogroup', { name: /time mode/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'departAt' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'arriveBy' })).toBeInTheDocument();
  });

  it('navigates to /plan on form submit', async () => {
    const user = userEvent.setup();
    render(<HeroSearch />);
    const submitBtn = screen.getByRole('button', { name: 'plan' });
    await user.click(submitBtn);
    expect(pushMock).toHaveBeenCalledOnce();
    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('/plan'));
  });

  it('navigates to /plan with from & to params when places are selected', async () => {
    const user = userEvent.setup({ delay: null });
    render(<HeroSearch />);

    // Type in the "from" input and pick a suggestion.
    await user.type(screen.getByPlaceholderText('fromPlaceholder'), 'frank');
    const fromSuggestion = await screen.findByText('Frankfurt (Main) Hbf');
    await user.click(fromSuggestion);

    // Type in the "to" input and pick a suggestion.
    await user.type(screen.getByPlaceholderText('toPlaceholder'), 'berlin');
    const toSuggestion = await screen.findByText('Berlin Hauptbahnhof');
    await user.click(toSuggestion);

    await user.click(screen.getByRole('button', { name: 'plan' }));

    expect(pushMock).toHaveBeenCalledOnce();
    const firstCall = pushMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    const url = firstCall![0] as string;
    expect(url).toContain('/plan');
    expect(url).toContain('from=');
    expect(url).toContain('to=');
  });

  it('swaps from and to values when the swap button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(<HeroSearch />);

    // Select a "from" place.
    await user.type(screen.getByPlaceholderText('fromPlaceholder'), 'frank');
    await user.click(await screen.findByText('Frankfurt (Main) Hbf'));

    // Swap.
    await user.click(screen.getByRole('button', { name: /swap/i }));

    // After swap, the "to" input should now contain Frankfurt's name.
    // (The swap button moves whatever was in "from" into "to".)
    expect(screen.getByPlaceholderText('toPlaceholder')).toHaveValue('Frankfurt (Main) Hbf');
  });
});
