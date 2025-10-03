# crm_marketing_scraping/integrations/crm/hubspot.py
import requests, json
from typing import Optional, Dict, Any
from common.config import settings

class HubSpotCRM:
    def __init__(self):
        self.base = settings.hs_base_url.rstrip('/')
        self.token = settings.hs_access_token

    def _h(self):
        return {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}

    def upsert_lead(self, email: str, company: Optional[str], attributes: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base}/crm/v3/objects/contacts"
        data = {
            "properties": {
                "email": email,
                "company": company or attributes.get("company"),
                "plutus_source": attributes.get("source","webscrape")
            }
        }
        r = requests.post(url, headers=self._h(), data=json.dumps(data), timeout=10)
        if r.status_code == 409:
            search = {"filterGroups":[{"filters":[{"propertyName":"email","operator":"EQ","value":email}]}]}
            s = requests.post(f"{self.base}/crm/v3/objects/contacts/search", headers=self._h(), data=json.dumps(search), timeout=10).json()
            cid = s.get("results",[{}])[0].get("id")
            if cid:
                u = requests.patch(f"{self.base}/crm/v3/objects/contacts/{cid}", headers=self._h(), data=json.dumps(data), timeout=10)
                u.raise_for_status()
                return {"hubspot_contact_id": cid, "updated": True}
        r.raise_for_status()
        return {"hubspot_contact_id": r.json().get("id"), "created": True}

    def add_timeline_event(self, email: str, event: str, properties: Dict[str, Any]) -> None:
        search = {"filterGroups":[{"filters":[{"propertyName":"email","operator":"EQ","value":email}]}]}
        s = requests.post(f"{self.base}/crm/v3/objects/contacts/search", headers=self._h(), data=json.dumps(search), timeout=10).json()
        cid = s.get("results",[{}])[0].get("id")
        if not cid: 
            return
        note = {"properties": {"hs_note_body": f"{event}: {json.dumps(properties)[:3000]}"}}
        n = requests.post(f"{self.base}/crm/v3/objects/notes", headers=self._h(), data=json.dumps(note), timeout=10).json()
        requests.put(f"{self.base}/crm/v4/objects/notes/{n.get('id')}/associations/contacts/{cid}/note_to_contact", headers=self._h(), timeout=10)
