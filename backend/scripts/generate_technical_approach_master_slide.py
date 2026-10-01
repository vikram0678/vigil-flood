"""
Technical Approach Master 1-Slide Presentation Generator for VIGIL-FLOOD
Strictly complies with user requirements:
- EXACTLY 1 SLIDE in PPTX format.
- 3 Clear Parts:
  1. Process Flow Architecture (Above, occupying ~70% width) using D:\\flash_flood\\SIH_PROCESS_FLOW_ARCHITECTURE.jpg
  2. Production Tech Stack (Occupies exactly 30% of slide on the right, colorful cards, tech badges, NO versions!)
  3. 4-Phase Technical Methodology (Below the architecture, 4 structured cards with metrics & USP)
- 80% visuals, 20% text with modern container cards, badges, and clean contrast.
- Focus on the USP: 96% Ensemble confidence, TreeSHAP Explainability, and Autonomous Sensor-Outage Fallback.
"""

import os
import pptx
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

TEMPLATE_PATH = r"D:\flash_flood\SIH2026-IDEA-Presentation-Format (3).pptx"
OUTPUT_1SLIDE_PATH = r"D:\flash_flood\VIGIL_FLOOD_TECHNICAL_APPROACH_MASTER_SLIDE.pptx"
FINAL_MASTER_DECK = r"D:\flash_flood\VIGIL_FLOOD_SIH_FINAL_PRESENTATION.pptx"
IMG_PROCESS_FLOW = r"D:\flash_flood\SIH_PROCESS_FLOW_ARCHITECTURE.jpg"

# -------------------------------------------------------------
# EXECUTIVE COLOR PALETTE
# -------------------------------------------------------------
C_BG_PAGE      = RGBColor(248, 250, 252)  # #F8FAFC
C_NAVY_DARK    = RGBColor(15, 23, 42)      # #0F172A - Deep Slate Black
C_SLATE_BODY   = RGBColor(51, 65, 85)      # #334155 - Slate Gray
C_MUTED        = RGBColor(100, 116, 139)   # #64748B - Muted Gray
C_CYAN_ACCENT  = RGBColor(14, 165, 233)    # #0EA5E9 - Sky Blue
C_CYAN_LIGHT   = RGBColor(240, 249, 255)  # #F0F9FF - Cyan Tint
C_EMERALD      = RGBColor(16, 185, 129)    # #10B981 - Emerald USP
C_EMERALD_LT   = RGBColor(240, 253, 244)  # #F0FDF4 - Emerald Tint
C_AMBER_ALERT  = RGBColor(245, 158, 11)   # #F59E0B - Amber Warning
C_AMBER_LIGHT  = RGBColor(255, 251, 235)  # #FFFBEB - Amber Tint
C_PURPLE_ACC   = RGBColor(139, 92, 246)   # #8B5CF6 - Purple Accent
C_PURPLE_LT    = RGBColor(245, 243, 255)  # #F5F3FF - Purple Tint
C_BORDER_GRAY  = RGBColor(203, 213, 225)  # #CBD5E1 - Thin Card Outline
C_WHITE        = RGBColor(255, 255, 255)  # Pure White

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

