# crm_marketing_scraping/common/logging.py
from loguru import logger
import sys, os

def setup_logging(level: str = None):
    logger.remove()
    lvl = level or os.getenv("LOG_LEVEL", "INFO")
    logger.add(sys.stderr, level=lvl, backtrace=False, diagnose=False, format="{time} | {level} | {level.icon} | {message}")
    return logger

log = setup_logging()
