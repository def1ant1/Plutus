# crm_marketing_scraping/services/marketing/ab_tester.py
import hashlib

def assign_variant(email: str, campaign: str, arms: list[str] = None) -> str:
    """Deterministic hash-based A/B arm assignment."""

    arms = arms or ["A", "B"]
    h = hashlib.sha256(f"{campaign}:{email}".encode()).hexdigest()
    idx = int(h, 16) % len(arms)
    return arms[idx]
