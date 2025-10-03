# crm_marketing_scraping/services/common/producer.py
from confluent_kafka import Producer
from common.config import settings
import json

def _delivery(err, msg):
    if err:
        print(f"Delivery failed: {err}")

def get_producer():
    conf = {
        "bootstrap.servers": settings.kafka_bootstrap,
        "client.id": settings.kafka_client_id,
        "enable.idempotence": True,
        "linger.ms": 10,
        "acks": "all",
    }
    return Producer(conf)

def publish(topic: str, payload: dict):
    p = get_producer()
    p.produce(topic, json.dumps(payload).encode("utf-8"), callback=_delivery)
    p.flush(5)
