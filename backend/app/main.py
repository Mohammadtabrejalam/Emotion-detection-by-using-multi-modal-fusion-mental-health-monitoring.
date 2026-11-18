import os
from dotenv import load_dotenv
load_dotenv()
import uuid
import json
import logging
from datetime import datetime
from typing import Optional, List

logger = logging.getLogger("mindsense.api")
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import hmac
import hashlib
import base64
import time

from .database import (
    init_db, save_analysis, get_history, delete_history, 
    save_checkin, get_checkins, get_dashboard_data,
    register_user, authenticate_user, get_user_login_history,
    update_user_profile, change_user_password,
    save_daily_note, get_daily_notes, delete_daily_note,
    get_articles, create_article, like_article, delete_article,
    record_site_visit, get_site_stats, save_user_feedback,
    create_share_link, get_share_link_data, revoke_share_link,
    authenticate_developer, get_developer_dashboard_metrics,
    get_developer_analytics_metrics, get_developer_feedback,
    update_developer_feedback, get_audit_logs, log_audit_event,
    get_user_by_id, log_assistant_interaction, get_assistant_db_metrics,
    register_developer, verify_developer_email, get_pending_developer_requests,
    update_developer_account_status, create_developer_password_reset,
    reset_developer_password, create_user_password_reset, reset_user_password,
    revoke_session_token, is_token_revoked, get_developer_by_id,
    get_active_research_studies, register_research_participant,
    save_research_consent, record_research_contribution,
    withdraw_research_participant, record_challenge_attempt,
    get_user_challenge_history, export_user_complete_data,
    delete_user_complete_account, record_game_session
)
from .rate_limiter import rate_limiter
from .security import signing_key
from .database import DATABASE_PATH, get_db_connection
from .inference.service import engine, InputError, ModelUnavailable
from .mail import send_token
from starlette.concurrency import run_in_threadpool
from .ml.preprocessing.text import tokenize, check_crisis_keywords
from .ml.preprocessing.audio import preprocess_audio
from .ml.preprocessing.vision import preprocess_image

PYTORCH_AVAILABLE = False
try:
    import torch
    PYTORCH_AVAILABLE = True
except ImportError:
    pass

app = FastAPI(title="MindSense API", version="1.4")

JWT_SECRET_KEY = signing_key(DATABASE_PATH)
ALLOWED_ORIGINS = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_AUDIO_EXTS = {".wav", ".mp3", ".ogg", ".m4a", ".webm", ".mp4"}
ALLOWED_IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp"}
DANGEROUS_EXTS = {".exe", ".sh", ".py", ".php", ".bat", ".cmd", ".ps1", ".vbs", ".js", ".html"}

def validate_uploaded_file(file: UploadFile, file_type: str, max_bytes: int = 10 * 1024 * 1024):
    if not file or not file.filename:
        return
        
    ext = os.path.splitext(file.filename)[1].lower()
    if ext in DANGEROUS_EXTS:
        raise HTTPException(status_code=400, detail=f"Security Alert: File extension {ext} is prohibited.")
        
    if file_type == "audio" and ext not in ALLOWED_AUDIO_EXTS:
        raise HTTPException(status_code=400, detail=f"Invalid audio format '{ext}'. Allowed: .wav, .mp3, .ogg, .m4a, .webm, .mp4")
    elif file_type == "video" and ext not in {".mp4", ".webm", ".flv"}:
        raise HTTPException(status_code=400, detail="Use an MP4, WebM, or FLV video.")
    elif file_type == "image" and ext not in ALLOWED_IMAGE_EXTS:
        raise HTTPException(status_code=400, detail=f"Invalid image format '{ext}'. Allowed: .png, .jpg, .jpeg, .webp")

def base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

def base64url_decode(data_str: str) -> bytes:
    padding = '=' * (4 - (len(data_str) % 4))
    return base64.urlsafe_b64decode(data_str + padding)

def create_jwt_token(payload: dict, expires_in_seconds: int = 86400) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload_copy = payload.copy()
    if payload_copy.get("type") in ("user", "developer") and "sub" in payload_copy:
        table = "users" if payload_copy["type"] == "user" else "developer_users"
        with get_db_connection() as conn:
            row = conn.execute("SELECT auth_version FROM users WHERE id = ?" if table == "users" else "SELECT auth_version FROM developer_users WHERE id = ?", (payload_copy["sub"],)).fetchone()
        payload_copy["version"] = row[0] if row else -1
    payload_copy["iat"] = int(time.time())
    payload_copy["jti"] = uuid.uuid4().hex
    payload_copy["exp"] = int(time.time()) + expires_in_seconds
    
    header_b64 = base64url_encode(json.dumps(header).encode('utf-8'))
    payload_b64 = base64url_encode(json.dumps(payload_copy).encode('utf-8'))
    
    signature_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = hmac.new(JWT_SECRET_KEY.encode('utf-8'), signature_input, hashlib.sha256).digest()
    sig_b64 = base64url_encode(signature)
    
    return f"{header_b64}.{payload_b64}.{sig_b64}"

def verify_jwt_token(token: str) -> Optional[dict]:
    try:
        if is_token_revoked(token):
            return None
        parts = token.split('.')
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts
        
        signature_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        expected_sig = base64url_encode(hmac.new(JWT_SECRET_KEY.encode('utf-8'), signature_input, hashlib.sha256).digest())
        
        if not hmac.compare_digest(sig_b64, expected_sig):
            return None
            
        header = json.loads(base64url_decode(header_b64).decode('utf-8'))
        if header != {"alg": "HS256", "typ": "JWT"}:
            return None
        payload = json.loads(base64url_decode(payload_b64).decode('utf-8'))
        if not isinstance(payload.get("exp"), (int, float)) or payload["exp"] <= int(time.time()):
            return None
            
        table = {"user": "users", "developer": "developer_users"}.get(payload.get("type"))
        if not table:
            return None
        with get_db_connection() as conn:
            row = conn.execute("SELECT auth_version FROM users WHERE id = ?" if table == "users" else "SELECT auth_version FROM developer_users WHERE id = ?", (payload.get("sub"),)).fetchone()
        if row is None or payload.get("version") != row[0]:
            return None
        return payload
    except Exception:
        return None

