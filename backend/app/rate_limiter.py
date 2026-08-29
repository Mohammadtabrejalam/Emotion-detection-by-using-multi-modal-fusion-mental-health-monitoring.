import time
from collections import defaultdict
from fastapi import Request, HTTPException

class SlidingWindowRateLimiter:
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.window_size = 60  # seconds
        self.history = defaultdict(list)

    def check_rate_limit(self, request: Request, endpoint_key: str = "global", limit: int = None):
        max_reqs = limit if limit is not None else self.requests_per_minute
        client_ip = request.client.host if request.client else "127.0.0.1"
        key = f"{client_ip}:{endpoint_key}"
        now = time.time()
        
        # Clean timestamps older than window
        timestamps = self.history[key]
        self.history[key] = [t for t in timestamps if now - t < self.window_size]
        
        if len(self.history[key]) >= max_reqs:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please wait a minute before making further requests."
            )
            
        self.history[key].append(now)

rate_limiter = SlidingWindowRateLimiter(requests_per_minute=60)
