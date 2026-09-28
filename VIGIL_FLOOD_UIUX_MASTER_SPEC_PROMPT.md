# VIGIL-FLOOD
## Complete UI/UX Design System & Production Specification
### For AI-Powered Flash Flood & Multi-Hazard Early Warning Command Center

---

> **Version:** 3.0 (Production)  
> **Last Updated:** September 2026  
> **Design Lead:** Senior UI/UX Architect (20+ Years, Defense & Crisis Systems)  
> **Prior Work References:** NASA Mission Control (MCC-H), Bloomberg Terminal, Palantir Foundry, Google Flood Hub, NOAA Weather Radar, Windy.com  
> **Standards:** NDMA India, CWC India, IMD, ISRO NRSC, ISO 22324, ITU-T X.1303 CAP, WCAG 2.1 AAA  

---

# PART I — DESIGN PHILOSOPHY & PRINCIPLES

## 1. The Problem This Interface Must Solve

A District Collector in Mandi, Himachal Pradesh receives a phone call at 2:47 AM during monsoon season. Upstream rain gauges are spiking. She opens Vigil-Flood on her laptop in a dimly lit control room. She has **90 seconds** to decide whether to evacuate 1,450 people from Pandoh Gorge.

The interface must answer three questions **before she consciously thinks to ask them:**

1. **How bad is it?** — A single number, unmistakable, at the largest font size on screen.
2. **How long do we have?** — A countdown in minutes, not hours. Not hidden. Not buried.
3. **What do I do?** — A directive. Not a suggestion. A clear, bold action.

Every single pixel in this interface exists to serve those three questions. Everything else is supporting context.

---

## 2. Eight Core Design Principles

### Principle 1: Severity Must Be Felt, Not Read
Risk is not communicated through text labels alone. The entire visual atmosphere of the interface shifts — background glow intensity, border saturation, animation frequency — proportional to how dangerous the situation is. When all villages are stable, the interface is calm, dark, almost dormant. When a cloudburst hits, the screen subtly breathes crimson.

### Principle 2: Calm Technology
Inspired by Amber Case's "Calm Technology" philosophy. In normal operations (which is 95% of the time), the dashboard is quiet, dark, and unobtrusive. Operators should be able to glance at it from across the room and confirm "everything is fine" in under 2 seconds from the color temperature alone.

### Principle 3: Progressive Disclosure
No operator should ever see all information at once. The hierarchy is:
- **Level 0 (Glance):** Basin threat summary — 1 number, 1 color.
- **Level 1 (Scan):** Village cards ranked by severity — 5-second scan.
- **Level 2 (Investigate):** Selected village deep-dive — sensor telemetry, XAI breakdown, evacuation routes.
- **Level 3 (Act):** CAP alert composer, SMS broadcast, siren activation.

### Principle 4: Every Number Earns Its Place
If a number is on screen, it must directly influence an evacuation decision. Decorative metrics are banned. Every sensor reading must connect to the causal chain: *rain falls -> soil saturates -> runoff accelerates -> river surges -> village floods.*

### Principle 5: Explain the Machine
No black-box percentages. A "77% risk" without explanation breeds distrust. Every risk score is decomposed into human-readable causal factors using TreeSHAP attribution bars. The operator must understand *why* the AI is alarmed.

### Principle 6: Graceful Degradation
Mountain flash floods destroy the very sensors that detect them. When an IoT gauge goes offline, the interface must not crash, show errors, or lose confidence. It must visually indicate the degraded state, switch to fallback models, and widen uncertainty bands — all without operator intervention.

### Principle 7: Accessible Under Duress
Color-blind operators exist. Screen glare exists. Shaky hands exist. Every critical visual signal uses redundant encoding: color + shape + position + text label. No information is conveyed by color alone.

### Principle 8: The Interface Is Not a Dashboard — It Is a Weapon
This is not a monitoring dashboard. It is a decision instrument. Every interaction — every click, drag, toggle — must produce actionable intelligence, not decorative insight.

