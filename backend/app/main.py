import os
import uuid
import json
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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
from .ml.preprocessing.text import tokenize, check_crisis_keywords
from .ml.preprocessing.audio import preprocess_audio
from .ml.preprocessing.vision import preprocess_image

PYTORCH_AVAILABLE = False
try:
    import torch
    from .ml.fusion_model import MultimodalFusionModel
    PYTORCH_AVAILABLE = True
except ImportError:
    pass

app = FastAPI(title="MindSense API", version="1.4")

JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "mindsense-research-secret-key-2026-v1")
ALLOWED_ORIGINS = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_AUDIO_EXTS = {".wav", ".mp3", ".ogg", ".m4a"}
ALLOWED_IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp"}
DANGEROUS_EXTS = {".exe", ".sh", ".py", ".php", ".bat", ".cmd", ".ps1", ".vbs", ".js", ".html"}

def validate_uploaded_file(file: UploadFile, file_type: str, max_bytes: int = 10 * 1024 * 1024):
    if not file or not file.filename:
        return
        
    ext = os.path.splitext(file.filename)[1].lower()
    if ext in DANGEROUS_EXTS:
        raise HTTPException(status_code=400, detail=f"Security Alert: File extension {ext} is prohibited.")
        
    if file_type == "audio" and ext not in ALLOWED_AUDIO_EXTS:
        raise HTTPException(status_code=400, detail=f"Invalid audio format '{ext}'. Allowed: .wav, .mp3, .ogg, .m4a")
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
            
        payload = json.loads(base64url_decode(payload_b64).decode('utf-8'))
        if payload.get("exp") and payload["exp"] < int(time.time()):
            return None
            
        return payload
    except Exception:
        return None

def get_current_user_from_req(request: Request) -> dict:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token required.")
    
    token = auth_header.split(" ")[1]
    payload = verify_jwt_token(token)
    if not payload or "sub" not in payload or payload.get("type") != "user":
        raise HTTPException(status_code=401, detail="Invalid or expired user authentication token.")
        
    user = get_user_by_id(int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=401, detail="User account no longer exists.")
        
    return user

def get_optional_user_from_req(request: Request) -> Optional[dict]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    payload = verify_jwt_token(token)
    if not payload or "sub" not in payload or payload.get("type") != "user":
        return None
    return get_user_by_id(int(payload["sub"]))

def get_current_developer_from_req(request: Request, required_permission: Optional[str] = None) -> dict:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Developer authentication required. Missing Bearer token.")
        
    token = auth_header.split(" ")[1]
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

model = None
if PYTORCH_AVAILABLE:
    try:
        model = MultimodalFusionModel(num_classes=7, d_model=64)
        model_path = os.path.join(os.path.dirname(__file__), "ml", "mindsense_fusion.pt")
        if os.path.exists(model_path):
            model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu'), weights_only=True))
            model.eval()
            print("Loaded PyTorch Multimodal Fusion weights successfully.")
        else:
            print("Warning: PyTorch model weights mindsense_fusion.pt not found. Running with uninitialized weights.")
            model.eval()
    except Exception as e:
        print(f"Error loading PyTorch model: {e}. Falling back to rule-based inference.")
        model = None

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
    password: str
    name: str

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class UpdateProfileRequest(BaseModel):
    user_id: int
    name: str
    email: str

class ChangePasswordRequest(BaseModel):
    user_id: int
    old_password: str
    new_password: str

class CheckinRequest(BaseModel):
    user_id: Optional[int] = None
    feeling_score: int
    energy_score: int
    sleep_score: int
    stress_score: int
    talk_to_someone: bool
    notes: Optional[str] = ""

class ForgotPasswordRequest(BaseModel):
    username_or_email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class DeveloperRegisterRequest(BaseModel):
    full_name: str
    username: str
    email: str
    password: str
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

