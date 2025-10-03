# crm_marketing_scraping/common/schemas.py
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Dict, Any

class LeadEvent(BaseModel):
    email: EmailStr
    company: Optional[str] = None
    source: str = Field(default="webscrape")
    attributes: Dict[str, Any] = Field(default_factory=dict)

class CrmUpserted(BaseModel):
    email: EmailStr
    salesforce_lead_id: Optional[str] = None
    hubspot_contact_id: Optional[str] = None
    attributes: Dict[str, Any] = Field(default_factory=dict)

class MarketingEvent(BaseModel):
    email: EmailStr
    campaign: str
    variant: str
    info: Dict[str, Any] = Field(default_factory=dict)
