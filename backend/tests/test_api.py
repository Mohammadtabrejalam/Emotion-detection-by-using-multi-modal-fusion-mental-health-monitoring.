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
