# crm_marketing_scraping/services/common/consumer.py
from confluent_kafka import Consumer
from common.config import settings
import json

def get_consumer(group_id: str, topics: list[str]):
    conf = {
        "bootstrap.servers": settings.kafka_bootstrap,
        "group.id": group_id,
        "auto.offset.reset": "earliest",
        "enable.auto.commit": False,
    }
    c = Consumer(conf)
    c.subscribe(topics)
    return c

def stream_json(group_id: str, topics: list[str], handler):
    c = get_consumer(group_id, topics)
    try:
        while True:
            msg = c.poll(1.0)
            if msg is None: 
                continue
            if msg.error():
                print(f"Kafka error: {msg.error()}")
                continue
            data = json.loads(msg.value())
            if handler(data) is not False:
                c.commit(asynchronous=False)
    except KeyboardInterrupt:
        pass
    finally:
        c.close()