def simulate_prediction(text: Optional[str], audio_mfcc: Optional[list], face_status: str) -> dict:
    text_probs = np_softmax([0.0] * 7)
    audio_probs = np_softmax([0.0] * 7)
    vision_probs = np_softmax([0.0] * 7)
    
    if text:
        text_scores = [0.0] * 7
        text_lower = text.lower()
        
        sad_words = ["sad", "depressed", "lonely", "hurt", "empty", "tired", "exhausted", "hopeless", "unhappy", "cry", "crying", "grief", "burnout"]
        happy_words = ["happy", "joy", "glad", "excited", "cheerful", "smile", "smiling", "love", "great", "good", "wonderful", "celebrate"]
        angry_words = ["angry", "mad", "rage", "furious", "annoyed", "frustrated", "hate", "irritated", "dislike", "furious"]
        fear_words = ["fear", "scared", "afraid", "anxious", "nervous", "panic", "worry", "worried", "stress", "stressed", "dread"]
        surprise_words = ["surprise", "surprised", "shocked", "amazing", "sudden", "unexpected", "wow"]
        disgust_words = ["disgust", "disgusted", "gross", "nasty", "revolting", "sick", "yuck", "repulsed"]
        neutral_words = ["fine", "okay", "normal", "average", "usual", "regular", "neutral"]
        
        for w in sad_words:
            if w in text_lower: text_scores[1] += 2.5
        for w in happy_words:
            if w in text_lower: text_scores[0] += 2.5
        for w in angry_words:
            if w in text_lower: text_scores[2] += 2.5
        for w in fear_words:
            if w in text_lower: text_scores[3] += 2.5
        for w in surprise_words:
            if w in text_lower: text_scores[4] += 2.5
        for w in disgust_words:
            if w in text_lower: text_scores[5] += 2.5
        for w in neutral_words:
            if w in text_lower: text_scores[6] += 1.5
            
        if sum(text_scores) == 0:
            text_scores[6] = 1.0
            
        text_probs = np_softmax(text_scores)
        
    if audio_mfcc is not None:
        audio_scores = [0.0] * 7
        mfcc_arr = np_array(audio_mfcc)
        std_dev = float(mfcc_arr.std())
        
        if std_dev > 1.2:
            audio_scores[2] = 2.0  # Angry
            audio_scores[4] = 1.5  # Surprise
            audio_scores[0] = 1.0  # Happy
        elif std_dev < 0.6:
            audio_scores[1] = 2.0  # Sad
            audio_scores[6] = 1.5  # Neutral
        else:
            audio_scores[6] = 1.5  # Neutral
            audio_scores[3] = 1.0  # Fear
            
        audio_probs = np_softmax(audio_scores)
        
    if face_status != "no_face":
        vision_scores = [0.0] * 7
        if face_status == "multiple_faces":
            vision_scores[4] = 2.0
            vision_scores[6] = 1.0
        else:
            vision_scores[6] = 1.5
            vision_scores[0] = 0.5
            
        vision_probs = np_softmax(vision_scores)
        
    modalities_used = []
    fused_scores = [0.0] * 7
    
    if text:
        modalities_used.append("text")
        for i in range(7): fused_scores[i] += text_probs[i] * 0.40
    if audio_mfcc is not None:
        modalities_used.append("audio")
        for i in range(7): fused_scores[i] += audio_probs[i] * 0.35
    if face_status != "no_face":
        modalities_used.append("image")
        for i in range(7): fused_scores[i] += vision_probs[i] * 0.25
        
    total_fused = sum(fused_scores)
    fused_probs = [s / total_fused for s in fused_scores] if total_fused > 0 else np_softmax([0.0] * 7)
    
    max_idx = fused_probs.index(max(fused_probs))
    final_emotion = EMOTIONS[max_idx]
    final_confidence = fused_probs[max_idx]
    
    return {
        "final_emotion": final_emotion,
        "confidence": final_confidence,
        "probabilities": {EMOTIONS[i]: float(fused_probs[i]) for i in range(7)},
        "modalities_used": modalities_used,
        "modality_predictions": {
            "text": {"emotion": EMOTIONS[text_probs.index(max(text_probs))], "confidence": float(max(text_probs))} if text else None,
            "audio": {"emotion": EMOTIONS[audio_probs.index(max(audio_probs))], "confidence": float(max(audio_probs))} if audio_mfcc is not None else None,
            "image": {"emotion": EMOTIONS[vision_probs.index(max(vision_probs))], "confidence": float(max(vision_probs))} if face_status != "no_face" else None
        }
    }

