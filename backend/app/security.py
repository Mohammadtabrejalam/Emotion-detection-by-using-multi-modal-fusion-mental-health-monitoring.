"""Password storage and deployment configuration; no hard-coded credentials."""
import hashlib
import hmac
import os
import secrets
from pathlib import Path


def hash_password(password):
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), 600000).hex()
    return f'pbkdf2_sha256$600000${salt}${digest}'


def verify_password(password, stored):
    try:
        if stored.startswith('pbkdf2_sha256$'):
            _, count, salt, expected = stored.split('$')
            actual = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), int(count)).hex()
            return hmac.compare_digest(expected, actual)
        # Read-only compatibility; successful legacy logins migrate immediately.
        return hmac.compare_digest(hashlib.sha256(password.encode()).hexdigest(), stored)
    except (ValueError, TypeError):
        return False


def signing_key(database_path):
    key = os.environ.get('JWT_SECRET_KEY', '')
    if key:
        if len(key) < 32:
            raise RuntimeError('JWT_SECRET_KEY must contain at least 32 characters.')
        return key
    if os.environ.get('ENVIRONMENT') == 'production':
        raise RuntimeError('Set a strong JWT_SECRET_KEY before starting in production.')
    path = Path(database_path).resolve().parent/'.mindsense-signing-key'
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError:
        return path.read_text().strip()
    with os.fdopen(fd, 'w') as handle:
        key = secrets.token_hex(32)
        handle.write(key)
    return key