def get_current_user_from_req(request: Request) -> dict:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer ") or not auth_header[7:].strip():
        raise HTTPException(status_code=401, detail="Authentication token required.")
    
    token = auth_header[7:].strip()
    payload = verify_jwt_token(token)
    if not payload or "sub" not in payload or payload.get("type") != "user":
        raise HTTPException(status_code=401, detail="Invalid or expired user authentication token.")
        
    user = get_user_by_id(int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=401, detail="User account no longer exists.")
        
    return user

def get_optional_user_from_req(request: Request) -> Optional[dict]:
    if not request.headers.get("Authorization"):
        return None
    return get_current_user_from_req(request)

def get_current_developer_from_req(request: Request, required_permission: Optional[str] = None) -> dict:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer ") or not auth_header[7:].strip():
        raise HTTPException(status_code=401, detail="Developer authentication required. Missing Bearer token.")
        
    token = auth_header[7:].strip()
    payload = verify_jwt_token(token)
    if not payload or "sub" not in payload or payload.get("type") != "developer":
        raise HTTPException(status_code=401, detail="Invalid or expired developer authentication token.")
        
    dev_id = int(payload["sub"])
    dev = get_developer_by_id(dev_id)
    if not dev:
        raise HTTPException(status_code=401, detail="Developer account no longer exists.")
        
    state = dev.get("account_state", "PENDING")
    if state != "ACTIVE":
        raise HTTPException(status_code=403, detail=f"Developer account state is '{state}'. Only ACTIVE accounts can access developer resources.")
        
    role = dev.get("role", "DEVELOPER")
    
    if required_permission:
        role_perms = {
            "SUPER_ADMIN": ["all", "admin_approval", "user_manage", "feedback_manage", "audit_view", "analytics_view", "health_view"],
            "ADMIN": ["admin_approval", "user_manage", "feedback_manage", "audit_view", "analytics_view", "health_view"],
            "DEVELOPER": ["feedback_manage", "analytics_view", "health_view"],
            "ANALYST": ["analytics_view", "health_view"],
            "SUPPORT": ["feedback_manage", "health_view"]
        }
        allowed = role_perms.get(role, [])
        if "all" not in allowed and required_permission not in allowed:
            raise HTTPException(status_code=403, detail=f"Role '{role}' lacks required permission '{required_permission}'. Access denied.")
            
    return dev

init_db()

EMOTIONS = ["happy", "sad", "angry", "fear", "surprise", "disgust", "neutral"]

# ----------------- PYDANTIC SCHEMAS ----------------- #

class ErrorResponse(BaseModel):
    code: str
    message: str

class StandardResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    error: Optional[ErrorResponse] = None

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str = Field(min_length=8, max_length=128)
    name: str

class LoginRequest(BaseModel):
    username_or_email: str
    password: str = Field(min_length=1, max_length=128)

class UpdateProfileRequest(BaseModel):
    user_id: int
    name: str
    email: str

class ChangePasswordRequest(BaseModel):
    user_id: int
    old_password: str
    new_password: str = Field(min_length=8, max_length=128)

class CheckinRequest(BaseModel):
    user_id: Optional[int] = None
    feeling_score: int = Field(ge=1, le=5)
    energy_score: int = Field(ge=1, le=5)
    sleep_score: int = Field(ge=1, le=5)
    stress_score: int = Field(ge=1, le=5)
    talk_to_someone: bool
    notes: Optional[str] = ""

class ForgotPasswordRequest(BaseModel):
    username_or_email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)

class DeveloperRegisterRequest(BaseModel):
    full_name: str
    username: str
    email: str
    password: str = Field(min_length=8, max_length=128)
    organization: Optional[str] = "Independent Research"
    requested_role: Optional[str] = "DEVELOPER"

class DeveloperStatusUpdateRequest(BaseModel):
    status: str  # ACTIVE, PENDING_APPROVAL, SUSPENDED, REVOKED

class ResearchConsentRequest(BaseModel):
    study_id: int
    consent_version: Optional[str] = "1.0"

class ResearchParticipateRequest(BaseModel):
    study_id: int
    age_group: str
    gender_identity: str
    questionnaire_answers: dict
    contributed_modalities: str
    analysis_id: Optional[str] = None

class ResearchWithdrawRequest(BaseModel):
    study_id: int

class ChallengeSubmitRequest(BaseModel):
    score: int
    total_questions: int
    accuracy: float
    streak: Optional[int] = 0

class FeedbackRequest(BaseModel):
    category: Optional[str] = "General"
    content: Optional[str] = None
    comment: Optional[str] = None
    rating: Optional[int] = 5
    user_id: Optional[int] = None

FeedbackPayload = FeedbackRequest

class FeedbackStatusUpdateRequest(BaseModel):
    status: str

class DailyNoteRequest(BaseModel):
    user_id: int
    date: str
    title: str
    content: str
    mood_tag: str

class ArticleCreateRequest(BaseModel):
    user_id: Optional[int] = None
    title: str
    author: str
    category: str
    summary: str
    content: str
    tags: List[str]

def get_confidence_label(prob: float) -> str:
    if prob < 0.40:
        return "Low confidence"
    elif prob < 0.70:
        return "Moderate confidence"
    else:
        return "Higher model confidence"

# ----------------- AUTHENTICATION & ACCOUNT SETTINGS ----------------- #

@app.get("/api/auth/me", response_model=StandardResponse)
def current_account(request: Request):
    return {"success": True, "data": {"user": get_current_user_from_req(request)}}

@app.post("/api/auth/register", response_model=StandardResponse)
def register(req: RegisterRequest, request: Request):
    rate_limiter.check_rate_limit(request, "register", limit=10)
    if not req.username.strip() or "@" not in req.email or not req.name.strip():
        raise HTTPException(422, "Provide a username, valid email, and name.")
    try:
        user = register_user(req.username, req.email, req.password, req.name)
        token = create_jwt_token({"sub": user["id"], "username": user["username"], "type": "user"})
        return {
            "success": True,
            "data": {"user": user, "token": token, "message": "Account created successfully."},
            "error": None
        }
    except Exception as e:
        err_msg = str(e)
        if "UNIQUE constraint failed" in err_msg:
            err_msg = "A user with this username or email already exists."
        return {
            "success": False,
            "error": {"code": "REGISTRATION_FAILED", "message": err_msg}
        }

