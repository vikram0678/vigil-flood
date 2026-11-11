import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFlood } from '../context/FloodContext';

interface ArchitectureNode {
  id: string;
  name: string;
  part: 'ingestion' | 'ai_core' | 'dissemination';
  pos: [number, number, number];
  color: string;
  shape: 'satellite' | 'sensor' | 'diamond' | 'matrix' | 'hub' | 'ai_engine' | 'dataset' | 'dossier' | 'cap_tower';
  badge: string;
  role: string;
  details: string;
}

const NODES: ArchitectureNode[] = [
  // ─── 1. MULTI-SOURCE INGESTION PART ───
  {
    id: 'user_sensor',
    name: 'User / IoT Sensor Ground Nodes',
    part: 'ingestion',
    pos: [-10, 2.2, -2.5],
    color: '#94a3b8',
    shape: 'sensor',
    badge: '10s Telemetry',
    role: 'Local telemetry uplink from river banks and field users',
    details: 'Ultrasonic acoustic gauges measuring river stage height and community observer alerts.'
  },
  {
    id: 'imd_doppler',
    name: 'IMD Doppler & GPM Satellite',
    part: 'ingestion',
    pos: [-8.5, 2.2, 2.5],
    color: '#eab308',
    shape: 'satellite',
    badge: '0.1° / Hourly',
    role: 'NWP rainfall intensity & atmospheric moisture tracking',
    details: 'NASA/JAXA GPM Core Observatory coupled with IMD Doppler X/S-band radar velocity.'
  },
  {
    id: 'iot_soil_river',
    name: 'IoT River & Soil Moisture',
    part: 'ingestion',
    pos: [-10, -1.8, -1.5],
    color: '#64748b',
    shape: 'sensor',
    badge: 'SMAP + Gauges',
    role: 'Surface infiltration & river baseline water telemetry',
    details: 'NASA SMAP L4 top-soil moisture combined with ultrasonic river stage sensors.'
  },
  {
    id: 'surge_filter',
    name: 'Threshold & Surge Filter',
    part: 'ingestion',
    pos: [-6.5, 0, 0],
    color: '#22c55e',
    shape: 'diamond',
    badge: '40 mm/h Split',
    role: 'Dual-route dynamic kinematic flow classifier',
    details: 'Evaluates instantaneous rate of rise. If Rain > 40 mm/h, fast-tracks to Critical Bypass.'
  },
  {
    id: 'feature_matrix',
    name: 'Dynamic Feature Matrix',
    part: 'ingestion',
    pos: [-3.8, 0, 0],
    color: '#f97316',
    shape: 'matrix',
    badge: '13-Feature Vector',
    role: 'Normalizes hydrometeorological input tensor for AI',
    details: 'Synthesizes rain_1h..24h, slope_deg, distance_to_stream, soil_moisture into unified tensor.'
  },

  // ─── 2. AI PREDICTION & EXPLAINABILITY PART ───
  {
    id: 'fastapi_hub',
    name: 'FastAPI Microservice Hub',
    part: 'ai_core',
    pos: [-1.2, 0.8, 0],
    color: '#ec4899',
    shape: 'hub',
    badge: 'ASGI <45ms',
    role: 'Asynchronous orchestration & model dispatch gateway',
    details: 'High-throughput FastAPI microservices routing telemetry, tile caching, and WebSocket feeds.'
  },
  {
    id: 'ai_engine',
    name: 'Dual-Hazard AI Engine',
    part: 'ai_core',
    pos: [1.8, 0.8, 0],
    color: '#06b6d4',
    shape: 'ai_engine',
    badge: 'XGBoost + LSTM + TreeSHAP',
    role: 'Coupled flash flood & landslide hazard score prediction',
    details: 'PyTorch 2-Layer LSTM sequence model + Gradient Boosted Trees with Platt scaling and TreeSHAP.'
  },
  {
    id: 'hist_datasets',
    name: 'Historical Disaster Datasets',
    part: 'ai_core',
    pos: [-0.5, -2.4, -2.2],
    color: '#eab308',
    shape: 'dataset',
    badge: '1970–2024 Records',
    role: 'Historical ground truth training & benchmark calibration',
    details: 'Beas & Himalayan historical cloudburst archives for empirical temperature scaling.'
  },
  {
    id: 'isro_atlas',
    name: 'ISRO Landslide Atlas',
    part: 'ai_core',
    pos: [-0.5, -2.4, 2.2],
    color: '#eab308',
    shape: 'dataset',
    badge: 'NRSC Zonation',
    role: 'High-altitude landslide susceptibility susceptibility vectors',
    details: 'ISRO National Remote Sensing Centre landslide zonation maps across hilly catchments.'
  },
  {
    id: 'dem_topography',
    name: '30m DEM Topography & ISRO DEM',
    part: 'ai_core',
    pos: [1.8, -2.4, -1.8],
    color: '#38bdf8',
    shape: 'dataset',
    badge: 'Copernicus 30m',
    role: 'Slope, flow accumulation, and ravine gradients',
    details: 'Copernicus 30m Global DEM calculating hydraulic gradient and runoff coefficients.'
  },
  {
    id: 'pilot_villages',
    name: '26 Pilot Mountain Villages',
    part: 'ai_core',
    pos: [1.8, -2.4, 1.8],
    color: '#86efac',
    shape: 'dataset',
    badge: 'Himalayan Pilot',
    role: 'Ultra-local spatial polygons & vulnerability profiles',
    details: 'Settlements along Beas, Teesta, Mandakini with demographic and shelter coordinates.'
  },

  // ─── 3. DECISION SUPPORT & WARNING DISSEMINATION PART ───
  {
    id: 'tactical_dossier',
    name: 'Interactive 2D/3D Tactical Dossier',
    part: 'dissemination',
    pos: [5.8, 0, 0],
    color: '#eab308',
    shape: 'dossier',
    badge: 'MapLibre + Leaflet',
    role: 'Command dashboard visualizing lead-time & dynamic flood hydrograph',
    details: 'Photorealistic hillshade 3D terrain, contour vectors, and rational runoff hydrograph.'
  },
  {
    id: 'cap_sachet',
    name: 'CAP-SACHET & Cell Broadcast SMS',
    part: 'dissemination',
    pos: [9.2, 0, 0],
    color: '#f97316',
    shape: 'cap_tower',
    badge: 'NDMA ITU-T X.1303',
    role: 'Multi-lingual emergency sirens, SMS geofencing & NDRF dispatch',
    details: 'Automated Common Alerting Protocol XML broadcasts alerting residents within 10-30 min window.'
  }
];

