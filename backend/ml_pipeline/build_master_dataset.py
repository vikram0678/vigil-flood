"""
VIGIL-FLOOD: Master Dataset Harmonizer
Merges sequential Himalayan hydrology (Nepal/Himalayas), Indian ground-truth flood labels,
and multisource topography into a single standardized master time-series dataset.
"""

import os
import glob
import pandas as pd
import numpy as np

def build_master_dataset():
    print("=" * 70)
    print("[*] VIGIL-FLOOD: BUILDING UNIFIED HIMALAYAN TIME-SERIES MASTER DATASET")
    print("=" * 70)
    
    # Paths
    nepal_csv = "kaggle/dataset/CORRECTED_2023_2026_NEPAL_FLOOD_WEATHER_KAGGLE.csv"
    if not os.path.exists(nepal_csv):
        nepal_csv = "kaggle/dataset/nepal_flood_weather_dataset_kaggle_2023_2026.csv"
        
    labels_csv = "kaggle/dataset/rainfall_with_correct_flood_labels.csv"
    uttarakhand_csv = "kaggle/dataset/Uttarakhand_floods_1970_2025.csv"
    output_dir = "backend/data"
    os.makedirs(output_dir, exist_ok=True)
    master_output_path = os.path.join(output_dir, "himalayan_timeseries_master.csv")
    
    records = []
    
    # 1. Process Himalayan Hydrology & Weather (Nepal DHM Stations)
    if os.path.exists(nepal_csv):
        print(f"[*] Processing Himalayan time-series from: {nepal_csv}")
        df_nepal = pd.read_csv(nepal_csv, encoding='utf-8', on_bad_lines='skip')
        
        # Clean column names (strip BOM \ufeff and whitespace)
        df_nepal.columns = [c.replace('\ufeff', '').strip() for c in df_nepal.columns]
        
        # Convert date
        df_nepal['timestamp'] = pd.to_datetime(df_nepal['date'], errors='coerce')
        df_nepal = df_nepal.dropna(subset=['timestamp']).sort_values('timestamp')
        
        # Extract features
        for loc, grp in df_nepal.groupby('location'):
            grp = grp.sort_values('timestamp').reset_index(drop=True)
            
            # Compute rolling features
            grp['rain_rolling_3d'] = grp['precipitation_mm'].rolling(3, min_periods=1).sum()
            grp['rain_rolling_7d'] = grp['precipitation_mm'].rolling(7, min_periods=1).sum()
            grp['discharge_rolling_3d'] = grp['river_discharge_m3s'].rolling(3, min_periods=1).mean()
            
            # Determine threshold-based realistic flood label for Himalayan hydrology:
            # When discharge exceeds 85th percentile OR (rain_3d > 100mm and soil_moisture > 0.35)
            q85_discharge = grp['river_discharge_m3s'].quantile(0.85)
            q95_discharge = grp['river_discharge_m3s'].quantile(0.95)
            
            grp['flood_label'] = (
                (grp['river_discharge_m3s'] >= q85_discharge) & 
                ((grp['precipitation_mm'] > 25.0) | (grp['rain_rolling_3d'] > 60.0) | (grp['soil_moisture_0_100cm_m3m3'] > 0.32))
            ).astype(int)
            
            # Compute a continuous flood risk score (0.0 to 1.0)
            norm_discharge = np.clip(grp['river_discharge_m3s'] / (q95_discharge + 1e-5), 0.0, 1.0)
            norm_rain = np.clip(grp['rain_rolling_3d'] / 150.0, 0.0, 1.0)
            norm_soil = np.clip(grp['soil_moisture_0_100cm_m3m3'] / 0.45, 0.0, 1.0)
            
            grp['flood_risk_score'] = np.clip(0.45 * norm_discharge + 0.35 * norm_rain + 0.20 * norm_soil, 0.0, 1.0)
            
            # Landslide risk: steep elevation + saturated soil + intense rain
            elev_norm = np.clip(grp['elevation_m'] / 3000.0, 0.0, 1.0)
            grp['landslide_risk_score'] = np.clip(0.40 * norm_rain + 0.35 * norm_soil + 0.25 * elev_norm, 0.0, 1.0)
            
            for idx, r in grp.iterrows():
                records.append({
                    "timestamp": r['timestamp'].strftime('%Y-%m-%d %H:%M:%S'),
                    "station_id": str(r['location']),
                    "basin_name": str(r.get('basin', 'Himalayan_Basin')),
                    "elevation_m": float(r.get('elevation_m', 1500.0)),
                    "precipitation_mm": float(r.get('precipitation_mm', 0.0)),
                    "rain_3d_sum_mm": float(r.get('rain_rolling_3d', 0.0)),
                    "rain_7d_sum_mm": float(r.get('rain_rolling_7d', 0.0)),
                    "soil_moisture": float(r.get('soil_moisture_0_100cm_m3m3', 0.25)),
                    "relative_humidity_pct": float(r.get('relative_humidity_mean_pct', 70.0)),
                    "temperature_c": float(r.get('temperature_mean_c', 15.0)),
                    "river_discharge_m3s": float(r.get('river_discharge_m3s', 1.0)),
                    "flood_label": int(r['flood_label']),
                    "flood_risk_score": round(float(r['flood_risk_score']), 4),
                    "landslide_risk_score": round(float(r['landslide_risk_score']), 4),
                    "source": "HIMALAYAN_DHM_SERIES"
                })
        print(f"    [+] Extracted {len(records)} Himalayan sequential records.")
        
    # 2. Sample Indian Flood Ground-Truth Labels (Historical High-Impact Events)
    if os.path.exists(labels_csv):
        print(f"[*] Processing Indian ground-truth labels from: {labels_csv} (sampling representative flood events)...")
        # Read chunks to avoid overwhelming memory, sample real flood events and normal days
        chunk_iter = pd.read_csv(labels_csv, chunksize=100000, encoding='utf-8', on_bad_lines='skip')
        flood_rows = []
        normal_rows = []
        for chunk in chunk_iter:
            chunk.columns = [c.strip() for c in chunk.columns]
            f_events = chunk[chunk['FLOOD'] == 1]
            if not f_events.empty:
                flood_rows.append(f_events)
            # Sample non-flood for balance
            n_events = chunk[chunk['FLOOD'] == 0].sample(n=min(len(chunk[chunk['FLOOD'] == 0]), 1500), random_state=42)
            normal_rows.append(n_events)
            if sum(len(x) for x in flood_rows) >= 5000:
                break
                
        if flood_rows:
            df_floods = pd.concat(flood_rows + normal_rows, ignore_index=True)
            print(f"    [+] Sampled {len(df_floods)} real Indian events ({df_floods['FLOOD'].sum()} flood occurrences).")
            
            for idx, r in df_floods.iterrows():
                rainfall = float(r.get('RAINFALL', 0.0))
                flood_flag = int(r.get('FLOOD', 0))
                dist = str(r.get('DISTRICT', 'Indian_District'))
                state = str(r.get('STATE', 'India'))
                date_str = str(r.get('TIME', '2020-01-01'))
                
                # Synthetic soil saturation proxy from rainfall
                soil_proxy = min(0.48, 0.15 + (rainfall / 180.0) * 0.30)
                discharge_proxy = max(0.5, (rainfall / 20.0) * 12.0) if rainfall > 10 else 1.0
                risk_score = 0.85 if flood_flag == 1 else min(0.35, rainfall / 100.0)
                
                records.append({
                    "timestamp": date_str,
                    "station_id": f"{dist}_{state}",
                    "basin_name": f"{state}_Catchment",
                    "elevation_m": 850.0,
                    "precipitation_mm": rainfall,
                    "rain_3d_sum_mm": rainfall * 1.8,
                    "rain_7d_sum_mm": rainfall * 2.5,
                    "soil_moisture": round(soil_proxy, 4),
                    "relative_humidity_pct": 85.0 if rainfall > 20 else 60.0,
                    "temperature_c": 22.0,
                    "river_discharge_m3s": round(discharge_proxy, 2),
                    "flood_label": flood_flag,
                    "flood_risk_score": round(risk_score, 4),
                    "landslide_risk_score": round(min(0.95, risk_score * 0.9), 4),
                    "source": "INDIAN_HISTORICAL_LABELS"
                })

    # 3. Create Master DataFrame & Save
    master_df = pd.DataFrame(records)
    master_df = master_df.dropna()
    master_df = master_df.sort_values(by=['station_id', 'timestamp']).reset_index(drop=True)
    
    master_df.to_csv(master_output_path, index=False)
    print(f"\n[SUCCESS] Master Dataset created successfully at: {master_output_path}")
    print(f"Total Rows: {len(master_df):,}")
    print(f"Features: {list(master_df.columns)}")
    print(f"Total Flood Events: {master_df['flood_label'].sum():,} ({master_df['flood_label'].mean()*100:.2f}%)")
    print("=" * 70)
    return master_output_path

if __name__ == '__main__':
    build_master_dataset()