@app.post("/api/auth/login", response_model=StandardResponse)
def login(req: LoginRequest, request: Request):
    rate_limiter.check_rate_limit(request, "login", limit=10)
    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent", "Unknown Browser")
    user = authenticate_user(req.username_or_email, req.password, client_ip, user_agent)
    if user:
        token = create_jwt_token({"sub": user["id"], "username": user["username"], "type": "user"})
        return {
            "success": True,
            "data": {"user": user, "token": token},
            "error": None
        }
    return {
        "success": False,
        "error": {"code": "INVALID_CREDENTIALS", "message": "Invalid username/email or password."}
    }

@app.put("/api/auth/profile", response_model=StandardResponse)
def update_profile(req: UpdateProfileRequest, request: Request):
    try:
        current_user = get_current_user_from_req(request)
        updated_user = update_user_profile(current_user["id"], req.name, req.email)
        return {
            "success": True,
            "data": {"user": updated_user, "message": "Profile updated successfully."},
            "error": None
        }
    except HTTPException:
        raise
    except Exception as e:
        return {
            "success": False,
            "error": {"code": "UPDATE_FAILED", "message": str(e)}
        }

@app.post("/api/auth/change-password", response_model=StandardResponse)
def change_password(req: ChangePasswordRequest, request: Request):
    try:
        current_user = get_current_user_from_req(request)
        success = change_user_password(current_user["id"], req.old_password, req.new_password)
        if success:
            return {
                "success": True,
                "data": {"message": "Password updated successfully."},
                "error": None
            }
        return {
            "success": False,
            "error": {"code": "INVALID_OLD_PASSWORD", "message": "Current password is incorrect."}
        }
    except Exception as e:
        return {
            "success": False,
            "error": {"code": "PASSWORD_CHANGE_FAILED", "message": str(e)}
        }

@app.get("/api/auth/login-history", response_model=StandardResponse)
def login_history(request: Request):
    try:
        current_user = get_current_user_from_req(request)
        history = get_user_login_history(current_user["id"])
        return {
            "success": True,
            "data": {"login_sessions": history},
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "error": {"code": "FETCH_FAILED", "message": str(e)}
        }

@app.post("/api/auth/forgot-password", response_model=StandardResponse)
def user_forgot_password(req: ForgotPasswordRequest, request: Request):
    rate_limiter.check_rate_limit(request, "forgot_pw", limit=5)
    return recovery_response(req.username_or_email, create_user_password_reset)


def recovery_response(identity, create_token):
    test_mode = os.environ.get("MINDSENSE_TEST_MODE") == "1" and os.environ.get("ENVIRONMENT") != "production"
    if not test_mode and not os.environ.get("SMTP_HOST"):
        raise HTTPException(503, "Password recovery requires configured email delivery. Contact the administrator.")
    ok, res = create_token(identity)
    if ok:
        if test_mode:
            return {"success": True, "data": {"reset_token": res["token"], "message": "Test-only recovery token."}}
        try:
            send_token(res["email"], res["token"], "password reset")
        except Exception:
            logger.exception("Password recovery email delivery failed")
    return {"success": True, "data": {"message": "If the account exists, a recovery email will arrive shortly."}}

@app.post("/api/auth/reset-password", response_model=StandardResponse)
def user_reset_password(req: ResetPasswordRequest, request: Request):
    rate_limiter.check_rate_limit(request, "reset_pw", limit=5)
    ok, msg = reset_user_password(req.token, req.new_password)
    if ok:
        return {"success": True, "data": {"message": msg}, "error": None}
    return {"success": False, "error": {"code": "RESET_FAILED", "message": msg}}

@app.post("/api/auth/logout", response_model=StandardResponse)
def user_logout(request: Request):
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        user = get_optional_user_from_req(request)
        if user:
            revoke_session_token(token, user["id"], "user")
    return {"success": True, "data": {"message": "User logged out successfully."}, "error": None}

# ----------------- RESEARCH PARTICIPATION & STUDY ENDPOINTS ----------------- #

@app.get("/api/research/studies", response_model=StandardResponse)
def list_research_studies():
    studies = get_active_research_studies()
    return {"success": True, "data": {"studies": studies}, "error": None}

@app.post("/api/research/consent", response_model=StandardResponse)
def submit_research_consent(req: ResearchConsentRequest, request: Request):
    user = get_current_user_from_req(request)
    ok = save_research_consent(user["id"], req.study_id, req.consent_version or "1.0")
    if ok:
        return {"success": True, "data": {"message": "Research participation consent recorded."}, "error": None}
    return {"success": False, "error": {"code": "CONSENT_FAILED", "message": "Failed to record research consent."}}

@app.post("/api/research/participate", response_model=StandardResponse)
def submit_research_participation(req: ResearchParticipateRequest, request: Request):
    user = get_current_user_from_req(request)
    from .database import get_db_connection
    with get_db_connection() as conn:
        consent = conn.execute("SELECT 1 FROM research_consents WHERE user_id=? AND study_id=? AND consent_given=1 AND withdrawn_at IS NULL", (user["id"], req.study_id)).fetchone()
        study = conn.execute("SELECT 1 FROM research_studies WHERE id=? AND status='active'", (req.study_id,)).fetchone()
        if not consent or not study:
            raise HTTPException(status_code=403, detail="An active study and explicit current consent are required.")
        if req.analysis_id and not conn.execute("SELECT 1 FROM analyses WHERE id=? AND user_id=?", (req.analysis_id, user["id"])).fetchone():
            raise HTTPException(status_code=404, detail="Analysis not found.")
    p_info = register_research_participant(user["id"], req.age_group, req.gender_identity)
    
    contrib_id = record_research_contribution(
        participant_id=p_info["id"],
        study_id=req.study_id,
        analysis_id=req.analysis_id,
        questionnaire_answers=req.questionnaire_answers,
        modalities=req.contributed_modalities
    )
    
    return {
        "success": True,
        "data": {
            "participant_code": p_info["participant_code"],
            "contribution_id": contrib_id,
            "message": "Thank you for contributing to MindSense research!"
        },
        "error": None
    }

