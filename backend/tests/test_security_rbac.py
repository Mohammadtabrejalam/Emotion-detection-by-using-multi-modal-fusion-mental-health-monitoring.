import uuid
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app, create_jwt_token
from backend.app.database import (
    register_developer,
    verify_developer_email,
    update_developer_account_status,
    create_user_password_reset,
    reset_user_password,
    revoke_session_token,
    is_token_revoked,
    get_developer_by_id,
    register_user,
    authenticate_developer
)

client = TestClient(app)

def test_developer_registration_approval_lifecycle():
    uid = uuid.uuid4().hex[:8]
    email = f"dev_{uid}@mindsense.ai"
    username = f"dev_{uid}"
    password = "SecretPassword123!"

    # 1. Register Developer
    res = client.post("/api/developer/auth/register", json={
        "full_name": "Test Developer",
        "username": username,
        "email": email,
        "password": password,
        "organization": "Test University",
        "requested_role": "DEVELOPER"
    })
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True, f"Register failed: {body}"
    assert body["data"]["state"] == "PENDING_APPROVAL"
    verification_token = body["data"]["verification_token"]

    # 2. Verify Email
    v_res = client.post(f"/api/developer/auth/verify-email?token={verification_token}")
    assert v_res.status_code == 200
    assert v_res.json()["success"] is True

    # 3. Attempt login while PENDING_APPROVAL -> Must fail
    login_res = client.post("/api/developer/auth/login", json={
        "username_or_email": username,
        "password": password
    })
    assert login_res.status_code == 200
    assert login_res.json()["success"] is False
    assert login_res.json()["error"]["code"] == "ACCOUNT_INACTIVE"

    # 4. Admin Approves Developer Account
    admin = authenticate_developer("admin@mindsense.ai", "admin123")
    admin_token = create_jwt_token({
        "sub": admin["id"],
        "username": admin["username"],
        "role": admin["role"],
        "type": "developer"
    })

    # Fetch pending developer ID
    devs_res = client.get("/api/developer/requests", headers={"Authorization": f"Bearer {admin_token}"})
    assert devs_res.status_code == 200
    reqs = devs_res.json()["data"]["requests"]
    target_dev = next((d for d in reqs if d["username"] == username), None)
    assert target_dev is not None

    # Approve account
    appr_res = client.post(
        f"/api/developer/requests/{target_dev['id']}/status",
        json={"status": "ACTIVE"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert appr_res.status_code == 200
    assert appr_res.json()["success"] is True

    # 5. Login after approval -> Must succeed
    login_ok = client.post("/api/developer/auth/login", json={
        "username_or_email": username,
        "password": password
    })
    assert login_ok.status_code == 200
    assert login_ok.json()["success"] is True
    assert "token" in login_ok.json()["data"]

def test_user_single_use_password_reset_and_logout():
    uid = uuid.uuid4().hex[:8]
    uname = f"usr_{uid}"
    uemail = f"usr_{uid}@test.org"
    register_user(uname, uemail, "OldPass123!", "User Test")

    # 2. Generate password reset token
    forgot_res = client.post("/api/auth/forgot-password", json={"username_or_email": uemail})
    assert forgot_res.status_code == 200
    reset_token = forgot_res.json()["data"]["reset_token"]

    # 3. Consume reset token
    reset_res1 = client.post("/api/auth/reset-password", json={
        "token": reset_token,
        "new_password": "NewSecretPass123!"
    })
    assert reset_res1.status_code == 200
    assert reset_res1.json()["success"] is True

    # 4. Attempt to reuse consumed token -> Must fail
    reset_res2 = client.post("/api/auth/reset-password", json={
        "token": reset_token,
        "new_password": "AnotherPass123!"
    })
    assert reset_res2.status_code == 200
    assert reset_res2.json()["success"] is False

def test_file_security_validation():
    fake_exe = ("malware.exe", b"MZ9000", "application/x-msdownload")
    res = client.post(
        "/api/analyze",
        data={"text": "Test security analysis"},
        files={"audio": fake_exe}
    )
    assert res.status_code == 400
    assert "Security Alert" in res.json()["detail"] or "prohibited" in res.json()["detail"] or "Invalid" in res.json()["detail"]

def test_rbac_permission_enforcement():
    uid = uuid.uuid4().hex[:8]
    uname = f"jrdev_{uid}"
    uemail = f"jrdev_{uid}@mindsense.ai"
    ok, res = register_developer(uemail, uname, "DevPass123!", "Junior Dev", "Research Lab", "DEVELOPER")
    dev_id = res["id"]
    
    # Approve developer account to ACTIVE
    update_developer_account_status(dev_id, "ACTIVE", "ADMIN", "SUPER_ADMIN")

    # Login to get valid token
    login_res = client.post("/api/developer/auth/login", json={
        "username_or_email": uname,
        "password": "DevPass123!"
    })
    dev_token = login_res.json()["data"]["token"]

    # Non-admin attempts to access admin approval list -> Must fail with 403 Forbidden
    res = client.get("/api/developer/requests", headers={"Authorization": f"Bearer {dev_token}"})
    assert res.status_code == 403
    assert "lacks required permission" in res.json()["detail"]

def test_system_health_endpoint():
    admin = authenticate_developer("admin@mindsense.ai", "admin123")
    token = create_jwt_token({
        "sub": admin["id"],
        "username": admin["username"],
        "role": admin["role"],
        "type": "developer"
    })

    res = client.get("/api/developer/health", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["status"] == "operational"
