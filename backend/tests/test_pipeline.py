import sys
import unittest
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.core.ml_engine import ml_engine
from backend.app.core.simulation import simulation_engine
from backend.app.core.action_engine import action_engine
from backend.app.core.lead_time_engine import lead_time_engine
from backend.app.core.sensor_health import sensor_health_manager

class TestVigilFloodCore(unittest.TestCase):

    def test_ml_risk_prediction_full_model(self):
        """Test that full ML model outputs valid risk score and hazard level"""
        features = {
            "elevation_m": 880,
            "slope_deg": 32.5,
            "distance_to_stream_m": 45,
            "soil_moisture": 42.0,
            "rain_1h": 25.0,
            "rain_3h": 60.0,
            "water_level_m": 1.2,
            "water_level_rise_rate": 0.4
        }
        res = ml_engine.predict_risk(features)
        self.assertIn("risk_percentage", res)
        self.assertIn("risk_level", res)
        self.assertGreaterEqual(res["risk_percentage"], 0)
        self.assertLessEqual(res["risk_percentage"], 100)
        self.assertIn(res["risk_level"], ["LOW", "MODERATE", "HIGH", "CRITICAL", "EXTREME", "NORMAL", "WARNING"])

    def test_ml_risk_prediction_fallback_model(self):
        """Test that fallback model functions when water level sensor is missing"""
        features_no_water = {
            "elevation_m": 920,
            "slope_deg": 36.8,
            "distance_to_stream_m": 80,
            "soil_moisture": 85.0,
            "rain_1h": 45.0,
            "rain_3h": 90.0,
            "water_level_m": None,
            "water_level_rise_rate": None
        }
        res = ml_engine.predict_risk(features_no_water)
        self.assertIn("risk_percentage", res)
        self.assertGreaterEqual(res["risk_percentage"], 0)
        self.assertLessEqual(res["risk_percentage"], 100)
        self.assertEqual(res.get("model_type"), "FALLBACK_ML_MODEL")

    def test_simulation_summary(self):
        """Test simulation engine loads pilot villages"""
        villages = simulation_engine.get_all_villages_summary()
        self.assertIsInstance(villages, list)
        self.assertGreaterEqual(len(villages), 1)
        self.assertIn("name", villages[0])
        self.assertIn("risk_level", villages[0])

    def test_simulation_scenario_application(self):
        """Test simulation applies cloudburst scenario"""
        applied = simulation_engine.apply_scenario("CLOUDBURST_CRITICAL")
        self.assertTrue(applied)
        villages = simulation_engine.get_all_villages_summary()
        high_risk_found = any(v["risk_level"] in ["HIGH", "CRITICAL", "EXTREME"] for v in villages)
        self.assertTrue(high_risk_found)

    def test_action_evacuation_routing(self):
        """Test action engine produces safe evacuation plan and citizen broadcast"""
        v = simulation_engine.villages[0]
        risk = {
            "risk_percentage": 75,
            "risk_level": "CRITICAL",
            "model_type": "FULL_MULTISOURCE_MODEL"
        }
        lead = {"lead_time_min": 30, "window_display": "20-40 min", "urgency": "URGENT"}
        plan = action_engine.generate_action_plan(v, risk, lead)
        self.assertIn("primary_shelter", plan)
        self.assertIn("recommended_route", plan)
        self.assertIn("simulated_sms_broadcast", plan)
        self.assertIn(v["name"], plan["simulated_sms_broadcast"])

    def test_lead_time_calculation(self):
        """Test lead time engine computes valid evacuation window"""
        v = simulation_engine.villages[0]
        lead = lead_time_engine.calculate_lead_time(
            rain_1h=35.0,
            soil_moisture=70.0,
            water_level_rise_rate=0.5,
            slope_deg=v["slope_deg"],
            distance_to_stream_m=v["distance_to_stream_m"],
            combined_risk=0.8
        )
        self.assertIn("lead_time_min", lead)
        self.assertIn("window_display", lead)
        self.assertGreater(lead["lead_time_min"], 0)

    def test_sensor_health_check(self):
        """Test sensor health monitoring report"""
        v = simulation_engine.villages[0]
        tel = {"rain_1h": 20.0, "soil_moisture": 45.0, "water_level_m": 1.1, "tilt_deg": 0.1}
        health = sensor_health_manager.get_village_sensor_summary(v.get("sensors", {}), tel)
        self.assertIn("data_health_pct", health)
        self.assertIn("sensors", health)
        self.assertIsInstance(health["sensors"], list)
        self.assertTrue(health["water_sensor_usable"])

if __name__ == "__main__":
    unittest.main()