@app.post("/api/research/withdraw", response_model=StandardResponse)
def withdraw_from_research(req: ResearchWithdrawRequest, request: Request):
    user = get_current_user_from_req(request)
    ok = withdraw_research_participant(user["id"], req.study_id)
    if ok:
        return {"success": True, "data": {"message": "Successfully withdrawn from research study and purged contributions."}, "error": None}
    return {"success": False, "error": {"code": "WITHDRAWAL_FAILED", "message": "Failed to process research withdrawal."}}

# ----------------- EMOTION RECOGNITION CHALLENGE ENDPOINTS ----------------- #

@app.post("/api/challenge/submit", response_model=StandardResponse)
def submit_challenge(req: ChallengeSubmitRequest, request: Request):
    opt_user = get_optional_user_from_req(request)
    user_id = opt_user["id"] if opt_user else None
    
    attempt_id = record_challenge_attempt(user_id, req.score, req.total_questions, req.accuracy)
    return {
        "success": True,
        "data": {
            "attempt_id": attempt_id,
            "score": req.score,
            "accuracy": req.accuracy,
            "message": "Challenge completed! Results recorded for personal reflection."
        },
        "error": None
    }

@app.get("/api/challenge/history", response_model=StandardResponse)
def challenge_history(request: Request):
    user = get_current_user_from_req(request)
    history = get_user_challenge_history(user["id"])
    return {"success": True, "data": {"history": history}, "error": None}

@app.post("/api/game/session", response_model=StandardResponse)
def create_game_session(req: ChallengeSubmitRequest, request: Request):
    opt_user = get_optional_user_from_req(request)
    user_id = opt_user["id"] if opt_user else None
    
    session_id = record_game_session(user_id, req.score, req.total_questions, req.accuracy, req.streak or 0)
    return {
        "success": True,
        "data": {
            "session_id": session_id,
            "score": req.score,
            "accuracy": req.accuracy,
            "streak": req.streak or 0,
            "message": "Game session recorded successfully."
        },
        "error": None
    }

# ----------------- PUBLIC FEEDBACK ENDPOINT ----------------- #

@app.post("/api/feedback", response_model=StandardResponse)
def submit_feedback(req: FeedbackRequest, request: Request):
    rate_limiter.check_rate_limit(request, "feedback", limit=10)
    try:
        opt_user = get_optional_user_from_req(request)
        user_id = opt_user["id"] if opt_user else None
        comment_text = req.comment or req.content or ""
        category_text = req.category or "General"
        rating_val = req.rating if req.rating is not None else 5

        feedback_id = save_user_feedback(
            rating=rating_val,
            category=category_text,
            comment=comment_text,
            user_id=user_id
        )
        return {
            "success": True,
            "data": {
                "id": feedback_id,
                "feedback_id": feedback_id,
                "message": "Thank you for your feedback! It has been submitted for review."
            },
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "error": {"code": "FEEDBACK_ERROR", "message": str(e)}
        }

# ----------------- USER DATA RIGHTS (EXPORT & ACCOUNT DELETION) ----------------- #

@app.get("/api/user/export-data", response_model=StandardResponse)
def export_user_data(request: Request):
    user = get_current_user_from_req(request)
    data = export_user_complete_data(user["id"])
    if data:
        return {"success": True, "data": {"export": data}, "error": None}
    return {"success": False, "error": {"code": "EXPORT_FAILED", "message": "User data not found."}}

@app.delete("/api/user/account", response_model=StandardResponse)
def delete_user_account(request: Request):
    user = get_current_user_from_req(request)
    ok = delete_user_complete_account(user["id"])
    if ok:
        return {"success": True, "data": {"message": "Account and all associated data permanently deleted."}, "error": None}
    return {"success": False, "error": {"code": "DELETE_FAILED", "message": "Failed to delete account."}}

# ----------------- ARTICLES & COMMUNITY KNOWLEDGE HUB ----------------- #

@app.get("/api/articles", response_model=StandardResponse)
def list_articles(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    limit: int = Query(50)
):
    try:
        articles = get_articles(search=search, category=category, limit=limit)
        return {
            "success": True,
            "data": {"articles": articles},
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "error": {"code": "FETCH_FAILED", "message": str(e)}
        }

@app.post("/api/articles", response_model=StandardResponse)
def publish_article(req: ArticleCreateRequest, request: Request):
    user = get_current_user_from_req(request)
    try:
        article_id = create_article(
            title=req.title,
            author=user["name"],
            category=req.category,
            summary=req.summary,
            content=req.content,
            tags=req.tags,
            user_id=user["id"]
        )
        return {
            "success": True,
            "data": {"id": article_id, "message": "Article published to community hub successfully."},
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "error": {"code": "PUBLISH_FAILED", "message": str(e)}
        }

@app.post("/api/articles/{article_id}/like", response_model=StandardResponse)
def like_post(article_id: int):
    try:
        new_likes = like_article(article_id)
        return {
            "success": True,
            "data": {"likes": new_likes},
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "error": {"code": "LIKE_FAILED", "message": str(e)}
        }

@app.delete("/api/articles/{article_id}", response_model=StandardResponse)
def remove_article(article_id: int, request: Request):
    user = get_current_user_from_req(request)
    try:
        deleted = delete_article(article_id, user["id"])
        if deleted:
            return {"success": True, "data": {"message": "Article deleted."}, "error": None}
        return {"success": False, "error": {"code": "NOT_FOUND", "message": "Article not found."}}
    except Exception as e:
        return {
            "success": False,
            "error": {"code": "DELETE_FAILED", "message": str(e)}
        }

# ----------------- REAL-WORLD DATASET SAMPLES ----------------- #

@app.get("/api/datasets/samples", response_model=StandardResponse)
def get_dataset_samples():
    return {"success": True, "data": {"samples": [],
        "message": "No benchmark media is bundled. Download licensed datasets from their publishers; authored prompts are not evaluation data."}, "error": None}

# ----------------- DAILY NOTES / MOOD JOURNAL ENDPOINTS ----------------- #

@app.post("/api/notes", response_model=StandardResponse)
def create_daily_note(req: DailyNoteRequest, request: Request):
    try:
        user = get_current_user_from_req(request)
        note_id = save_daily_note(user["id"], req.date, req.title, req.content, req.mood_tag)
        return {
            "success": True,
            "data": {"id": note_id, "message": "Daily reflection saved successfully."},
            "error": None
        }
    except HTTPException:
        raise
    except Exception as e:
        return {
            "success": False,
            "error": {"code": "NOTE_SAVE_FAILED", "message": str(e)}
        }

