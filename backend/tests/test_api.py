import sys
import os
from fastapi.testclient import TestClient

# Ensure app package is in python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "status" in data["data"]
    assert "pytorch_loaded" in data["data"]

def test_analyze_insufficient_input():
    response = client.post("/api/analyze", data={"demo_mode": "true"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "INSUFFICIENT_INPUT"

def test_analyze_text_only():
    response = client.post("/api/analyze", data={"text": "I feel so happy and excited today!", "demo_mode": "true"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["emotion"] == "happy"
    assert data["data"]["is_demo"] is True
    assert "text" in data["data"]["modalities_used"]

def test_analyze_text_crisis():
    response = client.post("/api/analyze", data={"text": "I want to commit suicide and end my life", "demo_mode": "true"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["crisis_alert"] is True
    assert "Lifeline" in data["data"]["wellness_insight"]

def test_checkin_flow():
    checkin_data = {
        "feeling_score": 4,
        "energy_score": 3,
        "sleep_score": 5,
        "stress_score": 2,
        "talk_to_someone": False,
        "notes": "Feeling good, slept well."
    }
    # Submit checkin
    response = client.post("/api/checkin", json=checkin_data)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "id" in data["data"]
    
    # Retrieve checkins
    response = client.get("/api/checkins")
    assert response.status_code == 200
    checkins_data = response.json()
    assert checkins_data["success"] is True
    assert len(checkins_data["data"]["checkins"]) > 0

def test_dashboard_endpoint():
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "total_analyses" in data["data"]["summary"]
    assert "trends" in data["data"]

def test_research_endpoint():
    response = client.get("/api/research")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "metrics" in data["data"]
    assert "confusion_matrix" in data["data"]

def test_clear_history():
    response = client.delete("/api/history")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    
    # Verify history is empty
    history_res = client.get("/api/history")
    assert len(history_res.json()["data"]["history"]) == 0

def test_assistant_chat_normal_question():
    # CASE 1: Normal research question
    response = client.post("/api/assistant/chat", json={"message": "How does multimodal fusion work?"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["is_crisis"] is False
    assert "Cross-Attention" in data["data"]["response"] or "Intermediate" in data["data"]["response"]

def test_assistant_chat_navigation_question():
    # CASE 2: Navigation / usage question
    response = client.post("/api/assistant/chat", json={"message": "How do I analyze text?"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["is_crisis"] is False
    assert "Analyze" in data["data"]["response"]

def test_assistant_chat_crisis_input():
    # CASE 3: Crisis detection question
    response = client.post("/api/assistant/chat", json={"message": "I want to commit suicide and end my life"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["is_crisis"] is True
    assert "988" in data["data"]["response"]
    assert "findahelpline.com" in data["data"]["response"]

def test_assistant_chat_empty_query():
    # CASE 4: Empty query handling
    response = client.post("/api/assistant/chat", json={"message": "   "})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["is_crisis"] is False
    assert "MindSense Research Assistant" in data["data"]["response"]

def test_share_link_flow():
    # 1. Run analysis to create result
    res = client.post("/api/analyze", data={"text": "Feeling wonderful and cheerful", "demo_mode": "true"})
    assert res.status_code == 200
    result_id = res.json()["data"]["id"]

    # 2. Create server-side share link
    share_res = client.post("/api/share/create", json={"result_id": result_id, "expiration_hours": 24})
    assert share_res.status_code == 200
    token = share_res.json()["data"]["share_token"]
    assert token is not None

    # 3. Retrieve shared result
    get_res = client.get(f"/api/share/{token}")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["emotion"] is not None
    assert get_res.json()["data"]["share_id"] == token

    # 4. Revoke share link
    revoke_res = client.post(f"/api/share/{token}/revoke")
    assert revoke_res.status_code == 200

    # 5. Verify revoked link returns error
    get_revoked = client.get(f"/api/share/{token}")
    assert get_revoked.json()["success"] is False
    assert get_revoked.json()["error"]["code"] == "LINK_REVOKED"

def test_developer_portal_flow():
    # 1. Developer Login
    login_res = client.post("/api/developer/auth/login", json={"username_or_email": "admin@mindsense.ai", "password": "admin123"})
    assert login_res.status_code == 200
    assert login_res.json()["success"] is True
    dev_token = login_res.json()["data"]["token"]
    assert dev_token is not None

    headers = {"Authorization": f"Bearer {dev_token}"}

    # 2. Developer Dashboard with Token
    dash_res = client.get("/api/developer/dashboard", headers=headers)
    assert dash_res.status_code == 200
    assert "total_visits" in dash_res.json()["data"]

    # 3. Submit feedback & update status
    client.post("/api/feedback", json={"rating": 5, "category": "UI/UX", "comment": "Great layout overhaul!"})
    fb_res = client.get("/api/developer/feedback", headers=headers)
    assert fb_res.status_code == 200
    fb_list = fb_res.json()["data"]["feedback"]
    assert len(fb_list) > 0
    fb_id = fb_list[0]["id"]

    # 4. Developer updates feedback status
    update_res = client.put(f"/api/developer/feedback/{fb_id}", json={"status": "In Review", "priority": "High", "internal_notes": "Assigned to UI team."}, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["success"] is True

    # 5. Developer Audit Logs & Health
    audit_res = client.get("/api/developer/audit-logs", headers=headers)
    assert audit_res.status_code == 200
    assert len(audit_res.json()["data"]["logs"]) > 0

    health_res = client.get("/api/developer/health", headers=headers)
    assert health_res.status_code == 200
    assert health_res.json()["data"]["status"] == "operational"

def test_user_isolation_and_rbac_security():
    # 1. Unauthenticated request to developer dashboard must fail with 401
    unauth_dev = client.get("/api/developer/dashboard")
    assert unauth_dev.status_code == 401

    # 2. Register User A & User B
    import uuid
    u1_name = f"user_a_{uuid.uuid4().hex[:6]}"
    u2_name = f"user_b_{uuid.uuid4().hex[:6]}"

    reg_a = client.post("/api/auth/register", json={"username": u1_name, "email": f"{u1_name}@mindsense.ai", "password": "password123", "name": "User A"})
    assert reg_a.status_code == 200
    token_a = reg_a.json()["data"]["token"]

    reg_b = client.post("/api/auth/register", json={"username": u2_name, "email": f"{u2_name}@mindsense.ai", "password": "password123", "name": "User B"})
    assert reg_b.status_code == 200
    token_b = reg_b.json()["data"]["token"]

    # 3. User A submits analysis with token A
    anal_a = client.post("/api/analyze", data={"text": "User A private thought"}, headers={"Authorization": f"Bearer {token_a}"})
    assert anal_a.status_code == 200

    # 4. User B fetches history with token B -> User B must NOT see User A's history
    hist_b = client.get("/api/history", headers={"Authorization": f"Bearer {token_b}"})
    assert hist_b.status_code == 200
    b_records = hist_b.json()["data"]["history"]
    assert len(b_records) == 0

    # 5. User A fetches history with token A -> User A sees 1 record
    hist_a = client.get("/api/history", headers={"Authorization": f"Bearer {token_a}"})
    assert hist_a.status_code == 200
    a_records = hist_a.json()["data"]["history"]
    assert len(a_records) == 1

    # 6. User A token cannot access developer dashboard (must fail with 401)
    user_access_dev = client.get("/api/developer/dashboard", headers={"Authorization": f"Bearer {token_a}"})
    assert user_access_dev.status_code == 401


