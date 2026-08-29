import os
import uuid
import json
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .database import (
    init_db, save_analysis, get_history, delete_history, 
    save_checkin, get_checkins, get_dashboard_data,
    register_user, authenticate_user, get_user_login_history,
    update_user_profile, change_user_password,
    save_daily_note, get_daily_notes, delete_daily_note,
    get_articles, create_article, like_article, delete_article
)
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

app = FastAPI(title="MindSense API", version="1.3")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

model = None
if PYTORCH_AVAILABLE:
    try:
        model = MultimodalFusionModel(num_classes=7, d_model=64)
        model_path = os.path.join(os.path.dirname(__file__), "ml", "mindsense_fusion.pt")
        if os.path.exists(model_path):
            model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
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
        return {
            "success": True,
            "data": {"user": user, "message": "Account created successfully."},
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
        return {
            "success": True,
            "data": {"user": user, "token": f"mindsense_token_{user['id']}"},
            "error": None
        }
    return {
        "success": False,
        "error": {"code": "INVALID_CREDENTIALS", "message": "Invalid username/email or password."}
    }

@app.put("/api/auth/profile", response_model=StandardResponse)
def update_profile(req: UpdateProfileRequest):
    try:
        updated_user = update_user_profile(req.user_id, req.name, req.email)
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
def change_password(req: ChangePasswordRequest):
    try:
        success = change_user_password(req.user_id, req.old_password, req.new_password)
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
def login_history(user_id: int = Query(...)):
    history = get_user_login_history(user_id)
    return {
        "success": True,
        "data": {"login_sessions": history},
        "error": None
    }

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
def create_daily_note(req: DailyNoteRequest):
    try:
        note_id = save_daily_note(req.user_id, req.date, req.title, req.content, req.mood_tag)
        return {
            "success": True,
            "data": {"id": note_id, "message": "Daily reflection saved successfully."},
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "error": {"code": "NOTE_SAVE_FAILED", "message": str(e)}
        }

@app.get("/api/notes", response_model=StandardResponse)
def list_daily_notes(user_id: int = Query(...), limit: int = Query(50)):
    notes = get_daily_notes(user_id, limit)
    return {
        "success": True,
        "data": {"notes": notes},
        "error": None
    }

@app.delete("/api/notes/{note_id}", response_model=StandardResponse)
def remove_daily_note(note_id: int, user_id: int = Query(...)):
    deleted = delete_daily_note(note_id, user_id)
    if deleted:
        return {"success": True, "data": {"message": "Note deleted successfully."}, "error": None}
    return {"success": False, "error": {"code": "NOT_FOUND", "message": "Note not found."}}

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
    text: Optional[str] = Form(None),
    audio: Optional[UploadFile] = File(None),
    image: Optional[UploadFile] = File(None),
    demo_mode: bool = Form(False),
    user_id: Optional[int] = Form(None)
):
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
        crisis_alert = check_crisis_keywords(text)
        
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
        user_id=user_id
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
def get_analysis_history(limit: int = Query(50, ge=1, le=100), user_id: Optional[int] = Query(None)):
    try:
        history = get_history(limit, user_id)
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
def clear_all_history(user_id: Optional[int] = Query(None)):
    try:
        delete_history(user_id)
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
def get_dashboard_summary(user_id: Optional[int] = Query(None)):
    try:
        raw_data = get_dashboard_data(user_id)
        
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
def submit_checkin(request: CheckinRequest):
    try:
        checkin_id = save_checkin(
            feeling_score=request.feeling_score,
            energy_score=request.energy_score,
            sleep_score=request.sleep_score,
            stress_score=request.stress_score,
            talk_to_someone=request.talk_to_someone,
            notes=request.notes,
            user_id=request.user_id
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
def get_all_checkins(limit: int = Query(50, ge=1, le=100), user_id: Optional[int] = Query(None)):
    try:
        checkins = get_checkins(limit, user_id)
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
