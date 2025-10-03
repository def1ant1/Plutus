# crm_marketing_scraping/services/scraper/main.py
import asyncio, yaml
from common.logging import log
from common.config import settings
from services.common.producer import publish
from services.scraper.sources.business_directory import scrape_directory
from services.scraper.sources.gov_contracts import fetch_awards

async def run():
    with open(settings.sources_yaml, 'r', encoding='utf-8') as f:
        cfg = yaml.safe_load(f)
    # Business directories (HTML)
    for src in cfg.get('business_directories', []):
        try:
            for lead in await scrape_directory(src):
                publish('lead.scraped', lead)
        except Exception as e:
            log.error(f"Directory scrape failed {src.get('name')}: {e}")
    # Gov contracts (API-first)
    for src in cfg.get('gov_contracts', []):
        try:
            for lead in await fetch_awards(src):
                publish('lead.scraped', lead)
        except Exception as e:
            log.error(f"Gov scrape failed {src.get('name')}: {e}")

if __name__ == '__main__':
    log.info("Starting Scraper…")
    asyncio.run(run())