def build_technical_approach_slide(slide):
    # Clean template placeholder text shapes
    for shape in list(slide.shapes):
        if shape.has_text_frame:
            t = shape.text_frame.text.strip()
            if "TECHNICAL APPROACH" in t:
                tf = shape.text_frame
                tf.clear()
                p = tf.paragraphs[0]
                p.text = "TECHNICAL APPROACH & SYSTEM ARCHITECTURE"
                set_font(p.runs[0], size_pt=20, bold=True, color=C_NAVY_DARK)
            elif any(k in t for k in ["Technologies to be used", "Methodology", "Your Team Name"]):
                if "Your Team Name" not in t:
                    sp_elem = shape._element
                    sp_elem.getparent().remove(sp_elem)

    # Top Subtitle Badge
    sub_badge = create_card(slide, Inches(0.6), Inches(0.85), Inches(8.5), Inches(0.32), fill_color=C_CYAN_LIGHT, border_color=C_CYAN_ACCENT, border_width=1.0)
    tf_sb = sub_badge.text_frame
    p_sb = tf_sb.paragraphs[0]
    p_sb.alignment = PP_ALIGN.LEFT
    p_sb.margin_left = Inches(0.12)
    p_sb.margin_top = Inches(0.04)
    r_sb = p_sb.add_run()
    r_sb.text = "VIGIL-FLOOD: Multi-Source Ingestion Pipeline  ➔  Dual-Hazard AI Core  ➔  Tactical CAP Evacuation"
    set_font(r_sb, size_pt=9.5, bold=True, color=C_CYAN_ACCENT)

    # =========================================================================
    # PART 1: SYSTEM PROCESS FLOW ARCHITECTURE (ABOVE, ~70% WIDTH)
    # =========================================================================
    # Card Container for the Process Flow Graphic
    c_arch = create_card(slide, Inches(0.6), Inches(1.22), Inches(8.5), Inches(3.6), fill_color=C_WHITE, border_color=C_BORDER_GRAY, border_width=1.2)
    
    # Title Tag inside card
    tag_arch = create_card(slide, Inches(0.75), Inches(1.28), Inches(4.3), Inches(0.3), fill_color=C_NAVY_DARK, border_color=None)
    tf_ta = tag_arch.text_frame
    p_ta = tf_ta.paragraphs[0]
    p_ta.alignment = PP_ALIGN.CENTER
    p_ta.margin_top = Inches(0.04)
    r_ta = p_ta.add_run()
    r_ta.text = "1. SYSTEM PROCESS FLOW ARCHITECTURE (PIPELINE)"
    set_font(r_ta, size_pt=9, bold=True, color=C_WHITE)

    # Embed Image inside container
    if os.path.exists(IMG_PROCESS_FLOW):
        slide.shapes.add_picture(IMG_PROCESS_FLOW, Inches(0.68), Inches(1.62), Inches(8.34), Inches(3.12))
        print("[+] Embedded Process Flow Architecture image.")

    # =========================================================================
    # PART 3: 4-STAGE TECHNICAL METHODOLOGY (BELOW ARCHITECTURE)
    # =========================================================================
    # Container for Methodology
    c_meth = create_card(slide, Inches(0.6), Inches(4.9), Inches(8.5), Inches(1.85), fill_color=C_BG_PAGE, border_color=C_BORDER_GRAY, border_width=1.2)
    
    # Title Tag
    tag_meth = create_card(slide, Inches(0.75), Inches(4.96), Inches(4.3), Inches(0.28), fill_color=C_CYAN_ACCENT, border_color=None)
    tf_tm = tag_meth.text_frame
    p_tm = tf_tm.paragraphs[0]
    p_tm.alignment = PP_ALIGN.CENTER
    p_tm.margin_top = Inches(0.03)
    r_tm = p_tm.add_run()
    r_tm.text = "2. TECHNICAL METHODOLOGY & BENCHMARKS (4 PHASES)"
    set_font(r_tm, size_pt=9, bold=True, color=C_WHITE)

    # 4 Sequential Methodology Cards
    card_w = Inches(1.98)
    card_h = Inches(1.38)
    m_top = Inches(5.3)
    m_lefts = [Inches(0.75), Inches(2.83), Inches(4.91), Inches(6.99)]

    phases = [
        (m_lefts[0], "Phase 1: Ingestion", "📡 <500ms Latency", C_WHITE, C_CYAN_ACCENT, [
            "IMD Radar + NASA GPM",
            "Copernicus 30m DEM",
            "CWC Gauges + Soil Sensors",
            "Auto dropout fallback"
        ]),
        (m_lefts[1], "Phase 2: Hydrology", "🌊 Kinematic Routing", C_WHITE, C_BORDER_GRAY, [
            "D8 Flow Accumulation",
            "Wavefront surge velocity",
            "Bedrock channel flow",
            "Slope >35° debris runout"
        ]),
        (m_lefts[2], "Phase 3: AI & XAI", "🧠 96% Conf (USP!)", C_EMERALD_LT, C_EMERALD, [
            "XGBoost + LightGBM",
            "Coupled River + Debris",
            "TreeSHAP Attribution",
            "+40% Hist, +34% Slope"
        ]),
        (m_lefts[3], "Phase 4: Tactical CAP", "⏱️ 30–60 Min Window", C_CYAN_LIGHT, C_CYAN_ACCENT, [
            "Dynamic escape timer",
            "Uphill shelter (+110m)",
            "NDMA CAP-SACHET XML",
            "Multilingual SMS dispatch"
        ])
    ]

    for left_pos, p_title, p_badge, fill_c, border_c, bullets in phases:
        c_p = create_card(slide, left_pos, m_top, card_w, card_h, fill_color=fill_c, border_color=border_c, border_width=1.2)
        tf_p = c_p.text_frame
        tf_p.word_wrap = True
        tf_p.margin_left = Inches(0.1)
        tf_p.margin_right = Inches(0.1)
        tf_p.margin_top = Inches(0.08)

        p1 = tf_p.paragraphs[0]
        p1.text = p_title
        set_font(p1.runs[0], size_pt=9.5, bold=True, color=C_NAVY_DARK)

        p_b = tf_p.add_paragraph()
        p_b.text = p_badge
        set_font(p_b.runs[0], size_pt=8.5, bold=True, color=border_c if border_c != C_BORDER_GRAY else C_NAVY_DARK)
        p_b.space_after = Pt(3)

        for b_text in bullets:
            p_bll = tf_p.add_paragraph()
            p_bll.space_after = Pt(1.5)
            r_dot = p_bll.add_run()
            r_dot.text = "• "
            set_font(r_dot, size_pt=7.5, bold=True, color=border_c if border_c != C_BORDER_GRAY else C_MUTED)
            r_txt = p_bll.add_run()
            r_txt.text = b_text
            set_font(r_txt, size_pt=7.5, bold=False, color=C_SLATE_BODY)

    # =========================================================================
    # PART 2: PRODUCTION TECH STACK (RIGHT SIDE, OCCUPIES EXACTLY 30% OF SLIDE)
    # =========================================================================
    ts_left = Inches(9.25)
    ts_top = Inches(1.22)
    ts_w = Inches(3.45)
    ts_h = Inches(5.53)

    # Master Tech Stack Container
    c_ts_main = create_card(slide, ts_left, ts_top, ts_w, ts_h, fill_color=C_WHITE, border_color=C_BORDER_GRAY, border_width=1.2)
    
    # Title Tag
    tag_ts = create_card(slide, Inches(9.4), Inches(1.28), Inches(3.15), Inches(0.3), fill_color=C_NAVY_DARK, border_color=None)
    tf_tts = tag_ts.text_frame
    p_tts = tf_tts.paragraphs[0]
    p_tts.alignment = PP_ALIGN.CENTER
    p_tts.margin_top = Inches(0.04)
    r_tts = p_tts.add_run()
    r_tts.text = "3. PRODUCTION TECH STACK (NO VERSIONS)"
    set_font(r_tts, size_pt=9, bold=True, color=C_WHITE)

    # 4 Stacked Colorful Tech Stack Cards
    stk_w = Inches(3.2)
    stk_h = Inches(1.15)
    stk_left = Inches(9.38)
    stk_tops = [Inches(1.68), Inches(2.93), Inches(4.18), Inches(5.43)]

    tech_stacks = [
        (stk_tops[0], "🗄️ Ingestion & Geospatial Data", C_CYAN_LIGHT, C_CYAN_ACCENT, [
            "GDAL, Copernicus GLO-30 DEM",
            "NASA GPM IMERG, Open-Meteo",
            "PostGIS, Python Async Pipeline",
            "Sub-500ms sync | Multi-sensor polling"
        ]),
        (stk_tops[1], "🧠 AI & Predictive Engine", C_EMERALD_LT, C_EMERALD, [
            "XGBoost + LightGBM Ensemble",
            "TreeSHAP Kernel Explainer (XAI)",
            "PyTorch Bi-LSTM (6h storm window)",
            "96% Model Confidence | <50ms inference"
        ]),
        (stk_tops[2], "🖥️ Full-Stack & 3D Digital Twin", C_BG_PAGE, C_PURPLE_ACC, [
            "FastAPI Asynchronous Backend",
            "MapLibre GL 3D Terrain + Three.js",
            "React.js, Tailwind CSS, Leaflet",
            "WebSockets real-time sensor stream"
        ]),
        (stk_tops[3], "🚨 Broadcast & Fallback Systems (USP)", C_AMBER_LIGHT, C_AMBER_ALERT, [
            "NDMA CAP-SACHET XML (ITU-T X.1303)",
            "Fast2SMS Multi-lingual Broadcast",
            "Solar ESP32 LoRa Mesh Gateway",
            "Autonomous Sensor-Outage Fallback"
        ])
    ]

    for top_pos, s_title, s_fill, s_border, s_lines in tech_stacks:
        c_stk = create_card(slide, stk_left, top_pos, stk_w, stk_h, fill_color=s_fill, border_color=s_border, border_width=1.2)
        tf_st = c_stk.text_frame
        tf_st.word_wrap = True
        tf_st.margin_left = Inches(0.12)
        tf_st.margin_right = Inches(0.12)
        tf_st.margin_top = Inches(0.08)

        p_sh = tf_st.paragraphs[0]
        p_sh.text = s_title
        set_font(p_sh.runs[0], size_pt=9.5, bold=True, color=C_NAVY_DARK)
        p_sh.space_after = Pt(2)

        for l_idx, line_txt in enumerate(s_lines):
            p_ln = tf_st.add_paragraph()
            p_ln.space_after = Pt(1)
            r_bul = p_ln.add_run()
            r_bul.text = "✔ " if l_idx == len(s_lines)-1 else "• "
            set_font(r_bul, size_pt=7.5, bold=True, color=s_border)
            r_txt = p_ln.add_run()
            r_txt.text = line_txt
            set_font(r_txt, size_pt=7.5, bold=(l_idx == len(s_lines)-1), color=C_NAVY_DARK if l_idx == len(s_lines)-1 else C_SLATE_BODY)

    print("[+] Successfully constructed 3-part Technical Approach layout.")