---

# PART II — VISUAL DESIGN SYSTEM

## 3. Color Architecture

### 3.1 The Obsidian Canvas
The base application background is not merely "dark mode." It is calibrated to the specific luminance level that allows 12-hour continuous observation without eye strain, based on research from air traffic control and naval combat information centers.

| Token | Value | Purpose |
|---|---|---|
| `--canvas-deep` | `#070a13` | Primary app background. Zero glare. |
| `--surface-primary` | `rgba(15, 23, 42, 0.94)` | Card and panel surfaces. Always with `backdrop-filter: blur(20px)` for glassmorphic depth. |
| `--surface-elevated` | `rgba(30, 41, 59, 0.95)` | Hover states, active cards, expanded sections. |
| `--surface-overlay` | `rgba(9, 13, 22, 0.97)` | Modal overlays, dropdown menus, search results. |
| `--grid-line` | `rgba(56, 189, 248, 0.08)` | Structural grid lines on canvas. Barely visible. Creates depth without distraction. |
| `--border-subtle` | `rgba(51, 65, 85, 0.6)` | Default card and section borders. |
| `--border-active` | `rgba(56, 189, 248, 0.45)` | Selected states, focus rings, active elements. |

### 3.2 Threat Severity Palette (ISO 22324 Compliant)
These colors are not decorative. They are a standardized international warning language. Each color has a specific meaning, a specific glow radius, and a specific animation frequency.

| Severity | Base Color | Glow Shadow | Animation Speed | Meaning |
|---|---|---|---|---|
| CRITICAL | `#ef4444` | `0 0 16px rgba(239, 68, 68, 0.6)` | `1.4s` pulse | Immediate evacuation required. Lives at risk now. |
| HIGH | `#f97316` | `0 0 14px rgba(249, 115, 22, 0.5)` | `1.8s` pulse | Prepare for evacuation. Move vulnerable populations. |
| MODERATE | `#f59e0b` | `0 0 12px rgba(245, 158, 11, 0.4)` | `2.2s` pulse | Heightened vigilance. Monitor upstream conditions. |
| NOMINAL | `#10b981` | None | No pulse | Baseline seasonal monitoring. All systems stable. |
| TELEMETRY | `#38bdf8` | `0 0 10px rgba(56, 189, 248, 0.3)` | None | Interactive elements, XAI analysis, informational data. |

**Critical rule:** Green and Cyan are the dominant interface colors during normal operations. Red and Orange appear *only* when verified physical threat conditions are detected.

### 3.3 Text Hierarchy

| Token | Value | Usage |
|---|---|---|
| `--text-primary` | `#f8fafc` | Headlines, village names, primary labels. |
| `--text-secondary` | `#94a3b8` | Supporting descriptions, secondary metrics. |
| `--text-muted` | `#64748b` | Tertiary labels, timestamps, source attributions. |
| `--text-danger` | `#fca5a5` | Error messages, offline sensor warnings. |

---

## 4. Typography System

### 4.1 Font Stack
```
Primary UI:    'Inter', 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
Telemetry:     'JetBrains Mono', 'Fira Code', 'SF Mono', monospace
```

