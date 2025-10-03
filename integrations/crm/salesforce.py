# crm_marketing_scraping/integrations/crm/salesforce.py
import requests, json
from typing import Optional, Dict, Any
from common.config import settings

class SalesforceCRM:
    def __init__(self):
        self.base = settings.sf_base_url.rstrip('/')
        self.api = settings.sf_api_version
        self._token = None
        self._instance = None

    def _get_token(self):
        if self._token:
            return self._token
        # Username-password OAuth flow (service account). Prefer JWT/OIDC in prod.
        url = f"{self.base}/services/oauth2/token"
        data = {
            "grant_type": "password",
            "client_id": settings.sf_client_id,
            "client_secret": settings.sf_client_secret,
            "username": settings.sf_username,
            "password": settings.sf_password + settings.sf_security_token
        }
        r = requests.post(url, data=data, timeout=10)
        r.raise_for_status()
        js = r.json()
        self._token = js["access_token"]
        self._instance = js["instance_url"]
        return self._token

    def _headers(self):
        return {"Authorization": f"Bearer {self._get_token()}", "Content-Type": "application/json"}

    def upsert_lead(self, email: str, company: Optional[str], attributes: Dict[str, Any]) -> Dict[str, Any]:
        soql = f"SELECT Id, Email FROM Lead WHERE Email='{email}' LIMIT 1"
        r = requests.get(f"{self._instance}/services/data/{self.api}/query/", params={"q": soql}, headers=self._headers(), timeout=10)
        r.raise_for_status()
        records = r.json().get("records", [])
        payload = {"Company": company or attributes.get("company","Unknown"), "Email": email, "Status": "Open - Not Contacted", "LeadSource": attributes.get("source","Web")}
        if records:
            lead_id = records[0]["Id"]
            ru = requests.patch(f"{self._instance}/services/data/{self.api}/sobjects/Lead/{lead_id}", headers=self._headers(), data=json.dumps(payload), timeout=10)
            ru.raise_for_status()
            return {"salesforce_lead_id": lead_id, "updated": True}
        else:
            rc = requests.post(f"{self._instance}/services/data/{self.api}/sobjects/Lead", headers=self._headers(), data=json.dumps(payload), timeout=10)
            rc.raise_for_status()
            return {"salesforce_lead_id": rc.json()["id"], "created": True}

    def add_timeline_event(self, email: str, event: str, properties: Dict[str, Any]) -> None:
        soql = f"SELECT Id FROM Lead WHERE Email='{email}' LIMIT 1"
        r = requests.get(f"{self._instance}/services/data/{self.api}/query/", params={"q": soql}, headers=self._headers(), timeout=10)
        r.raise_for_status()
        recs = r.json().get("records", [])
        if not recs: 
            return
        lead_id = recs[0]["Id"]
        task = {"Subject": event, "WhoId": lead_id, "Description": json.dumps(properties)[:32000]}
        rt = requests.post(f"{self._instance}/services/data/{self.api}/sobjects/Task", headers=self._headers(), data=json.dumps(task), timeout=10)
        rt.raise_for_status()
