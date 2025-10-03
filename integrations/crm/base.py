# crm_marketing_scraping/integrations/crm/base.py
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any

class ICrm(ABC):
    @abstractmethod
    def upsert_lead(self, email: str, company: Optional[str], attributes: Dict[str, Any]) -> Dict[str, Any]:
        ...

    @abstractmethod
    def add_timeline_event(self, email: str, event: str, properties: Dict[str, Any]) -> None:
        ...
