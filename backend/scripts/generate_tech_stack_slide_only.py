"""
Standalone Technology Stack Slide Generator for VIGIL-FLOOD
Generates a clean, perfectly proportioned, executive 1-slide PPTX:
- Exactly 1 slide in PPTX format.
- Strictly clean Sans-Serif typography (Segoe UI / modern style, NO version numbers).
- 5 distinct visual architectural tiers matching the user's stack:
  1. Frontend & Geospatial UI
  2. Backend & Real-Time Telemetry
  3. AI / ML, Deep Learning & Physics Engines
  4. Routing, Geospatial & Satellite Data
  5. DevOps, CI/CD & Edge Deployment
- Official SIH template layout, SIH logo on top right, crisp container cards.
"""

import os
import pptx
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

TEMPLATE_PATH = r"D:\flash_flood\SIH2026-IDEA-Presentation-Format (3).pptx"
OUTPUT_PATH = r"D:\flash_flood\VIGIL_FLOOD_TECH_STACK_SLIDE.pptx"

# -------------------------------------------------------------
# EXECUTIVE COLOR PALETTE
# -------------------------------------------------------------
C_BG_PAGE      = RGBColor(248, 250, 252)  # #F8FAFC
C_NAVY_DARK    = RGBColor(15, 23, 42)      # #0F172A - Deep Slate Black
C_SLATE_BODY   = RGBColor(51, 65, 85)      # #334155 - Slate Gray
C_MUTED        = RGBColor(100, 116, 139)   # #64748B - Muted Gray
C_BORDER_GRAY  = RGBColor(203, 213, 225)  # #CBD5E1 - Thin Card Outline
C_WHITE        = RGBColor(255, 255, 255)  # Pure White

# Category Color Accents
C_CYAN_ACC     = RGBColor(14, 165, 233)    # #0EA5E9
C_CYAN_LT      = RGBColor(240, 249, 255)  # #F0F9FF

C_EMERALD_ACC  = RGBColor(16, 185, 129)    # #10B981
C_EMERALD_LT   = RGBColor(240, 253, 244)  # #F0FDF4

C_PURPLE_ACC   = RGBColor(139, 92, 246)   # #8B5CF6
C_PURPLE_LT    = RGBColor(245, 243, 255)  # #F5F3FF

C_AMBER_ACC    = RGBColor(245, 158, 11)   # #F59E0B
C_AMBER_LT     = RGBColor(255, 251, 235)  # #FFFBEB

C_INDIGO_ACC   = RGBColor(99, 102, 241)   # #6366F1
C_INDIGO_LT    = RGBColor(238, 242, 255)  # #EEF2FF

FONT_FAMILY = "Segoe UI"

def set_font(run, size_pt=11, bold=False, color=C_SLATE_BODY):
    run.font.name = FONT_FAMILY
    run.font.size = Pt(size_pt)
    run.font.bold = bold
    run.font.color.rgb = color

def create_card(slide, left, top, width, height, fill_color=C_WHITE, border_color=C_BORDER_GRAY, border_width=1.0):
    """Creates a modern rounded rectangle container card with thin outline."""
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    card.fill.solid()
    card.fill.fore_color.rgb = fill_color
    if border_color:
        card.line.color.rgb = border_color
        card.line.width = Pt(border_width)
    else:
        card.line.fill.background()
    return card

