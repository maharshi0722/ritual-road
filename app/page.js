"use client";

import React, { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* ================= CONFIG ================= */

const SEG = 9;
const POOL = 10;

const BASE_CW = 4.2;
const BASE_CH = 3.6;

const BASE_SPEED = 5;
const SPEED_EASE = 0.9;

const IMAGE_COUNT = 102;
const IMAGE_EXT = "png";

/* images + names (FIRST) */
const IMAGES = [
  { src: "/images/JOSH.JPG", name: "JOSH" },
  { src: "/images/JEZ.JPG", name: "JEZ" },
  { src: "/images/DUNKEN.JPG", name: "DUNKEN" },
  { src: "/images/STEFAN.JPG", name: "STEFAN" },
  { src: "/images/BUNSDEV.JPG", name: "BUNSDEV" },
  { src: "/images/ELIF.JPG", name: "ELIF" },
  { src: "/images/CLARIE.JPG", name: "CLARIE" },
  { src: "/images/FLASH.JPG", name: "FLASH" },
  { src: "/images/MAJORPROJECT.JPG", name: "MAJORPROJECT" },
  { src: "/images/MEISON.JPG", name: "MEISON" },
  { src: "/images/WHITESOCK.JPG", name: "WHITESOCK" },
  { src: "/images/ERIC.JPG", name: "ERIC" },
  { src: "/images/KASH.JPG", name: "KASH" },
  { src: "/images/HINATA.JPG", name: "HINATA" },
];

/* ================= UTIL ================= */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(!!mq.matches);

    update();
    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else mq.removeListener(update);
    };
  }, []);

  return reduced;
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function pad3(n) {
  return String(n).padStart(3, "0");
}

/* ================= IMAGES (named first, then /1.png ... /102.png) ================= */

function buildAllImages(numberedCount) {
  const named = IMAGES.map((img, idx) => ({
    id: idx + 1,
    src: img.src,
    label: img.name,
  }));

  const numbered = Array.from({ length: numberedCount }, (_, i) => {
    const n = i + 1;
    return {
      id: named.length + n,
      src: `/${n}.${IMAGE_EXT}`,
      label: `#${pad3(n)}`,
    };
  });

  return [...named, ...numbered];
}

/* ================= TEXTURES ================= */

const loader = new THREE.TextureLoader();
const cache = new Map();

function useTexture(url) {
  const [tex, setTex] = useState(null);

  useEffect(() => {
    if (!url) return;

    if (cache.has(url)) {
      setTex(cache.get(url));
      return;
    }

    loader.load(
      url,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.flipY = false;
        t.rotation = Math.PI;
        t.center.set(0.5, 0.5);

        t.generateMipmaps = true;
        t.minFilter = THREE.LinearMipmapLinearFilter;
        t.magFilter = THREE.LinearFilter;
        t.anisotropy = 8;

        cache.set(url, t);
        setTex(t);
      },
      undefined,
      () => setTex(null)
    );
  }, [url]);

  return tex;
}

/* ================= LABEL TEXTURE ================= */

function makeLabelTexture(text) {
  const c = document.createElement("canvas");
  c.width = 768;
  c.height = 170;

  const ctx = c.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, c.width, c.height);

  const bg = ctx.createLinearGradient(0, 0, c.width, c.height);
  bg.addColorStop(0, "rgba(255,255,255,0.92)");
  bg.addColorStop(1, "rgba(245,248,255,0.86)");
  ctx.fillStyle = bg;

  const r = 26;
  const x = 10,
    y = 14,
    w = c.width - 20,
    h = c.height - 28;

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();

  const stroke = ctx.createLinearGradient(x, y, x + w, y + h);
  stroke.addColorStop(0, "rgba(79,172,254,0.80)");
  stroke.addColorStop(0.5, "rgba(154,124,255,0.80)");
  stroke.addColorStop(1, "rgba(240,147,251,0.80)");
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.font =
    "800 64px 'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const tg = ctx.createLinearGradient(0, y, 0, y + h);
  tg.addColorStop(0, "#14213b");
  tg.addColorStop(1, "#2d3f6f");
  ctx.fillStyle = tg;

  ctx.fillText(String(text || ""), c.width / 2, c.height / 2 + 2);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

/* ================= FRAME ================= */

