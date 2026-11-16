import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiService } from '../services/api';

describe('Authenticated journal requests', () => {
  beforeEach(() => {
    localStorage.setItem('mindsense_token', 'test-session');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ success: true, data: {} }),
    }));
  });
  afterEach(() => { localStorage.clear(); vi.unstubAllGlobals(); });

  it.each([
    ['save', () => apiService.saveDailyNote(1, '2026-11-16', 'Today', 'Reflection', 'calm')],
    ['read', () => apiService.getDailyNotes(1)],
    ['delete', () => apiService.deleteDailyNote(2, 1)],
  ] as const)('sends the session token when journals %s', async (_label, request) => {
    await request();
    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer test-session' }),
    }));
  });
});