@app.get("/api/notes", response_model=StandardResponse)
def list_daily_notes(request: Request, limit: int = Query(50)):
    user = get_current_user_from_req(request)
    notes = get_daily_notes(user["id"], limit)
    return {
        "success": True,
        "data": {"notes": notes},
        "error": None
    }

@app.delete("/api/notes/{note_id}", response_model=StandardResponse)
def remove_daily_note(note_id: int, request: Request):
    user = get_current_user_from_req(request)
    deleted = delete_daily_note(note_id, user["id"])
    if deleted:
        return {"success": True, "data": {"message": "Note deleted successfully."}, "error": None}
    raise HTTPException(status_code=404, detail="Note not found or unauthorized.")

# ----------------- ANALYSIS & MONITORING ENDPOINTS ----------------- #

@app.get("/api/health", response_model=StandardResponse)
def health_check():
    db_ok = False
    try:
        from .database import get_db_connection
        conn = get_db_connection()
        conn.close()
        db_ok = True
    except Exception as err:
        logger.warning("Database health check probe failed: %s", err)
        
    return {
        "success": True,
        "data": {
            "status": "healthy" if db_ok else "degraded",
            "inference_mode": "published_models",
            "models": engine.status(),
            "database_connected": db_ok,
            "pytorch_loaded": PYTORCH_AVAILABLE,
            "model_version": "published-late-fusion-v1"
        }
    }

@app.get("/api/models", response_model=StandardResponse)
def model_status():
    return {"success": True, "data": {"models": engine.status(), "fusion_method": "support-aware late fusion", "demo_available": False}}

@app.post("/api/analyze", response_model=StandardResponse)
async def analyze_emotion(request: Request, text: Optional[str] = Form(None),
                          audio: Optional[UploadFile] = File(None), image: Optional[UploadFile] = File(None),
                          demo_mode: bool = Form(False), user_id: Optional[int] = Form(None),
                          video: Optional[UploadFile] = File(None), video_mode: str = Form("midpoint")):
    rate_limiter.check_rate_limit(request, "analyze", limit=30)
    user = get_optional_user_from_req(request)
    if demo_mode:
        return {"success": False, "error": {"code": "DEMO_DISABLED", "message": "Simulated predictions are disabled. Install the published models to analyze real inputs."}}
    blobs = {}
    if video and (audio or image or (text and text.strip())):
        return {"success": False, "error": {"code": "INVALID_INPUT", "message": "Analyze a video on its own. Its sound and picture supply both inputs."}}
    if video and video_mode not in {"midpoint", "sequence", "transfer"}:
        return {"success": False, "error": {"code": "INVALID_INPUT", "message": "Unknown video analysis method."}}
    for kind, upload in (("audio", audio), ("image", image), ("video", video)):
        if upload:
            validate_uploaded_file(upload, kind)
            blobs[kind] = await upload.read(MAX_UPLOAD_BYTES + 1)
            if len(blobs[kind]) > MAX_UPLOAD_BYTES:
                raise HTTPException(413, "Each upload must be at most 10 MB.")
    if not (text and text.strip()) and not blobs:
        return {"success": False, "error": {"code": "INSUFFICIENT_INPUT", "message": "Provide text, speech, or one facial image."}}
    try:
        if video:
            sampling = "midpoint" if video_mode == "midpoint" else "sequence"
            started = time.perf_counter()
            prediction = await run_in_threadpool(engine.analyze_video, blobs["video"], sampling, video_mode == "transfer")
            prediction["video_summary"]["processing_seconds"] = time.perf_counter() - started
        else:
            prediction = await run_in_threadpool(engine.analyze, text=text, **blobs)
    except InputError as exc:
        return {"success": False, "error": {"code": "INVALID_INPUT", "message": str(exc)}}
    except ModelUnavailable as exc:
        return {"success": False, "error": {"code": "MODEL_UNAVAILABLE", "message": str(exc)}}
    except Exception:
        logger.exception("Inference failed")
        return {"success": False, "error": {"code": "INFERENCE_FAILED", "message": "Inference failed. No substitute prediction was generated."}}
    result = {
        "id": str(uuid.uuid4()), "timestamp": datetime.utcnow().isoformat(),
        "emotion": prediction["final_emotion"], "confidence": prediction["confidence"],
        "confidence_label": "Uncalibrated model score", "probabilities": prediction["probabilities"],
        "modalities_used": prediction["modalities_used"], "modality_predictions": prediction["modality_predictions"],
        "is_demo": False, "model_version": prediction["model_version"],
        "warnings": prediction["warnings"], "fusion_method": prediction["fusion_method"],
        "saved": user is not None, "crisis_alert": False,
        "disclaimer": "Research and self-reflection only. Expressions do not establish internal emotions or mental-health diagnoses.",
        "wellness_insight": "Consider whether these expression labels match your own experience. Model scores are uncertain and are not a mental-health assessment.",
        "stages": [{"stage": name, "status": "completed"} for name in ("Input validation", "Published model inference", "Late fusion")],
    }
    if "video_summary" in prediction:
        result["video_summary"] = prediction["video_summary"]
    if user:
        save_analysis(result["id"], result["modalities_used"], result["emotion"], result["confidence"],
                      result["model_version"], False, result["modality_predictions"], user["id"])
        with get_db_connection() as conn:
            conn.execute("UPDATE analyses SET result_json = ? WHERE id = ?", (json.dumps(result), result["id"]))
    return {"success": True, "data": result}

@app.get("/api/history", response_model=StandardResponse)
def get_analysis_history(request: Request, limit: int = Query(50, ge=1, le=100)):
    try:
        user = get_current_user_from_req(request)
        target_user_id = user["id"] if user else None
        history = get_history(limit, target_user_id)
        return {
            "success": True,
            "data": {"history": history},
            "error": None
        }
    except HTTPException:
        raise
    except Exception as e:
        return {
            "success": False,
            "error": {"code": "DATABASE_ERROR", "message": f"Failed to retrieve history: {str(e)}"}
        }

@app.delete("/api/history", response_model=StandardResponse)
def clear_all_history(request: Request):
    try:
        user = get_current_user_from_req(request)
        target_user_id = user["id"] if user else None
        delete_history(target_user_id)
        return {
            "success": True,
            "data": {"message": "Historical records have been deleted successfully."},
            "error": None
        }
    except HTTPException:
        raise
    except Exception as e:
        return {
            "success": False,
            "error": {"code": "DATABASE_ERROR", "message": f"Failed to reset data: {str(e)}"}
        }

