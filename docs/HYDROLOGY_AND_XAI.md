# VIGIL-FLOOD: Hydrological & Explainable AI (XAI) Architecture Spec

## 1. CWC Rational Runoff & Hydrodynamics
VIGIL-FLOOD implements the **Central Water Commission (CWC)** rational runoff framework adapted for steep mountain micro-catchments:

$$Q_p = 0.278 \cdot C \cdot I \cdot A$$

Where:
* **$Q_p$**: Peak surface runoff discharge ($\text{m}^3/\text{s}$).
* **$C$**: Dynamic runoff coefficient based on antecedent soil moisture ($S$):
  $$C = \min(0.92, 0.25 + 0.65 \cdot S_{\text{frac}})$$
* **$I$**: Rainfall intensity ($\text{mm/h}$) ingested via IMD radar & automated gauge feeds.
* **$A$**: Catchment area ($\text{km}^2$) delineated across 26 high-risk pilot basins.

### Channel Flow & Manning's Velocity
Valley river stage dynamics calculate velocity ($V$) using Manning's equation:

$$V = \frac{1}{n} \cdot R_h^{2/3} \cdot S^{1/2}$$

Bridge clearance ($H_{\text{clear}}$) evaluates real-time deck submersion risk:
$$H_{\text{clear}} = H_{\text{deck}} - H_{\text{stage}}$$

---

## 2. TreeSHAP Feature Attribution (Explainable AI)
To guarantee transparency during active disaster evacuations, VIGIL-FLOOD couples an **XGBoost** multi-hazard classifier with **TreeSHAP (SHapley Additive exPlanations)**.

### Game-Theoretic Feature Weights
1. **Soil Saturation Index (Antecedent Moisture)**: $\phi_1 \approx +24\%$
2. **Rainfall Intensity Gradient ($\Delta I / \Delta t$)**: $\phi_2 \approx +22\%$
3. **Terrain Slope & Topographic Wetness Index (TWI)**: $\phi_3 \approx +18\%$
4. **Current River Stage vs. HFL (High Flood Level)**: $\phi_4 \approx +16\%$
5. **Upstream Deforestation / Land-Cover Vulnerability**: $\phi_5 \approx +10\%$

---

## 3. NDMA CAP-SACHET Protocol Dispatch
Alerts comply with the **Common Alerting Protocol (CAP v1.2)** format:
* **Urgency**: `Immediate`
* **Severity**: `Extreme` | `Severe`
* **Certainty**: `Observed` | `Likely`
* **Handling Protocol**: Cell Broadcast + Geofenced SMS for mountain valleys.
