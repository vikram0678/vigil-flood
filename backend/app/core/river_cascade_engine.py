"""
VIGIL-FLOOD: River Cascade & Hydrodynamic Flow Routing Engine
Models upstream-to-downstream river connectivity and kinematic flood wave propagation
across the 26 monitored villages in the Beas, Sutlej, Alaknanda/Ganga, Teesta, and Chaliyar/Kabini basins.
"""

import math
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class RiverCascadeEngine:
    def __init__(self):
        # 1. Topological River Network Graph
        # Maps upstream nodes to downstream destination nodes, distance along river (km), and mean channel slope
        self.river_network = {
            # Beas River Basin (Himachal Pradesh)
            # High mountain tributaries converge into Beas gorge
            "VIL-05": {"downstream_id": "VIL-01", "river_name": "Uhl / Beas Tributary", "distance_km": 24.0, "elevation_drop_m": 1070.0}, # Jhatingri -> Pandoh
            "VIL-08": {"downstream_id": "VIL-01", "river_name": "Kotropi Nala / Beas", "distance_km": 19.5, "elevation_drop_m": 765.0},  # Kotropi -> Pandoh
            "VIL-06": {"downstream_id": "VIL-04", "river_name": "Beas Mainstem", "distance_km": 14.2, "elevation_drop_m": 140.0},      # Bajaura -> Nagwain
            "VIL-04": {"downstream_id": "VIL-02", "river_name": "Beas Mainstem", "distance_km": 11.8, "elevation_drop_m": 30.0},       # Nagwain -> Aut
            "VIL-02": {"downstream_id": "VIL-03", "river_name": "Beas Gorge Chokepoint", "distance_km": 8.5, "elevation_drop_m": 15.0}, # Aut -> Thalot
            "VIL-03": {"downstream_id": "VIL-01", "river_name": "Beas Gorge", "distance_km": 12.0, "elevation_drop_m": 25.0},          # Thalot -> Pandoh (Dam Reservoir)

            # Sutlej / Pabbar Basins (Himachal Pradesh)
            "VIL-10": {"downstream_id": "VIL-11", "river_name": "Pabbar / Sutlej Corridor", "distance_km": 36.0, "elevation_drop_m": 512.0}, # Janglikh -> Samej/Rampur
            "VIL-07": {"downstream_id": "VIL-11", "river_name": "Baspa / Sutlej Mainstem", "distance_km": 42.0, "elevation_drop_m": 80.0},   # Batseri/Sangla -> Samej
            "VIL-09": {"downstream_id": "VIL-11", "river_name": "Kurpan Gad / Sutlej", "distance_km": 15.0, "elevation_drop_m": 601.0},     # Kanon/Nirmand -> Samej

            # Alaknanda / Bhagirathi Basin (Uttarakhand Himalayas)
            "VIL-14": {"downstream_id": "VIL-15", "river_name": "Dhauliganga / Alaknanda", "distance_km": 28.0, "elevation_drop_m": 22.0}, # Tamak -> Paturi
            "VIL-16": {"downstream_id": "VIL-15", "river_name": "Mandakini / Alaknanda Confluence", "distance_km": 32.0, "elevation_drop_m": 654.0}, # Okhimath -> Paturi
            "VIL-12": {"downstream_id": "VIL-13", "river_name": "Bhagirathi Gorge", "distance_km": 26.0, "elevation_drop_m": 544.0},     # Dharali -> Sayanchatti

            # Teesta Basin (Sikkim)
            "VIL-17": {"downstream_id": "VIL-21", "river_name": "Teesta Upper Gorge", "distance_km": 18.0, "elevation_drop_m": 845.0},  # Chungthang -> Dikchu
            "VIL-18": {"downstream_id": "VIL-21", "river_name": "Mangan Chokepoint / Teesta", "distance_km": 14.0, "elevation_drop_m": 889.0}, # Rafong -> Dikchu
            "VIL-21": {"downstream_id": "VIL-20", "river_name": "Teesta River Mainstem", "distance_km": 25.0, "elevation_drop_m": 838.0}, # Dikchu -> Melli Bazaar
            "VIL-19": {"downstream_id": "VIL-20", "river_name": "Rangeet / Teesta Confluence", "distance_km": 31.0, "elevation_drop_m": 599.0}, # Rimbi -> Melli Bazaar

            # Chaliyar & Kabini Basin (Wayanad / Kerala Western Ghats)
            "VIL-23": {"downstream_id": "VIL-22", "river_name": "Iruvanjippuzha Debris Corridor", "distance_km": 4.2, "elevation_drop_m": 312.0}, # Mundakkai -> Chooralmala
            "VIL-22": {"downstream_id": "VIL-26", "river_name": "Chaliyar River Outflow", "distance_km": 19.5, "elevation_drop_m": 385.0},          # Chooralmala -> Kavalappara
            "VIL-25": {"downstream_id": "VIL-24", "river_name": "Pambar / Periyar Mountain Catchment", "distance_km": 16.0, "elevation_drop_m": 244.0} # Kottakamboor -> Pettimudi
        }

    def compute_wave_velocity(self, slope_m_per_km: float, discharge_m3s: float) -> float:
        """
        Manning-Seddon Kinematic Flood Wave Celerity Formula:
        C = 1.5 * v, where velocity v = (1/n) * R^(2/3) * S^(1/2)
        In steep mountain streams (S > 0.01), wave velocity ranges between 2.8 m/s and 5.2 m/s.
        """
        slope_ratio = max(0.002, slope_m_per_km / 1000.0)
        # Empirical hydraulic celerity for mountain bedrock channels
        base_v = 1.8 * math.pow(max(1.0, discharge_m3s), 0.22) * math.pow(slope_ratio * 100.0, 0.35)
        return min(5.5, max(2.5, base_v))

    def evaluate_cascade_effects(self, all_villages_telemetry: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """
        Propagates hydrodynamic flood waves along river graph edges.
        Calculates wave travel time and downriver hazard amplification.
        """
        cascade_alerts = {}

        for upstream_id, routing in self.river_network.items():
            downstream_id = routing["downstream_id"]
            distance_km = routing["distance_km"]
            elev_drop = routing["elevation_drop_m"]
            river_name = routing["river_name"]
            
            slope_m_per_km = elev_drop / max(1.0, distance_km)
            
            # Upstream metrics
            up_data = all_villages_telemetry.get(upstream_id, {})
            up_rain_1h = float(up_data.get("rainfall_1h_mm", up_data.get("rainfall_mm", 0.0)))
            up_rain_3h = float(up_data.get("rainfall_3h_mm", 0.0))
            up_discharge = float(up_data.get("river_discharge_m3s", 2.0))
            
            # Kinematic wave velocity and travel time in minutes
            wave_velocity_mps = self.compute_wave_velocity(slope_m_per_km, up_discharge)
            travel_time_sec = (distance_km * 1000.0) / wave_velocity_mps
            travel_time_min = int(round(travel_time_sec / 60.0))
            
            # Cascade Trigger: Extreme upstream rainfall or river discharge surge
            is_surging = (up_rain_1h >= 25.0) or (up_rain_3h >= 50.0) or (up_discharge >= 120.0)
            
            if is_surging:
                # Hydrodynamic surge attenuation with distance
                surge_intensity = min(1.0, (up_rain_1h / 60.0) * 0.6 + (up_discharge / 300.0) * 0.4)
                attenuation_factor = math.exp(-0.015 * distance_km)
                net_downstream_impact = surge_intensity * attenuation_factor
                
                alert_entry = {
                    "upstream_village_id": upstream_id,
                    "river_name": river_name,
                    "distance_km": distance_km,
                    "wave_velocity_mps": round(wave_velocity_mps, 2),
                    "estimated_arrival_minutes": travel_time_min,
                    "surge_severity": "CRITICAL" if net_downstream_impact > 0.6 else "HIGH",
                    "impact_factor": round(net_downstream_impact, 3),
                    "upstream_rainfall_rate": up_rain_1h,
                    "upstream_discharge_m3s": up_discharge,
                    "warning_message": (
                        f"HYDROLOGICAL SURGE DETECTED UPSTREAM: Flood wave generated along {river_name} "
                        f"will reach this sector in approximately {travel_time_min} minutes. "
                        f"Estimated channel velocity: {wave_velocity_mps:.1f} m/s."
                    )
                }
                
                # If multiple upstream tributaries feed the same downstream node, keep highest impact
                if downstream_id not in cascade_alerts or net_downstream_impact > cascade_alerts[downstream_id]["impact_factor"]:
                    cascade_alerts[downstream_id] = alert_entry

        return cascade_alerts

# Global Singleton Instance
river_cascade_engine = RiverCascadeEngine()
