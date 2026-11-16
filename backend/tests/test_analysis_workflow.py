"""Regression coverage for actual inference, upload, and ownership boundaries."""
import io
import uuid
from unittest.mock import patch

import numpy as np
import pytest
from fastapi.testclient import TestClient
from scipy.io import wavfile

from backend.app import main
from backend.app.ml.preprocessing.audio import extract_audio_waveform

client = TestClient(main.app)


def register():
    username = uuid.uuid4().hex
    data = client.post('/api/auth/register', json={
        'username': username, 'email': f'{username}@example.com',
        'password': 'Test-password-123!', 'name': 'Test User',
    }).json()['data']
    return data['user']['id'], {'Authorization': f"Bearer {data['token']}"}


def test_missing_checkpoint_is_not_model_inference():
    with patch.object(main, 'model', None):
        assert client.get('/api/health').json()['data']['inference_mode'] == 'demo'
        result = client.post('/api/analyze', data={'text': 'I feel happy'}).json()['data']
    assert result['is_demo'] is True
    assert result['confidence_label'] == 'Illustrative demo score'
    assert 'demonstration' in result['wellness_insight']


def test_whitespace_is_not_a_modality():
    result = client.post('/api/analyze', data={'text': ' \n\t '}).json()
    assert result['success'] is False
    assert result['error']['code'] == 'INSUFFICIENT_INPUT'


@pytest.mark.parametrize('extension', ['wav', 'webm', 'mp4'])
def test_corrupted_audio_is_rejected(extension):
    result = client.post('/api/analyze', files={
        'audio': (f'broken.{extension}', b'not audio', f'audio/{extension}'),
    }).json()
    assert result['success'] is False
    assert result['error']['code'] == 'INVALID_AUDIO'


@pytest.mark.parametrize('modality,filename', [('audio', 'big.wav'), ('image', 'big.png')])
def test_upload_limit(modality, filename):
    with patch.object(main, 'MAX_UPLOAD_BYTES', 16):
        result = client.post('/api/analyze', files={modality: (filename, b'x' * 17)})
    assert result.status_code == 413


def test_valid_wav_can_be_analyzed():
    buffer = io.BytesIO()
    samples = (np.sin(np.arange(1600) * 0.1) * 16000).astype(np.int16)
    wavfile.write(buffer, 16000, samples)
    result = client.post('/api/analyze', data={'demo_mode': 'true'}, files={
        'audio': ('voice.wav', buffer.getvalue(), 'audio/wav'),
    }).json()
    assert result['success'] is True
    assert result['data']['modalities_used'] == ['audio']


def test_stereo_pcm_is_normalized_before_downmix():
    buffer = io.BytesIO()
    wavfile.write(buffer, 16000, np.full((160, 2), 16384, dtype=np.int16))
    signal = extract_audio_waveform(buffer.getvalue())
    assert np.allclose(signal, 0.5)


def test_guest_cannot_attach_records_to_registered_user():
    user_id, headers = register()
    client.post('/api/analyze', data={'text': 'Hello', 'user_id': user_id, 'demo_mode': 'true'})
    client.post('/api/checkin', json={
        'user_id': user_id, 'feeling_score': 3, 'energy_score': 3,
        'sleep_score': 3, 'stress_score': 3, 'talk_to_someone': False,
    })
    assert client.get('/api/history', headers=headers).json()['data']['history'] == []
    assert client.get('/api/checkins', headers=headers).json()['data']['checkins'] == []


def test_private_shares_require_owner_for_creation_and_revocation():
    owner_id, owner = register()
    _, other = register()
    result_id = client.post('/api/analyze', data={'text': 'Happy', 'demo_mode': 'true'}, headers=owner).json()['data']['id']
    for headers in ({}, other):
        result = client.post('/api/share/create', json={'result_id': result_id, 'user_id': owner_id}, headers=headers).json()
        assert result['success'] is False
    shared = client.post('/api/share/create', json={'result_id': result_id}, headers=owner).json()
    token = shared['data']['share_token']
    for headers in ({}, other):
        assert client.post(f'/api/share/{token}/revoke', headers=headers).json()['success'] is False
    assert client.get(f'/api/share/{token}').json()['success'] is True
    assert client.post(f'/api/share/{token}/revoke', headers=owner).json()['success'] is True
    assert client.get(f'/api/share/{token}').json()['error']['code'] == 'LINK_REVOKED'


def test_checkin_scores_must_be_in_range():
    response = client.post('/api/checkin', json={
        'feeling_score': 99, 'energy_score': 3, 'sleep_score': 3,
        'stress_score': 3, 'talk_to_someone': False,
    })
    assert response.status_code == 422
