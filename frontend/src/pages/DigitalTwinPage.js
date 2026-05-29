import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useAuth } from '../context/AuthContext';

export default function DigitalTwinPage() {
  const mountRef = useRef(null);
  const sceneRef = useRef({});
  const { authFetch } = useAuth();
  const [activeLayer, setActiveLayer] = useState('all');
  const [metrics, setMetrics] = useState({ traffic: 72, energy: 58, water: 41, airQuality: 88 });

  useEffect(() => {
    // Load live metrics from IoT sensors
    authFetch('/api/iot/sensors?projectId=b1000000-0000-0000-0000-000000000002')
      .then(d => { if (d.success && d.data.length) {
        const update = {};
        d.data.forEach(s => { if (s.latest_value) update[s.sensor_type] = parseFloat(s.latest_value); });
        setMetrics(m => ({ ...m, ...update }));
      }}).catch(() => {});
  }, [authFetch]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const W = container.clientWidth;
    const H = container.clientHeight;

    // ── Scene ──────────────────────────────────────────────────────────────────
    const scene    = new THREE.Scene();
    scene.background = new THREE.Color(0x060918);
    scene.fog        = new THREE.FogExp2(0x060918, 0.018);

    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 500);
    camera.position.set(0, 28, 52);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // ── Lights ─────────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x1a2a4a, 1.5));
    const dirLight = new THREE.DirectionalLight(0x4488ff, 2);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);
    const pointLight1 = new THREE.PointLight(0x10b981, 3, 40);
    pointLight1.position.set(-15, 10, -10);
    scene.add(pointLight1);
    const pointLight2 = new THREE.PointLight(0x0ea5e9, 3, 40);
    pointLight2.position.set(15, 8, 10);
    scene.add(pointLight2);

    // ── Ground grid ────────────────────────────────────────────────────────────
    const gridHelper = new THREE.GridHelper(80, 40, 0x0ea5e920, 0x0ea5e910);
    scene.add(gridHelper);

    const groundGeo  = new THREE.PlaneGeometry(80, 80);
    const groundMat  = new THREE.MeshLambertMaterial({ color: 0x080d22 });
    const ground     = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // ── Building generator ─────────────────────────────────────────────────────
    const buildings = [];
    const buildingData = [
      { x:-18, z:-18, w:6, h:22, d:6 }, { x:-10, z:-20, w:4, h:14, d:4 },
      { x:0,   z:-18, w:8, h:30, d:6 }, { x:10,  z:-18, w:5, h:18, d:5 },
      { x:18,  z:-16, w:6, h:24, d:7 }, { x:-20, z:-5,  w:4, h:12, d:4 },
      { x:-12, z:-2,  w:6, h:20, d:5 }, { x:2,   z:-5,  w:5, h:16, d:5 },
      { x:12,  z:-3,  w:7, h:28, d:6 }, { x:20,  z:-5,  w:4, h:10, d:4 },
      { x:-18, z:10,  w:5, h:15, d:5 }, { x:-8,  z:12,  w:6, h:22, d:6 },
      { x:4,   z:10,  w:4, h:12, d:4 }, { x:14,  z:12,  w:6, h:18, d:5 },
      { x:20,  z:10,  w:5, h:25, d:5 },
    ];

    buildingData.forEach(b => {
      const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const mat = new THREE.MeshPhongMaterial({
        color: 0x0d1f40, emissive: 0x051020, shininess: 30,
        transparent: true, opacity: 0.92,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.x, b.h / 2, b.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      buildings.push(mesh);

      // Window lights
      const winMat  = new THREE.MeshBasicMaterial({ color: 0x88aaff, transparent: true, opacity: 0.6 });
      const winGeo  = new THREE.BoxGeometry(b.w + 0.05, b.h, b.d + 0.05);
      const windows = new THREE.Mesh(winGeo, winMat);
      windows.position.copy(mesh.position);
      scene.add(windows);
    });

    // ── Roads ──────────────────────────────────────────────────────────────────
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x0a1428 });
    [
      { x:0, z:0, w:80, h:0.05, d:5 },
      { x:0, z:0, w:5, h:0.05, d:80 },
      { x:-6, z:0, w:80, h:0.05, d:2 },
      { x:6, z:0, w:80, h:0.05, d:2 },
    ].forEach(r => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(r.w, r.h, r.d), roadMat);
      mesh.position.set(r.x, 0.01, r.z);
      scene.add(mesh);
    });

    // ── IoT sensor nodes ───────────────────────────────────────────────────────
    const sensorPositions = [
      { pos: [-10, 1, 5],  color: 0x10b981 },
      { pos: [10,  1, -5], color: 0x0ea5e9 },
      { pos: [0,   1, 15], color: 0xf59e0b },
      { pos: [-5,  1, -15],color: 0x10b981 },
    ];
    sensorPositions.forEach(({ pos, color }) => {
      const sGeo  = new THREE.SphereGeometry(0.4, 12, 12);
      const sMat  = new THREE.MeshBasicMaterial({ color });
      const sMesh = new THREE.Mesh(sGeo, sMat);
      sMesh.position.set(...pos);
      scene.add(sMesh);

      // Pulse ring
      const rGeo = new THREE.RingGeometry(0.5, 0.7, 16);
      const rMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
      const ring = new THREE.Mesh(rGeo, rMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(...pos); ring.position.y = 0.05;
      scene.add(ring);
      ring.userData.pulse = true;
    });

    // ── Heatmap overlay (energy layer) ────────────────────────────────────────
    const heatGeo = new THREE.PlaneGeometry(40, 40);
    const heatMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.06, side: THREE.DoubleSide });
    const heat    = new THREE.Mesh(heatGeo, heatMat);
    heat.rotation.x = -Math.PI / 2;
    heat.position.y  = 0.1;
    scene.add(heat);
    sceneRef.current.heat = heat;

    // ── Orbit controls (manual) ────────────────────────────────────────────────
    let isDragging = false, prevX = 0, prevY = 0;
    let theta = 0, phi = Math.PI / 4, radius = 65;
    const onMouseDown = e => { isDragging = true; prevX = e.clientX; prevY = e.clientY; };
    const onMouseUp   = () => { isDragging = false; };
    const onMouseMove = e => {
      if (!isDragging) return;
      theta -= (e.clientX - prevX) * 0.005;
      phi   = Math.max(0.1, Math.min(Math.PI/2.5, phi - (e.clientY - prevY) * 0.005));
      prevX  = e.clientX; prevY = e.clientY;
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, 5, 0);
    };
    const onWheel = e => {
      radius = Math.max(20, Math.min(120, radius + e.deltaY * 0.05));
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
    };
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    container.addEventListener('wheel', onWheel, { passive: true });

    // ── Animation loop ─────────────────────────────────────────────────────────
    let frame;
    const clock = new THREE.Clock();
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Pulse rings
      scene.children.forEach(obj => {
        if (obj.userData.pulse) { const s = 1 + 0.5 * Math.sin(t * 2); obj.scale.set(s, s, s); obj.material.opacity = 0.5 - 0.3 * Math.abs(Math.sin(t * 2)); }
      });

      // Rotating pointlights
      pointLight1.position.x = 15 * Math.cos(t * 0.3);
      pointLight1.position.z = 15 * Math.sin(t * 0.3);
      pointLight2.position.x = -15 * Math.cos(t * 0.2);
      pointLight2.position.z = -15 * Math.sin(t * 0.2);

      // Window flicker
      buildings.forEach((b, i) => { b.material.emissiveIntensity = 0.3 + 0.1 * Math.sin(t + i); });

      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ─────────────────────────────────────────────────────────────────
    const onResize = () => {
      const W2 = container.clientWidth, H2 = container.clientHeight;
      camera.aspect = W2 / H2;
      camera.updateProjectionMatrix();
      renderer.setSize(W2, H2);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [authFetch]);

  const LAYERS = ['all','traffic','energy','water','air'];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans',sans-serif", color: '#e2e8f0', position: 'relative' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');`}</style>

      {/* 3D Viewport */}
      <div ref={mountRef} style={{ flex: 1, cursor: 'grab' }} />

      {/* Overlay controls */}
      <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: '0.5rem', zIndex: 10 }}>
        <div style={{ background: 'rgba(6,9,26,0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '0.6rem 1rem' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, color: '#f0f9ff', fontSize: '0.9rem' }}>🔮 Digital Twin</div>
          <div style={{ color: '#475569', fontSize: '0.72rem', marginTop: '0.15rem' }}>Lagos Island · Live Data</div>
        </div>
      </div>

      {/* Layer toggles */}
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: '0.35rem', zIndex: 10 }}>
        {LAYERS.map(l => (
          <button key={l} onClick={() => setActiveLayer(l)}
            style={{ padding: '0.4rem 0.85rem', background: activeLayer === l ? 'rgba(16,185,129,0.2)' : 'rgba(6,9,26,0.8)', backdropFilter: 'blur(8px)', border: activeLayer === l ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.08)', color: activeLayer === l ? '#10b981' : '#475569', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize', textAlign: 'left', minWidth: 80 }}>
            {l === 'all' ? '⊞ All' : l === 'traffic' ? '🚗 Traffic' : l === 'energy' ? '⚡ Energy' : l === 'water' ? '🌊 Water' : '💨 Air Quality'}
          </button>
        ))}
      </div>

      {/* Metric cards bottom overlay */}
      <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, display: 'flex', gap: '0.75rem', zIndex: 10, flexWrap: 'wrap' }}>
        {[
          { label: 'Traffic Flow',  value: metrics.traffic,    unit: 'v/hr', color: '#8b5cf6', max: 1000 },
          { label: 'Energy Usage',  value: metrics.energy,     unit: 'kWh',  color: '#10b981', max: 5000 },
          { label: 'Water Flow',    value: metrics.water,      unit: 'L/m',  color: '#0ea5e9', max: 200  },
          { label: 'Air Quality',   value: metrics.airQuality, unit: 'AQI',  color: '#f59e0b', max: 200  },
        ].map(m => (
          <div key={m.label} style={{ background: 'rgba(6,9,26,0.88)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '0.75rem 1rem', minWidth: 130 }}>
            <div style={{ color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{m.label}</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.4rem', color: m.color, lineHeight: 1, marginTop: '0.25rem' }}>{m.value}<span style={{ fontSize: '0.65rem', color: '#334155', fontWeight: 400, marginLeft: 2 }}>{m.unit}</span></div>
            <div style={{ height: 3, background: '#1e293b', borderRadius: 2, marginTop: '0.4rem' }}>
              <div style={{ width: `${Math.min((m.value / m.max) * 100, 100)}%`, height: '100%', background: m.color, borderRadius: 2, transition: 'width 1s' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Mouse hint */}
      <div style={{ position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)', color: '#1e293b', fontSize: '0.72rem', zIndex: 10 }}>
        Drag to rotate · Scroll to zoom
      </div>
    </div>
  );
}