### 4.2 Type Scale

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| **Hero Metric** | `1.85rem` | `900` | `1.0` | `-0.02em` | The single largest number on screen: `77%` threat score. |
| **Section Title** | `1.15rem` | `800` | `1.2` | `0` | Panel headers: "Decision Support & XAI". |
| **Card Title** | `0.88rem` | `700` | `1.3` | `0` | Village names, subsection labels. |
| **Telemetry Value** | `0.85rem` | `700` | `1.2` | `0` | All live sensor readings: `80 mm/h`, `4.2 m`, `92%`. Set in monospace with `font-variant-numeric: tabular-nums`. |
| **Body Text** | `0.78rem` | `500` | `1.5` | `0` | Explanatory paragraphs, CAP directives. |
| **Micro Badge** | `0.68rem` | `800` | `1.0` | `0.03em` | Status pills (LIVE), rank badges (#1), category tags (ISRO-DEM). |

### 4.3 Why Tabular Numerals Matter
`font-variant-numeric: tabular-nums` forces every digit (0-9) to occupy an identical character width. Without this, when live telemetry values update every second over WebSocket — say from `11.2` to `88.9` — the digit width changes cause neighboring elements (labels, borders, buttons) to jitter and shift horizontally. This produces visual noise that causes eye fatigue within minutes.

With tabular numerals, the numbers still update in real-time, every second, continuously. The values change. But the *layout stays perfectly stable*. No jitter. No vibration. The operator's eyes can rest on a fixed spatial position and simply read the changing digits.

---

## 5. Spatial System & Layout Grid

### 5.1 Spacing Scale
All spacing uses a 4px base unit multiplied by the following factors:

| Token | Value | Usage |
|---|---|---|
| `--space-1` | `4px` | Icon-to-text gaps within tight badges. |
| `--space-2` | `8px` | Internal padding within pills and tags. |
| `--space-3` | `12px` | Card internal padding. Compact mode. |
| `--space-4` | `16px` | Section padding. Standard gap between cards. |
| `--space-5` | `24px` | Panel padding. Major section separators. |
| `--space-6` | `32px` | Page-level margins. |

### 5.2 Border Radius Tokens

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `6px` | Inline badges, tags, small pills. |
| `--radius-md` | `10px` | Cards, panels, dropdown menus. |
| `--radius-lg` | `16px` | Modals, primary action buttons. |
| `--radius-full` | `9999px` | Circular elements: avatar dots, status orbs, search bar. |

### 5.3 Shadow Hierarchy

| Token | Value | Usage |
|---|---|---|
| `--shadow-subtle` | `0 2px 8px rgba(0,0,0,0.3)` | Resting card state. |
| `--shadow-elevated` | `0 8px 24px rgba(0,0,0,0.5)` | Hover, expanded cards, dropdowns. |
| `--shadow-float` | `0 16px 36px rgba(0,0,0,0.7)` | Modals, search console, critical popups. |
| `--shadow-glow-cyan` | `0 0 20px rgba(56,189,248,0.25)` | Active/focus state for interactive elements. |
| `--shadow-glow-red` | `0 0 24px rgba(239,68,68,0.4)` | Critical threat glow on cards and markers. |

---

## 6. Motion & Animation System

### 6.1 Easing Curves
```css
--ease-snap:    cubic-bezier(0.16, 1, 0.3, 1);    /* Panel slides, drawer openings */
--ease-smooth:  cubic-bezier(0.4, 0, 0.2, 1);      /* Standard transitions */
--ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1);  /* Bouncy elements */
```

### 6.2 Duration Tokens
| Token | Value | Usage |
|---|---|---|
| `--duration-instant` | `0.12s` | Hover color changes, focus rings. |
| `--duration-fast` | `0.22s` | Card hover transforms, badge state changes. |
| `--duration-normal` | `0.35s` | Panel slide open/close, drawer collapse. |
| `--duration-slow` | `0.5s` | Modal entry, full-screen transitions. |

### 6.3 Key Animations

**Radar Ping (Dual-Ring):**
Two concentric rings expand outward from critical map markers, staggered by 650ms. This creates a continuous sonar-like pulse that draws the operator's peripheral vision to the hotspot.

**Stream Flow Pulse:**
Animated dashed stroke along river polylines. Stroke-dashoffset scrolls continuously to create the illusion of water flowing downstream. Speed increases proportionally with upstream rainfall intensity.

**Breathing Glow:**
Critical-severity cards have a subtle box-shadow oscillation — glow intensifies and fades on a 3-second cycle. Not distracting. Just enough to feel "alive" and urgent.

---

# PART III — COMPONENT SPECIFICATIONS

## 7. Top Navigation Bar (Mission Command HUD)

**Fixed position.** `height: 52px`. `z-index: 1000`. Glassmorphic surface.

### Layout: Three Horizontal Zones

**Zone A — Operational Context (Left):**
- Brand mark: wave icon + `VIGIL-FLOOD | Early Warning` text. Brand title uses gradient text.
- Basin selector dropdown: Native select styled as a pill. Shows current catchment basin name and state.
- Live status orb: `8px` pulsating dot with `animation: pulse 2s infinite`. Green = connected. Amber = degraded. Red = disconnected.

**Zone B — Intelligence HUD (Center):**
- **Critical Threat Counter:** `1 CRITICAL | 2 HIGH` — Inline capsule pills with glow borders matching severity color.
- **Peak Basin Rainfall:** `80.0 mm/h` — Monospace telemetry value. Color-coded red when exceeding 50 mm/h.
- **Peak Discharge:** `Qp: 1,450 m3/s` — The computed rational runoff peak. Monospace.
- **Lead Time Countdown:** `47 min` — The most critical number in the HUD. Larger weight (800) than neighboring pills.

**Zone C — Operational Actions (Right):**
- Role switcher: `[ Authority | Field | Citizen ]` segmented toggle. Active segment uses gradient fill.
- 2D/3D map mode toggle.
- Theme toggle (dark/light).
- Emergency CAP broadcast button: Crimson background with soft glow when threat level is CRITICAL. Otherwise, dormant with muted styling.

---

## 8. Universal Spatial Search Console

**Position:** Floating above map. `top: 14px; left: 50%; transform: translateX(-50%)`. `z-index: 800`.  
**Width:** `420px` resting, `520px` when focused (smooth width transition).

### 8.1 Search Bar Anatomy
- Left: Search icon emoji.
- Center: Input field. Placeholder text in muted color.
- Right: When empty, shows `<kbd>Ctrl+K</kbd>` shortcut badge. When populated, shows clear button.
- Global keyboard shortcut: `Ctrl+K` (Windows) / `Cmd+K` (Mac) focuses and selects all text.

### 8.2 Categorized Dropdown Results
When typing, results partition into **four visual sections** with distinct category headers:

**Section 1 — GPS Coordinates (Auto-Detection):**
Appears when input matches coordinate patterns (e.g., `31.67, 77.05`). Shows parsed lat/lng and offers direct DEM/hydro analysis.

**Section 2 — Monitored Basin Wards:**
Filters active villages from FloodContext. Shows village name, district, elevation, and live threat score badge.

**Section 3 — ISRO 147 Vulnerable Mountain Districts:**
Matches against a curated catalog of ISRO-identified high-risk mountain districts. Shows atlas reference code and vulnerability class.

**Section 4 — OpenStreetMap Geocoder:**
Fallback global geocoding via Nominatim API for any Indian location.

### 8.3 Interaction: Camera Fly-To
Selecting any result triggers `map.flyTo([lat, lng], 13.5, { duration: 1.5 })` — a smooth 60fps camera animation. On arrival, a brief radar-ping glowing animation marks the target coordinate.

---

## 9. Left Panel: Basin Catchment Ledger

**Width:** `340px`. Scrollable. `z-index: 200`.

### 9.1 Panel Header
- Title: Basin name and state abbreviation.
- Sub-header: Monitored village count, total catchment population, active IoT sensor count.
- Basin quick-switch tab bar for multi-basin deployments.

### 9.2 Village Threat Cards
Sorted descending by real-time risk percentage. Each card contains:

**Left Column — Circular SVG Risk Ring:**
- `42px` diameter SVG circle.
- `stroke-dasharray` and `stroke-dashoffset` computed from risk percentage.
- Stroke color transitions through severity palette: green to yellow to orange to red.
- Center text: The percentage number (e.g., `77`) in bold telemetry font.

**Right Column — Telemetry Summary:**
- **Row 1:** Village name (bold) + Ward identifier.
- **Row 2:** Risk level badge pill (colored background with severity text).
- **Row 3:** Key metrics in compact chip layout:
  - Rain intensity. Red text if >50 mm/h.
  - Soil saturation. Orange text if >80%.
  - River stage. Red text if >3.0m (danger threshold).
- **Row 4:** Evacuation lead time countdown.

**Card States:**
- **Default:** Primary surface background, subtle border.
- **Hover:** `translateY(-2px)`, elevated shadow, border shifts to severity color.
- **Selected:** Left border thickens to `4px solid` severity color. Background intensifies. Glow shadow activates. Map camera flies to village.

---

## 10. Central Viewport: GIS Map Engine

**Area:** Fills all remaining horizontal space between left panel and right drawer. Full vertical height below navbar, above sandbox dock.

### 10.1 2D Tactical Mode (Leaflet.js)
- Default basemap: Google FloodHub satellite tile layer with dark filter overlay.
- Alternative basemaps: CartoDB Dark, ESRI Satellite, OpenTopoMap, Stamen Terrain.
- Overlays: OpenWeatherMap precipitation radar, RainViewer Doppler nowcast tiles.

### 10.2 3D Topographic Mode (MapLibre GL JS)
- Terrain RGB elevation tiles providing real 3D extrusion of mountain valley walls.
- Interactive pitch and bearing controls for dramatic gorge visualization.
- 3D labels floating above village markers showing name and threat score.

### 10.3 Layer Groups (Toggle-able)
1. **Hazard Zones:** Concentric 3-tier inundation/slope polygons (Red/Orange/Green).
2. **Hexagonal Risk Grid:** Google Flood Hub-style hex cells color-coded by severity.
3. **River Drainage Streams:** Multi-layer animated polylines with flow direction chevrons.
4. **Safe Shelters:** Markers at designated high-ground refuge points.
5. **IoT Sensor Nodes:** Markers at river gauge and rain gauge positions.
6. **Evacuation Routes:** Dashed green polylines from village to nearest safe shelter.
7. **Elevation Contours:** Topographic contour lines at 50m intervals.
8. **Doppler Radar Overlay:** Semi-transparent precipitation radar imagery.

### 10.4 Map Resize Behavior
When the right drawer opens or closes, the map container width changes. A `ResizeObserver` on the map container calls `map.invalidateSize()` to prevent grey/blank tile rendering. This is critical — without it, the map breaks visually on every drawer toggle.

---

## 11. Map Symbols & Hazard Markers

### 11.1 Geometry-Coded Hazard Shapes
To ensure color-blind accessibility, each hazard type uses a distinct geometric shape in addition to color:

| Hazard Type | Shape | When Applied |
|---|---|---|
| **Landslide / Debris Flow** | Equilateral Triangle | Slope > 35 degrees, high historical landslide count. |
| **Flash Flood / Cloudburst** | 45-degree Rotated Diamond | Valley floor, proximity to river, high rainfall. |
| **Multi-Hazard (GLOF + Slope)** | Hexagon | Combined steep slope + high rainfall + river proximity. |

Each marker consists of:
- **Badge:** `28px` colored shape with white `2px` border.
- **Elevation Tag:** Small rounded pill below the badge showing elevation and threat percentage.
- **Radar Rings (Critical/High only):** Two concentric expanding rings creating sonar-like attention pulse.

### 11.2 Marker States
- **Resting:** Badge visible with elevation tag. No animation (Nominal/Moderate severity).
- **Alert Active (High/Critical):** Dual radar rings pulsate. Badge glows with severity shadow.
- **Hover:** Scale `1.22x`, elevated `translateY(-4px)`, z-index jumps to top layer.
- **Selected (Clicked):** Expanded rich tooltip card appears with full telemetry breakdown, evacuation window countdown, and designated refuge allocation.

### 11.3 Expanded Tooltip Card Structure
On hover, a glassmorphic tooltip card appears above the marker showing:
- Village name with geometry shape icon
- Severity level and percentage
- Evacuation window countdown
- Elevation and slope metrics

### 11.4 Hydrodynamic River Flow Vectors
River centerlines are rendered as multi-layer polylines:
1. **Base channel:** Wide (12px), dark blue, opacity 0.85.
2. **Core flow track:** Medium (6px), cyan, opacity 0.9.
3. **Animated pulse line:** Narrow (3px), white, with scrolling stroke-dashoffset animation.
4. **Directional chevrons:** SVG arrow markers placed at regular intervals, rotated to match downstream bearing.

Flow animation speed increases proportionally with upstream rainfall rate.

---

## 12. Right Drawer: Decision Support & XAI Engine

**Width:** `420px`. Slides horizontally from right edge.  
**Collapse behavior:** `transform: translateX(100%)` to `translateX(0)` with snap easing curve.  
**Collapse button:** Right-aligned chevron `Collapse >` / `< Expand`.

### 12.1 Content Hierarchy (Top to Bottom)

**Block 1 — Evacuation Countdown:**
- Large countdown number: `47 MIN` in hero metric font (1.85rem, weight 900).
- Label: "Until Forecasted Peak Crest Arrival".
- Progress bar showing time elapsed vs. total available window.

**Block 2 — TreeSHAP XAI Feature Attribution:**
- Horizontal waterfall bar chart.
- Each factor is a row with:
  - Meteorological icon (emoji).
  - Factor name: "1h Extreme Precipitation".
  - Directional impact tag: `+42%` (red, positive driver) or `-12%` (green, dampener).
  - Horizontal bar proportional to impact magnitude, color-coded by direction.
- Baseline annotation: "Regional historical baseline: 18%".
- Net computed score: Large bold badge — "NET: 77% CRITICAL".

**Block 3 — IoT Sensor Health Grid:**
- Grid of sensor cards (4-column layout).
- Each card: Sensor type icon, current reading, status dot (green/amber/red).
- Offline sensors: Amber dashed border, "FALLBACK ACTIVE" label, switch to upstream radar data source.

**Block 4 — Designated Refuge Allocation:**
- Selected village's nearest safe high-ground shelter.
- Name, elevation, capacity, safety verification status.
- Evacuation route: Named road/path with distance and estimated walking time.

**Block 5 — CAP Alert Composer:**
- Pre-filled emergency message template based on current telemetry.
- One-click broadcast: SMS gateway + Cell Broadcast + CAP XML feed.
- Preview pane showing the exact multilingual message citizens will receive.

---

## 13. Bottom Dock: "What-If" Simulation Sandbox

**Position:** Docked to bottom of viewport. `z-index: 750`.  
**Collapsed state:** Thin `44px` bar showing compact preview of current simulation parameters.  
**Expanded state:** Full control deck with sliders, presets, and hydrograph canvas.

### 13.1 Quick-Trigger Scenario Chips
Four preset buttons that instantly apply extreme simulation parameters:

| Chip | Parameters Applied |
|---|---|
| `Baseline Reset` | Rain: 15 mm/h, Soil: 42%, Surge: 1.1 m |
| `Cloudburst (80mm/h)` | Rain: 80 mm/h, Soil: 92%, Surge: 4.2 m |
| `Monsoon Saturation (95%)` | Rain: 68 mm/h, Soil: 95%, Surge: 2.8 m |
| `Dam Breach / GLOF` | Rain: 145 mm/h, Soil: 98%, Surge: 5.8 m |

### 13.2 Tactile Glassmorphic Sliders
Three continuous sliders with **dynamic color track gradients:**
- **Rainfall Intensity:** 0 to 160 mm/h. Track transitions: Cyan to Amber to Crimson as value increases.
- **Soil Moisture Saturation:** 15% to 98%. Same gradient logic.
- **River Surge Stage:** 0.5 m to 6.0 m. Danger threshold line at 3.0 m marked on track.

Each slider has:
- Left label: Emoji + metric name.
- Right value: Current value in monospace telemetry font, color-coded by severity.
- Custom thumb: 16px circular glassmorphic knob with active glow on drag.

### 13.3 Live CWC Hydrograph Canvas
A canvas element rendering two curves in real-time:
- **Solid cyan line:** Observed water stage over the past 6 hours up to NOW.
- **Dashed amber/red line:** AI kinematic peak forecast from NOW to +6 hours.
- **Danger threshold:** Horizontal red dashed line at 3.0m with label.
- **NOW marker:** White dot at the intersection of observed and forecast curves.
- **Peak annotation:** Time-to-peak and peak stage value labeled on the forecast curve.

The canvas re-renders on every slider change within 120ms.

---

# PART IV — INTERACTION STATES & EDGE CASES

## 14. Loading States
- **Initial app load:** Full-screen obsidian canvas with centered brand mark and pulsating "Connecting to Basin Telemetry..." text. Skeleton card outlines in left panel.
- **Village selection loading:** Selected card shows inline spinner. Map camera begins flying before data returns.
- **Search loading:** Spinner emoji replaces clear button during geocoding API call.

## 15. Empty States
- **No villages loaded:** Left panel shows illustration with text: "No basin telemetry available. Select a monitored catchment from the header dropdown."
- **No village selected (Right drawer):** Shows national-level system status with "Select a village from the map or left panel to view hyper-local decision intelligence."
- **Search no results:** Dropdown shows: "No matching locations found. Try a different search term or paste GPS coordinates directly."

## 16. Error States
- **WebSocket disconnection:** Navbar live status orb turns red. Banner appears below navbar: "Real-time telemetry connection lost. Attempting reconnect..." with auto-retry.
- **API failure:** Affected component shows inline error with retry button. Never a full-screen crash.
- **React component crash:** ErrorBoundary catches and displays developer-friendly stack trace with "Reload Dashboard" button.

## 17. Sensor Offline State
When a river pressure transducer or acoustic gauge is marked OFFLINE:
- Sensor card in right drawer: Amber dashed border, "SENSOR OFFLINE" badge.
- "FALLBACK ACTIVE" label with upstream radar/satellite data source attribution.
- XAI attribution panel: Uncertainty confidence interval widens (shown as plus/minus range on the bar).
- Simulation button: "Simulate Sensor Outage (Test Fallback)" for training operators.

---

# PART V — ROLE-BASED VIEWS

## 18. Authority Mode (State/District Disaster Commissioner)
Full access to all controls: simulation sliders, CAP alert dispatch, sensor toggles, multi-basin switching, methodology modals, geomorphic zonation overlays. This is the complete command center.

## 19. Aapda Mitra Mode (NDMA Field Volunteer)
Streamlined mobile-first interface focused on:
- Which villages need immediate attention (ranked card list).
- Where are the designated shelters and how to reach them.
- Road blockage and accessibility status.
- Simplified threat level indicator (Red/Yellow/Green).
- AI chatbot assistant for quick field queries.

## 20. Citizen Safety Mode
Maximally simplified:
- Large 3-color safety dial: "Am I in danger?"
- Turn-by-turn walking directions to nearest designated high-ground shelter.
- Emergency SOS beacon with GPS coordinates.
- Multilingual support (Hindi, English, regional languages).
- Works offline after initial load.

---

# PART VI — RESPONSIVE BREAKPOINTS

| Breakpoint | Width | Layout Changes |
|---|---|---|
| **Desktop XL** | > 1440px | Full 3-column layout: Left panel + Map + Right drawer + Bottom sandbox. |
| **Desktop** | 1024px to 1440px | Same layout, right drawer overlays map instead of shrinking it. |
| **Tablet** | 768px to 1024px | Left panel collapses to icon bar. Right drawer becomes full-width overlay. Bottom sandbox hides. |
| **Mobile** | < 768px | Tab-based navigation: Map / Villages / Telemetry. Full-width views for each tab. |

---

# PART VII — PERFORMANCE REQUIREMENTS

| Metric | Target |
|---|---|
| **First Contentful Paint** | < 1.5s |
| **Time to Interactive** | < 3.0s |
| **WebSocket Latency (Telemetry Update)** | < 200ms end-to-end |
| **Map Tile Load (First Paint)** | < 2.0s |
| **Slider-to-Hydrograph Re-render** | < 120ms |
| **Camera Fly-To Animation** | 60fps, no frame drops |
| **CSS Animations** | GPU-accelerated (transform, opacity only). No width/height animations on critical paths. |

---

# PART VIII — AI DESIGN PROMPT (COPY-PASTE READY)

Use the following prompt when generating UI designs with any AI tool (Claude, GPT-4o, Midjourney, v0.dev, Bolt.new, Figma AI, Vercel AI):

---

```
You are a Senior UI/UX Designer with 20+ years of experience building
mission-critical command centers for defense, aerospace, and natural
disaster response systems. Your prior work includes interfaces for
NASA Mission Control, Bloomberg Terminal, Palantir Foundry, and Google
Flood Hub.

Design the complete, production-grade web interface for
"VIGIL-FLOOD: AI Multi-Hazard & Flash Flood Early Warning Command Center"
following these exact specifications:

ATMOSPHERE:
- Deep obsidian canvas (#070a13) with glassmorphic cards
  (rgba(15,23,42,0.94) + 20px blur). Cybernetic cyan accent grid.
- The interface must feel like a defense-grade tactical operations room.
  Calm and dark in normal state. Breathing crimson when lives are at risk.

LAYOUT (Left to Right):
1. LEFT PANEL (340px): Scrollable village threat cards ranked by risk.
   Each card has a 42px SVG circular progress ring (green to red), village
   name, telemetry chips (rain, soil, river, slope), and evac countdown.
2. CENTER: Full GIS map (Leaflet 2D or MapLibre 3D DEM) with:
   - Geometry-coded markers (Triangle=landslide, Diamond=flood, Hexagon=GLOF)
   - Dual-ring radar pulse on critical hotspots
   - Animated river flow vectors with directional chevrons
   - 3-tier concentric hazard zone polygons (Red/Orange/Green)
3. RIGHT DRAWER (420px, slide-in): TreeSHAP XAI waterfall bars showing
   WHY the AI predicts this risk (+42% rain, +28% soil, -12% elevation),
   evacuation countdown, sensor health grid, CAP alert composer.
4. BOTTOM DOCK: What-If simulation sandbox with glassmorphic sliders
   (Rain, Soil, River Surge) that have cyan to amber to crimson color tracks,
   scenario preset chips (Cloudburst, Monsoon, GLOF, Baseline), and
   live CWC hydrograph canvas.
5. TOP NAVBAR: 3-zone HUD -- basin context (left), live threat intel
   pills (center), role switcher + CAP alert CTA (right).

FLOATING ELEMENTS:
- Universal search console (top center, Ctrl+K shortcut) with 3 categorized
  dropdown sections: Monitored Wards, ISRO 147 Districts, GPS Coordinates.

TYPOGRAPHY:
- Inter/Outfit for UI. JetBrains Mono with tabular-nums for sensor values.
- Hero metric: 1.85rem/900. Telemetry: 0.85rem/700 mono. Micro badge: 0.68rem/800.

COLORS (ISO 22324):
- Critical: #ef4444 with glow. High: #f97316. Moderate: #f59e0b.
  Nominal: #10b981. Telemetry Cyan: #38bdf8.
- Red and Orange appear ONLY for verified physical threats. Never decorative.

MOTION:
- Spring snap easing: cubic-bezier(0.16, 1, 0.3, 1) for all panel slides.
- Radar ping: dual expanding rings at 2.0s with 650ms stagger.
- Stream flow: animated stroke-dashoffset on river polylines.

The result must look like it belongs in a real government emergency
operations center -- not a startup dashboard. Premium. Precise. Life-saving.
```

---

*End of Vigil-Flood UI/UX Master Specification.*