function Frame({ pos, rotY, imgSrc, labelText, reducedMotion }) {
  const tex = useTexture(imgSrc);
  const [label, setLabel] = useState(null);
  const groupRef = useRef(null);
  const glowRef = useRef(null);

  useEffect(() => {
    setLabel(makeLabelTexture(labelText));
  }, [labelText]);

  useFrame((state) => {
    if (!groupRef.current) return;
    if (reducedMotion) return;

    const t = state.clock.elapsedTime;
    groupRef.current.position.y = pos[1] + Math.sin(t * 0.55) * 0.035;
    groupRef.current.rotation.z = Math.sin(t * 0.35) * 0.01;

    if (glowRef.current) {
      const s = 1 + Math.sin(t * 2.2) * 0.03;
      glowRef.current.scale.setScalar(s);
    }
  });

  if (!tex || !label) return null;

  return (
    <group ref={groupRef} position={pos} rotation={[0, rotY, 0]}>
      <mesh ref={glowRef} position={[0, 0, -0.25]}>
        <planeGeometry args={[2.35, 2.85]} />
        <meshBasicMaterial color="#b8d7ff" transparent opacity={0.12} />
      </mesh>

      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.72, 2.14, 0.14]} />
        <meshStandardMaterial
          color="#f6eadb"
          metalness={0.75}
          roughness={0.28}
          envMapIntensity={1.6}
        />
      </mesh>

      <mesh position={[0, 0, 0.085]} castShadow>
        <boxGeometry args={[1.52, 1.92, 0.03]} />
        <meshStandardMaterial color="#ffffff" roughness={0.35} />
      </mesh>

      <mesh position={[0, 0.1, 0.14]}>
        <planeGeometry args={[1.36, 1.62]} />
        <meshBasicMaterial
          map={tex}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>

      <mesh position={[0, -0.72, 0.155]}>
        <planeGeometry args={[1.36, 0.012]} />
        <meshBasicMaterial color="#d7dff0" />
      </mesh>

      <mesh position={[0, -0.9, 0.165]}>
        <planeGeometry args={[1.36, 0.36]} />
        <meshBasicMaterial map={label} transparent />
      </mesh>
    </group>
  );
}

/* ================= SEGMENT ================= */

