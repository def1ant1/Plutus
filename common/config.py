# crm_marketing_scraping/common/config.py
from pydantic import BaseModel
import os

class Settings(BaseModel):
    env: str = os.getenv("ENV", "dev")
    kafka_bootstrap: str = os.getenv("KAFKA_BOOTSTRAP", "localhost:19092")
    kafka_client_id: str = os.getenv("KAFKA_CLIENT_ID", "plutus-crm-mkt")
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    sf_base_url: str = os.getenv("SF_BASE_URL", "")
    sf_client_id: str = os.getenv("SF_CLIENT_ID", "")
    sf_client_secret: str = os.getenv("SF_CLIENT_SECRET", "")
    sf_username: str = os.getenv("SF_USERNAME", "")
    sf_password: str = os.getenv("SF_PASSWORD", "")
    sf_security_token: str = os.getenv("SF_SECURITY_TOKEN", "")
    sf_api_version: str = os.getenv("SF_API_VERSION", "v60.0")
    hs_base_url: str = os.getenv("HS_BASE_URL", "https://api.hubapi.com")
    hs_access_token: str = os.getenv("HS_ACCESS_TOKEN", "")
    sendgrid_api_key: str = os.getenv("SENDGRID_API_KEY", "")
    sources_yaml: str = os.getenv("SOURCES_YAML", "configs/sources.yaml")
    user_agent: str = os.getenv("SCRAPER_USER_AGENT", "PlutusBot/1.0")
    default_campaign: str = os.getenv("DEFAULT_CAMPAIGN", "default")

settings = Settings()
