# crm_marketing_scraping/common/http.py
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

class HttpError(Exception): pass

@retry(
    reraise=True,
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=0.5, max=4),
    retry=retry_if_exception_type(HttpError)
)
async def get_json(url: str, headers: dict = None, params: dict = None, timeout: float = 10.0):
    async with httpx.AsyncClient(timeout=timeout) as client:
        r = await client.get(url, headers=headers, params=params)
        if r.status_code >= 400:
            raise HttpError(f"{r.status_code} {r.text}")
        return r.json()
