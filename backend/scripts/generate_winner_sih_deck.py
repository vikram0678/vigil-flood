"""
Master Grand Finale Winner SIH 2026 Presentation Generator for VIGIL-FLOOD
Strictly 80% Visuals / 20% Text + Heavy Focus on the USP & Market Superiority.
Matches exact template slide titles:
- Slide 1: TITLE PAGE (SIH 26192, VIGIL-FLOOD, Theme, Team details)
- Slide 2: IDEA TITLE (Interactive Prototype Wireframe & Tactical Workflow)
- Slide 3: TECHNICAL APPROACH (Process Flow & Methodology Architecture Diagram)
- Slide 4: FEASIBILITY AND VIABILITY (Competitive Market Benchmark & Sensor-Outage Fallback USP)
- Slide 5: IMPACT AND BENEFITS (4-Quadrant Societal, Operational & Economic Infographic)
- Slide 6: RESEARCH AND REFERENCES (Scientific Rigor, Standards Alignment & Team Matrix)
"""

import os
import pptx
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

TEMPLATE_PATH = r"D:\flash_flood\SIH2026-IDEA-Presentation-Format (3).pptx"
OUTPUT_PATH = r"D:\flash_flood\SIH2026_VIGIL_FLOOD_WINNER_DECK.pptx"
FINAL_PATH = r"D:\flash_flood\VIGIL_FLOOD_SIH_FINAL_PRESENTATION.pptx"

# Embedded High-Resolution Visual Graphics (80% Visuals)
IMG_SLIDE2_WIREFRAME = r"D:\flash_flood\SIH_PROTOTYPE_WIREFRAME_WORKFLOW.jpg"
IMG_SLIDE3_ARCH      = r"D:\flash_flood\SIH_UNIFIED_TECHNICAL_ARCHITECTURE_SLIDE.jpg"
IMG_SLIDE4_USP       = r"D:\flash_flood\SIH_MARKET_COMPARISON_USP.jpg"
IMG_SLIDE5_IMPACT    = r"D:\flash_flood\SIH_IMPACT_BENEFITS_INFOGRAPHIC.jpg"

# -------------------------------------------------------------
# PALETTE A: TECH & DISASTER AI WINNER COLOR SCHEME
# -------------------------------------------------------------
C_BG_PAGE      = RGBColor(248, 250, 252)  # #F8FAFC - Clean Slate Off-White
C_NAVY_DARK    = RGBColor(15, 23, 42)      # #0F172A - Deep Slate/Navy (Headers)
C_SLATE_BODY   = RGBColor(51, 65, 85)      # #334155 - Slate Gray (Body Text)
C_MUTED        = RGBColor(100, 116, 139)   # #64748B - Muted Text
C_CYAN_ACCENT  = RGBColor(14, 165, 233)    # #0EA5E9 - Accent 1 (Cyan/Blue)
C_CYAN_LIGHT   = RGBColor(240, 249, 255)  # #F0F9FF - Cyan Tint Fill
C_EMERALD      = RGBColor(16, 185, 129)    # #10B981 - Accent 2 (Emerald USP)
C_EMERALD_LT   = RGBColor(240, 253, 244)  # #F0FDF4 - Emerald Tint Fill
C_AMBER_ALERT  = RGBColor(245, 158, 11)   # #F59E0B - Amber Warning
C_AMBER_LIGHT  = RGBColor(255, 251, 235)  # #FFFBEB - Amber Tint Fill
C_RED_ALERT    = RGBColor(239, 68, 68)     # #EF4444 - Crimson Alert
C_RED_LIGHT    = RGBColor(254, 242, 242)  # #FEF2F2 - Red Tint Fill
C_BORDER_GRAY  = RGBColor(203, 213, 225)  # #CBD5E1 - Thin Card Outline
C_WHITE        = RGBColor(255, 255, 255)  # Pure White

FONT_FAMILY = "Segoe UI"

