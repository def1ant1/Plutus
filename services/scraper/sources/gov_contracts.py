# crm_marketing_scraping/services/scraper/sources/gov_contracts.py
import os, httpx
from typing import Dict, Any, List
from common.logging import log

async def fetch_awards(src: Dict[str, Any]) -> List[dict]:
    """Fetch awarded opportunities via official API when available (SAM.gov example).
    Expects an API key in env var specified by `api_key_env`.
    """

    base = src.get("base_url")
    params = src.get("params", {}).copy()
    key = os.getenv(src.get("api_key_env","SAM_API_KEY"), None)
    if key:
        params["api_key"] = key
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(base, params=params)
        r.raise_for_status()
        data = r.json()
        leads = []
        for item in data.get("opportunitiesData", []):
            firm = item.get("awardee","Unknown Firm")
            email = item.get("contactEmail") or None
            if not email: 
                continue
            leads.append({"email": email, "company": firm, "source": "gov_award", "attributes": {"noticeId": item.get("noticeId")}})
        log.info(f"Fetched {len(leads)} award leads from gov API {base}")
        return leads
