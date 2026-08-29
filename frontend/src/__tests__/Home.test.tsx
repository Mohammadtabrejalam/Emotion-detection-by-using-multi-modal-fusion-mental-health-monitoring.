import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Home } from '../pages/Home';

describe('Home Page Component Tests', () => {
  const mockProps = {
    currentUser: null,
    onStartAnalysis: vi.fn(),
    onNavigate: vi.fn(),
    onOpenHelp: vi.fn(),
    recentAnalysis: null,
  };

  it('renders hero title and factual tagline without hype words', () => {
    render(<Home {...mockProps} />);
    expect(screen.getByText('MindSense')).toBeInTheDocument();
    expect(screen.getByText('Understanding emotional expression through multimodal signals.')).toBeInTheDocument();
    expect(screen.queryByText(/revolutionary AI/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/next-generation AI/i)).not.toBeInTheDocument();
  });

  it('renders primary CTA buttons and responds to clicks', () => {
    render(<Home {...mockProps} />);
    const ctas = screen.getAllByRole('button', { name: /start an analysis/i });
    fireEvent.click(ctas[0]);
    expect(mockProps.onStartAnalysis).toHaveBeenCalledTimes(1);
  });
});