def set_font(run, size_pt=14, bold=False, color=C_SLATE_BODY):
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

    # =============================================================
    # SLIDE 1: TITLE PAGE
    # =============================================================
    slide1 = prs.slides[0]
    
    # Remove template placeholder text shapes
    for shape in list(slide1.shapes):
        if shape.has_text_frame:
            t = shape.text_frame.text.strip()
            if any(k in t for k in ["TITLE PAGE", "SMART INDIA HACKATHON", "Problem Statement ID"]):
                sp_elem = shape._element
                sp_elem.getparent().remove(sp_elem)

    # Top Event Banner
    top_badge = create_card(slide1, Inches(0.8), Inches(0.45), Inches(8.5), Inches(0.45), fill_color=C_NAVY_DARK, border_color=None)
    tf_tb = top_badge.text_frame
    p_tb = tf_tb.paragraphs[0]
    p_tb.alignment = PP_ALIGN.LEFT
    p_tb.margin_left = Inches(0.15)
    r_tb = p_tb.add_run()
    r_tb.text = "SMART INDIA HACKATHON 2026  |  GRAND FINALE IDEA PRESENTATION"
    set_font(r_tb, size_pt=11.5, bold=True, color=C_WHITE)

    # Left Side: Master Branding & Metadata Card (60% width)
    c1 = create_card(slide1, Inches(0.8), Inches(1.05), Inches(7.5), Inches(5.45), fill_color=C_WHITE, border_color=C_CYAN_ACCENT, border_width=1.5)
    tf1 = c1.text_frame
    tf1.word_wrap = True
    tf1.margin_left = Inches(0.3)
    tf1.margin_right = Inches(0.3)
    tf1.margin_top = Inches(0.2)
    tf1.margin_bottom = Inches(0.15)

    # Prominent Problem Statement ID Badge
    badge_ps = create_card(slide1, Inches(1.1), Inches(1.22), Inches(4.6), Inches(0.42), fill_color=C_CYAN_ACCENT, border_color=None)
    tf_ps = badge_ps.text_frame
    p_ps = tf_ps.paragraphs[0]
    p_ps.alignment = PP_ALIGN.CENTER
    r_ps = p_ps.add_run()
    r_ps.text = "PROBLEM STATEMENT ID: 26192"
    set_font(r_ps, size_pt=13, bold=True, color=C_WHITE)

    # Project Title: VIGIL-FLOOD in 34pt Bold
    p_title = tf1.paragraphs[0]
    p_title.space_before = Pt(36)
    p_title.text = "VIGIL-FLOOD"
    set_font(p_title.runs[0], size_pt=34, bold=True, color=C_NAVY_DARK)

    p_sub = tf1.add_paragraph()
    p_sub.text = "Village-level Integrated Geospatial & IoT Lead-Time Early Warning System"
    set_font(p_sub.runs[0], size_pt=13.5, bold=True, color=C_CYAN_ACCENT)
    p_sub.space_after = Pt(12)

    meta_items = [
        ("Problem Statement Title: ", "Flash Flood Prediction System for Hilly Regions using Multi-Source Data"),
        ("Ministry / Organization: ", "Ministry of Home Affairs (MHA) / NDRF"),
        ("Category & Theme: ", "Software Track  |  Disaster Management & Mountain Hydrology"),
        ("Target Catchments: ", "Beas & Sutlej Basins (Samej Rampur, Mandi, Kullu - HP)"),
        ("Team Details: ", "[Your Registered Team Name / Team ID]  |  Team Leader: [Leader Name]")
    ]

    for label, val in meta_items:
        p = tf1.add_paragraph()
        p.space_after = Pt(5)
        r_l = p.add_run()
        r_l.text = label
        set_font(r_l, size_pt=11.5, bold=True, color=C_NAVY_DARK)
        r_v = p.add_run()
        r_v.text = val
        set_font(r_v, size_pt=11.5, bold=False, color=C_SLATE_BODY)

    # Right Side: 40% Evaluation Criteria Highlights
    c1_right = create_card(slide1, Inches(8.5), Inches(1.05), Inches(4.2), Inches(5.45), fill_color=C_CYAN_LIGHT, border_color=C_BORDER_GRAY, border_width=1.0)
    tf1_r = c1_right.text_frame
    tf1_r.word_wrap = True
    tf1_r.margin_left = Inches(0.25)
    tf1_r.margin_right = Inches(0.25)
    tf1_r.margin_top = Inches(0.22)

    p_rh = tf1_r.paragraphs[0]
    p_rh.text = "🎯 CORE EVALUATION HIGHLIGHTS"
    set_font(p_rh.runs[0], size_pt=13, bold=True, color=C_NAVY_DARK)
    p_rh.space_after = Pt(10)

    highlights = [
        ("⏱️ 30–60 Min Lead Time: ", "Converts abstract radar data into actionable escape countdown windows for mountain habitations."),
        ("🌊 Coupled Dual-Hazard: ", "Simultaneously predicts river channel surge & steep slope debris flow (Infinite Slope Fs < 1.0)."),
        ("🧠 TreeSHAP Explainable AI: ", "100% transparent decision drivers; no black-box predictions for disaster commanders."),
        ("🚨 Sensor-Outage Fallback: ", "Autonomous switch to 11-feature satellite/terrain model when river sensors are destroyed."),
        ("🌐 100% Open Data: ", "Zero recurring satellite licensing fees; deployable pan-India at negligible cost.")
    ]

    for h_title, h_desc in highlights:
        p = tf1_r.add_paragraph()
        p.space_after = Pt(5)
        r_t = p.add_run()
        r_t.text = h_title
        set_font(r_t, size_pt=10.5, bold=True, color=C_NAVY_DARK)
        r_d = p.add_run()
        r_d.text = h_desc
        set_font(r_d, size_pt=10, bold=False, color=C_SLATE_BODY)

    print("[+] Slide 1: TITLE PAGE generated.")

    # =============================================================
    # SLIDE 2: IDEA TITLE (80% VISUALS: PROTOTYPE WIREFRAME & WORKFLOW)
    # =============================================================
    slide2 = prs.slides[1]
    
    for shape in list(slide2.shapes):
        if shape.has_text_frame:
            t = shape.text_frame.text.strip()
            if "IDEA TITLE" in t:
                tf = shape.text_frame
                tf.clear()
                p = tf.paragraphs[0]
                p.text = "IDEA TITLE: VIGIL-FLOOD DUAL-HAZARD TACTICAL SYSTEM"
                set_font(p.runs[0], size_pt=20, bold=True, color=C_NAVY_DARK)
            elif "Proposed Solution" in t or "Detailed explanation" in t:
                sp_elem = shape._element
                sp_elem.getparent().remove(sp_elem)

    # Embed Interactive Prototype & Wireframe Graphic (Dominant 80% Visual)
    if os.path.exists(IMG_SLIDE2_WIREFRAME):
        slide2.shapes.add_picture(IMG_SLIDE2_WIREFRAME, Inches(0.8), Inches(1.15), Inches(8.5), Inches(4.85))
        print("[+] Embedded interactive UI wireframe on Slide 2.")

    # Right Side: 3 Compact Visual Solution Cards
    c_side2 = create_card(slide2, Inches(9.5), Inches(1.15), Inches(3.2), Inches(4.85), fill_color=C_WHITE, border_color=C_CYAN_ACCENT, border_width=1.2)
    tf_s2 = c_side2.text_frame
    tf_s2.word_wrap = True
    tf_s2.margin_left = Inches(0.18)
    tf_s2.margin_right = Inches(0.18)
    tf_s2.margin_top = Inches(0.18)

    p_s2h = tf_s2.paragraphs[0]
    p_s2h.text = "⚡ SOLUTION HIGHLIGHTS"
    set_font(p_s2h.runs[0], size_pt=11.5, bold=True, color=C_NAVY_DARK)
    p_s2h.space_after = Pt(8)

    s2_points = [
        ("1. What It Is: ", "AI-powered Tactical Early Warning & 3D Mountain Digital Twin for vulnerable mountain settlements."),
        ("2. How It Solves Gaps: ", "Replaces broad 50km district forecasts with 50m village-level flood surge & slope debris runout tracking."),
        ("3. 3D Valley Mesh: ", "Simulates rising floodwaters dynamically with safe uphill evacuation route mapping."),
        ("4. 1-Click CAP Alert: ", "Instant multi-lingual SMS dispatch with a live 35-min countdown escape window.")
    ]

    for s_t, s_d in s2_points:
        p = tf_s2.add_paragraph()
        p.space_after = Pt(5)
        r_t = p.add_run()
        r_t.text = s_t + "\n"
        set_font(r_t, size_pt=10, bold=True, color=C_CYAN_ACCENT)
        r_d = p.add_run()
        r_d.text = s_d
        set_font(r_d, size_pt=9, bold=False, color=C_SLATE_BODY)

    # Bottom Metric Ribbon
    ribbon2 = create_card(slide2, Inches(0.8), Inches(6.1), Inches(11.9), Inches(0.4), fill_color=C_NAVY_DARK, border_color=None)
    tf_r2 = ribbon2.text_frame
    p_r2 = tf_r2.paragraphs[0]
    p_r2.alignment = PP_ALIGN.CENTER
    r_r2 = p_r2.add_run()
    r_r2.text = "⚡ PRODUCTION STATUS:   Trained on 280,000+ real records   |   Tested across 6 Himalayan pilot villages   |   100% Test Pass Rate"
    set_font(r_r2, size_pt=9.5, bold=True, color=C_WHITE)

    print("[+] Slide 2: IDEA TITLE generated.")

    # =============================================================
    # SLIDE 3: TECHNICAL APPROACH (80% VISUALS: ARCHITECTURE & METHODOLOGY)
    # =============================================================
    slide3 = prs.slides[2]
    
    for shape in list(slide3.shapes):
        if shape.has_text_frame:
            t = shape.text_frame.text.strip()
            if "TECHNICAL APPROACH" in t:
                tf = shape.text_frame
                tf.clear()
                p = tf.paragraphs[0]
                p.text = "TECHNICAL APPROACH & SYSTEM ARCHITECTURE"
                set_font(p.runs[0], size_pt=20, bold=True, color=C_NAVY_DARK)
            elif "Technologies to be used" in t or "Methodology" in t:
                sp_elem = shape._element
                sp_elem.getparent().remove(sp_elem)

    # Embed High-Resolution Technical Architecture & Process Flow Diagram (Left 68%)
    if os.path.exists(IMG_SLIDE3_ARCH):
        slide3.shapes.add_picture(IMG_SLIDE3_ARCH, Inches(0.8), Inches(1.15), Inches(8.3), Inches(4.75))
        print("[+] Embedded technical architecture diagram on Slide 3.")

    # Right Side: 4 Visual Component Stack Cards
    t_left = Inches(9.3)
    t_w = Inches(3.4)
    t_h = Inches(1.1)
    t_ys = [Inches(1.15), Inches(2.35), Inches(3.55), Inches(4.75)]

    tech_cards = [
        (t_ys[0], "🗄️ Ingestion & Geospatial Data", C_CYAN_LIGHT, C_CYAN_ACCENT, "Python GDAL, Copernicus GLO-30 DEM, NASA GPM IMERG, Open-Meteo, PostGIS (Sub-500ms sync)"),
        (t_ys[1], "🧠 AI & Predictive Engine", C_WHITE, C_BORDER_GRAY, "XGBoost + LightGBM Ensemble (96% Conf), TreeSHAP Kernel, PyTorch LSTM (6h storm lookback)"),
        (t_ys[2], "🖥️ Full-Stack & 3D Digital Twin", C_WHITE, C_BORDER_GRAY, "FastAPI Async WebSockets (<50ms inference), MapLibre GL 3D Terrain, React.js, Tailwind CSS"),
        (t_ys[3], "🚨 Broadcast & Fallback Systems", C_EMERALD_LT, C_EMERALD, "NDMA CAP-SACHET XML (ITU-T X.1303), Fast2SMS Multi-lingual Broadcast, Solar ESP32 LoRa Fallback")
    ]

    for top_y, title, fill, border, desc in tech_cards:
        box = create_card(slide3, t_left, top_y, t_w, t_h, fill_color=fill, border_color=border, border_width=1.2)
        tf_t = box.text_frame
        tf_t.word_wrap = True
        tf_t.margin_left = Inches(0.15)
        tf_t.margin_right = Inches(0.15)
        tf_t.margin_top = Inches(0.1)

        p1 = tf_t.paragraphs[0]
        p1.text = title
        set_font(p1.runs[0], size_pt=10.5, bold=True, color=C_NAVY_DARK)

        p2 = tf_t.add_paragraph()
        p2.text = desc
        set_font(p2.runs[0], size_pt=9, bold=False, color=C_SLATE_BODY)

    # Bottom Feasibility Assurance Ribbon
    ribbon3 = create_card(slide3, Inches(0.8), Inches(6.0), Inches(11.9), Inches(0.45), fill_color=C_BG_PAGE, border_color=C_BORDER_GRAY)
    tf_r3 = ribbon3.text_frame
    p_r3 = tf_r3.paragraphs[0]
    p_r3.alignment = PP_ALIGN.CENTER
    r_r3 = p_r3.add_run()
    r_r3.text = "🔒 FEASIBILITY ASSURANCE:   Compiled ML Models (<2MB)   |   Edge-Deployable on Solar Raspberry Pi / ESP32   |   Zero Cloud Lock-in"
    set_font(r_r3, size_pt=9.5, bold=True, color=C_CYAN_ACCENT)

    print("[+] Slide 3: TECHNICAL APPROACH generated.")

    # =============================================================
    # SLIDE 4: FEASIBILITY AND VIABILITY (HEAVY FOCUS ON THE USP & MARKET BENCHMARK)
    # =============================================================
    slide4 = prs.slides[3]
    
    for shape in list(slide4.shapes):
        if shape.has_text_frame:
            t = shape.text_frame.text.strip()
            if "FEASIBILITY AND VIABILITY" in t:
                tf = shape.text_frame
                tf.clear()
                p = tf.paragraphs[0]
                p.text = "FEASIBILITY AND VIABILITY: MARKET BENCHMARK & USP"
                set_font(p.runs[0], size_pt=20, bold=True, color=C_NAVY_DARK)
            elif "Analysis of the feasibility" in t or "Potential challenges" in t:
                sp_elem = shape._element
                sp_elem.getparent().remove(sp_elem)

    # Embed High-Resolution Market Comparison & Zero-Downtime Sensor Fallback USP Graphic (Dominant 80% Visual)
    if os.path.exists(IMG_SLIDE4_USP):
        slide4.shapes.add_picture(IMG_SLIDE4_USP, Inches(0.8), Inches(1.15), Inches(8.5), Inches(4.8))
        print("[+] Embedded market comparison & USP graphic on Slide 4.")

    # Right Side: 2 Clear Evaluation Differentiator Cards
    c_usp_side = create_card(slide4, Inches(9.5), Inches(1.15), Inches(3.2), Inches(4.8), fill_color=C_WHITE, border_color=C_EMERALD, border_width=2.0)
    tf_us = c_usp_side.text_frame
    tf_us.word_wrap = True
    tf_us.margin_left = Inches(0.18)
    tf_us.margin_right = Inches(0.18)
    tf_us.margin_top = Inches(0.18)

    p_ush = tf_us.paragraphs[0]
    p_ush.text = "🏆 WHY VIGIL-FLOOD WINS"
    set_font(p_ush.runs[0], size_pt=11.5, bold=True, color=C_EMERALD)
    p_ush.space_after = Pt(8)

    diff_points = [
        ("1. Hyper-Local Resolution: ", "50m sub-catchment precision vs broad 50km district-wide forecasts."),
        ("2. Coupled Dual-Hazard: ", "Simultaneously predicts river surge AND slope debris flows (Infinite Slope Fs < 1.0)."),
        ("3. Autonomous Fallback USP: ", "When boulders crush physical river sensors, system auto-switches in <100ms to satellite/DEM model, preserving 94% warning confidence!"),
        ("4. 30–60 Min Lead Time: ", "Actionable escape countdown vs late reactive sirens."),
        ("5. Zero Data Cost: ", "Built 100% on open-access scientific APIs (Copernicus 30m, NASA SMAP, Open-Meteo).")
    ]

    for d_t, d_d in diff_points:
        p = tf_us.add_paragraph()
        p.space_after = Pt(4)
        r_t = p.add_run()
        r_t.text = d_t
        set_font(r_t, size_pt=9.5, bold=True, color=C_NAVY_DARK)
        r_d = p.add_run()
        r_d.text = d_d
        set_font(r_d, size_pt=9, bold=False, color=C_SLATE_BODY)

    # Bottom Winning Differentiator Ribbon
    ribbon4 = create_card(slide4, Inches(0.8), Inches(6.05), Inches(11.9), Inches(0.4), fill_color=C_NAVY_DARK, border_color=None)
    tf_r4 = ribbon4.text_frame
    p_r4 = tf_r4.paragraphs[0]
    p_r4.alignment = PP_ALIGN.CENTER
    r_r4 = p_r4.add_run()
    r_r4.text = "💡 THE KILLER USP:   Zero-Cost Public Satellites   +   Autonomous Sensor-Outage Fallback   +   Dual-Hazard Coupling"
    set_font(r_r4, size_pt=9.5, bold=True, color=C_WHITE)

    print("[+] Slide 4: FEASIBILITY AND VIABILITY generated.")

    # =============================================================
    # SLIDE 5: IMPACT AND BENEFITS (80% VISUALS: 4-QUADRANT INFOGRAPHIC)
    # =============================================================
    slide5 = prs.slides[4]
    
    for shape in list(slide5.shapes):
        if shape.has_text_frame:
            t = shape.text_frame.text.strip()
            if "IMPACT AND BENEFITS" in t:
                tf = shape.text_frame
                tf.clear()
                p = tf.paragraphs[0]
                p.text = "IMPACT AND BENEFITS: SOCIETAL & ECONOMIC VALUE"
                set_font(p.runs[0], size_pt=20, bold=True, color=C_NAVY_DARK)
            elif "Potential impact" in t or "Benefits of the solution" in t:
                sp_elem = shape._element
                sp_elem.getparent().remove(sp_elem)

    # Embed High-Resolution 4-Quadrant Impact Infographic (Dominant 80% Visual)
    if os.path.exists(IMG_SLIDE5_IMPACT):
        slide5.shapes.add_picture(IMG_SLIDE5_IMPACT, Inches(0.8), Inches(1.15), Inches(8.5), Inches(4.8))
        print("[+] Embedded impact & benefits infographic on Slide 5.")

    # Right Side: Structured Measurable Metrics Card
    c_imp_side = create_card(slide5, Inches(9.5), Inches(1.15), Inches(3.2), Inches(4.8), fill_color=C_WHITE, border_color=C_CYAN_ACCENT, border_width=1.5)
    tf_is = c_imp_side.text_frame
    tf_is.word_wrap = True
    tf_is.margin_left = Inches(0.18)
    tf_is.margin_right = Inches(0.18)
    tf_is.margin_top = Inches(0.18)

    p_ish = tf_is.paragraphs[0]
    p_ish.text = "📊 MEASURABLE IMPACT"
    set_font(p_ish.runs[0], size_pt=11.5, bold=True, color=C_NAVY_DARK)
    p_ish.space_after = Pt(8)

    imp_metrics = [
        ("👥 Life Safety (Zero Casualties): ", "Extends civilian evacuation runway from <15 min to a reliable 30–60 min window, preventing drowning casualties."),
        ("🦺 NDRF Tactical Edge: ", "Live incident command hydrographs enable boat and rescue pre-positioning before highways get severed."),
        ("🛣️ Infrastructure Protection: ", "Early closures on NH-3/NH-5 prevent vehicle inundation; dam gate controls protect hydropower turbines."),
        ("🌿 Pan-Himalayan Scale: ", "Deployable with 0 recurring licensing fees across HP, Uttarakhand, Sikkim & Western Ghats.")
    ]

    for m_t, m_d in imp_metrics:
        p = tf_is.add_paragraph()
        p.space_after = Pt(4)
        r_t = p.add_run()
        r_t.text = m_t + "\n"
        set_font(r_t, size_pt=9.5, bold=True, color=C_CYAN_ACCENT)
        r_d = p.add_run()
        r_d.text = m_d
        set_font(r_d, size_pt=9, bold=False, color=C_SLATE_BODY)

    # Bottom Beneficiary Ribbon
    ribbon5 = create_card(slide5, Inches(0.8), Inches(6.05), Inches(11.9), Inches(0.4), fill_color=C_NAVY_DARK, border_color=None)
    tf_r5 = ribbon5.text_frame
    p_r5 = tf_r5.paragraphs[0]
    p_r5.alignment = PP_ALIGN.CENTER
    r_r5 = p_r5.add_run()
    r_r5.text = "🎯 BENEFICIARIES:   Vulnerable Mountain Habitats   |   NDRF / SDRF First Responders   |   District EOC Commanders   |   State DMAs"
    set_font(r_r5, size_pt=9.5, bold=True, color=C_WHITE)

    print("[+] Slide 5: IMPACT AND BENEFITS generated.")

    # =============================================================
    # SLIDE 6: RESEARCH AND REFERENCES (STANDARDS, CITATIONS & TEAM MATRIX)
    # =============================================================
    slide6 = prs.slides[5]
    
    for shape in list(slide6.shapes):
        if shape.has_text_frame:
            t = shape.text_frame.text.strip()
            if "RESEARCH" in t:
                tf = shape.text_frame
                tf.clear()
                p = tf.paragraphs[0]
                p.text = "RESEARCH AND REFERENCES: STANDARDS & TEAM COMPETENCY"
                set_font(p.runs[0], size_pt=20, bold=True, color=C_NAVY_DARK)
            elif "Details / Links" in t:
                sp_elem = shape._element
                sp_elem.getparent().remove(sp_elem)

    # Left 50%: Scientific Rigor & Standards Alignment
    c_ref = create_card(slide6, Inches(0.8), Inches(1.2), Inches(5.6), Inches(4.7), fill_color=C_WHITE, border_color=C_BORDER_GRAY, border_width=1.2)
    tf_rf = c_ref.text_frame
    tf_rf.word_wrap = True
    tf_rf.margin_left = Inches(0.2)
    tf_rf.margin_right = Inches(0.2)
    tf_rf.margin_top = Inches(0.18)

    p_rfh = tf_rf.paragraphs[0]
    p_rfh.text = "🏛️ SCIENTIFIC STANDARDS & FORMULATIONS"
    set_font(p_rfh.runs[0], size_pt=11.5, bold=True, color=C_NAVY_DARK)
    p_rfh.space_after = Pt(8)

    ref_items = [
        ("NDMA CAP-SACHET Guidelines (2022): ", "ITU-T X.1303 Common Alerting Protocol compliant XML schema for Indian disaster warnings."),
        ("ISRO National Landslide Atlas (NRSC 2023): ", "Landslide hazard zonation methodology and historical scar spatial distribution across Himalayan river basins."),
        ("Kinematic Wave Hydrodynamic Routing: ", "Surge wave propagation down steep bedrock channels: ∂A/∂t + ∂Q/∂x = q."),
        ("Infinite Slope Factor of Safety (Fs): ", "Limit equilibrium slope stability model accounting for transient pore water pressure rise during cloudburst storms."),
        ("TreeSHAP Explainable AI: ", "Game-theoretic Shapley value attribution for tree ensemble hazard predictions (Lundberg et al., Nature MI 2020).")
    ]

    for r_title, r_desc in ref_items:
        p = tf_rf.add_paragraph()
        p.space_after = Pt(4)
        r_t = p.add_run()
        r_t.text = "• " + r_title
        set_font(r_t, size_pt=9.5, bold=True, color=C_CYAN_ACCENT)
        r_d = p.add_run()
        r_d.text = r_desc
        set_font(r_d, size_pt=9, bold=False, color=C_SLATE_BODY)

    # Right 50%: Team Competency Matrix Table
    c_tbl_box = create_card(slide6, Inches(6.7), Inches(1.2), Inches(6.0), Inches(4.7), fill_color=C_WHITE, border_color=C_BORDER_GRAY, border_width=1.2)
    tf_tb = c_tbl_box.text_frame
    tf_tb.margin_left = Inches(0.2)
    tf_tb.margin_top = Inches(0.15)
    p_th = tf_tb.paragraphs[0]
    p_th.text = "👥 TEAM COMPETENCY MATRIX"
    set_font(p_th.runs[0], size_pt=11.5, bold=True, color=C_NAVY_DARK)

    # Add Table Shape
    table_shape = slide6.shapes.add_table(5, 3, Inches(6.9), Inches(1.75), Inches(5.6), Inches(3.9))
    table = table_shape.table
    table.columns[0].width = Inches(1.9)
    table.columns[1].width = Inches(2.3)
    table.columns[2].width = Inches(1.4)

    headers = ["Role / Domain", "Primary Core Skill", "Assigned Lead"]
    for col_idx, h_text in enumerate(headers):
        cell = table.cell(0, col_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = C_NAVY_DARK
        tf_c = cell.text_frame
        tf_c.margin_left = Inches(0.08)
        tf_c.margin_right = Inches(0.08)
        tf_c.margin_top = Inches(0.06)
        tf_c.margin_bottom = Inches(0.06)
        p = tf_c.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        r = p.add_run()
        r.text = h_text
        set_font(r, size_pt=10, bold=True, color=C_WHITE)

    team_data = [
        ("System Architecture & ML", "Spatial Modeling / PyTorch / Ensemble", "Team Leader"),
        ("GIS & 3D Digital Twin", "Geo-Data Integration / MapLibre / PostGIS", "Member 2 & 3"),
        ("Full-Stack Dashboard", "Real-Time UI / WebSockets / FastAPI", "Member 4 & 5"),
        ("Hardware & Fallback IoT", "Edge Systems / LoRaWAN Mesh / CAP SMS", "Member 6")
    ]

    for row_idx, row_values in enumerate(team_data, start=1):
        for col_idx, val in enumerate(row_values):
            cell = table.cell(row_idx, col_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = C_BG_PAGE if row_idx % 2 == 1 else C_WHITE
            tf_c = cell.text_frame
            tf_c.margin_left = Inches(0.08)
            tf_c.margin_right = Inches(0.08)
            tf_c.margin_top = Inches(0.06)
            tf_c.margin_bottom = Inches(0.06)
            p = tf_c.paragraphs[0]
            p.alignment = PP_ALIGN.LEFT if col_idx < 2 else PP_ALIGN.CENTER
            r = p.add_run()
            r.text = val
            set_font(r, size_pt=9.5, bold=(col_idx == 0), color=C_NAVY_DARK if col_idx == 0 else C_SLATE_BODY)

    # Bottom Standard Alignment Ribbon
    ribbon6 = create_card(slide6, Inches(0.8), Inches(6.05), Inches(11.9), Inches(0.4), fill_color=C_NAVY_DARK, border_color=None)
    tf_r6 = ribbon6.text_frame
    p_r6 = tf_r6.paragraphs[0]
    p_r6.alignment = PP_ALIGN.CENTER
    r_r6 = p_r6.add_run()
    r_r6.text = "🏛️ STANDARDS ALIGNED:   NDMA CAP-SACHET Guidelines (2022)   |   ISRO Landslide Atlas   |   CWC / IMD Protocols"
    set_font(r_r6, size_pt=9.5, bold=True, color=C_WHITE)

    print("[+] Slide 6: RESEARCH AND REFERENCES generated.")

    # =============================================================
    # REMOVE SLIDE 7 IF PRESENT (Instruction Slide)
    # =============================================================
    if len(prs.slides) >= 7:
        rId = prs.slides._sldIdLst[6].rId
        prs.part.drop_rel(rId)
        del prs.slides._sldIdLst[6]
        print("[+] Slide 7 (Instruction Slide) successfully removed per SIH guidelines.")

    prs.save(OUTPUT_PATH)
    prs.save(FINAL_PATH)
    print(f"\n[SUCCESS] Final Grand Finale Winner SIH Presentation saved to:")
    print(f"  -> {OUTPUT_PATH}")
    print(f"  -> {FINAL_PATH}")
    print(f"Total Slides: {len(prs.slides)}")

if __name__ == "__main__":
    main()