def main():
    prs = Presentation(TEMPLATE_PATH)
    print(f"[*] Loaded template with {len(prs.slides)} slides.")

    # Use Slide 3 (index 2: TECHNICAL APPROACH) as the base
    slide = prs.slides[2]

    # Clean existing shapes except branding/footer
    for shape in list(slide.shapes):
        if shape.name not in ["Rectangle 9", "Slide Number Placeholder 5", "Footer Placeholder 6", "Picture 11"]:
            sp_elem = shape._element
            sp_elem.getparent().remove(sp_elem)

    # Slide Title
    title_box = create_card(slide, Inches(0.8), Inches(0.4), Inches(8.5), Inches(0.55), fill_color=C_WHITE, border_color=None)
    tf_t = title_box.text_frame
    p_t = tf_t.paragraphs[0]
    p_t.text = "TECHNOLOGY STACK ARCHITECTURE"
    set_font(p_t.runs[0], size_pt=22, bold=True, color=C_NAVY_DARK)

    # Subtitle Ribbon
    sub_box = create_card(slide, Inches(0.8), Inches(0.95), Inches(8.5), Inches(0.3), fill_color=C_CYAN_LT, border_color=C_CYAN_ACC, border_width=1.0)
    tf_sb = sub_box.text_frame
    p_sb = tf_sb.paragraphs[0]
    p_sb.alignment = PP_ALIGN.LEFT
    p_sb.margin_left = Inches(0.12)
    p_sb.margin_top = Inches(0.03)
    r_sb = p_sb.add_run()
    r_sb.text = "VIGIL-FLOOD: Enterprise Modern Full-Stack, AI / ML Physics Engines & Geospatial Digital Twin"
    set_font(r_sb, size_pt=9.5, bold=True, color=C_CYAN_ACC)

    # =========================================================================
    # 5 HORIZONTAL TECH STACK TIERS
    # =========================================================================
    tiers = [
        ("🖥️ Frontend & 3D Geospatial UI", C_CYAN_ACC, C_CYAN_LT, [
            ("React", "Component UI & State"),
            ("TypeScript", "Type-Safe Client Core"),
            ("Vite", "High-Speed HMR Build"),
            ("Leaflet", "2D Tactical Map View"),
            ("MapLibre GL", "3D Mountain DEM Terrain"),
            ("Tailwind CSS", "Modern Glassmorphism UI")
        ]),
        ("⚡ Backend & Real-Time Telemetry", C_EMERALD_ACC, C_EMERALD_LT, [
            ("Python", "Core Logic Runtime"),
            ("FastAPI", "High-Speed Asynchronous API"),
            ("Uvicorn", "Lightning ASGI Server"),
            ("WebSockets", "Live Sensor Broadcast"),
            ("Pydantic", "Strict Telemetry Validation"),
            ("PostGIS", "Spatial Query Database")
        ]),
        ("🧠 AI / ML, Deep Learning & XAI", C_PURPLE_ACC, C_PURPLE_LT, [
            ("XGBoost", "Dual-Hazard Inundation AI"),
            ("LightGBM", "Slope Debris Flow Model"),
            ("PyTorch", "Bi-LSTM Storm Lookback"),
            ("TreeSHAP", "Explainable AI (Game Theory)"),
            ("Scikit-Learn", "Feature Scaling & Pipelines"),
            ("Joblib", "Ultra-Fast Serialized Inference")
        ]),
        ("🗺️ Routing, Geospatial & Satellite Data", C_AMBER_ACC, C_AMBER_LT, [
            ("NetworkX", "Graph Evacuation Routing"),
            ("OSMnx", "Mountain Highway Topology"),
            ("OpenStreetMap", "Road Network Baseline"),
            ("NASA GPM", "Satellite Precipitation (0.1°)"),
            ("Copernicus GLO-30", "30m Digital Elevation Model"),
            ("Open-Meteo", "Hourly Meteorological APIs")
        ]),
        ("🚀 DevOps, Edge Systems & Broadcast", C_INDIGO_ACC, C_INDIGO_LT, [
            ("GitHub Actions", "Automated CI/CD Workflows"),
            ("Docker", "Containerized Production"),
            ("Render", "High-Availability Cloud Hosting"),
            ("NDMA CAP-SACHET", "ITU-T X.1303 Alerting XML"),
            ("Fast2SMS", "Multilingual Telecom SMS"),
            ("ESP32 LoRa", "Solar Edge Siren Fallback")
        ])
    ]

    row_y = Inches(1.35)
    row_h = Inches(0.95)
    row_gap = Inches(0.08)

    for idx, (tier_title, accent_color, tint_color, tech_items) in enumerate(tiers):
        cur_y = row_y + idx * (row_h + row_gap)

        # Full-width row container card
        row_card = create_card(slide, Inches(0.8), cur_y, Inches(11.8), row_h, fill_color=C_WHITE, border_color=C_BORDER_GRAY, border_width=1.0)

        # Left Category Badge (Width = 3.0 inches)
        badge = create_card(slide, Inches(0.9), cur_y + Inches(0.12), Inches(3.0), Inches(0.71), fill_color=tint_color, border_color=accent_color, border_width=1.5)
        tf_b = badge.text_frame
        tf_b.word_wrap = True
        tf_b.margin_left = Inches(0.12)
        tf_b.margin_right = Inches(0.1)
        tf_b.margin_top = Inches(0.18)
        p_b = tf_b.paragraphs[0]
        p_b.alignment = PP_ALIGN.LEFT
        r_b = p_b.add_run()
        r_b.text = tier_title
        set_font(r_b, size_pt=10.5, bold=True, color=C_NAVY_DARK)

        # Right Technology Badges (6 tools per row)
        badge_w = Inches(1.36)
        badge_h = Inches(0.71)
        start_x = Inches(4.02)
        item_gap = Inches(0.09)

        for item_idx, (t_name, t_sub) in enumerate(tech_items):
            item_x = start_x + item_idx * (badge_w + item_gap)
            item_card = create_card(slide, item_x, cur_y + Inches(0.12), badge_w, badge_h, fill_color=C_BG_PAGE, border_color=C_BORDER_GRAY, border_width=1.0)
            tf_item = item_card.text_frame
            tf_item.word_wrap = True
            tf_item.margin_left = Inches(0.06)
            tf_item.margin_right = Inches(0.06)
            tf_item.margin_top = Inches(0.12)

            p1 = tf_item.paragraphs[0]
            p1.alignment = PP_ALIGN.CENTER
            r1 = p1.add_run()
            r1.text = t_name
            set_font(r1, size_pt=9.5, bold=True, color=C_NAVY_DARK)

            p2 = tf_item.add_paragraph()
            p2.alignment = PP_ALIGN.CENTER
            p2.margin_top = Pt(1)
            r2 = p2.add_run()
            r2.text = t_sub
            set_font(r2, size_pt=7.5, bold=False, color=C_MUTED)

    # Bottom Standard Alignment Ribbon
    ribbon = create_card(slide, Inches(0.8), Inches(6.55), Inches(11.8), Inches(0.38), fill_color=C_NAVY_DARK, border_color=None)
    tf_r = ribbon.text_frame
    p_r = tf_r.paragraphs[0]
    p_r.alignment = PP_ALIGN.CENTER
    p_r.margin_top = Inches(0.04)
    r_r = p_r.add_run()
    r_r.text = "⚡ PRODUCTION READY:   Zero Commercial API Licenses   |   <50ms Inference Latency   |   Edge-Deployable on Solar ESP32 / Raspberry Pi"
    set_font(r_r, size_pt=9.5, bold=True, color=C_WHITE)

    # Delete all other slides so that ONLY this 1 slide remains
    # Template has 7 slides (0 to 6). Slide 3 is index 2.
    for idx in [6, 5, 4, 3]:
        if len(prs.slides) > idx:
            rId = prs.slides._sldIdLst[idx].rId
            prs.part.drop_rel(rId)
            del prs.slides._sldIdLst[idx]

    for idx in [1, 0]:
        rId = prs.slides._sldIdLst[idx].rId
        prs.part.drop_rel(rId)
        del prs.slides._sldIdLst[idx]

    prs.save(OUTPUT_PATH)
    print(f"[SUCCESS] Standalone Tech Stack Slide saved to: {OUTPUT_PATH}")
    print(f"Total Slides in file: {len(prs.slides)}")

if __name__ == "__main__":
    main()
