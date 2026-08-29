import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_research_studies_listing():
    response = client.get("/api/research/studies")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert "studies" in res["data"]
    assert len(res["data"]["studies"]) > 0
    assert res["data"]["studies"][0]["title"] == "Multimodal Affective Baseline Study 2026"

def test_research_participation_and_withdrawal_flow():
    # 1. Register test user & get JWT token
    reg_res = client.post("/api/auth/register", json={
        "username": "researcher_test_user",
        "email": "researcher_test@mindsense.ai",
        "password": "Password123!",
        "name": "Test Researcher Participant"
    })
    assert reg_res.status_code == 200
    token = reg_res.json()["data"]["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Submit Research Consent
    consent_res = client.post("/api/research/consent", json={"study_id": 1, "consent_version": "1.0"}, headers=headers)
    assert consent_res.status_code == 200
    assert consent_res.json()["success"] is True

    # 3. Submit Research Participation Data
    part_res = client.post("/api/research/participate", json={
        "study_id": 1,
        "age_group": "25-34",
        "gender_identity": "Prefer not to say",
        "questionnaire_answers": {"baseline_mood": 4},
        "contributed_modalities": "text"
    }, headers=headers)
    assert part_res.status_code == 200
    part_data = part_res.json()["data"]
    assert "participant_code" in part_data
    assert part_data["participant_code"].startswith("PAR-")

    # 4. Submit Emotion Recognition Challenge Score
    chal_res = client.post("/api/challenge/submit", json={
        "score": 4,
        "total_questions": 5,
        "accuracy": 80.0
    }, headers=headers)
    assert chal_res.status_code == 200
    assert chal_res.json()["success"] is True

    # 5. Get Challenge History
    hist_res = client.get("/api/challenge/history", headers=headers)
    assert hist_res.status_code == 200
    assert len(hist_res.json()["data"]["history"]) >= 1

    # 6. Export Complete User Data
    export_res = client.get("/api/user/export-data", headers=headers)
    assert export_res.status_code == 200
    assert "export" in export_res.json()["data"]

    # 7. Withdraw from Research Study
    withdraw_res = client.post("/api/research/withdraw", json={"study_id": 1}, headers=headers)
    assert withdraw_res.status_code == 200
    assert withdraw_res.json()["success"] is True

    # 8. Delete Account
    del_res = client.delete("/api/user/account", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True
