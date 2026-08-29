import re

# A small pre-defined vocabulary for emotion detection to avoid downloading heavy tokenizers.
# Maps common English words and emotional cues to indices.
VOCAB = {
    "<pad>": 0,
    "<unk>": 1,
    "i": 2, "me": 3, "my": 4, "myself": 5, "we": 6, "our": 7, "ours": 8, "you": 9, "your": 10,
    "he": 11, "him": 12, "his": 13, "she": 14, "her": 15, "it": 16, "they": 17, "them": 18,
    "am": 19, "is": 20, "are": 21, "was": 22, "were": 23, "be": 24, "been": 25, "have": 26, "has": 27, "had": 28,
    "do": 29, "does": 30, "did": 31, "but": 32, "and": 33, "or": 34, "if": 35, "because": 36, "as": 37, "until": 38,
    "while": 39, "of": 40, "at": 41, "by": 42, "for": 43, "with": 44, "about": 45, "against": 46, "between": 47,
    "into": 48, "through": 49, "during": 50, "before": 51, "after": 52, "above": 53, "below": 54, "to": 55, "from": 56,
    "up": 57, "down": 58, "in": 59, "out": 60, "on": 61, "off": 62, "over": 63, "under": 64, "again": 65, "further": 66,
    "then": 67, "once": 68, "here": 69, "there": 70, "when": 71, "where": 72, "why": 73, "how": 74, "all": 75, "any": 76,
    "both": 77, "each": 78, "few": 79, "more": 80, "most": 81, "other": 82, "some": 83, "such": 84, "no": 85, "nor": 86,
    "not": 87, "only": 88, "own": 89, "same": 90, "so": 91, "than": 92, "too": 93, "very": 94, "s": 95, "t": 96,
    "can": 97, "will": 98, "just": 99, "don": 100, "should": 101, "now": 102,
    
    # Emotional tokens
    "happy": 200, "joy": 201, "glad": 202, "excited": 203, "cheerful": 204, "smile": 205, "smiling": 206, "love": 207,
    "great": 208, "good": 209, "wonderful": 210, "delighted": 211, "awesome": 212, "positive": 213, "calm": 214, "peace": 215,
    "sad": 220, "sorrow": 221, "cry": 222, "crying": 223, "depressed": 224, "lonely": 225, "hurt": 226, "grief": 227,
    "pain": 228, "empty": 229, "tired": 230, "exhausted": 231, "hopeless": 232, "heavy": 233, "unhappy": 234, "blue": 235,
    "angry": 240, "mad": 241, "rage": 242, "furious": 243, "annoyed": 244, "frustrated": 245, "hate": 246, "irritated": 247,
    "offended": 248, "bitter": 249, "anger": 250, "dislike": 251, "shout": 252, "scream": 253, "spite": 254,
    "fear": 260, "scared": 261, "afraid": 262, "frightened": 263, "terrified": 264, "anxious": 265, "nervous": 266, "panic": 267,
    "worry": 268, "worried": 269, "stress": 270, "stressed": 271, "dread": 272, "horror": 273, "threat": 274, "alarm": 275,
    "surprise": 280, "surprised": 281, "shocked": 282, "amazing": 283, "sudden": 284, "unexpected": 285, "wonder": 286,
    "disgust": 290, "disgusted": 291, "gross": 292, "nasty": 293, "revolting": 294, "sick": 295, "yuck": 296, "hatefully": 297,
    "neutral": 300, "fine": 301, "okay": 302, "normal": 303, "average": 304, "usual": 305, "regular": 306,
    
    # Mental health warning keywords (for safety monitoring)
    "suicide": 400, "kill myself": 401, "end my life": 402, "self-harm": 403, "die": 404, "hurting myself": 405,
    "overdose": 406, "want to die": 407, "hang myself": 408
}

def clean_text(text: str) -> str:
    # Lowercase, strip punctuation and extra spaces
    text = text.lower()
    text = re.sub(r"[^\w\s\-\']", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def tokenize(text: str, max_length: int = 64) -> list:
    cleaned = clean_text(text)
    words = cleaned.split()
    
    token_ids = []
    for word in words:
        # Check phrase match first (like "kill myself")
        # For simplicity, we just check word by word here, but we can do a quick check
        if word in VOCAB:
            token_ids.append(VOCAB[word])
        else:
            token_ids.append(VOCAB["<unk>"])
            
    # Pad or truncate
    if len(token_ids) < max_length:
        token_ids += [VOCAB["<pad>"]] * (max_length - len(token_ids))
    else:
        token_ids = token_ids[:max_length]
        
    return token_ids

def check_crisis_keywords(text: str) -> bool:
    cleaned = clean_text(text)
    crisis_phrases = [
        "suicide", "kill myself", "end my life", "self-harm", "hurting myself",
        "want to die", "hang myself", "commit suicide", "cut myself"
    ]
    for phrase in crisis_phrases:
        if phrase in cleaned:
            return True
    return False