@app.get("/api/dashboard", response_model=StandardResponse)
def get_dashboard_summary(request: Request):
    try:
        user = get_current_user_from_req(request)
        target_user_id = user["id"] if user else None
        raw_data = get_dashboard_data(target_user_id)
        
        from collections import Counter
        counts = Counter(h["final_emotion"] for h in raw_data["historic_trends"])
        trends = {"dominant_emotion": counts.most_common(1)[0][0] if counts else "No data",
                  "emotional_variability": "Not assessed", "recent_trend": "Expression-label history only; not a mental-health trend or diagnosis.",
                  "wellness_score": None, "alert": False}
        return {
            "success": True,
            "data": {
                "summary": raw_data,
                "trends": trends
            },
            "error": None
        }
    except HTTPException:
        raise
    except Exception as e:
        return {
            "success": False,
            "error": {"code": "DATABASE_ERROR", "message": f"Failed to compile dashboard: {str(e)}"}
        }

@app.post("/api/checkin", response_model=StandardResponse)
def submit_checkin(request: CheckinRequest, req: Request):
    try:
        user = get_current_user_from_req(req)
        target_user_id = user["id"] if user else None
        checkin_id = save_checkin(
            feeling_score=request.feeling_score,
            energy_score=request.energy_score,
            sleep_score=request.sleep_score,
            stress_score=request.stress_score,
            talk_to_someone=request.talk_to_someone,
            notes=request.notes,
            user_id=target_user_id
        )
        return {
            "success": True,
            "data": {"id": checkin_id, "message": "Daily check-in recorded successfully."},
            "error": None
        }
    except HTTPException:
        raise
    except Exception as e:
        return {
            "success": False,
            "error": {"code": "DATABASE_ERROR", "message": f"Failed to record check-in: {str(e)}"}
        }

@app.get("/api/checkins", response_model=StandardResponse)
def get_all_checkins(req: Request, limit: int = Query(50, ge=1, le=100)):
    try:
        user = get_current_user_from_req(req)
        target_user_id = user["id"] if user else None
        checkins = get_checkins(limit, target_user_id)
        return {
            "success": True,
            "data": {"checkins": checkins},
            "error": None
        }
    except HTTPException:
        raise
    except Exception as e:
        return {
            "success": False,
            "error": {"code": "DATABASE_ERROR", "message": f"Failed to retrieve checkins: {str(e)}"}
        }

@app.get("/api/research", response_model=StandardResponse)
def get_research_metrics():
    try:
        metrics_path = os.environ.get("MINDSENSE_EVALUATION_REPORT", os.path.join(os.path.dirname(__file__), "..", "..", "reports", "evaluation.json"))
        if os.path.exists(metrics_path):
            with open(metrics_path, "r") as f:
                metrics_data = json.load(f)
            return {"success": True, "data": metrics_data, "error": None}
        return {
            "success": False,
            "error": {"code": "METRICS_UNAVAILABLE", "message": "Evaluation metrics not available."}
        }
    except Exception as e:
        return {
            "success": False,
            "error": {"code": "READ_ERROR", "message": f"Failed to read metrics: {str(e)}"}
        }

# ----------------- SITE METRICS & VISITOR TRACKING ----------------- #

class VisitPayload(BaseModel):
    page: str = "/"
    user_agent: Optional[str] = ""


class AssistantQueryPayload(BaseModel):
    message: str
    context_page: Optional[str] = "home"

@app.get("/api/stats", response_model=StandardResponse)
def get_platform_statistics():
    try:
        stats = get_site_stats()
        return {
            "success": True,
            "data": stats,
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "error": {"code": "STATS_ERROR", "message": f"Failed to fetch statistics: {str(e)}"}
        }

@app.post("/api/visit", response_model=StandardResponse)
def track_visitor_pageview(request: VisitPayload, req: Request):
    try:
        ua = req.headers.get("user-agent", "") or request.user_agent
        success = record_site_visit(page=request.page, user_agent=ua)
        return {
            "success": success,
            "data": {"recorded": success},
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "error": {"code": "VISIT_ERROR", "message": str(e)}
        }


# ----------------- RESEARCH ASSISTANT / CHATBOT ----------------- #

KNOWLEDGE_FAQ = [
    {"keywords": ["start", "analyze", "upload"], "topic": "Starting an Analysis", "answer": "Open Analyze, add English text, speech, or a photo containing one consenting adult's face. Check the consent box and click Start Analysis. Missing models produce an error, not a substitute prediction."},
    {"keywords": ["fusion", "multimodal", "architecture", "cross-attention"], "topic": "Fusion", "answer": "The serving pipeline uses published text, speech, and facial classifiers with equal-weight, support-aware late fusion. Historical cross-attention experiments are separate and are not used for application predictions."},
    {"keywords": ["score", "confidence", "probability"], "topic": "Scores", "answer": "Normalized scores are uncalibrated model outputs, not certainty about a person's feelings. They cannot diagnose mental-health conditions."},
    {"keywords": ["dataset", "training", "benchmark"], "topic": "Evaluation", "answer": "Open Models and evidence for measured MELD and RAVDESS diagnostic results and their limitations. No clinical validation or population-wide performance claim is available."},
    {"keywords": ["privacy", "stored", "camera", "microphone", "storage"], "topic": "Privacy", "answer": "Inference runs on the server. Raw inputs are not saved to the application database; media decoding may use temporary files that are deleted. Guest results are not saved. Signed-in results and journal entries persist in SQLite until deleted. SQLite is not encrypted by this application."},
    {"keywords": ["history", "journal", "checkin"], "topic": "Private records", "answer": "Sign in to use Insights, journal entries, and self-reported check-ins. Export or delete account data in Settings. Sharing creates a public bearer link that you can revoke."},
]

