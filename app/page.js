"use client";

import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* ================= CONFIG ================= */

const CW = 4.2;
const CH = 3.6;
const SEG = 9;
const POOL = 10;
const SPEED = 5;

/* images + names */

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

/* ================= TEXTURES ================= */

const loader = new THREE.TextureLoader();
const cache = new Map();

function useTexture(url) {
  const [tex, setTex] = useState(null);

  useEffect(() => {
    if (cache.has(url)) return setTex(cache.get(url));

    loader.load(url, t => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.flipY = false;
      t.rotation = Math.PI;
      t.center.set(0.5, 0.5);
      cache.set(url, t);
      setTex(t);
    });
  }, [url]);

  return tex;
}

/* ================= LABEL ================= */

function makeLabelTexture(text) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 140;

  const ctx = c.getContext("2d");

  // Light blue gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, c.height);
  gradient.addColorStop(0, "rgba(220, 235, 255, 0.95)");
  gradient.addColorStop(1, "rgba(200, 220, 245, 0.95)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, c.width, c.height);

  // Blue accent border
  ctx.strokeStyle = "rgba(100, 150, 220, 0.6)";
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, c.width - 3, c.height - 3);

  // Dark blue text
  ctx.fillStyle = "#2c4a6e";
  ctx.font = "600 36px Segoe UI";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, c.width / 2, c.height / 2);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ================= FRAME ================= */

function Frame({ pos, rotY, imgSrc, title }) {
  const tex = useTexture(imgSrc);
  const [label, setLabel] = useState(null);
  const meshRef = useRef();

  useEffect(() => {
    setLabel(makeLabelTexture(title));
  }, [title]);

  // Subtle animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = pos[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    }
  });

  if (!tex || !label) return null;

  return (
    <group ref={meshRef} position={pos} rotation={[0, rotY, 0]}>
      {/* Light blue-tinted silver frame */}
      <mesh castShadow>
        <boxGeometry args={[1.6, 2.0, 0.15]} />
        <meshStandardMaterial 
          color="#c5d5e8"
          metalness={0.4}
          roughness={0.5}
        />
      </mesh>

      {/* Bright white mat */}
      <mesh position={[0, 0, 0.075]}>
        <boxGeometry args={[1.45, 1.85, 0.02]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Image */}
      <mesh position={[0, 0.12, 0.09]}>
        <planeGeometry args={[1.3, 1.5]} />
        <meshBasicMaterial map={tex} />
      </mesh>

      {/* Label */}
      <mesh position={[0, -0.82, 0.1]}>
        <planeGeometry args={[1.3, 0.32]} />
        <meshBasicMaterial map={label} transparent />
      </mesh>
    </group>
  );
}

/* ================= SEGMENT ================= */

