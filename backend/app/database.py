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

    # 7. Articles & Publishing Hub Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        category TEXT NOT NULL,
        read_time TEXT NOT NULL,
        summary TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT NOT NULL,
        likes INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
    )
    """)
    
    # Run automatic migrations for older schemas
    cursor.execute("PRAGMA table_info(analyses)")
    a_cols = [row[1] for row in cursor.fetchall()]
    if "user_id" not in a_cols:
        cursor.execute("ALTER TABLE analyses ADD COLUMN user_id INTEGER")
        
    cursor.execute("PRAGMA table_info(daily_checkins)")
    c_cols = [row[1] for row in cursor.fetchall()]
    if "user_id" not in c_cols:
        cursor.execute("ALTER TABLE daily_checkins ADD COLUMN user_id INTEGER")
    
    # Insert default guest user if no users exist
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        guest_pw = hash_password("demo123")
        cursor.execute("""
        INSERT INTO users (username, email, password_hash, name, created_at)
        VALUES (?, ?, ?, ?, ?)
        """, ("guest_user", "guest@mindsense.ai", guest_pw, "Demo Explorer", datetime.utcnow().isoformat()))

    # Seed curated articles if empty
    cursor.execute("SELECT COUNT(*) FROM articles")
    if cursor.fetchone()[0] == 0:
        seed_articles = [
            (
                "How Multimodal AI Decodes Unspoken Human Emotion",
                "Dr. Elena Vance, AI Research Fellow",
                "AI & Research",
                "4 min read",
                "Why single-modality emotion detection fails on sarcasm and poker faces, and how intermediate Cross-Attention Fusion deciphers the true underlying affective state.",
                "Human emotion is inherently multifaceted. When people communicate, lexical words carry only a portion of the emotional signal. Vocal prosody—including pitch variation, speech cadence, and energy standard deviations—conveys involuntary autonomic arousal.\n\nSimultaneously, micro-expressions in facial musculature (such as subtle cheek elevation or eyebrow furrowing) provide direct insights into subconscious psychological valence.\n\nTraditional systems rely either on text NLP models (which fail completely when sarcasm or irony is used) or computer vision alone (which can be deceived by social poker faces). MindSense implements intermediate multi-head self-attention fusion to align and weigh all three modalities dynamically.",
                json.dumps(["AI", "Multimodal", "Emotion Detection", "Deep Learning"]),
                24,
                datetime.utcnow().isoformat()
            ),
            (
                "5 Evidence-Based Techniques to De-escalate Workplace Anxiety",
                "Marcus Thorne, Cognitive Behavioral Therapist",
                "Mental Wellness",
                "3 min read",
                "Practical, actionable grounding exercises and somatic breathing patterns designed to calm the sympathetic nervous system during intense work stress.",
                "When workplace stress triggers acute anxiety, the sympathetic nervous system floods the body with cortisol and adrenaline. Here are five clinically proven techniques to down-regulate your nervous system in minutes:\n\n1. 4-4-4-4 Box Breathing: Inhale for 4 seconds, hold for 4, exhale for 4, and hold empty for 4. This stimulates the vagus nerve.\n\n2. 5-4-3-2-1 Sensory Grounding: Anchor yourself by naming 5 things you see, 4 you feel, 3 you hear, 2 you smell, and 1 you taste.\n\n3. Cold Water Somatic Reset: Splash cold water on your face to trigger the mammalian dive reflex, naturally slowing your heart rate.\n\n4. Cognitive Re-labeling: Notice catastrophic thoughts without accepting them as facts. Ask: 'Is this thought helpful right now?'\n\n5. Micro-Walks: Even 3 minutes of physical movement disrupts the fight-or-flight freeze state.",
                json.dumps(["Anxiety", "Mental Health", "Mindfulness", "Grounding"]),
                41,
                datetime.utcnow().isoformat()
            ),
            (
                "The Science of Speech Emotion Recognition (SER) & 13 MFCCs",
                "Prof. Arvind Sharma, Audio DSP Engineer",
                "Speech & Acoustics",
                "5 min read",
                "A deep technical dive into Mel-Frequency Cepstral Coefficients, Hamming windowing, and how Fourier transforms capture vocal inflection.",
                "Speech Emotion Recognition (SER) relies on extracting acoustic features that reflect physiological changes in the vocal tract caused by emotional excitation.\n\nWhen a person experiences anger or high surprise, tension in the vocal folds elevates fundamental frequency (F0) and increases spectral energy in higher harmonics.\n\nTo compute 13 MFCCs:\n1. Resample audio to 16,000 Hz mono.\n2. Apply 25ms Hamming window with 10ms frame stride to prevent spectral leakage.\n3. Compute Discrete Fourier Transform (FFT) power spectrum.\n4. Map frequency bins onto a non-linear Mel-scale filterbank.\n5. Apply Discrete Cosine Transform (DCT) to yield 13 orthogonal cepstral coefficients.\n\nThese 13 coefficients serve as the acoustic fingerprint passed to our 1D Convolutional Neural Network.",
                json.dumps(["Audio", "MFCC", "Speech Emotion", "DSP"]),
                19,
                datetime.utcnow().isoformat()
            ),
            (
                "Recognizing the Subtle Signs of Chronic Fatigue & Burnout",
                "Dr. Sarah Jenkins, Occupational Health Specialist",
                "Stress & Burnout",
                "4 min read",
                "How to distinguish everyday tiredness from systemic occupational burnout, and structural strategies to recover emotional vitality.",
                "Unlike acute fatigue which resolves after a restful weekend, chronic burnout is characterized by three clinical dimensions: emotional exhaustion, depersonalization (cynicism), and a perceived lack of personal accomplishment.\n\nSubtle warning signs include:\n- Procrastinating on routine tasks that used to be easy\n- A flat, monotonic vocal delivery when answering work calls\n- Increased sensitivity to minor friction or feedback\n- Physical tension in the neck, jaw, and lower back\n\nRecovery requires setting non-negotiable availability boundaries, scheduling true disconnected downtime, and logging daily reflections to track energy trends.",
                json.dumps(["Burnout", "Wellness", "Workplace Stress", "Self Care"]),
                33,
                datetime.utcnow().isoformat()
            )
        ]
        for art in seed_articles:
            cursor.execute("""
            INSERT INTO articles (title, author, category, read_time, summary, content, tags, likes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, art)
    
    conn.commit()
    conn.close()

