"""
Aapda Mitra AI - FastAPI REST API Router
Unified endpoint for intelligent disaster copilot interactions.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import logging

from backend.app.aapda_mitra.aapda_mitra_config import DEFAULT_PROMPT_CHIPS, DEFAULT_OPENROUTER_MODEL
from backend.app.aapda_mitra.openrouter_client import openrouter_client
from backend.app.aapda_mitra.deterministic_engine import deterministic_engine

logger = logging.getLogger("aapda_mitra.router")

router = APIRouter(prefix="/api/aapda-mitra", tags=["Aapda Mitra AI"])

class ChatRequest(BaseModel):
    message: str = Field(..., description="User question or prompt for Aapda Mitra AI")
    dashboard_context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Active village telemetry and dashboard snapshot")
    history: Optional[List[Dict[str, str]]] = Field(default_factory=list, description="Recent conversation turns")
    language: Optional[str] = Field(default="en", description="Target language filter: 'en' (English), 'hi' (Hindi), or 'bilingual' (Hinglish/Mix)")

class ChatResponse(BaseModel):
    status: str
    reply: str
    engine_used: str
    model_name: Optional[str] = None
    is_emergency: bool = False
    language_used: Optional[str] = "en"

@router.get("/status")
def get_aapda_mitra_status():
    """Returns the operational status of Aapda Mitra AI and configured prompt chips."""
    has_key = openrouter_client.is_configured()
    return {
        "status": "online",
        "name": "Aapda Mitra AI (आपदा मित्र)",
        "openrouter_configured": has_key,
        "active_model": DEFAULT_OPENROUTER_MODEL if has_key else "deterministic_offline_engine",
        "quick_chips": DEFAULT_PROMPT_CHIPS
    }

@router.post("/chat", response_model=ChatResponse)
def chat_with_aapda_mitra(req: ChatRequest):
    """
    Main chat endpoint for Aapda Mitra AI.
    1. Guardrail check: Refuse off-topic questions in the chosen language.
    2. Try OpenRouter LLM with full dashboard grounding and language directive.
    3. Fallback seamlessly to Deterministic Engine if no key, network drops, or rate limit.
    """
    msg = req.message.strip()
    if not msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    ctx = req.dashboard_context or {}
    lang = req.language or "en"

    # 1. Strict Domain Guardrail: Refuse off-topic questions immediately
    if deterministic_engine.is_off_topic(msg):
        refusal = deterministic_engine.generate_response(msg, ctx, language=lang)
        return ChatResponse(
            status="success",
            reply=refusal,
            engine_used="guardrail_refusal",
            model_name="domain_guardrail",
            is_emergency=False,
            language_used=lang
        )

    # 2. Try OpenRouter Cloud Model if configured
    if openrouter_client.is_configured():
        try:
            llm_reply = openrouter_client.generate_chat_response(
                user_message=msg,
                dashboard_context=ctx,
                conversation_history=req.history,
                language=lang
            )
            if llm_reply:
                is_emerg = any(term in llm_reply.lower() for term in ["evacuate", "warning", "critical", "danger", "आपातकालीन", "तुरंत", "खतरा"])
                return ChatResponse(
                    status="success",
                    reply=llm_reply,
                    engine_used="openrouter_cloud",
                    model_name=DEFAULT_OPENROUTER_MODEL,
                    is_emergency=is_emerg,
                    language_used=lang
                )
        except Exception as e:
            logger.warning(f"OpenRouter query exception: {str(e)}. Switching to deterministic engine.")

    # 3. Deterministic Grounded Fallback Engine
    fallback_reply = deterministic_engine.generate_response(msg, ctx, language=lang)
    is_emerg = ctx.get("risk_percentage", 0) >= 51
    return ChatResponse(
        status="success",
        reply=fallback_reply,
        engine_used="deterministic_fallback",
        model_name="deterministic_offline_rules",
        is_emergency=is_emerg,
        language_used=lang
    )