function Segment({ z, left, right, setRef }) {
  const hw = CW / 2;
  const hh = CH / 2;

  // Frames closer to viewer
  const frameZ = -SEG / 2 + 4.8;

  return (
    <group ref={setRef} position={[0, 0, z]}>
      {/* Left wall - light blue-gray */}
      <mesh position={[-hw, 0, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[SEG, CH]} />
        <meshStandardMaterial 
          color="#d8e4f0"
          roughness={0.8}
        />
      </mesh>

      {/* Right wall - light blue-gray */}
      <mesh position={[hw, 0, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[SEG, CH]} />
        <meshStandardMaterial 
          color="#d8e4f0"
          roughness={0.8}
        />
      </mesh>

      {/* Ceiling - bright sky blue */}
      <mesh position={[0, hh, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[CW, SEG]} />
        <meshStandardMaterial 
          color="#e8f2ff"
          roughness={0.7}
        />
      </mesh>

      {/* Floor - light blue-tinted white */}
      <mesh position={[0, -hh, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[CW, SEG]} />
        <meshStandardMaterial 
          color="#e5eef8"
          roughness={0.85}
        />
      </mesh>

      {/* Coral/salmon carpet center - warm accent */}
      <mesh position={[0, -hh + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.1, SEG]} />
        <meshStandardMaterial 
          color="#ff8a80"
          roughness={0.75}
          emissive="#ff6b60"
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Bright cyan/turquoise stripes - left */}
      <mesh position={[-0.62, -hh + 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.08, SEG]} />
        <meshStandardMaterial 
          color="#4dd0e1"
          roughness={0.5}
          emissive="#26c6da"
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* Bright cyan/turquoise stripes - right */}
      <mesh position={[0.62, -hh + 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.08, SEG]} />
        <meshStandardMaterial 
          color="#4dd0e1"
          roughness={0.5}
          emissive="#26c6da"
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* Left frame */}
      <Frame
        pos={[-hw + 0.08, 0.35, frameZ]}
        rotY={Math.PI / 2}
        imgSrc={left.src}
        title={left.name}
      />

      {/* Right frame */}
      <Frame
        pos={[hw - 0.08, 0.35, frameZ]}
        rotY={-Math.PI / 2}
        imgSrc={right.src}
        title={right.name}
      />
    </group>
  );
}

/* ================= CEILING LIGHTS ================= */

function CeilingLight({ position }) {
  return (
    <group position={position}>
      {/* Light fixture - bright blue-white glow */}
      <mesh>
        <boxGeometry args={[0.6, 0.08, 1.2]} />
        <meshStandardMaterial 
          color="#e8f4ff"
          emissive="#d0e8ff"
          emissiveIntensity={0.8}
        />
      </mesh>
      
      {/* Point light - cool blue-white */}
      <pointLight 
        position={[0, -0.2, 0]} 
        intensity={1.8} 
        distance={9} 
        color="#e8f4ff"
        decay={2}
      />
    </group>
  );
}

/* ================= SCENE ================= */

function Scene() {
  const { camera } = useThree();
  const refs = useRef([]);
  const pos = useRef(Array.from({ length: POOL }, (_, i) => -(i * SEG + SEG / 2)));
  const camZ = useRef(-1.2);

  const pairs = IMAGES.map((_, i) => ({
    L: IMAGES[(i * 2) % IMAGES.length],
    R: IMAGES[(i * 2 + 1) % IMAGES.length],
  }));

  useFrame((_, d) => {
    camZ.current += d * SPEED;
    camera.position.z = -camZ.current;

    const recycle = camera.position.z + SEG * 1.4;

    for (let i = 0; i < POOL; i++) {
      const g = refs.current[i];
      if (!g) continue;

      if (pos.current[i] + SEG / 2 > recycle) {
        const m = Math.min(...pos.current);
        pos.current[i] = m - SEG;
        g.position.z = pos.current[i];
      }
    }
  });

  return (
    <>
      {/* Light blue fog */}
      <fog attach="fog" args={["#d8e8f8", 12, 58]} />
      
      {/* Bright ambient light with blue tint */}
      <ambientLight intensity={0.85} color="#f0f8ff" />
      
      {/* Ceiling lights array */}
      {Array.from({ length: 15 }, (_, i) => (
        <CeilingLight key={i} position={[0, CH / 2 - 0.05, -i * SEG / 2 + 10]} />
      ))}
      
      {/* Blue accent lights on walls */}
      <spotLight 
        position={[-CW/2 + 0.5, 1.5, 0]} 
        intensity={0.8}
        angle={0.5}
        penumbra={0.5}
        distance={7}
        color="#a8d8ff"
      />
      <spotLight 
        position={[CW/2 - 0.5, 1.5, 0]} 
        intensity={0.8}
        angle={0.5}
        penumbra={0.5}
        distance={7}
        color="#a8d8ff"
      />
      
      {/* Bright directional light */}
      <directionalLight 
        position={[2, 6, 3]} 
        intensity={1.0}
        color="#ffffff"
        castShadow
      />
      
      {/* Additional blue fill light */}
      <pointLight 
        position={[0, 2, -5]} 
        intensity={0.5}
        distance={15}
        color="#b8e0ff"
      />
      
      {pairs.slice(0, POOL).map((p, i) => (
        <Segment 
          key={i} 
          z={pos.current[i]} 
          left={p.L} 
          right={p.R} 
          setRef={e => (refs.current[i] = e)} 
        />
      ))}
    </>
  );
}

/* ================= PAGE ================= */

export default function Page() {
  return (
    <main style={{ width: "100vw", height: "100vh", background: "#d0e4f5" }}>
      <Canvas 
        camera={{ position: [0, 0.3, 2], fov: 68 }}
        shadows
      >
        <Scene />
      </Canvas>

      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transform: "translateY(-260px)",
          pointerEvents: "none",
          textShadow: "0 2px 10px rgba(100, 150, 220, 0.4), 0 0 30px rgba(200, 230, 255, 0.6)",
        }}
      >
        <img 
          src="/images/logo.png" 
          style={{ 
            width: 70, 
            marginBottom: 10,
          }} 
          alt="Ritual Net Logo"
        />
        <h1 
          style={{ 
            letterSpacing: ".35em", 
            fontWeight: 300,
            margin: "8px 0",
            fontSize: "2rem",
            color: "#2c5080",
            textTransform: "uppercase"
          }}
        >
          RITUAL NET
        </h1>
        <p 
          style={{ 
            fontSize: 11, 
            letterSpacing: ".2em",
            opacity: 0.85,
            color: "#3d6090"
          }}
        >
          Sovereign AI Corridor
        </p>
      </div>
    </main>
  );
}