# ----------------- USER AUTH & PROFILE FUNCTIONS ----------------- #

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

def update_user_profile(user_id: int, name: str, email: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        UPDATE users SET name = ?, email = ? WHERE id = ?
        """, (name.strip(), email.strip().lower(), user_id))
        conn.commit()
        cursor.execute("SELECT id, username, email, name, created_at FROM users WHERE id = ?", (user_id,))
        return dict(cursor.fetchone())
    finally:
        conn.close()

def change_user_password(user_id: int, old_password: str, new_password: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        old_hash = hash_password(old_password)
        cursor.execute("SELECT id FROM users WHERE id = ? AND password_hash = ?", (user_id, old_hash))
        if not cursor.fetchone():
            return False
        new_hash = hash_password(new_password)
        cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, user_id))
        conn.commit()
        return True
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

# ----------------- ARTICLES & COMMUNITY FUNCTIONS ----------------- #

def get_articles(search: str = None, category: str = None, limit: int = 50):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        query = "SELECT * FROM articles WHERE 1=1"
        params = []
        
        if category and category != 'All':
            query += " AND category = ?"
            params.append(category)
            
        if search and search.strip():
            query += " AND (title LIKE ? OR summary LIKE ? OR content LIKE ? OR tags LIKE ?)"
            s_param = f"%{search.strip()}%"
            params.extend([s_param, s_param, s_param, s_param])
            
        query += " ORDER BY id DESC LIMIT ?"
        params.append(limit)
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        articles = []
        for row in rows:
            art = dict(row)
            try:
                art["tags"] = json.loads(art["tags"])
            except:
                art["tags"] = [t.strip() for t in art["tags"].split(",") if t.strip()]
            articles.append(art)
        return articles
    finally:
        conn.close()

def create_article(title: str, author: str, category: str, summary: str, content: str, tags: list, user_id: int = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        created_at = datetime.utcnow().isoformat()
        # Calculate estimated read time
        word_count = len(content.split())
        read_time = f"{max(1, round(word_count / 200))} min read"
        tags_json = json.dumps(tags)
        
        cursor.execute("""
        INSERT INTO articles (user_id, title, author, category, read_time, summary, content, tags, likes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
        """, (user_id, title.strip(), author.strip(), category.strip(), read_time, summary.strip(), content.strip(), tags_json, created_at))
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()

def like_article(article_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE articles SET likes = likes + 1 WHERE id = ?", (article_id,))
        conn.commit()
        cursor.execute("SELECT likes FROM articles WHERE id = ?", (article_id,))
        row = cursor.fetchone()
        return row[0] if row else 0
    finally:
        conn.close()

def delete_article(article_id: int, user_id: int = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if user_id:
            cursor.execute("DELETE FROM articles WHERE id = ? AND user_id = ?", (article_id, user_id))
        else:
            cursor.execute("DELETE FROM articles WHERE id = ?", (article_id,))
        conn.commit()
        return cursor.rowcount > 0
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
        
        cursor.execute(f"SELECT COUNT(*) FROM analyses {user_clause}", params)
        total_analyses = cursor.fetchone()[0]
        
        cursor.execute(f"SELECT final_emotion, COUNT(*) as count FROM analyses {user_clause} GROUP BY final_emotion", params)
        emotion_counts = {row["final_emotion"]: row["count"] for row in cursor.fetchall()}
        
        cursor.execute(f"SELECT * FROM analyses {user_clause} ORDER BY timestamp DESC LIMIT 1", params)
        latest_row = cursor.fetchone()
        latest_analysis = dict(latest_row) if latest_row else None
        if latest_analysis:
            latest_analysis["modalities_used"] = json.loads(latest_analysis["modalities_used"])
            latest_analysis["is_demo"] = bool(latest_analysis["is_demo"])
            
            cursor.execute("SELECT modality, emotion, confidence FROM modality_results WHERE analysis_id = ?", (latest_analysis["id"],))
            mod_rows = cursor.fetchall()
            latest_analysis["modality_predictions"] = {row["modality"]: {"emotion": row["emotion"], "confidence": row["confidence"]} for row in mod_rows}

        cursor.execute(f"SELECT modalities_used FROM analyses {user_clause}", params)
        modality_freqs = {"text": 0, "audio": 0, "image": 0}
        for row in cursor.fetchall():
            mods = json.loads(row["modalities_used"])
            for m in mods:
                if m in modality_freqs:
                    modality_freqs[m] += 1
                    
        cursor.execute(f"SELECT timestamp, feeling_score, energy_score, sleep_score, stress_score FROM daily_checkins {user_clause} ORDER BY timestamp ASC LIMIT 10", params)
        checkin_trends = [dict(row) for row in cursor.fetchall()]
        
        cursor.execute(f"SELECT timestamp, final_emotion, confidence_score FROM analyses {user_clause} ORDER BY timestamp DESC LIMIT 10", params)
        historic_trends = [dict(row) for row in cursor.fetchall()]

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
