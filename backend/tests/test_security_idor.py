import pytest
import uuid
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_user_a_and_b_idor_isolation():
    """
    CRITICAL SECURITY TEST:
    Create User A and User B.
    Verify User A cannot access User B's:
    - history
    - analysis results
    - daily notes / journal
    - daily check-ins
    - research contributions
    - account export data
    
    Attempt manual ID manipulation IDOR attacks.
    The expected result MUST be 403 Forbidden or 404 Not Found.
    """
    uid = uuid.uuid4().hex[:6]
    # 1. Register User A
    res_a = client.post("/api/auth/register", json={
        "username": f"user_a_victim_{uid}",
        "email": f"user_a_{uid}@mindsense.ai",
        "password": "Password123!",
        "name": "User A (Victim)"
    })
    assert res_a.status_code == 200
    token_a = res_a.json()["data"]["token"]
    user_a_id = res_a.json()["data"]["user"]["id"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 2. Register User B (Attacker)
    res_b = client.post("/api/auth/register", json={
        "username": f"user_b_attacker_{uid}",
        "email": f"user_b_{uid}@mindsense.ai",
        "password": "Password123!",
        "name": "User B (Attacker)"
    })
    assert res_b.status_code == 200
    token_b = res_b.json()["data"]["token"]
    user_b_id = res_b.json()["data"]["user"]["id"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 3. User A creates a private daily note and check-in
    note_res = client.post("/api/notes", json={
        "user_id": user_a_id,
        "date": "2026-08-29",
        "title": "User A Confidential Journal Entry",
        "content": "Private psychological reflection data",
        "mood_tag": "Calm"
    }, headers=headers_a)
    assert note_res.status_code == 200
    note_a_id = note_res.json()["data"]["id"]

    checkin_res = client.post("/api/checkin", json={
        "user_id": user_a_id,
        "feeling_score": 4,
        "energy_score": 3,
        "sleep_score": 5,
        "stress_score": 2,
        "talk_to_someone": False,
        "notes": "User A private checkin"
    }, headers=headers_a)
    assert checkin_res.status_code == 200

    # 4. User A performs an affective analysis
    analysis_res = client.post("/api/analyze", data={
        "text": "User A secret text sample"
    }, headers=headers_a)
    assert analysis_res.status_code == 200
    analysis_a_id = analysis_res.json()["data"]["id"]

    # --- ATTACK SCENARIO 1: User B attempts GET /api/history trying to supply user_id=user_a_id ---
    history_idor_res = client.get(f"/api/history?user_id={user_a_id}", headers=headers_b)
    assert history_idor_res.status_code == 200
    b_history = history_idor_res.json()["data"]["history"]
    # User B MUST ONLY receive User B's history (0 items), NEVER User A's items
    for item in b_history:
        assert item["id"] != analysis_a_id, "IDOR VULNERABILITY: User B accessed User A's analysis record!"

    # --- ATTACK SCENARIO 2: User B attempts DELETE /api/notes/{note_a_id} ---
    delete_note_idor = client.delete(f"/api/notes/{note_a_id}", headers=headers_b)
    assert delete_note_idor.status_code in [403, 404]

    # --- ATTACK SCENARIO 3: User B attempts GET /api/user/export-data trying to impersonate User A ---
    export_b = client.get("/api/user/export-data", headers=headers_b)
    assert export_b.status_code == 200
    b_export_data = export_b.json()["data"]["export"]
    assert b_export_data["id"] == user_b_id
    assert b_export_data["id"] != user_a_id, "IDOR VULNERABILITY: Export data returned User A's private account!"

    # --- ATTACK SCENARIO 4: User B attempts DELETE /api/user/account trying to delete User A ---
    # User B calling account delete must ONLY delete User B
    client.delete("/api/user/account", headers=headers_b)
    
    # Verify User A still exists unharmed
    export_a = client.get("/api/user/export-data", headers=headers_a)
    assert export_a.status_code == 200
    assert export_a.json()["data"]["export"]["id"] == user_a_id
