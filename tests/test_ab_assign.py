# crm_marketing_scraping/tests/test_ab_assign.py
from services.marketing.ab_tester import assign_variant

def test_deterministic():
    a1 = assign_variant("user@example.com", "campaign-x")
    a2 = assign_variant("user@example.com", "campaign-x")
    assert a1 == a2