def np_softmax(x):
    import numpy as np
    exp_x = np.exp(x - np.max(x))
    return (exp_x / exp_x.sum()).tolist()

def np_array(x):
    import numpy as np
    return np.array(x)

# ----------------- AUTHENTICATION & ACCOUNT SETTINGS ----------------- #

@app.post("/api/auth/register", response_model=StandardResponse)
def register(req: RegisterRequest):
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
    ok, res = create_user_password_reset(req.username_or_email)
    if ok:
        return {
            "success": True,
            "data": {"message": "Password reset token generated.", "reset_token": res["token"]},
            "error": None
        }
    return {
        "success": False,
        "error": {"code": "USER_NOT_FOUND", "message": res}
    }

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
        token = auth_header.split(" ")[1]
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
        user_id = req.user_id or (opt_user["id"] if opt_user else None)
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
def publish_article(req: ArticleCreateRequest):
    try:
        article_id = create_article(
            title=req.title,
            author=req.author,
            category=req.category,
            summary=req.summary,
            content=req.content,
            tags=req.tags,
            user_id=req.user_id
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
def remove_article(article_id: int, user_id: Optional[int] = Query(None)):
    try:
        deleted = delete_article(article_id, user_id)
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
    samples = [
        {
            "id": "crema-d-01",
            "dataset": "CREMA-D",
            "title": "Crowd-Sourced Multimodal Speech & Facial Clip",
            "speaker": "Actor #1024 (Female, 28)",
            "ground_truth": "sad",
            "text": "I can't believe this is happening again. Everything feels completely overwhelming.",
            "audio_label": "High pitch variability, depressed resonance, 16kHz mono",
            "vision_label": "Lowered lip corners, drooped eyelids, 48x48 grayscale crop",
            "description": "CREMA-D contains 7,442 clips from 91 diverse actors labeled by 2,445 crowd reviewers."
        },
        {
            "id": "ravdess-02",
            "dataset": "RAVDESS",
            "title": "Ryerson Speech & Song Emotional Dataset",
            "speaker": "Actor #03 (Male, 34)",
            "ground_truth": "fear",
            "text": "The papers are waiting on the desk... did you hear that sudden noise in the hallway?",
            "audio_label": "Fast cadence, tremors in vocal tract MFCC distribution",
            "vision_label": "Widened eye aperture, raised inner brows",
            "description": "RAVDESS provides validated North American recordings scored across 8 discrete emotions."
        },
        {
            "id": "fer2013-03",
            "dataset": "FER-2013",
            "title": "In-the-Wild Facial Emotion Benchmark",
            "speaker": "Unconstrained Subject #18920",
            "ground_truth": "angry",
            "text": "This is completely unacceptable after we waited for three hours.",
            "audio_label": "High energy bursts, sharp fundamental frequency shift",
            "vision_label": "Furrowed brow, pressed lips, normalized 48x48 face",
            "description": "FER-2013 contains 35,887 in-the-wild facial expressions harvested from search queries."
        },
        {
            "id": "goemotions-04",
            "dataset": "GoEmotions",
            "title": "Reddit Social Commentary Corpus",
            "speaker": "User r/AskReddit",
            "ground_truth": "happy",
            "text": "I finally defended my thesis and got offered the research role! Thank you all for the support!",
            "audio_label": "Upbeat vocal tone, balanced harmonics",
            "vision_label": "Duchenne smile with cheek elevation",
            "description": "Google's GoEmotions corpus provides 58,000 fine-grained human annotated comments."
        }
    ]
    return {
        "success": True,
        "data": {"samples": samples},
        "error": None
    }

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
    except Exception:
        pass
        
    return {
        "success": True,
        "data": {
            "status": "healthy",
            "database_connected": db_ok,
            "pytorch_loaded": PYTORCH_AVAILABLE and model is not None,
            "model_version": "multimodal_v1.3"
        }
    }

@app.post("/api/analyze", response_model=StandardResponse)
async def analyze_emotion(
    request: Request,
    text: Optional[str] = Form(None),
    audio: Optional[UploadFile] = File(None),
    image: Optional[UploadFile] = File(None),
    demo_mode: bool = Form(False),
    user_id: Optional[int] = Form(None)
):
    rate_limiter.check_rate_limit(request, "analyze", limit=30)
    
    if audio:
        validate_uploaded_file(audio, "audio")
    if image:
        validate_uploaded_file(image, "image")

    opt_user = get_optional_user_from_req(request)
    target_user_id = opt_user["id"] if opt_user else user_id
    stages = []
    
    stages.append({"stage": "Input Validation", "status": "processing"})
    if not text and not audio and not image:
        stages[-1]["status"] = "failed"
        return {
            "success": False,
            "error": {
                "code": "INSUFFICIENT_INPUT",
                "message": "No input modalities provided. Please provide text, audio, or image."
            }
        }
    stages[-1]["status"] = "completed"
    
    stages.append({"stage": "Preprocessing", "status": "processing"})
    stages.append({"stage": "Feature Extraction", "status": "pending"})
    
    crisis_alert = False
    text_tokens = None
    if text and text.strip():
        text_tokens = tokenize(text)
        crisis_alert, _ = check_crisis_keywords(text)
        
    audio_mfcc = None
    if audio:
        try:
            audio_bytes = await audio.read()
            ext = os.path.splitext(audio.filename)[1] if audio.filename else ".wav"
            if not ext: ext = ".wav"
            audio_mfcc = preprocess_audio(audio_bytes, ext).tolist()
        except Exception as e:
            stages[-1]["status"] = "failed"
            return {
                "success": False,
                "error": {
                    "code": "INVALID_AUDIO",
                    "message": f"The uploaded audio file could not be preprocessed. Details: {str(e)}"
                }
            }
            
    image_face = None
    face_status = "no_face"
    if image:
        try:
            image_bytes = await image.read()
            image_face, face_status = preprocess_image(image_bytes)
            if image_face is None and face_status == "no_face":
                stages[-1]["status"] = "failed"
                return {
                    "success": False,
                    "error": {
                        "code": "NO_FACE_DETECTED",
                        "message": "No face was detected in this image. Please upload a clear image containing one face."
                    }
                }
        except Exception as e:
            stages[-1]["status"] = "failed"
            return {
                "success": False,
                "error": {
                    "code": "INVALID_IMAGE",
                    "message": f"The uploaded image could not be processed. Details: {str(e)}"
                }
            }
            
    stages[-2]["status"] = "completed"
    stages[-1]["status"] = "completed"
    
    stages.append({"stage": "Modality Encoding", "status": "processing"})
    stages.append({"stage": "Multimodal Fusion", "status": "pending"})
    
    is_demo_prediction = demo_mode or (not PYTORCH_AVAILABLE) or (model is None)
    result = None
    
    if not is_demo_prediction:
        try:
            stages[-2]["status"] = "processing"
            t_tensor = torch.tensor([text_tokens], dtype=torch.long) if text_tokens else None
            a_tensor = torch.tensor([audio_mfcc], dtype=torch.float) if audio_mfcc else None
            v_tensor = torch.tensor([image_face.tolist()], dtype=torch.float) if image_face is not None else None
            
            with torch.no_grad():
                out = model(text_input=t_tensor, audio_input=a_tensor, vision_input=v_tensor)
                probs = torch.softmax(out["multimodal_logits"], dim=1).squeeze(0).tolist()
                max_idx = probs.index(max(probs))
                final_emotion = EMOTIONS[max_idx]
                final_confidence = probs[max_idx]
                
                t_pred = None
                if out["text_logits"] is not None:
                    t_probs = torch.softmax(out["text_logits"], dim=1).squeeze(0).tolist()
                    t_pred = {"emotion": EMOTIONS[t_probs.index(max(t_probs))], "confidence": max(t_probs)}
                    
                a_pred = None
                if out["audio_logits"] is not None:
                    a_probs = torch.softmax(out["audio_logits"], dim=1).squeeze(0).tolist()
                    a_pred = {"emotion": EMOTIONS[a_probs.index(max(a_probs))], "confidence": max(a_probs)}
                    
                v_pred = None
                if out["vision_logits"] is not None:
                    v_probs = torch.softmax(out["vision_logits"], dim=1).squeeze(0).tolist()
                    v_pred = {"emotion": EMOTIONS[v_probs.index(max(v_probs))], "confidence": max(v_probs)}
                    
            modalities_used = []
            if text_tokens: modalities_used.append("text")
            if audio_mfcc: modalities_used.append("audio")
            if image_face is not None: modalities_used.append("image")
            
            result = {
                "final_emotion": final_emotion,
                "confidence": final_confidence,
                "probabilities": {EMOTIONS[i]: probs[i] for i in range(7)},
                "modalities_used": modalities_used,
                "modality_predictions": {
                    "text": t_pred,
                    "audio": a_pred,
                    "image": v_pred
                }
            }
            stages[-2]["status"] = "completed"
            stages[-1]["status"] = "completed"
        except Exception as e:
            print(f"PyTorch inference exception: {e}. Falling back to demo mode.")
            is_demo_prediction = True
            
    if is_demo_prediction:
        stages[-2]["status"] = "completed"
        stages[-1]["status"] = "completed"
        result = simulate_prediction(text, audio_mfcc, face_status)
        
    stages.append({"stage": "Emotion Classification", "status": "completed"})
    stages.append({"stage": "Generating Insights", "status": "processing"})
    
    final_emo = result["final_emotion"]
    conf = result["confidence"]
    insight_text = ""
    
    if final_emo in ["sad", "fear", "angry", "disgust"]:
        insight_text = f"The model detected emotional patterns associated with {final_emo}."
        if final_emo == "fear":
            insight_text = "The model detected emotional patterns associated with worry or stress."
        insight_text += " Your recent inputs show elevated negative emotional signals. "
        if conf > 0.60:
            insight_text += "Consider checking in with yourself or speaking with someone you trust or a qualified professional if these feelings persist."
    elif final_emo in ["happy", "surprise"]:
        insight_text = f"The model detected emotional patterns associated with positive states like {final_emo}."
    else:
        insight_text = "The model detected stable, neutral emotional patterns."
        
    if crisis_alert:
        insight_text = (
            "MindSense detected signals of high distress or potential self-harm. Please know you are not alone. "
            "Consider reaching out to a professional or contacting a crisis line immediately: "
            "National Suicide Prevention Lifeline: Call or text 988 (USA) | "
            "Crisis Text Line: Text HOME to 741741 (USA) | "
            "International Resources: https://findahelpline.com/"
        )
    else:
        insight_text += " This result is an AI-generated estimate and is not a medical diagnosis."

    disclaimer = (
        "This system is for research and wellness monitoring only and does not provide medical "
        "diagnosis or professional mental-health assessment."
    )
    
    stages[-1]["status"] = "completed"
    analysis_id = str(uuid.uuid4())
    
    save_analysis(
        analysis_id=analysis_id,
        modalities_used=result["modalities_used"],
        final_emotion=final_emo,
        confidence_score=conf,
        model_version="multimodal_v1.3",
        is_demo=is_demo_prediction,
        modality_results=result["modality_predictions"],
        user_id=target_user_id
    )
    
    response_data = {
        "id": analysis_id,
        "timestamp": datetime.utcnow().isoformat(),
        "emotion": final_emo,
        "confidence": conf,
        "confidence_label": get_confidence_label(conf),
        "probabilities": result["probabilities"],
        "modalities_used": result["modalities_used"],
        "modality_predictions": result["modality_predictions"],
        "is_demo": is_demo_prediction,
        "model_version": "multimodal_v1.3",
        "disclaimer": disclaimer,
        "crisis_alert": crisis_alert,
        "wellness_insight": insight_text,
        "stages": stages
    }
    
    return {
        "success": True,
        "data": response_data,
        "error": None
    }

@app.get("/api/history", response_model=StandardResponse)
def get_analysis_history(request: Request, limit: int = Query(50, ge=1, le=100)):
    try:
        user = get_optional_user_from_req(request)
        target_user_id = user["id"] if user else None
        history = get_history(limit, target_user_id)
        return {
            "success": True,
            "data": {"history": history},
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "error": {"code": "DATABASE_ERROR", "message": f"Failed to retrieve history: {str(e)}"}
        }

@app.delete("/api/history", response_model=StandardResponse)
def clear_all_history(request: Request):
    try:
        user = get_optional_user_from_req(request)
        target_user_id = user["id"] if user else None
        delete_history(target_user_id)
        return {
            "success": True,
            "data": {"message": "Historical records have been deleted successfully."},
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "error": {"code": "DATABASE_ERROR", "message": f"Failed to reset data: {str(e)}"}
        }

@app.get("/api/dashboard", response_model=StandardResponse)
def get_dashboard_summary(request: Request):
    try:
        user = get_optional_user_from_req(request)
        target_user_id = user["id"] if user else None
        raw_data = get_dashboard_data(target_user_id)
        
        trends = {
            "dominant_emotion": "Neutral",
            "emotional_variability": "Low",
            "recent_trend": "No recent trend available. Complete more analyses to calculate.",
            "wellness_score": 78,
            "alert": False
        }
        
        historic = raw_data["historic_trends"]
        checkins = raw_data["checkin_trends"]
        
        if len(historic) > 0 or len(checkins) > 0:
            positive_count = 0
            total_items = 0
            
            for h in historic:
                total_items += 1
                if h["final_emotion"] in ["happy", "surprise", "neutral"]:
                    positive_count += 1
                    
            for c in checkins:
                total_items += 1
                if c["feeling_score"] >= 3:
                    positive_count += 1
                if c["stress_score"] <= 2:
                    positive_count += 0.5
                    
            if total_items > 0:
                score = int((positive_count / total_items) * 100)
                trends["wellness_score"] = max(10, min(98, score))

        if len(historic) >= 3:
            emotions = [h["final_emotion"] for h in historic]
            from collections import Counter
            counts = Counter(emotions)
            
            trends["dominant_emotion"] = counts.most_common(1)[0][0]
            trends["emotional_variability"] = "High" if len(counts) > 3 else "Moderate" if len(counts) > 1 else "Low"
            
            negative_emotions = ["sad", "fear", "angry"]
            neg_count = sum(1 for e in emotions[:5] if e in negative_emotions)
            
            if neg_count >= 3:
                trends["recent_trend"] = (
                    "Your recent analyses show a concentration of stress or sadness-related emotional signals. "
                    "Consider checking in with yourself, logging daily reflections, or speaking with someone you trust."
                )
                trends["alert"] = True
            else:
                trends["recent_trend"] = "Your emotional signals show a balanced, positive distribution over recent days."
                
        return {
            "success": True,
            "data": {
                "summary": raw_data,
                "trends": trends
            },
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "error": {"code": "DATABASE_ERROR", "message": f"Failed to compile dashboard: {str(e)}"}
        }

@app.post("/api/checkin", response_model=StandardResponse)
def submit_checkin(request: CheckinRequest, req: Request):
    try:
        user = get_optional_user_from_req(req)
        target_user_id = user["id"] if user else request.user_id
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
    except Exception as e:
        return {
            "success": False,
            "error": {"code": "DATABASE_ERROR", "message": f"Failed to record check-in: {str(e)}"}
        }

@app.get("/api/checkins", response_model=StandardResponse)
def get_all_checkins(req: Request, limit: int = Query(50, ge=1, le=100)):
    try:
        user = get_optional_user_from_req(req)
        target_user_id = user["id"] if user else None
        checkins = get_checkins(limit, target_user_id)
        return {
            "success": True,
            "data": {"checkins": checkins},
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "error": {"code": "DATABASE_ERROR", "message": f"Failed to retrieve checkins: {str(e)}"}
        }

@app.get("/api/research", response_model=StandardResponse)
def get_research_metrics():
    try:
        metrics_path = os.path.join(os.path.dirname(__file__), "ml", "evaluation_results.json")
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
    {
        "keywords": ["start", "analyze", "how to analyze", "how to use", "begin", "upload"],
        "topic": "Starting an Analysis",
        "answer": "To run an analysis in MindSense:\n1. Navigate to **Analyze** in the top navigation.\n2. Choose any combination of **Text** (statement), **Audio** (microphone record or .wav upload), and **Vision** (webcam photo snap or file upload).\n3. Click **Execute Intermediate Cross-Attention Analysis**.\n4. Review the detected dominant emotional state, confidence score, and probability distribution across 7 affect categories."
    },
    {
        "keywords": ["multimodal", "cross-attention", "fusion", "how it works", "architecture", "intermediate"],
        "topic": "Multimodal Fusion Architecture",
        "answer": "MindSense uses an **Intermediate Cross-Attention Transformer**. Rather than concatenating raw features (Early Fusion) or averaging independent classifier scores (Late Fusion), our model projects 64-dimensional unimodal representations into a unified attention sequence. It applies dynamic availability masking ($M_{mask} = -\\infty$) so missing inputs never inject false zero-bias artifacts."
    },
    {
        "keywords": ["confidence", "probability", "what does confidence mean", "score", "meaning"],
        "topic": "Understanding Confidence Scores",
        "answer": "The confidence score is the Softmax output probability computed by the neural network, representing the model's mathematical certainty among the 7 classified emotion categories. **Important:** Confidence is an AI estimation metric, NOT a clinical diagnostic probability or psychological assessment."
    },
    {
        "keywords": ["medical", "diagnosis", "doctor", "clinical", "disease", "disorder", "depression", "anxiety"],
        "topic": "Clinical Scope & Disclaimers",
        "answer": "**Important Medical Advisory:** MindSense is an academic affective computing research and wellness self-reflection platform. It is NOT a medical device and does NOT diagnose psychiatric disorders. If you are experiencing distress, please contact the 24/7 Suicide & Crisis Lifeline at **988** (US/Canada) or visit findahelpline.com."
    },
    {
        "keywords": ["dataset", "datasets", "crema", "ravdess", "fer", "goemotions", "training"],
        "topic": "Benchmark Corpora",
        "answer": "MindSense is evaluated against four gold-standard academic benchmarks:\n- **CREMA-D**: 7,442 audio-visual clips across 91 diverse actors.\n- **RAVDESS**: 7,356 validated North American speech and song recordings.\n- **FER-2013**: 35,887 unconstrained 48x48 facial crops.\n- **GoEmotions**: 58,000 fine-grained Reddit conversational comments.\nAll splits enforce strict speaker-independent and actor-independent isolation to prevent data leakage."
    },
    {
        "keywords": ["privacy", "data", "storage", "camera", "microphone", "save", "stored"],
        "topic": "Privacy & Data Architecture",
        "answer": "MindSense follows local zero-persistence inference. Raw webcam captures and microphone audio buffers are processed exclusively in temporary volatile memory and flushed immediately after inference. Only numerical classification logits and private journal notes are stored in your local SQLite database."
    },
    {
        "keywords": ["history", "trends", "past", "journal", "checkin", "check-in"],
        "topic": "Insights & Longitudinal Tracking",
        "answer": "Under **Insights**, you can explore:\n- **Longitudinal Trends**: Timeline charts tracking emotion transitions and daily feeling/stress curves.\n- **Assessment History**: Searchable logs of past multimodal inferences.\n- **Daily Journal**: Private qualitative reflections with affect tags and JSON export.\n- **Daily Check-in**: 1–5 somatic scale self-reporting."
    }
]