@app.post("/api/assistant/chat", response_model=StandardResponse)
def ask_research_assistant(request: AssistantQueryPayload):
    started = time.perf_counter()
    query = request.message.strip().lower()
    is_crisis, _ = check_crisis_keywords(query)
    if is_crisis:
        answer = "This is a scripted app guide, not crisis care. If you may act on thoughts of harming yourself or someone else, contact local emergency services or a trusted person who can stay with you. Seek qualified local support. MindSense cannot assess your safety."
        topic = "Support"
    else:
        matches = [(sum(keyword in query for keyword in item['keywords']), item) for item in KNOWLEDGE_FAQ]
        score, match = max(matches, key=lambda item: item[0])
        answer = match['answer'] if score else "I am a scripted app guide. Ask about analysis, late fusion, scores, privacy, datasets, or your journal. I am not a language model or a mental-health counselor."
        topic = match['topic'] if score else 'App guide'
    log_assistant_interaction(is_crisis=is_crisis, topic=topic, latency_ms=round((time.perf_counter()-started)*1000))
    return {"success": True, "data": {"response": answer, "topic": topic, "is_crisis": is_crisis,
            "suggested_actions": ["Start Analysis", "Privacy Info"], "mode": "scripted_faq"}, "error": None}


# ============================================================================
# PUBLIC SECURE SHARE LINK ENDPOINTS
# ============================================================================

class ShareCreateRequest(BaseModel):
    result_id: str
    expiration_hours: int = Field(default=24, ge=1, le=168)
    user_id: Optional[int] = None

@app.post("/api/share/create", response_model=StandardResponse)
async def api_create_share_link(payload: ShareCreateRequest, request: Request):
    try:
        user = get_current_user_from_req(request)
        target_owner_id = user["id"] if user else None
        token = create_share_link(
            result_id=payload.result_id,
            owner_id=target_owner_id,
            expiration_hours=payload.expiration_hours or 24
        )
        return {
            "success": True,
            "data": {
                "share_token": token,
                "share_url": f"#/shared-result/{token}",
                "expiration_hours": payload.expiration_hours or 24
            },
            "error": None
        }
    except HTTPException:
        raise
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "error": {"code": "SHARE_CREATE_FAILED", "message": str(e)}
        }

@app.get("/api/share/{token}", response_model=StandardResponse)
async def api_get_shared_result(token: str):
    res = get_share_link_data(token)
    status = res["status"]
    if status == "ACTIVE":
        return {"success": True, "data": res["data"], "error": None}
    elif status == "EXPIRED":
        return {
            "success": False,
            "data": None,
            "error": {"code": "LINK_EXPIRED", "message": "This shared analysis link has expired."}
        }
    elif status == "REVOKED":
        return {
            "success": False,
            "data": None,
            "error": {"code": "LINK_REVOKED", "message": "This shared analysis link was revoked by the owner."}
        }
    else:
        return {
            "success": False,
            "data": None,
            "error": {"code": "LINK_NOT_FOUND", "message": "Invalid or expired share link."}
        }

@app.post("/api/share/{token}/revoke", response_model=StandardResponse)
async def api_revoke_shared_link(token: str, request: Request):
    user = get_current_user_from_req(request)
    actor_id = user["username"] if user else "PUBLIC_USER"
    ok = revoke_share_link(token, actor_id=actor_id, owner_id=user["id"] if user else None)
    if ok:
        return {"success": True, "data": {"message": "Share link revoked successfully."}, "error": None}
    return {"success": False, "data": None, "error": {"code": "REVOKE_FAILED", "message": "Link not found or already revoked."}}


# ============================================================================
# SEPARATE DEVELOPER / ADMIN PORTAL ENDPOINTS (JWT & RBAC ENFORCED)
# ============================================================================

class DeveloperLoginRequest(BaseModel):
    username_or_email: str
    password: str = Field(min_length=1, max_length=128)

class DeveloperFeedbackUpdateRequest(BaseModel):
    status: str
    priority: Optional[str] = None
    internal_notes: Optional[str] = None
    actor_id: Optional[str] = "ADMIN"

@app.post("/api/developer/auth/register", response_model=StandardResponse)
async def api_register_developer(payload: DeveloperRegisterRequest, request: Request):
    rate_limiter.check_rate_limit(request, "dev_register", limit=5)
    ok, res = register_developer(
        email=payload.email,
        username=payload.username,
        password=payload.password,
        name=payload.full_name,
        organization=payload.organization or "Independent Research",
        requested_role=payload.requested_role or "DEVELOPER"
    )
    if ok:
        data = {"message": "Registration received. Email verification and administrator approval are required.", "state": res["state"]}
        if os.environ.get("MINDSENSE_TEST_MODE") == "1" and os.environ.get("ENVIRONMENT") != "production":
            data["verification_token"] = res["verification_token"]
        else:
            try:
                send_token(payload.email, res["verification_token"], "email verification")
            except Exception:
                data["message"] = "Registration saved. Email delivery is unavailable; contact the administrator."
        return {"success": True, "data": data}
    return {"success": False, "error": {"code": "REGISTRATION_FAILED", "message": str(res)}}

@app.post("/api/developer/auth/verify-email", response_model=StandardResponse)
async def api_verify_developer_email(token: str):
    ok, msg = verify_developer_email(token)
    if ok:
        return {"success": True, "data": {"message": msg}, "error": None}
    return {"success": False, "data": None, "error": {"code": "VERIFICATION_FAILED", "message": msg}}

@app.post("/api/developer/auth/login", response_model=StandardResponse)
async def developer_login(payload: DeveloperLoginRequest, request: Request):
    rate_limiter.check_rate_limit(request, "dev_login", limit=10)
    dev = authenticate_developer(payload.username_or_email, payload.password)
    if dev:
        state = dev.get("account_state", "ACTIVE")
        if state != "ACTIVE":
            return {
                "success": False,
                "data": None,
                "error": {"code": "ACCOUNT_INACTIVE", "message": f"Your developer account state is '{state}'. Please wait for administrator approval."}
            }
        dev_token = create_jwt_token({
            "sub": dev["id"],
            "username": dev["username"],
            "role": dev["role"],
            "type": "developer"
        })
        return {
            "success": True,
            "data": {
                "developer": dev,
                "token": dev_token
            },
            "error": None
        }
    return {
        "success": False,
        "data": None,
        "error": {"code": "INVALID_CREDENTIALS", "message": "Invalid developer ID or password."}
    }

