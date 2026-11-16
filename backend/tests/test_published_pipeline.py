"""Serving contracts and privacy regression tests. No model metrics from doubles."""
import io
import uuid
import numpy as np
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import get_db_connection
from backend.app.inference.service import EmotionEngine, ModelUnavailable, InputError, fuse, normalize, face_crop
from backend.app.security import hash_password, verify_password

client = TestClient(app)

def account():
    name = 'privacy_' + uuid.uuid4().hex[:12]
    response = client.post('/api/auth/register', json={'username':name,'email':name+'@example.test','name':'Test','password':'StrongPass123!'}).json()
    return {'Authorization':'Bearer '+response['data']['token']}

@pytest.mark.parametrize('path', ['/api/history','/api/dashboard','/api/checkins','/api/user/export-data'])
def test_private_endpoints_require_auth(path):
    assert client.get(path).status_code == 401

def test_guest_analysis_not_persisted_and_invalid_token_rejected():
    with get_db_connection() as conn:
        before = conn.execute('SELECT count(*) FROM analyses').fetchone()[0]
    result = client.post('/api/analyze', data={'text':'An authored test input.'}).json()
    assert result['success'] and result['data']['saved'] is False
    with get_db_connection() as conn:
        assert conn.execute('SELECT count(*) FROM analyses').fetchone()[0] == before
    assert client.post('/api/analyze', data={'text':'hello'}, headers={'Authorization':'Bearer invalid'}).status_code == 401

def test_demo_never_returns_prediction():
    response = client.post('/api/analyze', data={'text':'hello','demo_mode':'true'}).json()
    assert not response['success'] and response['error']['code'] == 'DEMO_DISABLED'

def test_missing_weights_do_not_initialize_random_model(tmp_path):
    with pytest.raises(ModelUnavailable):
        EmotionEngine(tmp_path).analyze(text='hello')

@pytest.mark.parametrize('values', [{'happy':float('nan')},{'sad':-1},{'sad':0},{'sad':float('inf')}])
def test_invalid_scores_rejected(values):
    with pytest.raises(ValueError): normalize(values)

def test_fusion_uses_only_supported_labels_and_normalizes():
    predictions = {'audio':{'probabilities':{'happy':.8,'sad':.2}}, 'image':{'probabilities':{'happy':.4,'sad':.1,'fear':.5}}}
    result = fuse(predictions)
    assert result == pytest.approx({'happy':.6/1.25,'sad':.15/1.25,'fear':.5/1.25})
    assert fuse({'audio':predictions['audio']}) == predictions['audio']['probabilities']

def test_no_face_rejected():
    buffer = io.BytesIO(); Image.new('RGB',(200,200),'white').save(buffer,format='PNG')
    with pytest.raises(InputError, match='exactly one'): face_crop(buffer.getvalue())

def test_password_hashes_salted_and_verified():
    first, second = hash_password('secret'), hash_password('secret')
    assert first != second
    assert verify_password('secret', first) and not verify_password('wrong', first)

def test_research_requires_consent_and_never_fabricates_dataset_samples():
    headers = account()
    response = client.post('/api/research/participate', headers=headers, json={'study_id':999,'age_group':'25-34','gender_identity':'unspecified','questionnaire_answers':{},'contributed_modalities':'text'})
    assert response.status_code == 403
    assert client.get('/api/datasets/samples').json()['data']['samples'] == []

def test_password_reset_invalidates_old_session_and_is_single_use():
    name = 'reset_' + uuid.uuid4().hex[:10]
    data = client.post('/api/auth/register',json={'username':name,'email':name+'@example.test','name':'Test','password':'OldPassword123!'}).json()['data']
    headers = {'Authorization':'Bearer '+data['token']}
    token = client.post('/api/auth/forgot-password',json={'username_or_email':name}).json()['data']['reset_token']
    assert client.post('/api/auth/reset-password',json={'token':token,'new_password':'NewPassword123!'}).json()['success']
    assert client.get('/api/auth/me',headers=headers).status_code == 401
    assert not client.post('/api/auth/reset-password',json={'token':token,'new_password':'AnotherPassword123!'}).json()['success']

def test_production_recovery_never_exposes_token(monkeypatch):
    headers = account()
    user = client.get('/api/auth/me',headers=headers).json()['data']['user']
    sent = []
    monkeypatch.setenv('MINDSENSE_TEST_MODE','0')
    monkeypatch.setenv('SMTP_HOST','test.invalid')
    monkeypatch.setattr('backend.app.main.send_token',lambda recipient, token, purpose: sent.append((recipient,token,purpose)))
    response = client.post('/api/auth/forgot-password',json={'username_or_email':user['username']}).json()
    assert response['success'] and 'reset_token' not in response['data']
    assert len(sent) == 1  # Stubbed transport only: no real email sent.
    unknown = client.post('/api/auth/forgot-password',json={'username_or_email':'not-an-account'}).json()
    assert unknown == response
