"""Actual-model API smoke test in a disposable database (no classifier doubles).

Usage: python -m scripts.smoke_real --clip path/to/RAVDESS/01-01-01-01-01-01-01.mp4
This is integration verification, not an accuracy benchmark.
"""
import argparse
import io
import os
import tempfile
import time
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--clip', type=Path, required=True)
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix='mindsense-real-smoke-') as temp:
        os.environ['MINDSENSE_DATABASE_PATH'] = str(Path(temp)/'test.db')
        os.environ['MINDSENSE_TEST_MODE'] = '0'
        os.environ['ENVIRONMENT'] = 'development'
        import cv2
        from PIL import Image
        from fastapi.testclient import TestClient
        from backend.app.main import app
        from backend.app.database import get_db_connection
        cap = cv2.VideoCapture(str(args.clip))
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(cap.get(cv2.CAP_PROP_FRAME_COUNT)//2))
        ok, frame = cap.read(); cap.release()
        assert ok
        image = io.BytesIO(); Image.fromarray(cv2.cvtColor(frame,cv2.COLOR_BGR2RGB)).save(image,format='PNG')
        client = TestClient(app)
        with get_db_connection() as conn:
            assert conn.execute('SELECT count(*) FROM users').fetchone()[0] == 0
            assert conn.execute('SELECT count(*) FROM developer_users').fetchone()[0] == 0
        assert client.get('/api/research/studies').json()['data']['studies'] == []
        account = client.post('/api/auth/register',json={'username':'smoke','email':'smoke@example.test','password':'TestOnlyPassword123!','name':'Smoke test'}).json()['data']
        headers = {'Authorization':'Bearer '+account['token']}
        start = time.perf_counter()
        response = client.post('/api/analyze',headers=headers,data={'text':'Kids are talking by the door.'},files={'audio':('clip.mp4',args.clip.read_bytes(),'audio/mp4'),'image':('face.png',image.getvalue(),'image/png')}).json()
        assert response['success'], response
        result = response['data']
        assert result['saved'] and set(result['modalities_used']) == {'text','audio','image'}
        assert all('TEST' not in value['model'] for value in result['modality_predictions'].values())
        print(f'Actual three-model API inference passed in {time.perf_counter()-start:.2f}s (includes cold loading).')
        note = client.post('/api/notes',headers=headers,json={'user_id':account['user']['id'],'date':'2026-11-16','title':'Integration test','content':'Disposable authored journal entry.','mood_tag':'calm'}).json()
        assert note['success'],note
        assert client.get('/api/notes',headers=headers).json()['data']['notes']
        checkin = client.post('/api/checkin',headers=headers,json={'feeling_score':3,'energy_score':3,'sleep_score':3,'stress_score':2,'talk_to_someone':False}).json()
        assert checkin['success'],checkin
        assert client.get('/api/dashboard',headers=headers).json()['success']
        token = client.post('/api/share/create',headers=headers,json={'result_id':result['id'],'expiration_hours':1}).json()['data']['share_token']
        shared = client.get('/api/share/'+token).json()
        assert shared['success'] and 'Disposable authored' not in str(shared)
        assert client.post('/api/share/'+token+'/revoke',headers=headers).json()['success']
        assert not client.get('/api/share/'+token).json()['success']
        assert client.get('/api/user/export-data',headers=headers).json()['success']
        assert client.delete('/api/user/account',headers=headers).json()['success']
        assert client.get('/api/auth/me',headers=headers).status_code == 401
        print('Registration, journals, check-ins, dashboard, share/revoke, export, deletion and session invalidation passed.')

if __name__ == '__main__': main()
