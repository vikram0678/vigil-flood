"""
Unit Tests for Aapda Mitra AI (Disaster Decision Assistant)
Tests guardrails, deterministic fallback, context grounding, and bilingual response.
"""

import unittest
from backend.app.aapda_mitra.aapda_mitra_config import AAPDA_MITRA_SYSTEM_PROMPT, DEFAULT_PROMPT_CHIPS
from backend.app.aapda_mitra.deterministic_engine import deterministic_engine
from backend.app.aapda_mitra.openrouter_client import openrouter_client

class TestAapdaMitraAI(unittest.TestCase):

    def setUp(self):
        self.mock_context = {
            "village_name": "Pandoh",
            "ward": "Ward 2 (Lower Catchment)",
            "elevation_m": 880,
            "slope_deg": 32.5,
            "population": 1450,
            "risk_percentage": 61,
            "risk_level": "HIGH",
            "actionable_window": "27 - 52 min",
            "telemetry": {
                "rain_1h": 18.5,
                "soil_moisture": 48.0,
                "water_level_m": 1.2,
                "tilt_deg": 0.2
            },
            "action_plan": {
                "primary_shelter": {
                    "name": "Govt Senior Secondary School (Upper Ridge)",
                    "elevation_m": 990
                },
                "recommended_route": {
                    "name": "Route A (Upper Hill Road via SH-13)"
                },
                "blocked_route": {
                    "name": "Route B (Riverside Embankment Road)"
                }
            },
            "sensor_health": {
                "water_sensor_usable": True,
                "data_health_pct": 100
            }
        }

    def test_domain_guardrail_rejection(self):
        """Ensures off-topic questions (recipes, code, movies) are strictly refused."""
        self.assertTrue(deterministic_engine.is_off_topic("What is the recipe for chocolate cake?"))
        self.assertTrue(deterministic_engine.is_off_topic("Tell me a funny joke about movies"))
        self.assertTrue(deterministic_engine.is_off_topic("Who is the actor in the new film?"))

        # Legitimate disaster queries should NOT be rejected
        self.assertFalse(deterministic_engine.is_off_topic("Where is the designated flood shelter?"))
        self.assertFalse(deterministic_engine.is_off_topic("What is the current rainfall intensity in Pandoh?"))
        self.assertFalse(deterministic_engine.is_off_topic("How much time do we have to evacuate?"))

    def test_evacuation_routing_advice(self):
        """Verifies shelter and evacuation routing advice citations."""
        response = deterministic_engine.generate_response("Where should we evacuate?", self.mock_context)
        self.assertIn("Govt Senior Secondary School", response)
        self.assertIn("Route A (Upper Hill Road", response)
        self.assertIn("Route B (Riverside", response)
        self.assertIn("27 - 52 min", response)

    def test_explainable_ai_shap_citation(self):
        """Verifies TreeSHAP factor breakdown is explained."""
        response = deterministic_engine.generate_response("Explain TreeSHAP risk factors", self.mock_context)
        self.assertIn("61%", response)
        self.assertIn("Terrain Steepness", response)
        self.assertIn("Soil Moisture Saturation", response)

    def test_sensor_health_failover_advice(self):
        """Verifies sensor status and fallback reporting."""
        # Online test
        resp_online = deterministic_engine.generate_response("What is the sensor status?", self.mock_context)
        self.assertIn("ONLINE", resp_online)
        self.assertIn("FULL_ML_MODEL", resp_online)

        # Outage test
        outage_context = dict(self.mock_context)
        outage_context["sensor_health"] = {"water_sensor_usable": False}
        resp_offline = deterministic_engine.generate_response("What is the sensor status?", outage_context)
        self.assertIn("OFFLINE", resp_offline)
        self.assertIn("FALLBACK_PHYSICS_MODEL", resp_offline)

    def test_hindi_response_generation(self):
        """Verifies Hindi query returns bilingual Devanagari guidance."""
        resp_hindi = deterministic_engine.generate_response("हिंदी में निर्देश बताएं", self.mock_context)
        self.assertIn("आपदा मित्र आपातकालीन निर्देश", resp_hindi)
        self.assertIn("61%", resp_hindi)
        self.assertIn("Govt Senior Secondary School", resp_hindi)

    def test_language_filter_switching(self):
        """Verifies explicit language parameter controls output language."""
        # 1. Explicit Hindi Filter
        resp_hi = deterministic_engine.generate_response("Where is the shelter?", self.mock_context, language="hi")
        self.assertIn("सामरिक निकासी निर्देश", resp_hi)
        self.assertIn("शरण स्थल", resp_hi)

        # 2. Explicit English Filter
        resp_en = deterministic_engine.generate_response("Where is the shelter?", self.mock_context, language="en")
        self.assertIn("TACTICAL EVACUATION DIRECTIVE", resp_en)
        self.assertIn("Designated Primary Shelter", resp_en)

        # 3. Explicit Bilingual Filter
        resp_bi = deterministic_engine.generate_response("Where is the shelter?", self.mock_context, language="bilingual")
        self.assertIn("TACTICAL EVACUATION DIRECTIVE", resp_bi)
        self.assertIn("सुरक्षित", resp_bi)

if __name__ == "__main__":
    unittest.main()
