import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Analysis } from '../pages/Analysis';
import { apiService } from '../services/api';
vi.mock('../services/api', () => ({ apiService: {getModels: vi.fn(), analyzeEmotion: vi.fn()} }));
beforeEach(() => {
  vi.mocked(apiService.getModels).mockResolvedValue({success:true,data:{models:{text:{installed:false,loaded:false,repo:'test'}}},error:null} as any);
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe('Real analysis UI contracts', () => {
  it('requires permission and reports missing models without invented results', async () => {
    vi.mocked(apiService.analyzeEmotion).mockResolvedValue({success:false,data:null,error:{code:'MODEL_UNAVAILABLE',message:'Text model is not installed.'}});
    render(<Analysis/>);
    expect(screen.getByRole('button',{name:'Start Analysis'})).toBeDisabled();
    await screen.findByText('text: not installed');
    fireEvent.change(screen.getByPlaceholderText(/Type or paste/),{target:{value:'An authored example.'}});
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button',{name:'Start Analysis'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('not installed');
    expect(screen.queryByText('Analysis Output & Classification')).not.toBeInTheDocument();
  });
  it('shows unsaved guest output without offering sharing', async () => {
    vi.mocked(apiService.analyzeEmotion).mockResolvedValue({success:true,data:{id:'test',emotion:'happy',confidence:.7,probabilities:{happy:.7,neutral:.3},modality_predictions:{},warnings:['Uncalibrated'],saved:false}} as any);
    render(<Analysis initialText="An example"/>);
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button',{name:'Start Analysis'}));
    await waitFor(() => expect(screen.getByText('Guest result: not saved to the server.')).toBeInTheDocument());
    expect(screen.queryByRole('button',{name:'Share Result'})).not.toBeInTheDocument();
  });
});
