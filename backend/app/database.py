import sqlite3
import json
import os
import hashlib
from datetime import datetime

DATABASE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mindsense.db")

def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    # 2. Login Sessions History Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS login_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        status TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)
    
    # 3. Analyses Table (with user_id)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS analyses (
        id TEXT PRIMARY KEY,
        user_id INTEGER,
        timestamp TEXT NOT NULL,
        modalities_used TEXT NOT NULL,
        final_emotion TEXT NOT NULL,
        confidence_score REAL NOT NULL,
        model_version TEXT NOT NULL,
        is_demo INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
    )
    """)
    
    # 4. Modality Results Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS modality_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        analysis_id TEXT NOT NULL,
        modality TEXT NOT NULL,
        emotion TEXT NOT NULL,
        confidence REAL NOT NULL,
        FOREIGN KEY (analysis_id) REFERENCES analyses (id) ON DELETE CASCADE
    )
    """)
    
    # 5. Daily Check-ins Table (with user_id)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS daily_checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        timestamp TEXT NOT NULL,
        feeling_score INTEGER NOT NULL,
        energy_score INTEGER NOT NULL,
        sleep_score INTEGER NOT NULL,
        stress_score INTEGER NOT NULL,
        talk_to_someone INTEGER NOT NULL,
        notes TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # 6. Daily Notes / Journal Capture Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS daily_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        mood_tag TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)
    
    # Insert a default guest user if no users exist
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        guest_pw = hash_password("demo123")
        cursor.execute("""
        INSERT INTO users (username, email, password_hash, name, created_at)
        VALUES (?, ?, ?, ?, ?)
        """, ("guest_user", "guest@mindsense.ai", guest_pw, "Demo Explorer", datetime.utcnow().isoformat()))
    
    conn.commit()
    conn.close()

# ----------------- USER AUTH FUNCTIONS ----------------- #