function Segment({ z, left, right, setRef, CW, CH, reducedMotion }) {
  const hw = CW / 2;
  const hh = CH / 2;
  const frameZ = -SEG / 2 + 4.8;

  return (
    <group ref={setRef} position={[0, 0, z]}>
      <mesh
        position={[-hw, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[SEG, CH]} />
        <meshStandardMaterial color="#f9fbff" roughness={0.78} metalness={0.04} />
      </mesh>

      <mesh
        position={[hw, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[SEG, CH]} />
        <meshStandardMaterial color="#f9fbff" roughness={0.78} metalness={0.04} />
      </mesh>

      <mesh
        position={[0, hh, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[CW, SEG]} />
        <meshStandardMaterial color="#ffffff" roughness={0.55} />
      </mesh>

      <mesh
        position={[0, -hh, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[CW, SEG]} />
        <meshStandardMaterial color="#f6f8fc" roughness={0.85} metalness={0.08} />
      </mesh>

      <mesh position={[0, -hh + 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.25, SEG]} />
        <meshStandardMaterial
          color="#6b7cff"
          roughness={0.7}
          emissive="#6b7cff"
          emissiveIntensity={0.22}
          metalness={0.18}
        />
      </mesh>

      <mesh position={[-0.7, -hh + 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.11, SEG]} />
        <meshStandardMaterial
          color="#4facfe"
          roughness={0.45}
          emissive="#4facfe"
          emissiveIntensity={0.45}
          metalness={0.25}
        />
      </mesh>
      <mesh position={[0.7, -hh + 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.11, SEG]} />
        <meshStandardMaterial
          color="#f093fb"
          roughness={0.45}
          emissive="#f093fb"
          emissiveIntensity={0.45}
          metalness={0.25}
        />
      </mesh>

      <mesh position={[0, -hh + 0.017, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.55, SEG]} />
        <meshBasicMaterial color="#cdd6ff" transparent opacity={0.1} />
      </mesh>

      <Frame
        pos={[-hw + 0.08, 0.35, frameZ]}
        rotY={Math.PI / 2}
        imgSrc={left.src}
        labelText={left.label}
        reducedMotion={reducedMotion}
      />
      <Frame
        pos={[hw - 0.08, 0.35, frameZ]}
        rotY={-Math.PI / 2}
        imgSrc={right.src}
        labelText={right.label}
        reducedMotion={reducedMotion}
      />
    </group>
  );
}

/* ================= LIGHTS ================= */

function CeilingLight({ position, reducedMotion }) {
  const lightRef = useRef(null);

  useFrame((state) => {
    if (!lightRef.current || reducedMotion) return;
    lightRef.current.intensity =
      2.15 + Math.sin(state.clock.elapsedTime * 1.6) * 0.12;
  });

  return (
    <group position={position}>
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.35, 0.4, 0.08, 32]} />
        <meshStandardMaterial color="#f8f9fc" metalness={0.6} roughness={0.2} />
      </mesh>

      <mesh position={[0, -0.03, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.02, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={1.15}
        />
      </mesh>

      <pointLight
        ref={lightRef}
        position={[0, -0.32, 0]}
        intensity={2.15}
        distance={10}
        color="#ffffff"
        decay={2}
      />
    </group>
  );
}

/* ================= RESPONSIVE RIG ================= */

function ResponsiveRig({ reducedMotion }) {
  const { camera, size } = useThree();

  const device = useMemo(() => {
    const w = size.width;
    if (w < 520) return "mobile";
    if (w < 900) return "tablet";
    return "desktop";
  }, [size.width]);

  useEffect(() => {
    if (device === "mobile") {
      camera.fov = 74;
      camera.position.set(0, 0.25, 2.15);
    } else if (device === "tablet") {
      camera.fov = 70;
      camera.position.set(0, 0.28, 2.05);
    } else {
      camera.fov = 68;
      camera.position.set(0, 0.3, 2.0);
    }
    camera.updateProjectionMatrix();
  }, [camera, device]);

  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.elapsedTime;

    camera.position.x = Math.sin(t * 0.25) * 0.04;
    camera.position.y = 0.28 + Math.sin(t * 0.18) * 0.025;

    const baseFov = device === "mobile" ? 74 : device === "tablet" ? 70 : 68;
    camera.fov = baseFov + Math.sin(t * 0.22) * 0.35;
    camera.updateProjectionMatrix();
  });

  return null;
}

/* ================= TOP NAV + BOTTOM CONTROLS ================= */

function TopNav() {
  return (
    <div className="topNav">
      <div className="topNavCard">
        <img className="navLogo" src="/logo.png" alt="Logo" />
        <div className="navTitle">RITUALIST CORRIDOR</div>
      </div>
    </div>
  );
}

function BottomControls({ paused, onTogglePause, speed, setSpeed, reducedMotion }) {
  return (
    <div className="bottomControls">
      <div className="bottomControlsCard">
        <button className="btn" type="button" onClick={onTogglePause}>
          {paused ? "Play" : "Pause"}
        </button>

        <div className="sliderRow">
          <div className="sliderMeta">
            <span>Speed</span>
            <span className="mono">{speed.toFixed(2)}x</span>
          </div>

          <input
            className="slider"
            type="range"
            min="0.25"
            max="2.0"
            step="0.01"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
          />
        </div>

        {!reducedMotion && <div className="hint">Space = Pause/Play</div>}
      </div>
    </div>
  );
}

/* ================= SCENE ================= */

function Scene({ reducedMotion, paused, speed }) {
  const { camera, size, scene } = useThree();
  const refs = useRef([]);
  const pos = useRef(Array.from({ length: POOL }, (_, i) => -(i * SEG + SEG / 2)));

  const camZ = useRef(-1.2);
  const speedRef = useRef(0);

  // includes IMAGES first, then numbered files
  const images = useMemo(() => buildAllImages(IMAGE_COUNT), []);
  const segIndex = useRef(Array.from({ length: POOL }, (_, i) => i));

  const device = useMemo(() => {
    const w = size.width;
    if (w < 520) return "mobile";
    if (w < 900) return "tablet";
    return "desktop";
  }, [size.width]);

  const { CW, CH } = useMemo(() => {
    if (device === "mobile") return { CW: BASE_CW * 0.92, CH: BASE_CH * 0.95 };
    if (device === "tablet") return { CW: BASE_CW * 0.98, CH: BASE_CH * 1.0 };
    return { CW: BASE_CW, CH: BASE_CH };
  }, [device]);

  useFrame((state, d) => {
    const baseTarget = reducedMotion ? BASE_SPEED * 0.35 : BASE_SPEED;
    const target = paused ? 0 : baseTarget * speed;

    speedRef.current = THREE.MathUtils.lerp(
      speedRef.current,
      target,
      1 - Math.pow(SPEED_EASE, d * 60)
    );

    camZ.current += d * speedRef.current;
    camera.position.z = -camZ.current;

    const recycle = camera.position.z + SEG * 1.4;

    for (let i = 0; i < POOL; i++) {
      const g = refs.current[i];
      if (!g) continue;

      if (pos.current[i] + SEG / 2 > recycle) {
        const m = Math.min(...pos.current);
        pos.current[i] = m - SEG;
        g.position.z = pos.current[i];

        // advance this segment's pair index so images don't repeat after 20
        segIndex.current[i] = segIndex.current[i] + POOL;
      }
    }

    if (!reducedMotion && scene.fog) {
      scene.fog.near = 14.5 + Math.sin(state.clock.elapsedTime * 0.12) * 0.8;
      scene.fog.far = 66 + Math.sin(state.clock.elapsedTime * 0.09) * 1.2;
    }
  });

  return (
    <>
      <fog attach="fog" args={["#eef4ff", 15, 66]} />
      <ambientLight intensity={1.0} color="#ffffff" />

      {Array.from({ length: 16 }, (_, i) => (
        <CeilingLight
          key={i}
          reducedMotion={reducedMotion}
          position={[0, CH / 2 - 0.05, -i * SEG * 0.5 + 10]}
        />
      ))}

      <directionalLight
        position={[5, 8, 5]}
        intensity={1.55}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      <directionalLight position={[-3, 6, -2]} intensity={0.85} color="#f0f8ff" />
      <directionalLight position={[0, 3, -8]} intensity={0.65} color="#e8f4ff" />

      <spotLight
        position={[-CW / 2 + 0.3, 1.8, 0]}
        intensity={1.25}
        angle={0.45}
        penumbra={0.6}
        distance={8}
        color="#cfe6ff"
        castShadow
      />

      <spotLight
        position={[CW / 2 - 0.3, 1.8, 0]}
        intensity={1.25}
        angle={0.45}
        penumbra={0.6}
        distance={8}
        color="#ffe0f0"
        castShadow
      />

      <pointLight position={[0, 1, -10]} intensity={0.42} distance={20} color="#d6ebff" />
      <pointLight position={[0, 0.5, 5]} intensity={0.28} distance={15} color="#fff8f0" />

      {Array.from({ length: POOL }, (_, i) => {
        const idx = segIndex.current[i];
        const left = images[(idx * 2) % images.length];
        const right = images[(idx * 2 + 1) % images.length];

        return (
          <Segment
            key={i}
            z={pos.current[i]}
            left={left}
            right={right}
            CW={CW}
            CH={CH}
            reducedMotion={reducedMotion}
            setRef={(e) => (refs.current[i] = e)}
          />
        );
      })}

      <ResponsiveRig reducedMotion={reducedMotion} />
    </>
  );
}

/* ================= PAGE ================= */

export default function Page() {
  const reducedMotion = usePrefersReducedMotion();

  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);

  const onTogglePause = useCallback(() => setPaused((p) => !p), []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap");

        :root {
          --bg0: #f3f7ff;
          --bg1: #eef3ff;
          --glass: rgba(255, 255, 255, 0.58);
          --stroke: rgba(255, 255, 255, 0.72);
          --shadow: rgba(21, 31, 54, 0.18);
          --text: #1a2a4a;
          --muted: rgba(26, 42, 74, 0.72);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html,
        body {
          height: 100%;
        }

        body {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
            "SF Pro Display", system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          overflow: hidden;

          background: radial-gradient(
              1200px 700px at 10% 10%,
              rgba(102, 126, 234, 0.18),
              transparent 60%
            ),
            radial-gradient(
              900px 600px at 90% 20%,
              rgba(240, 147, 251, 0.16),
              transparent 55%
            ),
            linear-gradient(135deg, var(--bg0), var(--bg1));
        }

        /* ===== Top navbar ===== */
        .topNav {
          position: fixed;
          top: max(10px, env(safe-area-inset-top));
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          width: min(760px, calc(100vw - 20px));
          pointer-events: none;
        }

        .topNavCard {
          pointer-events: auto;
          border-radius: 18px;
          padding: 12px 14px;
          background: var(--glass);
          border: 1px solid var(--stroke);
          box-shadow: 0 18px 55px var(--shadow),
            inset 0 1px 0 rgba(255, 255, 255, 0.55);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          text-align: center;
        }

        .navLogo {
          width: clamp(42px, 8vw, 64px);
          height: clamp(42px, 8vw, 64px);
          object-fit: contain;
          filter: drop-shadow(0 10px 22px rgba(21, 31, 54, 0.12));
          flex: 0 0 auto;
        }

        .navTitle {
          font-weight: 900;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          font-size: clamp(18px, 4.2vw, 22px);
          background: linear-gradient(135deg, #667eea, #9a7cff, #f093fb);
          background-size: 220% 220%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1.1;
        }

        /* ===== Bottom controls ===== */
        .bottomControls {
          position: fixed;
          bottom: calc(12px + env(safe-area-inset-bottom));
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          width: min(760px, calc(100vw - 20px));
          pointer-events: none;
        }

        .bottomControlsCard {
          pointer-events: auto;
          border-radius: 18px;
          padding: 12px 14px;
          background: var(--glass);
          border: 1px solid var(--stroke);
          box-shadow: 0 18px 55px var(--shadow),
            inset 0 1px 0 rgba(255, 255, 255, 0.55);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);

          display: grid;
          gap: 10px;
        }

        .btn {
          border: 1px solid rgba(255, 255, 255, 0.65);
          background: linear-gradient(
            135deg,
            rgba(102, 126, 234, 0.2),
            rgba(240, 147, 251, 0.2)
          );
          color: var(--text);
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 10px 12px;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 10px 26px rgba(21, 31, 54, 0.12);
          justify-self: center;
          min-width: 120px;
        }

        .sliderRow {
          display: grid;
          gap: 8px;
        }

        .sliderMeta {
          display: flex;
          justify-content: space-between;
          color: rgba(26, 42, 74, 0.78);
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: 11px;
        }

        .mono {
          font-variant-numeric: tabular-nums;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
          letter-spacing: 0.06em;
        }

        .slider {
          width: 100%;
          accent-color: #9a7cff;
          height: 28px;
        }

        .hint {
          color: rgba(26, 42, 74, 0.65);
          font-weight: 650;
          font-size: 12px;
          line-height: 1.35;
          text-align: center;
        }

        /* ===== Mobile refinements ===== */
        @media (max-width: 520px) {
          .topNavCard {
            padding: 12px 14px;
            gap: 12px;
            border-radius: 16px;
          }

          .navTitle {
            font-size: clamp(18px, 5.2vw, 24px);
            letter-spacing: 0.18em;
          }

          .bottomControlsCard {
            padding: 12px 14px;
            border-radius: 16px;
          }

          .btn {
            width: 100%;
            min-width: 0;
            padding: 13px 12px;
            font-size: 13px;
          }

          .sliderMeta {
            font-size: 12px;
          }

          .slider {
            height: 38px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: none !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      <main style={{ width: "100vw", height: "100vh", position: "fixed", inset: 0 }}>
        <Canvas
          camera={{ position: [0, 0.3, 2], fov: 68 }}
          shadows
          dpr={[1, 2]}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.18,
            powerPreference: "high-performance",
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <Scene reducedMotion={reducedMotion} paused={paused} speed={speed} />
        </Canvas>

        <TopNav />

        <BottomControls
          reducedMotion={reducedMotion}
          paused={paused}
          onTogglePause={onTogglePause}
          speed={speed}
          setSpeed={(v) => setSpeed(clamp(v, 0.25, 2))}
        />

        {/* Vignette */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at center, rgba(255,255,255,0) 0%, rgba(8,14,28,0.05) 100%)",
            mixBlendMode: "multiply",
          }}
        />

        {/* Grain */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            opacity: 0.06,
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'180\' height=\'180\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'.9\' numOctaves=\'2\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'180\' height=\'180\' filter=\'url(%23n)\' opacity=\'.35\'/%3E%3C/svg%3E")',
          }}
        />
      </main>
    </>
  );
}