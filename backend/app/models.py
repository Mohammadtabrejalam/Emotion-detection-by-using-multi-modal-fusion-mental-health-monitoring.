from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Index, Enum
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def get_utc_now():
    return datetime.now(timezone.utc)

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)  # SUPER_ADMIN, ADMIN, DEVELOPER, ANALYST, USER
    description = Column(String(255), nullable=True)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

    analyses = relationship("AnalysisResult", back_populates="user", cascade="all, delete-orphan")
    checkins = relationship("CheckIn", back_populates="user", cascade="all, delete-orphan")
    feedbacks = relationship("Feedback", back_populates="user")
    game_scores = relationship("GameScore", back_populates="user")

class Developer(Base):
    __tablename__ = "developers"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    organization = Column(String(150), nullable=True)
    role = Column(String(50), default="DEVELOPER", nullable=False)
    status = Column(String(50), default="PENDING_APPROVAL", nullable=False)  # PENDING_APPROVAL, ACTIVE, REJECTED, SUSPENDED
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    token_jti = Column(String(255), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    developer_id = Column(Integer, ForeignKey("developers.id", ondelete="CASCADE"), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    final_emotion = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=False)
    modalities_json = Column(Text, nullable=False)  # e.g. ["text", "audio"]
    probabilities_json = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False, index=True)

    user = relationship("User", back_populates="analyses")
    metadata_rel = relationship("AnalysisInputMetadata", back_populates="analysis", uselist=False, cascade="all, delete-orphan")

class AnalysisInputMetadata(Base):
    __tablename__ = "analysis_input_metadata"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analysis_results.id", ondelete="CASCADE"), nullable=False, unique=True)
    text_snippet = Column(Text, nullable=True)
    audio_cloudinary_id = Column(String(255), nullable=True)
    image_cloudinary_id = Column(String(255), nullable=True)
    audio_duration_sec = Column(Float, nullable=True)
    image_resolution = Column(String(50), nullable=True)

    analysis = relationship("AnalysisResult", back_populates="metadata_rel")

class CheckIn(Base):
    __tablename__ = "checkins"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    feeling_score = Column(Integer, nullable=False)
    energy_score = Column(Integer, nullable=False)
    sleep_score = Column(Integer, nullable=False)
    stress_score = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    user = relationship("User", back_populates="checkins")

class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    category = Column(String(50), nullable=False)  # bug_report, feature_suggestion, usability, general
    content = Column(Text, nullable=False)
    status = Column(String(50), default="NEW", nullable=False)  # NEW, IN_REVIEW, RESOLVED, CLOSED
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    user = relationship("User", back_populates="feedbacks")

class ResearchParticipant(Base):
    __tablename__ = "research_participants"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    participant_code = Column(String(50), unique=True, nullable=False, index=True)
    age_group = Column(String(50), nullable=True)
    gender_identity = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

class ResearchConsent(Base):
    __tablename__ = "research_consents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    study_id = Column(Integer, nullable=False)
    consent_given = Column(Boolean, nullable=False)
    signed_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    withdrawn_at = Column(DateTime(timezone=True), nullable=True)

class ShareLink(Base):
    __tablename__ = "share_links"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(100), unique=True, nullable=False, index=True)
    analysis_id = Column(Integer, ForeignKey("analysis_results.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)

class Visit(Base):
    __tablename__ = "visits"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), nullable=False, index=True)
    path = Column(String(255), nullable=False)
    timestamp = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

class GameSession(Base):
    __tablename__ = "game_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    score = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False)
    accuracy = Column(Float, nullable=False)
    streak = Column(Integer, default=0, nullable=False)
    completed_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

class GameScore(Base):
    __tablename__ = "game_scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    high_score = Column(Integer, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

    user = relationship("User", back_populates="game_scores")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(100), nullable=False)
    actor_type = Column(String(50), nullable=False)  # USER, DEVELOPER, SYSTEM
    actor_id = Column(Integer, nullable=True)
    details_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