@app.post("/api/developer/auth/forgot-password", response_model=StandardResponse)
async def developer_forgot_password(payload: ForgotPasswordRequest, request: Request):
    rate_limiter.check_rate_limit(request, "dev_forgot_pw", limit=5)
    return recovery_response(payload.username_or_email, create_developer_password_reset)

@app.post("/api/developer/auth/reset-password", response_model=StandardResponse)
async def developer_reset_password(payload: ResetPasswordRequest, request: Request):
    rate_limiter.check_rate_limit(request, "dev_reset_pw", limit=5)
    ok, msg = reset_developer_password(payload.token, payload.new_password)
    if ok:
        return {"success": True, "data": {"message": msg}, "error": None}
    return {"success": False, "data": None, "error": {"code": "RESET_FAILED", "message": msg}}

@app.post("/api/developer/auth/logout", response_model=StandardResponse)
async def developer_logout(request: Request):
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        payload = verify_jwt_token(token)
        if payload and "sub" in payload:
            revoke_session_token(token, int(payload["sub"]), "developer")
    return {"success": True, "data": {"message": "Developer session logged out."}, "error": None}

@app.get("/api/developer/requests", response_model=StandardResponse)
async def list_developer_requests(request: Request):
    dev = get_current_developer_from_req(request, required_permission="admin_approval")
    requests = get_pending_developer_requests()
    return {"success": True, "data": {"requests": requests}, "error": None}

@app.post("/api/developer/requests/{dev_id}/status", response_model=StandardResponse)
async def update_dev_status(dev_id: int, payload: DeveloperStatusUpdateRequest, request: Request):
    dev = get_current_developer_from_req(request, required_permission="admin_approval")
    ok, msg = update_developer_account_status(
        dev_id=dev_id,
        new_status=payload.status,
        actor_id=dev["username"],
        actor_role=dev.get("role", "ADMIN")
    )
    if ok:
        return {"success": True, "data": {"message": msg}, "error": None}
    return {"success": False, "data": None, "error": {"code": "UPDATE_FAILED", "message": msg}}

@app.get("/api/developer/dashboard", response_model=StandardResponse)
async def get_developer_dashboard(request: Request):
    get_current_developer_from_req(request, required_permission="analytics_view")
    metrics = get_developer_dashboard_metrics()
    return {"success": True, "data": metrics, "error": None}

@app.get("/api/developer/analytics", response_model=StandardResponse)
async def get_developer_analytics(request: Request):
    get_current_developer_from_req(request, required_permission="analytics_view")
    analytics = get_developer_analytics_metrics()
    return {"success": True, "data": analytics, "error": None}

@app.get("/api/developer/feedback", response_model=StandardResponse)
async def get_developer_feedback_list(
    request: Request,
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None)
):
    get_current_developer_from_req(request, required_permission="feedback_manage")
    feedback_items = get_developer_feedback(status_filter=status, priority_filter=priority)
    return {"success": True, "data": {"feedback": feedback_items, "feedbacks": feedback_items}, "error": None}

@app.put("/api/developer/feedback/{feedback_id}", response_model=StandardResponse)
async def update_feedback_item(feedback_id: int, payload: DeveloperFeedbackUpdateRequest, request: Request):
    dev = get_current_developer_from_req(request, required_permission="feedback_manage")
    ok = update_developer_feedback(
        feedback_id=feedback_id,
        status=payload.status,
        priority=payload.priority,
        internal_notes=payload.internal_notes,
        actor_id=dev.get("username", "ADMIN")
    )
    if ok:
        return {"success": True, "data": {"message": "Feedback status updated."}, "error": None}
    return {"success": False, "data": None, "error": {"code": "UPDATE_FAILED", "message": "Feedback record not found."}}

@app.post("/api/developer/feedback/{feedback_id}/status", response_model=StandardResponse)
async def developer_update_feedback_status(feedback_id: int, req: FeedbackStatusUpdateRequest, request: Request):
    dev = get_current_developer_from_req(request, required_permission="feedback_manage")
    ok = update_developer_feedback(
        feedback_id=feedback_id,
        status=req.status,
        actor_id=dev.get("username", "ADMIN")
    )
    if ok:
        return {"success": True, "data": {"message": f"Feedback #{feedback_id} status updated to {req.status}."}, "error": None}
    return {"success": False, "error": {"code": "NOT_FOUND", "message": "Feedback record not found."}}

@app.get("/api/developer/health", response_model=StandardResponse)
async def get_developer_health(request: Request):
    get_current_developer_from_req(request, required_permission="health_view")
    
    # Real dynamic check of DB & services
    db_status = "healthy"
    try:
        from .database import get_db_connection
        conn = get_db_connection()
        conn.execute("SELECT 1")
        conn.close()
    except Exception:
        db_status = "unhealthy"

    overall_status = "operational" if db_status == "healthy" else "degraded"
    
    health = {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "frontend": {"status": "not_probed", "latency_ms": None},
            "backend_api": {"status": "healthy", "latency_ms": None},
            "database_sqlite": {"status": db_status, "latency_ms": None},
            "analysis_engine": {"status": "available" if all(m["installed"] for m in engine.status().values()) else "models_missing", "mode": "Published local models + late fusion"},
            "assistant_service": {"status": "healthy", "mode": "Knowledge-Base + Diversion"}
        }
    }
    return {"success": True, "data": health, "error": None}

@app.get("/api/developer/assistant", response_model=StandardResponse)
async def get_developer_assistant_metrics(request: Request):
    get_current_developer_from_req(request, required_permission="analytics_view")
    metrics = get_assistant_db_metrics()
    return {"success": True, "data": metrics, "error": None}

@app.get("/api/developer/audit-logs", response_model=StandardResponse)
async def get_developer_audit_logs(request: Request):
    get_current_developer_from_req(request, required_permission="audit_view")
    logs = get_audit_logs(limit=50)
    return {"success": True, "data": {"logs": logs}, "error": None}



@app.on_event('startup')
async def preload_models():
    if os.environ.get('MINDSENSE_PRELOAD_MODELS') == '1':
        for modality in ('text', 'audio', 'image'):
            await run_in_threadpool(engine._load, modality)

# Hash-based frontend routing works with a single same-origin static application.
static_dir = os.environ.get('MINDSENSE_STATIC_DIR')
if static_dir:
    from fastapi.staticfiles import StaticFiles
    app.mount('/', StaticFiles(directory=static_dir, html=True), name='frontend')
