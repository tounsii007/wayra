import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Place } from '@wayra/types';
import { PlacesAutocomplete } from '../components/places-autocomplete';

const FRANKFURT: Place = {
  id: 'de:frankfurt:hbf',
  type: 'station',
  name: 'Frankfurt (Main) Hbf',
  coordinates: { lat: 50.1073, lng: 8.6638 },
  countryCode: 'DE',
  modes: ['rail'],
};

describe('PlacesAutocomplete', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    onChange.mockReset();
    // Keep localStorage clean between tests so Zustand's persist middleware
    // doesn't leak state.
    localStorage.clear();
  });

  it('renders with the supplied placeholder text', () => {
    render(<PlacesAutocomplete value={null} onChange={onChange} placeholder="From" />);
    expect(screen.getByPlaceholderText('From')).toBeInTheDocument();
  });

  it('opens the suggestions panel on focus', async () => {
    const user = userEvent.setup();
    render(<PlacesAutocomplete value={null} onChange={onChange} placeholder="From" />);
    const input = screen.getByPlaceholderText('From');
    await user.click(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows the clear button when a place is already selected', () => {
    render(<PlacesAutocomplete value={FRANKFURT} onChange={onChange} />);
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('calls onChange(null) when the clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<PlacesAutocomplete value={FRANKFURT} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /clear/i }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('shows matching suggestions after typing a query', async () => {
    const user = userEvent.setup({ delay: null });
    render(<PlacesAutocomplete value={null} onChange={onChange} placeholder="From" />);
    const input = screen.getByPlaceholderText('From');
    await user.type(input, 'frank');
    // findByText waits up to 1s, covering the 120ms debounce.
    expect(await screen.findByText('Frankfurt (Main) Hbf')).toBeInTheDocument();
  });

  it('calls onChange with the selected place when a suggestion is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(<PlacesAutocomplete value={null} onChange={onChange} placeholder="From" />);
    await user.type(screen.getByPlaceholderText('From'), 'frank');
    const suggestion = await screen.findByText('Frankfurt (Main) Hbf');
    await user.click(suggestion);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'de:frankfurt:hbf' }));
  });

  it('closes the suggestions panel when Escape is pressed', async () => {
    const user = userEvent.setup({ delay: null });
    render(<PlacesAutocomplete value={null} onChange={onChange} placeholder="From" />);
    const input = screen.getByPlaceholderText('From');
    await user.type(input, 'frank');
    await screen.findByText('Frankfurt (Main) Hbf'); // wait for panel to open
    await user.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('navigates suggestions with arrow keys', async () => {
    const user = userEvent.setup({ delay: null });
    render(<PlacesAutocomplete value={null} onChange={onChange} placeholder="From" />);
    await user.type(screen.getByPlaceholderText('From'), 'hbf');
    // Wait for at least two suggestions to appear before asserting navigation.
    const options = await screen.findAllByRole('option');
    expect(options.length).toBeGreaterThanOrEqual(2);
    // Initial active index is 0 → first option aria-selected=true.
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowDown}');
    // After one ArrowDown the second option should become active.
    const refreshed = screen.getAllByRole('option');
    expect(refreshed[1]).toHaveAttribute('aria-selected', 'true');
  });
});
