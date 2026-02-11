"""
RSA MVP Enhanced — ATS Webhook Router
=======================================
Provides webhook integration for Applicant Tracking Systems.
"""

import logging
import hmac
import hashlib
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.models.webhook import WebhookLog

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/webhooks", tags=["Webhooks"])


class WebhookService:
    """Handles sending and receiving webhook notifications."""
    
    @staticmethod
    async def send_notification(event_type: str, payload: dict, db: Session = None) -> bool:
        url = settings.ATS_WEBHOOK_URL
        if not url:
            logger.debug(f"Webhook skipped (no URL configured): {event_type}")
            return False
        
        signature = WebhookService._sign_payload(json.dumps(payload))
        headers = {
            "Content-Type": "application/json",
            "X-Webhook-Event": event_type,
            "X-Webhook-Signature": signature,
        }
        
        try:
            import httpx
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload, headers=headers)
            
            if db:
                log = WebhookLog(
                    event_type=event_type, payload=payload,
                    response_status=response.status_code,
                    response_body=response.text[:1000],
                )
                db.add(log)
                db.commit()
            
            return 200 <= response.status_code < 300
        except Exception as e:
            logger.error(f"Webhook delivery failed: {e}")
            if db:
                log = WebhookLog(event_type=event_type, payload=payload, error=str(e))
                db.add(log)
                db.commit()
            return False
    
    @staticmethod
    def _sign_payload(payload_str: str) -> str:
        secret = settings.ATS_WEBHOOK_SECRET or "default-secret"
        return hmac.new(secret.encode(), payload_str.encode(), hashlib.sha256).hexdigest()
    
    @staticmethod
    def verify_signature(payload: str, signature: str) -> bool:
        expected = WebhookService._sign_payload(payload)
        return hmac.compare_digest(expected, signature)


@router.post("/ats/notify")
async def send_ats_notification(event_type: str, payload: dict, db: Session = Depends(get_db)):
    """Manually trigger an ATS webhook notification."""
    success = await WebhookService.send_notification(event_type=event_type, payload=payload, db=db)
    return {"success": success, "event_type": event_type}


@router.post("/ats/receive")
async def receive_ats_webhook(request: Request, db: Session = Depends(get_db)):
    """Receive incoming webhooks from ATS systems."""
    body = await request.body()
    signature = request.headers.get("X-Webhook-Signature", "")
    
    if settings.ATS_WEBHOOK_SECRET and not WebhookService.verify_signature(body.decode(), signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")
    
    payload = await request.json()
    event_type = request.headers.get("X-Webhook-Event", "unknown")
    
    log = WebhookLog(event_type=f"received:{event_type}", payload=payload, response_status=200)
    db.add(log)
    db.commit()
    
    return {"status": "received", "event_type": event_type}


@router.get("/ats/logs")
async def get_webhook_logs(limit: int = 50, db: Session = Depends(get_db)):
    """Get recent webhook delivery logs."""
    logs = db.query(WebhookLog).order_by(WebhookLog.created_at.desc()).limit(limit).all()
    return [
        {
            "id": str(log.id),
            "event_type": log.event_type,
            "response_status": log.response_status,
            "error": log.error,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]