def register_user(username: str, email: str, password: str, name: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        pw_hash = hash_password(password)
        created_at = datetime.utcnow().isoformat()
        cursor.execute("""
        INSERT INTO users (username, email, password_hash, name, created_at)
        VALUES (?, ?, ?, ?, ?)
        """, (username.strip().lower(), email.strip().lower(), pw_hash, name.strip(), created_at))
        user_id = cursor.lastrowid
        conn.commit()
        return {"id": user_id, "username": username, "email": email, "name": name}
    finally:
        conn.close()

def authenticate_user(username_or_email: str, password: str, ip_address: str = "127.0.0.1", user_agent: str = "Web Browser"):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        pw_hash = hash_password(password)
        query_val = username_or_email.strip().lower()
        cursor.execute("""
        SELECT * FROM users WHERE (username = ? OR email = ?) AND password_hash = ?
        """, (query_val, query_val, pw_hash))
        user_row = cursor.fetchone()
        
        timestamp = datetime.utcnow().isoformat()
        if user_row:
            user = dict(user_row)
            # Record successful login session
            cursor.execute("""
            INSERT INTO login_sessions (user_id, timestamp, ip_address, user_agent, status)
            VALUES (?, ?, ?, ?, ?)
            """, (user["id"], timestamp, ip_address, user_agent, "SUCCESS"))
            conn.commit()
            return {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"],
                "name": user["name"],
                "created_at": user["created_at"]
            }
        else:
            # Check if user exists to log failed attempt
            cursor.execute("SELECT id FROM users WHERE username = ? OR email = ?", (query_val, query_val))
            existing = cursor.fetchone()
            if existing:
                cursor.execute("""
                INSERT INTO login_sessions (user_id, timestamp, ip_address, user_agent, status)
                VALUES (?, ?, ?, ?, ?)
                """, (existing[0], timestamp, ip_address, user_agent, "FAILED_PASSWORD"))
                conn.commit()
            return None
    finally:
        conn.close()

def get_user_login_history(user_id: int, limit: int = 20):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        SELECT id, timestamp, ip_address, user_agent, status 
        FROM login_sessions 
        WHERE user_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
        """, (user_id, limit))
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()

# ----------------- ANALYSIS FUNCTIONS ----------------- #

def save_analysis(analysis_id: str, modalities_used: list, final_emotion: str, 
                  confidence_score: float, model_version: str, is_demo: bool, 
                  modality_results: dict, user_id: int = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        timestamp = datetime.utcnow().isoformat()
        modalities_used_str = json.dumps(modalities_used)
        
        cursor.execute("""
        INSERT INTO analyses (id, user_id, timestamp, modalities_used, final_emotion, confidence_score, model_version, is_demo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (analysis_id, user_id, timestamp, modalities_used_str, final_emotion, confidence_score, model_version, 1 if is_demo else 0))
        
        for modality, res in modality_results.items():
            if res:
                cursor.execute("""
                INSERT INTO modality_results (analysis_id, modality, emotion, confidence)
                VALUES (?, ?, ?, ?)
                """, (analysis_id, modality, res["emotion"], res["confidence"]))
                
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def get_history(limit: int = 50, user_id: int = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if user_id is not None:
            cursor.execute("SELECT * FROM analyses WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?", (user_id, limit))
        else:
            cursor.execute("SELECT * FROM analyses ORDER BY timestamp DESC LIMIT ?", (limit,))
            
        analyses = [dict(row) for row in cursor.fetchall()]
        
        for analysis in analyses:
            analysis["modalities_used"] = json.loads(analysis["modalities_used"])
            analysis["is_demo"] = bool(analysis["is_demo"])
            
            cursor.execute("SELECT modality, emotion, confidence FROM modality_results WHERE analysis_id = ?", (analysis["id"],))
            mod_rows = cursor.fetchall()
            analysis["modality_predictions"] = {row["modality"]: {"emotion": row["emotion"], "confidence": row["confidence"]} for row in mod_rows}
            
        return analyses
    finally:
        conn.close()

def delete_history(user_id: int = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if user_id is not None:
            # Delete user's analysis results and checkins
            cursor.execute("SELECT id FROM analyses WHERE user_id = ?", (user_id,))
            a_ids = [row[0] for row in cursor.fetchall()]
            for aid in a_ids:
                cursor.execute("DELETE FROM modality_results WHERE analysis_id = ?", (aid,))
            cursor.execute("DELETE FROM analyses WHERE user_id = ?", (user_id,))
            cursor.execute("DELETE FROM daily_checkins WHERE user_id = ?", (user_id,))
            cursor.execute("DELETE FROM daily_notes WHERE user_id = ?", (user_id,))
        else:
            cursor.execute("DELETE FROM modality_results")
            cursor.execute("DELETE FROM analyses")
            cursor.execute("DELETE FROM daily_checkins")
            cursor.execute("DELETE FROM daily_notes")
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

# ----------------- CHECK-IN FUNCTIONS ----------------- #

def save_checkin(feeling_score: int, energy_score: int, sleep_score: int, 
                 stress_score: int, talk_to_someone: bool, notes: str, user_id: int = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        timestamp = datetime.utcnow().isoformat()
        cursor.execute("""
        INSERT INTO daily_checkins (user_id, timestamp, feeling_score, energy_score, sleep_score, stress_score, talk_to_someone, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, timestamp, feeling_score, energy_score, sleep_score, stress_score, 1 if talk_to_someone else 0, notes))
        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def get_checkins(limit: int = 100, user_id: int = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if user_id is not None:
            cursor.execute("SELECT * FROM daily_checkins WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?", (user_id, limit))
        else:
            cursor.execute("SELECT * FROM daily_checkins ORDER BY timestamp DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()

# ----------------- DAILY NOTES / JOURNAL CAPTURE ----------------- #

def save_daily_note(user_id: int, date: str, title: str, content: str, mood_tag: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        now = datetime.utcnow().isoformat()
        cursor.execute("""
        INSERT INTO daily_notes (user_id, date, title, content, mood_tag, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (user_id, date, title, content, mood_tag, now, now))
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()

def get_daily_notes(user_id: int, limit: int = 50):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        SELECT * FROM daily_notes 
        WHERE user_id = ? 
        ORDER BY date DESC, created_at DESC 
        LIMIT ?
        """, (user_id, limit))
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()

def delete_daily_note(note_id: int, user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM daily_notes WHERE id = ? AND user_id = ?", (note_id, user_id))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()

# ----------------- DASHBOARD & MENTAL HEALTH TRACKING ----------------- #

def get_dashboard_data(user_id: int = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        user_clause = "WHERE user_id = ?" if user_id is not None else ""
        params = (user_id,) if user_id is not None else ()
        
        # 1. Total Analyses count
        cursor.execute(f"SELECT COUNT(*) FROM analyses {user_clause}", params)
        total_analyses = cursor.fetchone()[0]
        
        # 2. Emotion frequency distribution
        cursor.execute(f"SELECT final_emotion, COUNT(*) as count FROM analyses {user_clause} GROUP BY final_emotion", params)
        emotion_counts = {row["final_emotion"]: row["count"] for row in cursor.fetchall()}
        
        # 3. Latest analysis
        cursor.execute(f"SELECT * FROM analyses {user_clause} ORDER BY timestamp DESC LIMIT 1", params)
        latest_row = cursor.fetchone()
        latest_analysis = dict(latest_row) if latest_row else None
        if latest_analysis:
            latest_analysis["modalities_used"] = json.loads(latest_analysis["modalities_used"])
            latest_analysis["is_demo"] = bool(latest_analysis["is_demo"])
            
            cursor.execute("SELECT modality, emotion, confidence FROM modality_results WHERE analysis_id = ?", (latest_analysis["id"],))
            mod_rows = cursor.fetchall()
            latest_analysis["modality_predictions"] = {row["modality"]: {"emotion": row["emotion"], "confidence": row["confidence"]} for row in mod_rows}

        # 4. Modality usage breakdown
        cursor.execute(f"SELECT modalities_used FROM analyses {user_clause}", params)
        modality_freqs = {"text": 0, "audio": 0, "image": 0}
        for row in cursor.fetchall():
            mods = json.loads(row["modalities_used"])
            for m in mods:
                if m in modality_freqs:
                    modality_freqs[m] += 1
                    
        # 5. Checkin trend (last 10)
        cursor.execute(f"SELECT timestamp, feeling_score, energy_score, sleep_score, stress_score FROM daily_checkins {user_clause} ORDER BY timestamp ASC LIMIT 10", params)
        checkin_trends = [dict(row) for row in cursor.fetchall()]
        
        # 6. Historic analyses (last 10)
        cursor.execute(f"SELECT timestamp, final_emotion, confidence_score FROM analyses {user_clause} ORDER BY timestamp DESC LIMIT 10", params)
        historic_trends = [dict(row) for row in cursor.fetchall()]

        # 7. Recent daily notes count
        notes_count = 0
        if user_id is not None:
            cursor.execute("SELECT COUNT(*) FROM daily_notes WHERE user_id = ?", (user_id,))
            notes_count = cursor.fetchone()[0]

        return {
            "total_analyses": total_analyses,
            "emotion_distribution": emotion_counts,
            "latest_analysis": latest_analysis,
            "modality_usage": modality_freqs,
            "checkin_trends": checkin_trends,
            "historic_trends": historic_trends,
            "notes_count": notes_count
        }
    finally:
        conn.close()