export const SystemTopology3D: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { simulation, setSimulationValue } = useFlood();

  const [selectedNode, setSelectedNode] = useState<ArchitectureNode>(NODES[6]); // Default to AI Engine
  const [cameraView, setCameraView] = useState<'full' | 'ingestion' | 'ai_core' | 'dissemination'>('full');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [isSimulatedCloudburst, setIsSimulatedCloudburst] = useState<boolean>(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 7.5, 17));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const currentLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const pulsesRef = useRef<{ mesh: THREE.Mesh; curve: THREE.QuadraticBezierCurve3; t: number; speed: number; isCritical?: boolean }[]>([]);
  const diamondRef = useRef<THREE.Mesh | null>(null);
  const towerRingsRef = useRef<THREE.Mesh[]>([]);

  const isRainCritical = isSimulatedCloudburst || (simulation?.rain ?? 0) > 40;
  const currentRainVal = isSimulatedCloudburst ? 78.5 : (simulation?.rain ?? 15.0);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera & WebGL Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#030712');
    scene.fog = new THREE.FogExp2('#030712', 0.022);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;
    camera.position.set(0, 8, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Cybernetic Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 2.0);
    dirLight1.position.set(10, 20, 15);
    scene.add(dirLight1);
    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 1.2);
    dirLight2.position.set(-15, -10, -10);
    scene.add(dirLight2);

    // 3. Three 3D Glass Platforms (Directly matching the 3 Slide Pillars)
    const platforms = [
      { x: -8.0, label: '1. MULTI-SOURCE INGESTION PART', color: 0x0284c7, width: 8.5 },
      { x: 0.5, label: '2. AI PREDICTION & EXPLAINABILITY PART', color: 0x9333ea, width: 7.5 },
      { x: 7.5, label: '3. DECISION SUPPORT & DISSEMINATION', color: 0xd97706, width: 6.0 }
    ];

    platforms.forEach(p => {
      // Platform Plate
      const plateGeo = new THREE.BoxGeometry(p.width, 0.15, 8.5);
      const plateMat = new THREE.MeshStandardMaterial({
        color: p.color,
        roughness: 0.2,
        metalness: 0.7,
        transparent: true,
        opacity: 0.14
      });
      const plate = new THREE.Mesh(plateGeo, plateMat);
      plate.position.set(p.x, -3.8, 0);
      scene.add(plate);

      // Glowing Neon Perimeter Edges
      const edges = new THREE.EdgesGeometry(plateGeo);
      const lineMat = new THREE.LineBasicMaterial({ color: p.color, transparent: true, opacity: 0.6 });
      const wireframe = new THREE.LineSegments(edges, lineMat);
      wireframe.position.copy(plate.position);
      scene.add(wireframe);

      // Cybernetic Grid on Top
      const grid = new THREE.GridHelper(p.width, 8, p.color, 0x1e293b);
      grid.position.set(p.x, -3.7, 0);
      grid.material.opacity = 0.35;
      grid.material.transparent = true;
      scene.add(grid);
    });

    // 4. Construct 3D Process Flow Nodes
    const nodeMap = new Map<string, THREE.Mesh>();
    const lookup = new Map<string, ArchitectureNode>();

    NODES.forEach(n => {
      lookup.set(n.id, n);
      let mesh: THREE.Mesh;

      if (n.shape === 'diamond') {
        // Threshold & Surge Filter Diamond
        const geo = new THREE.OctahedronGeometry(0.7, 0);
        const mat = new THREE.MeshStandardMaterial({
          color: isRainCritical ? 0xef4444 : 0x22c55e,
          emissive: isRainCritical ? 0xef4444 : 0x22c55e,
          emissiveIntensity: 0.7,
          roughness: 0.1,
          metalness: 0.9
        });
        mesh = new THREE.Mesh(geo, mat);
        diamondRef.current = mesh;
      } else if (n.shape === 'hub') {
        // FastAPI Cylinder Server Hub
        const geo = new THREE.CylinderGeometry(0.65, 0.65, 1.1, 32);
        const mat = new THREE.MeshStandardMaterial({
          color: 0xec4899,
          emissive: 0xdb2777,
          emissiveIntensity: 0.5,
          metalness: 0.8,
          roughness: 0.2
        });
        mesh = new THREE.Mesh(geo, mat);
      } else if (n.shape === 'ai_engine') {
        // Dual-Hazard AI Engine Crystalline Core
        const geo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          emissive: 0x0891b2,
          emissiveIntensity: 0.6,
          metalness: 0.85,
          roughness: 0.15
        });
        mesh = new THREE.Mesh(geo, mat);

        // Orbiting Neural Rings around AI Engine
        const ringGeo = new THREE.TorusGeometry(0.95, 0.03, 16, 64);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 3;
        mesh.add(ring);
      } else if (n.shape === 'cap_tower') {
        // CAP-SACHET Emergency Radio Tower
        const geo = new THREE.ConeGeometry(0.65, 1.6, 8);
        const mat = new THREE.MeshStandardMaterial({
          color: 0xf97316,
          emissive: 0xea580c,
          emissiveIntensity: 0.6,
          metalness: 0.9
        });
        mesh = new THREE.Mesh(geo, mat);

        // Pulsing Radio Broadcast Rings
        const rings: THREE.Mesh[] = [];
        for (let r = 0; r < 3; r++) {
          const rGeo = new THREE.RingGeometry(0.8 + r * 0.45, 0.86 + r * 0.45, 32);
          const rMat = new THREE.MeshBasicMaterial({
            color: isRainCritical ? 0xef4444 : 0xf97316,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6 - r * 0.18
          });
          const rMesh = new THREE.Mesh(rGeo, rMat);
          rMesh.rotation.x = Math.PI / 2;
          rMesh.position.y = 0.5;
          mesh.add(rMesh);
          rings.push(rMesh);
        }
        towerRingsRef.current = rings;
      } else if (n.shape === 'satellite') {
        // IMD Doppler Satellite Dish
        const geo = new THREE.SphereGeometry(0.55, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.6);
        const mat = new THREE.MeshStandardMaterial({ color: 0xeab308, emissive: 0xca8a04, emissiveIntensity: 0.6, side: THREE.DoubleSide });
        mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 4;
      } else if (n.shape === 'dossier') {
        // Holographic 2D/3D Tactical Tablet
        const geo = new THREE.BoxGeometry(1.2, 0.8, 0.1);
        const mat = new THREE.MeshStandardMaterial({ color: 0xeab308, emissive: 0xb45309, emissiveIntensity: 0.5 });
        mesh = new THREE.Mesh(geo, mat);
      } else {
        // Default Sensor / Matrix Sphere
        const geo = new THREE.SphereGeometry(n.shape === 'matrix' ? 0.65 : 0.48, 24, 24);
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(n.color),
          emissive: new THREE.Color(n.color),
          emissiveIntensity: 0.5,
          metalness: 0.7,
          roughness: 0.3
        });
        mesh = new THREE.Mesh(geo, mat);
      }

      mesh.position.set(...n.pos);
      (mesh as any).nodeId = n.id;
      scene.add(mesh);
      nodeMap.set(n.id, mesh);

      // Label Pedestal Base
      const baseGeo = new THREE.CylinderGeometry(0.4, 0.45, 0.1, 16);
      const baseMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.set(n.pos[0], -3.6, n.pos[2]);
      scene.add(base);

      // Vertical Stanchion Beam
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(n.pos[0], -3.6, n.pos[2]),
        new THREE.Vector3(...n.pos)
      ]);
      const stanchion = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.5 }));
      scene.add(stanchion);
    });

    // 5. Connect Spline Pipelines with Branching Paths
    const connections: { src: string; dst: string; color: number; isCriticalBranch?: boolean; isNormalBranch?: boolean }[] = [
      { src: 'user_sensor', dst: 'surge_filter', color: 0x38bdf8 },
      { src: 'imd_doppler', dst: 'surge_filter', color: 0xeab308 },
      { src: 'iot_soil_river', dst: 'surge_filter', color: 0x64748b },
      // Branch 1: Normal Range (Upper curve)
      { src: 'surge_filter', dst: 'feature_matrix', color: 0x22c55e, isNormalBranch: true },
      // Branch 2: Critical Rain Bypass (>40mm/h - Lower intense curve)
      { src: 'surge_filter', dst: 'feature_matrix', color: 0xef4444, isCriticalBranch: true },
      { src: 'feature_matrix', dst: 'fastapi_hub', color: 0xf97316 },
      { src: 'fastapi_hub', dst: 'ai_engine', color: 0xec4899 },
      // Knowledge Bases feeding into AI Engine
      { src: 'hist_datasets', dst: 'ai_engine', color: 0xeab308 },
      { src: 'isro_atlas', dst: 'ai_engine', color: 0xeab308 },
      { src: 'dem_topography', dst: 'ai_engine', color: 0x38bdf8 },
      { src: 'pilot_villages', dst: 'ai_engine', color: 0x86efac },
      // Output Dissemination
      { src: 'ai_engine', dst: 'tactical_dossier', color: 0x06b6d4 },
      { src: 'tactical_dossier', dst: 'cap_sachet', color: 0xf97316 }
    ];

    const pulses: { mesh: THREE.Mesh; curve: THREE.QuadraticBezierCurve3; t: number; speed: number; isCritical?: boolean }[] = [];

    connections.forEach(conn => {
      const src = lookup.get(conn.src);
      const dst = lookup.get(conn.dst);
      if (!src || !dst) return;

      const p1 = new THREE.Vector3(...src.pos);
      const p2 = new THREE.Vector3(...dst.pos);

      // Offset branches cleanly
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      if (conn.isNormalBranch) {
        mid.y += 0.9; // Normal arc rises upward
      } else if (conn.isCriticalBranch) {
        mid.y -= 0.9; // Critical arc drops downward
      }

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const points = curve.getPoints(24);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: conn.color,
        transparent: true,
        opacity: conn.isCriticalBranch ? (isRainCritical ? 0.9 : 0.15) : 0.4,
        linewidth: conn.isCriticalBranch && isRainCritical ? 2.5 : 1
      });
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);

      // Energy Flow Pulse Sphere
      const pGeo = new THREE.SphereGeometry(conn.isCriticalBranch ? 0.14 : 0.1, 12, 12);
      const pMat = new THREE.MeshBasicMaterial({ color: conn.color });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.copy(p1);
      scene.add(pMesh);

      pulses.push({
        mesh: pMesh,
        curve,
        t: Math.random(),
        speed: conn.isCriticalBranch && isRainCritical ? 0.012 : 0.005 + Math.random() * 0.003,
        isCritical: conn.isCriticalBranch
      });
    });
    pulsesRef.current = pulses;

    // 6. Raycaster for Interactive Node Clicking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(Array.from(nodeMap.values()));
      if (hits.length > 0) {
        const id = (hits[0].object as any).nodeId;
        const node = lookup.get(id);
        if (node) setSelectedNode(node);
      }
    };
    container.addEventListener('pointerdown', onPointerDown);

    // 7. Animation & Camera Lerp Loop
    let angle = 0;
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Smoothly Lerp Camera Position
      camera.position.lerp(targetCamPos.current, 0.04);
      currentLookAt.current.lerp(targetLookAt.current, 0.04);
      camera.lookAt(currentLookAt.current);

      // Optional auto-rotation when full view
      if (autoRotate && cameraView === 'full') {
        angle += 0.0018;
        targetCamPos.current.x = Math.sin(angle) * 17;
        targetCamPos.current.z = Math.cos(angle) * 17;
        targetCamPos.current.y = 8 + Math.sin(angle * 0.8) * 1.5;
        targetLookAt.current.set(0, 0, 0);
      }

      // Rotate Diamond Filter
      if (diamondRef.current) {
        diamondRef.current.rotation.y += isRainCritical ? 0.04 : 0.015;
        diamondRef.current.rotation.z += 0.01;
      }

      // Expand Broadcast Shockwave Rings
      towerRingsRef.current.forEach((ring, idx) => {
        const scale = 1 + ((Date.now() * 0.002 + idx * 0.35) % 1) * 0.8;
        ring.scale.set(scale, scale, scale);
      });

      // Flow Energy Packets Along Splines
      pulses.forEach(p => {
        p.t += p.speed;
        if (p.t > 1) p.t = 0;
        p.mesh.position.copy(p.curve.getPoint(p.t));
      });

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('pointerdown', onPointerDown);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [autoRotate, isRainCritical]);

  // Camera Fly-To Preset Switcher
  const setPresetView = (view: 'full' | 'ingestion' | 'ai_core' | 'dissemination') => {
    setCameraView(view);
    setAutoRotate(false);

    if (view === 'full') {
      targetCamPos.current.set(0, 7.5, 17);
      targetLookAt.current.set(0, 0, 0);
    } else if (view === 'ingestion') {
      targetCamPos.current.set(-7.5, 3.5, 9.5);
      targetLookAt.current.set(-7.5, 0, 0);
      setSelectedNode(NODES[3]); // Focus Threshold Filter
    } else if (view === 'ai_core') {
      targetCamPos.current.set(0.5, 3.5, 9);
      targetLookAt.current.set(0.5, 0, 0);
      setSelectedNode(NODES[6]); // Focus AI Engine
    } else if (view === 'dissemination') {
      targetCamPos.current.set(7.5, 3.5, 9);
      targetLookAt.current.set(7.5, 0, 0);
      setSelectedNode(NODES[12]); // Focus CAP Tower
    }
  };

  const handleToggleCloudburst = () => {
    const next = !isSimulatedCloudburst;
    setIsSimulatedCloudburst(next);
    if (next) {
      setSimulationValue('rain', 78.5);
    } else {
      setSimulationValue('rain', 15.0);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '620px', background: '#030712', borderRadius: '12px', overflow: 'hidden' }}>
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

      {/* Top Header: Title & Camera Preset Tabs */}
      <div style={{
        position: 'absolute',
        top: '14px',
        left: '16px',
        right: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
        pointerEvents: 'none'
      }}>
        {/* Title Badge */}
        <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', fontFamily: "'Outfit', sans-serif" }}>
            ⚡ PROCESS FLOW ARCHITECTURE
          </span>
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: '12px',
            background: isRainCritical ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
            border: `1px solid ${isRainCritical ? '#ef4444' : '#22c55e'}`,
            color: isRainCritical ? '#ef4444' : '#22c55e'
          }}>
            {isRainCritical ? '🚨 CRITICAL SURGE ACTIVE (>40mm/h)' : '🟢 NORMAL TELEMETRY ROUTE'}
          </span>
        </div>

        {/* 3 Pillar Camera Presets & Test Buttons */}
        <div style={{ pointerEvents: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
          {/* Pillar Presets */}
          <div style={{ display: 'inline-flex', background: 'rgba(15, 23, 42, 0.85)', padding: '2px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => setPresetView('full')}
              style={{
                background: cameraView === 'full' ? '#38bdf8' : 'transparent',
                color: cameraView === 'full' ? '#0f172a' : '#94a3b8',
                border: 'none', padding: '4px 9px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              Overview
            </button>
            <button
              onClick={() => setPresetView('ingestion')}
              style={{
                background: cameraView === 'ingestion' ? '#0284c7' : 'transparent',
                color: cameraView === 'ingestion' ? '#ffffff' : '#94a3b8',
                border: 'none', padding: '4px 9px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              1. Ingestion
            </button>
            <button
              onClick={() => setPresetView('ai_core')}
              style={{
                background: cameraView === 'ai_core' ? '#9333ea' : 'transparent',
                color: cameraView === 'ai_core' ? '#ffffff' : '#94a3b8',
                border: 'none', padding: '4px 9px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              2. AI Core
            </button>
            <button
              onClick={() => setPresetView('dissemination')}
              style={{
                background: cameraView === 'dissemination' ? '#d97706' : 'transparent',
                color: cameraView === 'dissemination' ? '#ffffff' : '#94a3b8',
                border: 'none', padding: '4px 9px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              3. Dissemination
            </button>
          </div>

          {/* Interactive Cloudburst Injection Button */}
          <button
            onClick={handleToggleCloudburst}
            style={{
              padding: '5px 12px',
              fontSize: '0.72rem',
              fontWeight: 800,
              borderRadius: '6px',
              background: isRainCritical ? 'rgba(239, 68, 68, 0.25)' : 'rgba(56, 189, 248, 0.15)',
              border: `1px solid ${isRainCritical ? '#ef4444' : '#38bdf8'}`,
              color: isRainCritical ? '#f87171' : '#38bdf8',
              cursor: 'pointer'
            }}
          >
            {isRainCritical ? '🌱 Reset to Normal' : '⚡ Inject Cloudburst (>40mm/h)'}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#94a3b8',
                borderRadius: '6px',
                padding: '5px 10px',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Floating Bottom-Right Cybernetic HUD Card */}
      {selectedNode && (
        <div style={{
          position: 'absolute',
          bottom: '48px',
          right: '18px',
          width: '330px',
          background: 'rgba(15, 23, 42, 0.90)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${selectedNode.color}77`,
          borderRadius: '10px',
          padding: '14px',
          boxShadow: `0 12px 30px rgba(0, 0, 0, 0.8), 0 0 15px ${selectedNode.color}22`,
          pointerEvents: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
            <div>
              <div style={{ fontSize: '0.66rem', fontWeight: 800, color: selectedNode.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {selectedNode.part.replace('_', ' ').toUpperCase()} COMPONENT
              </div>
              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#ffffff', marginTop: '1px' }}>
                {selectedNode.name}
              </div>
            </div>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              background: `${selectedNode.color}22`,
              border: `1px solid ${selectedNode.color}55`,
              color: selectedNode.color
            }}>
              {selectedNode.badge}
            </span>
          </div>

          <div style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 600, marginBottom: '6px' }}>
            📌 {selectedNode.role}
          </div>

          <p style={{ fontSize: '0.74rem', color: '#cbd5e1', lineHeight: '1.4', margin: '0 0 10px 0' }}>
            {selectedNode.details}
          </p>

          {/* Dynamic Telemetry Status inside HUD */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '6px',
            padding: '8px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px'
          }}>
            <div>
              <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700 }}>RAINFALL METRIC</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: isRainCritical ? '#ef4444' : '#38bdf8' }}>
                {currentRainVal.toFixed(1)} mm/h
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700 }}>FILTER ROUTE</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: isRainCritical ? '#ef4444' : '#22c55e' }}>
                {isRainCritical ? 'CRITICAL (>40)' : 'NORMAL RANGE'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Live Event Stream Terminal Ticker */}
      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        height: '36px',
        background: 'rgba(2, 6, 23, 0.95)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        fontSize: '0.72rem',
        color: '#94a3b8',
        fontFamily: "'Courier New', monospace",
        gap: '12px',
        overflow: 'hidden',
        whiteSpace: 'nowrap'
      }}>
        <span style={{ color: '#22c55e', fontWeight: 800 }}>● LIVE EVENT STREAM:</span>
        <span style={{ color: '#e2e8f0' }}>
          {isRainCritical
            ? `[!] THRESHOLD BREACH: Rain ${currentRainVal.toFixed(1)} mm/h > 40 mm/h ➔ Fast-track CRITICAL bypass activated ➔ GBDT+LSTM dispatched ➔ CAP Broadcast Alerting active`
            : `[✓] INGESTION: GPM Sat + IMD Doppler (${currentRainVal.toFixed(1)} mm/h) ➔ Filter status: NOMINAL ➔ Feature Matrix assembled ➔ Inference latency 34ms`
          }
        </span>
      </div>
    </div>
  );
};
