# crm_marketing_scraping/services/marketing/campaign_orchestrator.py
from common.logging import log
from common.config import settings
from common.schemas import MarketingEvent, CrmUpserted
from services.common.consumer import stream_json
from services.common.producer import publish
from services.marketing.ab_tester import assign_variant
from integrations.crm.hubspot import HubSpotCRM

def handle(evt: dict):
    data = CrmUpserted(**evt)
    variant = assign_variant(data.email, settings.default_campaign, ["A","B"])
    me = MarketingEvent(email=data.email, campaign=settings.default_campaign, variant=variant, info={"crm": evt})
    log.info(f"Assign variant {variant} to {data.email}")
    publish("marketing.event", me.model_dump())
    # Enrich timeline in HubSpot for traceability
    try:
        hs = HubSpotCRM()
        hs.add_timeline_event(data.email, f"Enrolled in {settings.default_campaign}", {"variant": variant})
    except Exception as e:
        log.warning(f"HubSpot timeline failed: {e}")
    return True

if __name__ == "__main__":
    log.info("Starting Marketing Orchestrator…")
    stream_json("mkt-orchestrator", ["crm.upserted"], handle)