def main():
    prs = Presentation(TEMPLATE_PATH)
    print(f"[*] Loaded template with {len(prs.slides)} slides.")

    # We want a clean presentation with EXACTLY 1 SLIDE for this master slide deliverable!
    # Slide 3 is the TECHNICAL APPROACH slide in SIH template (index 2)
    slide3 = prs.slides[2]
    build_technical_approach_slide(slide3)

    # Keep ONLY slide 3 by deleting all other slides
    # Delete slide 7, 6, 5, 4 (indices 6, 5, 4, 3)
    for idx in [6, 5, 4, 3]:
        if len(prs.slides) > idx:
            rId = prs.slides._sldIdLst[idx].rId
            prs.part.drop_rel(rId)
            del prs.slides._sldIdLst[idx]
    
    # Delete slide 2, slide 1 (indices 1, 0)
    for idx in [1, 0]:
        rId = prs.slides._sldIdLst[idx].rId
        prs.part.drop_rel(rId)
        del prs.slides._sldIdLst[idx]

    prs.save(OUTPUT_1SLIDE_PATH)
    print(f"[SUCCESS] Standalone 1-Slide Presentation saved to: {OUTPUT_1SLIDE_PATH}")
    print(f"Total Slides in 1-slide deck: {len(prs.slides)}")

    # Also update Slide 3 in the master final deck VIGIL_FLOOD_SIH_FINAL_PRESENTATION.pptx!
    if os.path.exists(FINAL_MASTER_DECK):
        prs_master = Presentation(FINAL_MASTER_DECK)
        if len(prs_master.slides) >= 3:
            slide_m3 = prs_master.slides[2]
            # Remove any non-template shapes on slide 3
            for shape in list(slide_m3.shapes):
                if shape.name not in ["Rectangle 9", "Title 1", "Slide Number Placeholder 5", "Footer Placeholder 6", "Oval 10", "Picture 11"]:
                    sp_elem = shape._element
                    sp_elem.getparent().remove(sp_elem)
            build_technical_approach_slide(slide_m3)
            prs_master.save(FINAL_MASTER_DECK)
            print(f"[SUCCESS] Synchronized Slide 3 in Master Deck: {FINAL_MASTER_DECK}")

if __name__ == "__main__":
    main()
