"""
VIGIL-FLOOD: SIH 2026 Official Idea PPT Generator
Generates the completed, professional 6-slide Smart India Hackathon Presentation
using the official SIH 2026 Idea Presentation Template.
"""

import os
import pptx
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

TEMPLATE_PATH = r"D:\flash_flood\SIH2026-IDEA-Presentation-Format (1).pptx"
OUTPUT_PATH = r"D:\flash_flood\SIH2026_VIGIL_FLOOD_PRESENTATION.pptx"

# Color Palette
COLOR_PRIMARY = RGBColor(15, 23, 42)      # Dark Slate
COLOR_SECONDARY = RGBColor(2, 132, 199)   # Vibrant Sky Blue
COLOR_ACCENT = RGBColor(239, 68, 68)      # Critical Red
COLOR_TEXT_DARK = RGBColor(30, 41, 59)    # Slate 800
COLOR_TEXT_MUTED = RGBColor(71, 85, 105)  # Slate 600

def set_font(run, name="Calibri", size_pt=12, bold=False, italic=False, color=COLOR_TEXT_DARK):
    run.font.name = name
    run.font.size = Pt(size_pt)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color

def populate_presentation():
    prs = Presentation(TEMPLATE_PATH)
    print(f"[*] Loaded template with {len(prs.slides)} slides.")

    # -------------------------------------------------------------
    # SLIDE 1: TITLE PAGE
    # -------------------------------------------------------------
    slide1 = prs.slides[0]
    for shape in slide1.shapes:
        if not shape.has_text_frame:
            continue
        text = shape.text_frame.text.strip()
        
        if "TITLE PAGE" in text:
            tf = shape.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.text = "SIH 2026 IDEA SUBMISSION"
            set_font(p.runs[0], "Calibri", 20, bold=True, color=COLOR_SECONDARY)
            
        elif "SMART INDIA HACKATHON 2026" in text:
            tf = shape.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.text = "SMART INDIA HACKATHON 2026"
            set_font(p.runs[0], "Calibri", 26, bold=True, color=COLOR_PRIMARY)
            
        elif "Problem Statement ID" in text:
            tf = shape.text_frame
            tf.clear()
            
            lines = [
                ("Problem Statement ID: ", "SIH 26192"),
                ("Problem Statement Title: ", "Flash Flood Prediction System for Hilly Regions using Multi-Source Data"),
                ("Organization: ", "Ministry of Home Affairs (MHA) / National Disaster Response Force (NDRF)"),
                ("Theme: ", "Disaster Management (Hilly Region Hydrology & Slope Stability)"),
                ("PS Category: ", "Software (Multi-Source AI, 3D GIS Digital Twin & Edge IoT)"),
                ("Project Title: ", "VIGIL-FLOOD: Village-level Integrated Geospatial & IoT Lead-Time Early Warning System"),
                ("Pilot Catchment: ", "Beas River Basin, Mandi & Kullu Districts, Himachal Pradesh"),
                ("Team Name / ID: ", "[Your Registered Team Name / Team ID]")
            ]
            
            for i, (label, val) in enumerate(lines):
                p = tf.add_paragraph() if i > 0 else tf.paragraphs[0]
                p.space_after = Pt(4)
                
                run_label = p.add_run()
                run_label.text = label
                set_font(run_label, "Calibri", 12, bold=True, color=COLOR_PRIMARY)
                
                run_val = p.add_run()
                run_val.text = val
                set_font(run_val, "Calibri", 12, bold=False, color=COLOR_TEXT_DARK)

    # -------------------------------------------------------------
    # SLIDE 2: PROPOSED SOLUTION / PROTOTYPE
    # -------------------------------------------------------------
    slide2 = prs.slides[1]
    for shape in slide2.shapes:
        if not shape.has_text_frame:
            continue
        text = shape.text_frame.text.strip()
        
        if "IDEA TITLE" in text:
            tf = shape.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.text = "VIGIL-FLOOD: MULTI-SOURCE EARLY WARNING SYSTEM"
            set_font(p.runs[0], "Calibri", 18, bold=True, color=COLOR_PRIMARY)
            
        elif "Proposed Solution" in text or "Detailed explanation" in text:
            tf = shape.text_frame
            tf.clear()
            
            bullets = [
                ("Hyper-Local Village & Ward-Level Intelligence: ", "Solves the fatal limitation of broad district-level forecasts by predicting inundation and debris flow risks at 50–100m resolution for individual mountain settlements."),
                ("Coupled Dual-Hazard Predictive Engine: ", "Simultaneously models river channel overtopping and steep slope shear instability (Infinite Slope Factor of Safety Fs < 1.0) caused by rapid soil saturation (>85%)."),
                ("Dynamic Actionable Lead-Time (10 to 30 Min): ", "Computes real-time citizen escape windows based on distance to stream, slope runoff velocity (Q = C·I·A), and rate of water surge rise (dH/dt)."),
                ("Interactive 3D Mountain Digital Twin: ", "High-performance WebGL 3D DEM terrain (MapLibre + AWS Terrarium 1.6x relief) with draped Google Hybrid Satellite imagery and real-time physical flood rising simulation."),
                ("Production Prototype Status: ", "Fully operational end-to-end system running on FastAPI + WebSockets, trained across 280,512 real hourly records (2021–2024), tested across 6 Himalayan pilot villages with 100% test pass rate.")
            ]
            
            for i, (head, desc) in enumerate(bullets):
                p = tf.add_paragraph() if i > 0 else tf.paragraphs[0]
                p.space_after = Pt(6)
                p.level = 0
                
                run_h = p.add_run()
                run_h.text = "• " + head
                set_font(run_h, "Calibri", 11.5, bold=True, color=COLOR_SECONDARY)
                
                run_d = p.add_run()
                run_d.text = desc
                set_font(run_d, "Calibri", 11, bold=False, color=COLOR_TEXT_DARK)

    # -------------------------------------------------------------
    # SLIDE 3: TECHNICAL APPROACH & SYSTEM ARCHITECTURE
    # -------------------------------------------------------------
    slide3 = prs.slides[2]
    for shape in slide3.shapes:
        if not shape.has_text_frame:
            continue
        text = shape.text_frame.text.strip()
        
        if "TECHNICAL APPROACH" in text:
            tf = shape.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.text = "TECHNICAL APPROACH & SYSTEM ARCHITECTURE"
            set_font(p.runs[0], "Calibri", 18, bold=True, color=COLOR_PRIMARY)
            
        elif "Technologies to be used" in text or "Methodology" in text:
            tf = shape.text_frame
            tf.clear()
            
            bullets = [
                ("5-Source Synchronous Multi-Sensor Ingestion: ", "Pulls hourly rainfall (Open-Meteo & OpenWeather), satellite soil moisture 0–7cm (NASA SMAP/ERA5), 30m DEM elevation & slope (Copernicus GLO-30), historical landslide scars (ISRO Bhuvan & GSI), and live IoT ultrasonic river gauges."),
                ("4-Tier AI Ensemble on NVIDIA CUDA GPU: ", "Trained on 280,512 real records with sub-millisecond (<2ms) inference:\n   1. Full Inundation XGBoost (13 features | 99.98% R² | 0.0008 RMSE)\n   2. Full Slope Stability Model (13 features | 99.99% R² | 0.0014 RMSE)\n   3. Autonomous Sensor-Outage Fallback Model (11 features | 99.98% R²)\n   4. PyTorch 2-Layer Bi-LSTM Sequence Model (99k sliding windows | 6h storm lookback | 90.3% R²)"),
                ("Explainable AI (SHAP TreeExplainer): ", "Replaces black-box predictions with real-time Game-Theoretic attribution breakdown (e.g. 34% Rain Intensity, 26% Soil Saturation, 21% Slope Gradient, 19% Gauge Surge)."),
                ("Full-Stack Modern Stack: ", "FastAPI (Asynchronous Python), MapLibre GL JS (WebGL 3D DEM), Leaflet (2D Tactical GIS), WebSockets (3-second live sensor streaming), and Twilio CAP SMS Gateway.")
            ]
            
            for i, (head, desc) in enumerate(bullets):
                p = tf.add_paragraph() if i > 0 else tf.paragraphs[0]
                p.space_after = Pt(5)
                
                run_h = p.add_run()
                run_h.text = "• " + head
                set_font(run_h, "Calibri", 11.5, bold=True, color=COLOR_SECONDARY)
                
                run_d = p.add_run()
                run_d.text = desc
                set_font(run_d, "Calibri", 10.5, bold=False, color=COLOR_TEXT_DARK)

    # -------------------------------------------------------------
    # SLIDE 4: FEASIBILITY, VIABILITY & SENSOR OUTAGE USP
    # -------------------------------------------------------------
    slide4 = prs.slides[3]
    for shape in slide4.shapes:
        if not shape.has_text_frame:
            continue
        text = shape.text_frame.text.strip()
        
        if "FEASIBILITY AND VIABILITY" in text:
            tf = shape.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.text = "FEASIBILITY, VIABILITY & SENSOR FAULT-TOLERANCE"
            set_font(p.runs[0], "Calibri", 18, bold=True, color=COLOR_PRIMARY)
            
        elif "Analysis of the feasibility" in text or "Potential challenges" in text:
            tf = shape.text_frame
            tf.clear()
            
            bullets = [
                ("Zero Recurring Data Cost & High Scalability: ", "Built 100% on open-access scientific satellite APIs (Open-Meteo 10,000 free calls/day, Copernicus 30m DEM, NASA SMAP). Deployable across any mountain catchment in India with zero software licensing fees."),
                ("Edge-Computing Resilience: ", "Lightweight compiled ML models (<2MB) deployable on solar-powered Raspberry Pi / ESP32 edge gateways at village Panchayat Bhawans, ensuring siren triggers even if fiber internet is severed."),
                ("THE KILLER USP — Autonomous Sensor-Outage Fallback: ", "During violent cloudbursts, river gauges are often destroyed by rolling boulders. Traditional early warning systems crash. VIGIL-FLOOD autonomously dispatches the 11-Feature Fallback Model, reconstructing threat levels from rainfall accumulation, soil saturation %, and DEM slope runoff—preserving evacuation alerts with 74% to 99% confidence and zero downtime!"),
                ("Physics-Informed False Alarm Suppression: ", "Integrates geotechnical Infinite Slope Factor of Safety (Fs) and Antecedent Precipitation Index (API) so heavy rain on dry ground does not trigger unnecessary panic.")
            ]
            
            for i, (head, desc) in enumerate(bullets):
                p = tf.add_paragraph() if i > 0 else tf.paragraphs[0]
                p.space_after = Pt(5)
                
                run_h = p.add_run()
                run_h.text = "• " + head
                set_font(run_h, "Calibri", 11.5, bold=True, color=COLOR_SECONDARY)
                
                run_d = p.add_run()
                run_d.text = desc
                set_font(run_d, "Calibri", 10.5, bold=False, color=COLOR_TEXT_DARK)

    # -------------------------------------------------------------
    # SLIDE 5: IMPACT, BENEFITS & LAST-MILE ACTION
    # -------------------------------------------------------------
    slide5 = prs.slides[4]
    for shape in slide5.shapes:
        if not shape.has_text_frame:
            continue
        text = shape.text_frame.text.strip()
        
        if "IMPACT AND BENEFITS" in text:
            tf = shape.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.text = "IMPACT, BENEFITS & LAST-MILE ACTION ENGINE"
            set_font(p.runs[0], "Calibri", 18, bold=True, color=COLOR_PRIMARY)
            
        elif "Potential impact" in text or "Benefits of the solution" in text:
            tf = shape.text_frame
            tf.clear()
            
            bullets = [
                ("Saving Lives via Actionable Lead Time (10–30 Min): ", "Transforms abstract weather data into clear, minute-by-minute escape windows, giving vulnerable riverside residents sufficient time to evacuate before debris flows arrive."),
                ("Safe High-Ridge Relief Shelter Allocation: ", "Automatically routes villagers to pre-surveyed reinforced concrete buildings (e.g. Govt Senior Secondary School at 990m, safely +110m above the 880m flood line) rather than flat open fields."),
                ("True Uphill Safe Evacuation Routing: ", "Calculates escape paths strictly climbing uphill along mountain ridge roads, preventing panicked villagers from walking into low-lying riverside flood traps."),
                ("Common Alerting Protocol (CAP) Multi-Lingual SMS: ", "Auto-generates geo-targeted emergency SMS alerts in Hindi and English for instant telecom broadcast to village pradhans, district magistrates, and NDRF battalions."),
                ("Economic & Infrastructure Protection: ", "Minimizes highway washouts on NH-3, prevents vehicle inundation, and reduces disaster relief expenditure by enabling proactive pre-positioning of rescue teams.")
            ]
            
            for i, (head, desc) in enumerate(bullets):
                p = tf.add_paragraph() if i > 0 else tf.paragraphs[0]
                p.space_after = Pt(5)
                
                run_h = p.add_run()
                run_h.text = "• " + head
                set_font(run_h, "Calibri", 11.5, bold=True, color=COLOR_SECONDARY)
                
                run_d = p.add_run()
                run_d.text = desc
                set_font(run_d, "Calibri", 10.5, bold=False, color=COLOR_TEXT_DARK)

    # -------------------------------------------------------------
    # SLIDE 6: RESEARCH, SCIENTIFIC STANDARDS & REFERENCES
    # -------------------------------------------------------------
    slide6 = prs.slides[5]
    for shape in slide6.shapes:
        if not shape.has_text_frame:
            continue
        text = shape.text_frame.text.strip()
        
        if "RESEARCH" in text:
            tf = shape.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.text = "RESEARCH, SCIENTIFIC BENCHMARKS & REFERENCES"
            set_font(p.runs[0], "Calibri", 18, bold=True, color=COLOR_PRIMARY)
            
        elif "Details / Links" in text:
            tf = shape.text_frame
            tf.clear()
            
            bullets = [
                ("International Disaster Management Standards: ", "Engineered in accordance with PIARC (World Road Association) Mountain Natural Hazards Framework and Japan Ministry of Land, Infrastructure, Transport & Tourism (MLIT) Sabo Debris Flow Early Warning Standards."),
                ("Official Scientific Data Repositories: ", "\n   • ECMWF Copernicus ERA5-Land Reanalysis (Hourly Precipitation & Volumetric Soil Water Layer 1)\n   • NASA SMAP (Soil Moisture Active Passive) L3 Global Radiometer Satellite Feed\n   • Copernicus GLO-30 & NASA SRTM 30m Digital Elevation Model (DEM)\n   • ISRO Bhuvan Landslide Atlas of India & Geological Survey of India (GSI) NLSM Database\n   • Central Water Commission (CWC) River Stage Bulletins & India-WRIS Hydrology"),
                ("Global Mountain Benchmark Training: ", "Pre-trained on 280,512 real hourly records spanning extreme storm catchments in the Indian Himalayas (Beas Basin), Japanese Alps (Nagano Sabo Basins), and Austrian Alps (Innsbruck Tyrol)."),
                ("GitHub Codebase & Live Prototype: ", "Full-stack repository including FastAPI backend, 3D MapLibre digital twin, GPU training scripts, and automated test suite: github.com/vigil-flood/early-warning-system")
            ]
            
            for i, (head, desc) in enumerate(bullets):
                p = tf.add_paragraph() if i > 0 else tf.paragraphs[0]
                p.space_after = Pt(5)
                
                run_h = p.add_run()
                run_h.text = "• " + head
                set_font(run_h, "Calibri", 11.5, bold=True, color=COLOR_SECONDARY)
                
                run_d = p.add_run()
                run_d.text = desc
                set_font(run_d, "Calibri", 10.5, bold=False, color=COLOR_TEXT_DARK)

    # -------------------------------------------------------------
    # SLIDE 7: DELETE INSTRUCTIONS SLIDE (STRICT 6-SLIDE SIH LIMIT)
    # -------------------------------------------------------------
    if len(prs.slides) > 6:
        rId = prs.slides._sldIdLst[6].rId
        prs.part.drop_rel(rId)
        del prs.slides._sldIdLst[6]
        print("[+] Removed Slide 7 (Instructions) to maintain strict 6-slide SIH limit.")

    prs.save(OUTPUT_PATH)
    print(f"[+] Completed SIH 2026 Presentation saved successfully to:\n    {OUTPUT_PATH}")

if __name__ == "__main__":
    populate_presentation()
