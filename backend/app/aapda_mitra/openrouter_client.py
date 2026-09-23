"""
OpenRouter API Client for Aapda Mitra AI
Connects to high-performance free LLM models on OpenRouter with automated model fallback.
"""

import os
import json
import logging
import requests
from dotenv import load_dotenv
from typing import Dict, Any, List, Optional

load_dotenv()

from backend.app.aapda_mitra.aapda_mitra_config import (
    DEFAULT_OPENROUTER_MODEL,
    FALLBACK_MODELS,
    AAPDA_MITRA_SYSTEM_PROMPT
)

logger = logging.getLogger("aapda_mitra.openrouter")

class OpenRouterClient:
    def __init__(self):
        load_dotenv()
        self.api_url = "https://openrouter.ai/api/v1/chat/completions"
        self.timeout_sec = 14.0

    @property
    def api_key(self) -> str:
        return os.getenv("OPENROUTER_API_KEY", "").strip()

    def is_configured(self) -> bool:
        """Returns True if a non-empty OpenRouter API key is found."""
        return bool(self.api_key and not self.api_key.startswith("your_"))

    def generate_chat_response(
        self,
        user_message: str,
        dashboard_context: Dict[str, Any],
        conversation_history: Optional[List[Dict[str, str]]] = None,
        language: str = "en"
    ) -> Optional[str]:
        """
        Sends formatted system prompt + dashboard state + user query to OpenRouter.
        Cycles through fallback models if primary model is rate-limited or unavailable.
        """
        if not self.is_configured():
            logger.info("OpenRouter API key not configured. Using deterministic engine.")
            return None

        # Build language constraint instruction
        if language == "hi":
            lang_instruction = (
                "CRITICAL MANDATORY LANGUAGE DIRECTIVE: The user has selected the HINDI language filter. "
                "You MUST formulate your ENTIRE response strictly and 100% in HINDI (हिन्दी - देवनागरी लिपि). "
                "Do NOT use English except for technical sensor IDs. Use clear, authoritative Hindi disaster terminology "
                "(जैसे: सुरक्षित शरण स्थल, निकासी मार्ग, जल स्तर, खतरा स्तर, समय सीमा)."
            )
        elif language == "bilingual":
            lang_instruction = (
                "CRITICAL MANDATORY LANGUAGE DIRECTIVE: The user has selected the BILINGUAL (Hinglish/Mix) language filter. "
                "You MUST provide a natural, balanced bilingual combination of Hindi and English. "
                "Provide Hindi (देवनागरी) headings and executive summaries, paired with clear English technical bullet points."
            )
        else:
            lang_instruction = (
                "CRITICAL MANDATORY LANGUAGE DIRECTIVE: The user has selected the ENGLISH language filter. "
                "You MUST formulate your ENTIRE response strictly and 100% in clean, professional ENGLISH. "
                "Do NOT mix in Hindi words or Devanagari script."
            )

        # Build context grounding string
        context_str = json.dumps(dashboard_context, indent=2, ensure_ascii=False)
        grounding_message = f"""
[ACTIVE REAL-TIME DASHBOARD SNAPSHOT]
The user is currently looking at this live data on the VIGIL-FLOOD dashboard screen:
```json
{context_str}
```
Instructions:
1. {lang_instruction}
2. Answer the user's question directly, citing the exact numbers, shelter names, and routes from the snapshot above.
"""

        messages = [
            {"role": "system", "content": AAPDA_MITRA_SYSTEM_PROMPT},
            {"role": "system", "content": grounding_message}
        ]

        # Add recent conversation turns if provided
        if conversation_history:
            for turn in conversation_history[-4:]:  # last 4 turns
                messages.append(turn)

        messages.append({"role": "user", "content": user_message})

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://vigil-flood.onrender.com",
            "X-Title": "VIGIL-FLOOD Aapda Mitra AI",
            "Content-Type": "application/json"
        }

        # Try default model first, followed by fallback models
        models_to_try = [DEFAULT_OPENROUTER_MODEL] + [m for m in FALLBACK_MODELS if m != DEFAULT_OPENROUTER_MODEL]

        for model_name in models_to_try:
            payload = {
                "model": model_name,
                "messages": messages,
                "temperature": 0.2,  # Low temperature for precise disaster instructions
                "max_tokens": 800
            }

            try:
                logger.info(f"Aapda Mitra AI querying OpenRouter model: {model_name}")
                response = requests.post(
                    self.api_url,
                    headers=headers,
                    json=payload,
                    timeout=self.timeout_sec
                )

                if response.status_code == 200:
                    data = response.json()
                    choices = data.get("choices", [])
                    if choices:
                        content = choices[0].get("message", {}).get("content", "").strip()
                        if content:
                            return content
                else:
                    logger.warning(
                        f"OpenRouter model {model_name} returned HTTP {response.status_code}: {response.text[:200]}"
                    )
            except requests.exceptions.Timeout:
                logger.warning(f"OpenRouter model {model_name} timed out after {self.timeout_sec}s.")
            except Exception as e:
                logger.warning(f"OpenRouter model {model_name} query error: {str(e)}")

        # If all OpenRouter models fail, return None to trigger deterministic engine
        return None

openrouter_client = OpenRouterClient()
