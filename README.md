# Plutus

This package provides production-ready scaffolding for:
- Web **scraping** of business directories and government contract awards (API-first where available).
- **CRM sync** with Salesforce and HubSpot (create/update Leads/Contacts, timeline events).
- **Marketing automation**: list management, A/B assignment, workflow enrollment (HubSpot-first), optional direct email provider port.
- Stream-first eventing via **Kafka/Redpanda** topics: `lead.scraped`, `crm.upserted`, `marketing.event`.

## Quick start (local)
1. Copy `.env.example` to `.env` and fill credentials.
2. `docker compose up -d` (starts Redpanda + Redis).
3. In three shells, run:
   ```bash
   # Scraper
   python -m services.scraper.main
   # CRM Sync
   python -m services.crm_sync.main
   # Marketing Orchestrator
   python -m services.marketing.campaign_orchestrator
   ```

## Topics
- `lead.scraped` → payload conforms to `common/schemas.py::LeadEvent`.
- `crm.upserted` → CRM IDs + dedupe markers.
- `marketing.event` → A/B arm, list/workflow actions.

## Compliance
- Robots.txt respected; per-source crawl budgets and backoff.
- PII minimized; emails hashed for dedupe, full PII sent directly to CRM over TLS; no plaintext PII in logs.
- Consent/opt-out respected; HubSpot/Salesforce suppression lists honored.
