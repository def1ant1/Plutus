# crm_marketing_scraping/services/scraper/sources/business_directory.py
from bs4 import BeautifulSoup
import httpx, asyncio
from typing import Dict, Any, List
from common.config import settings
from common.logging import log

async def scrape_directory(src: Dict[str, Any]) -> List[dict]:
    """Scrape a simple HTML listing page using CSS selectors.
    Use only on sites that permit crawling (respect robots.txt off-path).
    """

    headers = {"User-Agent": settings.user_agent}
    url = src["url"]
    throttle = float(src.get("throttle_ms", 1000))/1000.0
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(url, headers=headers)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "lxml")
        rows = soup.select(src["css_selectors"]["row"]) if src.get("css_selectors") else []
        leads = []
        for row in rows:
            company_el = row.select_one(src["css_selectors"].get("company",""))
            company = company_el.get_text(strip=True) if company_el else None
            email_el = row.select_one(src["css_selectors"].get("email",""))
            email = email_el.get("href","").replace("mailto:","") if email_el else None
            if not email: 
                continue
            leads.append({"email": email, "company": company, "source": "business_directory", "attributes": {"directory": src.get("name")}})
        await asyncio.sleep(throttle)
        log.info(f"Scraped {len(leads)} leads from {url}")
        return leads
