import pytest
import uuid
from fastapi.testclient import TestClient
from backend.app.main import app, create_jwt_token
from backend.app.database import authenticate_developer

client = TestClient(app)

def test_developer_security_and_rbac_isolation():
    """
    DEVELOPER SECURITY TESTING:
    Verify normal user / unauthenticated user cannot access developer functionality.
    
    1. Normal User calls /api/developer/dashboard -> 401 Unauthorized / 403 Forbidden.
    2. Unapproved Developer calls /api/developer/dashboard -> 403 Forbidden.
    3. Approved Developer calls /api/developer/dashboard -> 200 OK.
    """
    uid = uuid.uuid4().hex[:6]
    # 1. Unauthenticated request to developer endpoint
    unauth_res = client.get("/api/developer/dashboard")
    assert unauth_res.status_code == 401

    # 2. Normal User JWT token request to developer endpoint
    user_reg = client.post("/api/auth/register", json={
        "username": f"normal_user_{uid}",
        "email": f"normal_{uid}@mindsense.ai",
        "password": "Password123!",
        "name": "Normal User"
    })
    assert user_reg.status_code == 200
    user_token = user_reg.json()["data"]["token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}

    user_dev_res = client.get("/api/developer/dashboard", headers=user_headers)
    assert user_dev_res.status_code == 401, "SECURITY FAILURE: Normal user accessed Developer API!"

    # 3. Unapproved Developer (PENDING_APPROVAL)
    dev_username = f"applicant_dev_{uid}"
    dev_reg = client.post("/api/developer/auth/register", json={
        "full_name": "Applicant Developer",
        "username": dev_username,
        "email": f"applicant_{uid}@mindsense.ai",
        "password": "DevPassword123!",
        "organization": "Independent Lab",
        "requested_role": "DEVELOPER"
    })
    assert dev_reg.status_code == 200
    v_token = dev_reg.json()["data"]["verification_token"]
    client.post(f"/api/developer/auth/verify-email?token={v_token}")

    # Try login before approval
    login_unapproved = client.post("/api/developer/auth/login", json={
        "username_or_email": dev_username,
        "password": "DevPassword123!"
    })
    assert login_unapproved.json()["success"] is False

    # 4. Super Admin Login & Approval
    admin = authenticate_developer("admin@mindsense.ai", "admin123")
    admin_token = create_jwt_token({
        "sub": admin["id"],
        "username": admin["username"],
        "role": admin["role"],
        "type": "developer"
    })
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Fetch pending developer requests
    requests_res = client.get("/api/developer/requests", headers=admin_headers)
    assert requests_res.status_code == 200
    pending_list = requests_res.json()["data"]["requests"]
    target_dev = next((r for r in pending_list if r["username"] == dev_username), None)
    assert target_dev is not None

    # Approve developer account
    approve_res = client.post(f"/api/developer/requests/{target_dev['id']}/status", json={
        "status": "ACTIVE"
    }, headers=admin_headers)
    assert approve_res.status_code == 200

    # 5. Now Approved Developer can log in and access developer metrics
    dev_login = client.post("/api/developer/auth/login", json={
        "username_or_email": dev_username,
        "password": "DevPassword123!"
    })
    assert dev_login.status_code == 200
    active_dev_token = dev_login.json()["data"]["token"]
    active_dev_headers = {"Authorization": f"Bearer {active_dev_token}"}

    dev_dash_res = client.get("/api/developer/dashboard", headers=active_dev_headers)
    assert dev_dash_res.status_code == 200
    assert dev_dash_res.json()["success"] is True