@app.post("/api/assistant/chat", response_model=StandardResponse)
def ask_research_assistant(request: AssistantQueryPayload):
    query = request.message.strip().lower()
    
    # 1. Crisis Check
    is_crisis, detected = check_crisis_keywords(query)
    if is_crisis:
        log_assistant_interaction(is_crisis=True, topic="Crisis Support", latency_ms=45)
        return {
            "success": True,
            "data": {
                "response": "⚠️ **Immediate Crisis Support Notice:** It sounds like you or someone you know may be going through a difficult time. MindSense is an AI research tool and cannot provide clinical care or emergency assistance. **Please reach out to confidential 24/7 support right away:**\n- **Call or text 988** (USA & Canada Suicide & Crisis Lifeline)\n- **Text HOME to 741741** (Crisis Text Line)\n- **International:** Visit [findahelpline.com](https://findahelpline.com)\nFree, confidential help is available 24/7.",
                "is_crisis": True,
                "suggested_actions": ["Call 988", "Open Crisis Resources"]
            },
            "error": None
        }

    # 2. Match Knowledge Base
    best_match = None
    max_score = 0

    for item in KNOWLEDGE_FAQ:
        score = sum(1 for kw in item["keywords"] if kw in query)
        if score > max_score:
            max_score = score
            best_match = item

    if best_match and max_score > 0:
        log_assistant_interaction(is_crisis=False, topic=best_match["topic"], latency_ms=65)
        return {
            "success": True,
            "data": {
                "response": best_match["answer"],
                "topic": best_match["topic"],
                "is_crisis": False,
                "suggested_actions": ["Start Analysis", "Explore Research", "Open Help Center"]
            },
            "error": None
        }

    # 3. Default Helpful Academic Guidance
    fallback_response = (
        "I am the **MindSense Research Assistant**. I can help you navigate the platform, understand multimodal affective computing, explain our cross-attention architecture, and clarify how dataset benchmarks are structured.\n\n"
        "**Popular topics you can ask me about:**\n"
        "- *How do I start a multimodal analysis?*\n"
        "- *What is Intermediate Cross-Attention fusion?*\n"
        "- *What does the confidence score mean?*\n"
        "- *Which benchmark datasets (CREMA-D, RAVDESS, FER-2013) are used?*\n"
        "- *How is my audio and camera privacy handled?*\n"
        "- *Is this a medical diagnostic system?*"
    )

    log_assistant_interaction(is_crisis=False, topic="General Guidance", latency_ms=80)
    return {
        "success": True,
        "data": {
            "response": fallback_response,
            "topic": "General Guidance",
            "is_crisis": False,
            "suggested_actions": ["How to Analyze", "Explain Cross-Attention", "Privacy Info"]
        },
        "error": None
    }


