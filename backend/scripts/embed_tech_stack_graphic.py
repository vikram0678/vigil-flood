"""
Embed high-resolution Technology Stack graphic into VIGIL_FLOOD_TECH_STACK_SLIDE.pptx
"""

import os
import pptx
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor

TEMPLATE_PATH = r"D:\flash_flood\SIH2026-IDEA-Presentation-Format (3).pptx"
OUTPUT_PATH = r"D:\flash_flood\VIGIL_FLOOD_TECH_STACK_SLIDE.pptx"
IMG_PATH = r"D:\flash_flood\SIH_TECHNOLOGY_STACK_INFOGRAPHIC.jpg"

prs = Presentation(TEMPLATE_PATH)
slide = prs.slides[2]

# Remove all existing content shapes except footer and template background
for shape in list(slide.shapes):
    if shape.name not in ["Rectangle 9", "Slide Number Placeholder 5", "Footer Placeholder 6", "Picture 11"]:
        sp_elem = shape._element
        sp_elem.getparent().remove(sp_elem)

# Embed High-Resolution Technology Stack Graphic (Centered, 16:9 ratio)
if os.path.exists(IMG_PATH):
    # Width: 11.8 inches, Height: 5.6 inches, Left: 0.76 inches, Top: 0.75 inches
    slide.shapes.add_picture(IMG_PATH, Inches(0.76), Inches(0.75), Inches(11.8), Inches(5.6))
    print("[+] Successfully embedded Technology Stack graphic into slide.")

# Delete other slides
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
print(f"[SUCCESS] Standalone Tech Stack Presentation saved to: {OUTPUT_PATH}")
