# crm_marketing_scraping/services/crm_sync/main.py
from common.logging import log
from common.schemas import LeadEvent, CrmUpserted
from services.common.consumer import stream_json
from services.common.producer import publish
from integrations.crm.salesforce import SalesforceCRM
from integrations.crm.hubspot import HubSpotCRM

sf = SalesforceCRM()
hs = HubSpotCRM()

def handle(evt: dict):
    lead = LeadEvent(**evt)
    out = {"email": lead.email, "attributes": lead.attributes}
    try:
        r1 = sf.upsert_lead(lead.email, lead.company, {"source": lead.source, **lead.attributes})
        out.update(r1)
    except Exception as e:
        log.warning(f"SF upsert failed for {lead.email}: {e}")
    try:
        r2 = hs.upsert_lead(lead.email, lead.company, {"source": lead.source, **lead.attributes})
        out.update(r2)
    except Exception as e:
        log.warning(f"HS upsert failed for {lead.email}: {e}")
    publish("crm.upserted", CrmUpserted(**out).model_dump())
    return True

if __name__ == "__main__":
    log.info("Starting CRM Sync…")
    stream_json("crm-sync", ["lead.scraped"], handle)