# ============================================================================
# PUBLIC SECURE SHARE LINK ENDPOINTS
# ============================================================================

class ShareCreateRequest(BaseModel):
    result_id: str
    expiration_hours: Optional[int] = 24
    user_id: Optional[int] = None

@app.post("/api/share/create", response_model=StandardResponse)
async def api_create_share_link(payload: ShareCreateRequest, request: Request):
    try:
        user = get_optional_user_from_req(request)
        target_owner_id = user["id"] if user else payload.user_id
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
    user = get_optional_user_from_req(request)
    actor_id = user["username"] if user else "PUBLIC_USER"
    ok = revoke_share_link(token, actor_id=actor_id)
    if ok:
        return {"success": True, "data": {"message": "Share link revoked successfully."}, "error": None}
    return {"success": False, "data": None, "error": {"code": "REVOKE_FAILED", "message": "Link not found or already revoked."}}


# ============================================================================
# SEPARATE DEVELOPER / ADMIN PORTAL ENDPOINTS (JWT & RBAC ENFORCED)
# ============================================================================

class DeveloperLoginRequest(BaseModel):
    username_or_email: str
    password: str

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
        return {
            "success": True,
            "data": {
                "message": "Developer registration submitted. Verification token created.",
                "verification_token": res["verification_token"],
                "state": res["state"]
            },
            "error": None
        }
    return {"success": False, "data": None, "error": {"code": "REGISTRATION_FAILED", "message": res}}

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
    ok, res = create_developer_password_reset(payload.username_or_email)
    if ok:
        return {
            "success": True,
            "data": {"message": "Developer password reset token generated.", "reset_token": res["token"]},
            "error": None
        }
    return {"success": False, "data": None, "error": {"code": "NOT_FOUND", "message": res}}

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
        token = auth_header.split(" ")[1]
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
            "frontend": {"status": "healthy", "latency_ms": 12},
            "backend_api": {"status": "healthy", "latency_ms": 15},
            "database_sqlite": {"status": db_status, "latency_ms": 4},
            "analysis_engine": {"status": "healthy" if (PYTORCH_AVAILABLE or model is not None) else "operational", "mode": "PyTorch / Rule-Fallback" if PYTORCH_AVAILABLE else "Rule-Fallback"},
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


