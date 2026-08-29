import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from '../components/Header';

describe('Header Component Unit & Accessibility Tests', () => {
  const mockProps = {
    currentPillar: 'home' as const,
    onSelectPillar: vi.fn(),
    onStartAnalysis: vi.fn(),
    currentUser: null,
    onOpenAccount: vi.fn(),
    onOpenSettings: vi.fn(),
    onOpenSearch: vi.fn(),
    onOpenHelp: vi.fn(),
    isLightMode: false,
    onToggleTheme: vi.fn(),
  };

  it('renders MindSense identity and primary navigation items', () => {
    render(<Header {...mockProps} />);
    expect(screen.getByText('MindSense')).toBeInTheDocument();
    expect(screen.getByText('Analyze')).toBeInTheDocument();
    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getAllByText('Research').length).toBeGreaterThan(0);
    expect(screen.getByText('Resources')).toBeInTheDocument();
  });

  it('triggers onStartAnalysis when Start Analysis CTA is clicked', () => {
    render(<Header {...mockProps} />);
    const cta = screen.getAllByRole('button', { name: /start analysis/i })[0];
    fireEvent.click(cta);
    expect(mockProps.onStartAnalysis).toHaveBeenCalledTimes(1);
  });

  it('toggles theme when theme button is clicked', () => {
    render(<Header {...mockProps} />);
    const themeBtn = screen.getAllByRole('button', { name: /toggle theme/i })[0];
    fireEvent.click(themeBtn);
    expect(mockProps.onToggleTheme).toHaveBeenCalledTimes(1);
  });
});
