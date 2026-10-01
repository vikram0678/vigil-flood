import unittest
import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.core.earth_engine_connector import earth_engine_connector
from backend.app.core.demographics_engine import demographics_engine
from backend.app.core.action_engine import action_engine
from backend.app.core.simulation import simulation_engine

class TestEarthEngineRoutingAndDemographics(unittest.TestCase):
    def test_worldpop_exposure_caching_and_extraction(self):
        """Step 1: Test WorldPop 100m exposure returns pixel-precise headcounts."""
        pandoh_pop = earth_engine_connector.get_worldpop_exposure(village_id="VIL-01")
        self.assertIsNotNone(pandoh_pop)
        self.assertEqual(pandoh_pop, 581)

        aut_pop = earth_engine_connector.get_worldpop_exposure(village_id="VIL-02")
        self.assertIsNotNone(aut_pop)
        self.assertEqual(aut_pop, 162)

    def test_demographics_disaster_logistics_satellite_verified(self):
        """Step 1: Test disaster logistics incorporates WorldPop headcount and verification flag."""
        logistics = demographics_engine.calculate_disaster_logistics(
            population=4350,
            risk_level="CRITICAL",
            risk_percentage=88.5,
            safe_shelters=[{"name": "School", "capacity": 400}],
            village_id="VIL-01"
        )
        self.assertTrue(logistics["is_satellite_verified"])
        self.assertEqual(logistics["target_evacuees_count"], 581)
        self.assertIn("WorldPop 100m", logistics["exposure_source"])
        self.assertGreater(logistics["ndrf_teams_required"], 0)
        self.assertGreater(logistics["water_supply_litres_per_day"], 0)

    def test_copernicus_dem_route_clearance_and_submersion(self):
        """Step 2: Test Copernicus 30m DEM route elevation checking against river crest."""
        # Simulated flood crest of 837.0m ASL in Pandoh (river bed ~835.0m + 2.0m surge)
        crest_m = 837.0
        
        # Route A (Upper Hill Road) bottleneck ~840.9m ASL -> Should be CLEAR (+3.9m)
        route_a_eval = earth_engine_connector.check_route_elevation_safety(
            village_id="VIL-01",
            route_name="Route A (Upper Hill Road via SH-13)",
            path_coords=[[31.6702, 77.056], [31.6725, 77.053], [31.6745, 77.05]],
            projected_river_crest_m=crest_m,
            village_base_elevation_m=880.0
        )
        self.assertTrue(route_a_eval["is_safe"])
        self.assertEqual(route_a_eval["status"], "CLEAR_ELEVATED_SAFE")
        self.assertGreater(route_a_eval["clearance_margin_m"], 0.0)

        # Route B (Riverside Embankment) bottleneck ~835.0m ASL -> Should be SUBMERGED (-2.0m)
        route_b_eval = earth_engine_connector.check_route_elevation_safety(
            village_id="VIL-01",
            route_name="Route B (Riverside Embankment Road)",
            path_coords=[[31.6702, 77.056], [31.668, 77.058], [31.665, 77.0532]],
            projected_river_crest_m=crest_m,
            village_base_elevation_m=880.0
        )
        self.assertFalse(route_b_eval["is_safe"])
        self.assertEqual(route_b_eval["status"], "SUBMERGED_IMPASSABLE")
        self.assertLess(route_b_eval["clearance_margin_m"], 0.0)
        self.assertIn("ROAD SUBMERGED", route_b_eval["action_directive"])

    def test_action_engine_end_to_end_integration(self):
        """Step 1 & 2: Test ActionEngine attaches evaluated routes and satellite demographics."""
        analysis = simulation_engine.get_village_full_analysis("VIL-01")
        plan = analysis["action_plan"]
        
        self.assertIn("evaluated_routes", plan)
        self.assertGreater(len(plan["evaluated_routes"]), 0)
        self.assertIn("projected_flood_crest_m", plan)
        self.assertIn("river_bed_elevation_m", plan)
        self.assertTrue(plan["disaster_logistics"]["is_satellite_verified"])

    def test_worldpop_age_sex_breakdown(self):
        """Step 3: Test WorldPop age & sex breakdown for infants, seniors, and pediatric/mobility resources."""
        age_data = earth_engine_connector.get_worldpop_age_sex_breakdown(village_id="VIL-01")
        self.assertIsNotNone(age_data)
        self.assertEqual(age_data["total_exposed"], 581)
        self.assertEqual(age_data["children_under_5"], 42)
        self.assertEqual(age_data["elderly_over_65"], 49)
        self.assertEqual(age_data["adults"], 490)
        self.assertEqual(age_data["pediatric_kits_needed"], 42)
        self.assertGreaterEqual(age_data["wheelchair_vehicles_needed"], 6)

        # Check full simulation plan includes vulnerable_populations
        analysis = simulation_engine.get_village_full_analysis("VIL-01")
        vuln = analysis["action_plan"].get("vulnerable_populations")
        self.assertIsNotNone(vuln)
        self.assertIn("children_under_5_count", vuln)
        self.assertIn("elderly_over_65_count", vuln)
        self.assertIn("pediatric_kits_needed", vuln)

if __name__ == "__main__":
    unittest.main()

