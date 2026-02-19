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

  // Premium glass morphism background
  const gradient = ctx.createLinearGradient(0, 0, 0, c.height);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
  gradient.addColorStop(1, "rgba(245, 248, 255, 0.92)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, c.width, c.height);

  // Premium border with gradient
  const borderGradient = ctx.createLinearGradient(0, 0, c.width, c.height);
  borderGradient.addColorStop(0, "rgba(100, 180, 255, 0.7)");
  borderGradient.addColorStop(0.5, "rgba(150, 100, 255, 0.7)");
  borderGradient.addColorStop(1, "rgba(100, 180, 255, 0.7)");
  ctx.strokeStyle = borderGradient;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, c.width - 4, c.height - 4);

  // Elegant dark text with premium font - BETTER SPACING
  const textGradient = ctx.createLinearGradient(0, 0, 0, c.height);
  textGradient.addColorStop(0, "#1a2a4a");
  textGradient.addColorStop(1, "#2a3a5a");
  ctx.fillStyle = textGradient;
  ctx.font = "700 42px 'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  
  // Better letter spacing
  const letters = text.split('');
  const spacing = 8; // pixels between letters
  const totalWidth = letters.reduce((w, letter) => w + ctx.measureText(letter).width + spacing, 0) - spacing;
  let x = (c.width - totalWidth) / 2;
  
  letters.forEach(letter => {
    ctx.fillText(letter, x, c.height / 2);
    x += ctx.measureText(letter).width + spacing;
  });

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ================= FRAME ================= */

function Frame({ pos, rotY, imgSrc, title }) {
  const tex = useTexture(imgSrc);
  const [label, setLabel] = useState(null);
  const meshRef = useRef();
  const glowRef = useRef();

  useEffect(() => {
    setLabel(makeLabelTexture(title));
  }, [title]);

  // Elegant floating animation with glow pulse
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      meshRef.current.position.y = pos[1] + Math.sin(time * 0.5) * 0.03;
      
      if (glowRef.current) {
        glowRef.current.scale.setScalar(1 + Math.sin(time * 2) * 0.02);
      }
    }
  });

  if (!tex || !label) return null;

  return (
    <group ref={meshRef} position={pos} rotation={[0, rotY, 0]}>
      {/* Ambient glow behind frame */}
      <mesh ref={glowRef} position={[0, 0, -0.1]}>
        <planeGeometry args={[2.2, 2.6]} />
        <meshBasicMaterial 
          color="#a8d0ff"
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* Premium champagne gold frame */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.7, 2.1, 0.12]} />
        <meshStandardMaterial 
          color="#f5e6d3"
          metalness={0.7}
          roughness={0.3}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Pristine white mat with subtle texture */}
      <mesh position={[0, 0, 0.06]} castShadow>
        <boxGeometry args={[1.5, 1.9, 0.03]} />
        <meshStandardMaterial 
          color="#ffffff"
          roughness={0.4}
        />
      </mesh>

      {/* Image with subtle border */}
      <mesh position={[0, 0.1, 0.08]}>
        <planeGeometry args={[1.35, 1.6]} />
        <meshBasicMaterial map={tex} />
      </mesh>

      {/* Thin elegant separator line */}
      <mesh position={[0, -0.72, 0.09]}>
        <planeGeometry args={[1.35, 0.01]} />
        <meshBasicMaterial color="#d0d8e8" />
      </mesh>

      {/* Premium label */}
      <mesh position={[0, -0.88, 0.095]}>
        <planeGeometry args={[1.35, 0.35]} />
        <meshBasicMaterial map={label} transparent />
      </mesh>
    </group>
  );
}

/* ================= SEGMENT ================= */

function Segment({ z, left, right, setRef }) {
  const hw = CW / 2;
  const hh = CH / 2;

  const frameZ = -SEG / 2 + 4.8;

  return (
    <group ref={setRef} position={[0, 0, z]}>
      {/* Left wall - premium light with subtle texture */}
      <mesh position={[-hw, 0, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[SEG, CH]} />
        <meshStandardMaterial 
          color="#f8f9fc"
          roughness={0.75}
          metalness={0.05}
        />
      </mesh>

      {/* Right wall - premium light with subtle texture */}
      <mesh position={[hw, 0, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[SEG, CH]} />
        <meshStandardMaterial 
          color="#f8f9fc"
          roughness={0.75}
          metalness={0.05}
        />
      </mesh>

      {/* Ceiling - bright pristine white */}
      <mesh position={[0, hh, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[CW, SEG]} />
        <meshStandardMaterial 
          color="#ffffff"
          roughness={0.6}
        />
      </mesh>

      {/* Floor - elegant pearl white */}
      <mesh position={[0, -hh, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[CW, SEG]} />
        <meshStandardMaterial 
          color="#f5f7fa"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Premium gradient carpet - electric blue to purple */}
      <mesh position={[0, -hh + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.2, SEG]} />
        <meshStandardMaterial 
          color="#667eea"
          roughness={0.7}
          emissive="#667eea"
          emissiveIntensity={0.2}
          metalness={0.2}
        />
      </mesh>

      {/* Glowing accent stripe - left (cyan) */}
      <mesh position={[-0.68, -hh + 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.1, SEG]} />
        <meshStandardMaterial 
          color="#4facfe"
          roughness={0.4}
          emissive="#4facfe"
          emissiveIntensity={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* Glowing accent stripe - right (pink) */}
      <mesh position={[0.68, -hh + 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.1, SEG]} />
        <meshStandardMaterial 
          color="#f093fb"
          roughness={0.4}
          emissive="#f093fb"
          emissiveIntensity={0.4}
          metalness={0.3}
        />
      </mesh>

      {/* Subtle center glow on carpet */}
      <mesh position={[0, -hh + 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.4, SEG]} />
        <meshBasicMaterial 
          color="#a8b8ff"
          transparent
          opacity={0.15}
        />
      </mesh>

      <Frame
        pos={[-hw + 0.08, 0.35, frameZ]}
        rotY={Math.PI / 2}
        imgSrc={left.src}
        title={left.name}
      />

      <Frame
        pos={[hw - 0.08, 0.35, frameZ]}
        rotY={-Math.PI / 2}
        imgSrc={right.src}
        title={right.name}
      />
    </group>
  );
}

/* ================= PREMIUM CEILING LIGHTS ================= */

function CeilingLight({ position }) {
  const lightRef = useRef();

  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.intensity = 2.2 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
    }
  });

  return (
    <group position={position}>
      {/* Modern recessed light fixture */}
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.35, 0.4, 0.08, 32]} />
        <meshStandardMaterial 
          color="#f8f9fc"
          metalness={0.6}
          roughness={0.2}
        />
      </mesh>

      {/* Bright LED center */}
      <mesh position={[0, -0.03, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.02, 32]} />
        <meshStandardMaterial 
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={1.2}
        />
      </mesh>
      
      {/* Dynamic point light */}
      <pointLight 
        ref={lightRef}
        position={[0, -0.3, 0]} 
        intensity={2.2} 
        distance={10} 
        color="#ffffff"
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
      {/* Subtle atmospheric fog */}
      <fog attach="fog" args={["#f0f4f8", 15, 65]} />
      
      {/* High-key ambient lighting */}
      <ambientLight intensity={1.0} color="#ffffff" />
      
      {/* Ceiling lights array */}
      {Array.from({ length: 15 }, (_, i) => (
        <CeilingLight key={i} position={[0, CH / 2 - 0.05, -i * SEG / 2 + 10]} />
      ))}
      
      {/* Key light - main illumination */}
      <directionalLight 
        position={[5, 8, 5]} 
        intensity={1.5}
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
      
      {/* Fill light - soft shadows */}
      <directionalLight 
        position={[-3, 6, -2]} 
        intensity={0.8}
        color="#f0f8ff"
      />
      
      {/* Rim light - depth and separation */}
      <directionalLight 
        position={[0, 3, -8]} 
        intensity={0.6}
        color="#e8f4ff"
      />
      
      {/* Accent lights on frames - left side with color */}
      <spotLight 
        position={[-CW/2 + 0.3, 1.8, 0]} 
        intensity={1.2}
        angle={0.45}
        penumbra={0.6}
        distance={8}
        color="#c8e0ff"
        castShadow
      />
      
      {/* Accent lights on frames - right side with color */}
      <spotLight 
        position={[CW/2 - 0.3, 1.8, 0]} 
        intensity={1.2}
        angle={0.45}
        penumbra={0.6}
        distance={8}
        color="#ffd4e8"
        castShadow
      />
      
      {/* Subtle blue ambient fill */}
      <pointLight 
        position={[0, 1, -10]} 
        intensity={0.4}
        distance={20}
        color="#d0e8ff"
      />

      {/* Warm counter light for balance */}
      <pointLight 
        position={[0, 0.5, 5]} 
        intensity={0.3}
        distance={15}
        color="#fff8f0"
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
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Display', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          overflow: hidden;
        }
      `}</style>

      <main style={{ 
        width: "100vw", 
        height: "100vh", 
        background: "linear-gradient(135deg, #f0f4f8 0%, #e8f0f8 100%)",
        position: "fixed",
        top: 0,
        left: 0,
        overflow: "hidden"
      }}>
        <Canvas 
          camera={{ position: [0, 0.3, 2], fov: 68 }}
          shadows
          gl={{ 
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <Scene />
        </Canvas>

        {/* Compact overlay UI */}
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            pointerEvents: "none",
            zIndex: 10,
            textAlign: "center",
          }}
        >
          {/* Logo */}
          <img 
            src="/images/logo.png" 
            style={{ 
              width: window.innerWidth < 768 ? "45px" : "55px", 
              marginBottom: window.innerWidth < 768 ? "8px" : "10px",
              display: "block",
              margin: `0 auto ${window.innerWidth < 768 ? "8px" : "10px"}`,
            }} 
            alt="Ritual Net Logo"
          />
          
          {/* Title */}
          <h1 
            style={{ 
              letterSpacing: window.innerWidth < 768 ? ".28em" : ".35em", 
              fontWeight: 300,
              margin: "0 0 6px 0",
              fontSize: window.innerWidth < 768 ? "1.2rem" : "1.5rem",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textTransform: "uppercase",
              fontFamily: "'Inter', -apple-system, 'SF Pro Display', sans-serif",
              filter: "drop-shadow(0 1px 4px rgba(102, 126, 234, 0.2))",
            }}
          >
            RITUAL NET
          </h1>
          
          {/* Subtitle */}
          <p 
            style={{ 
              fontSize: window.innerWidth < 768 ? "9px" : "10px", 
              letterSpacing: window.innerWidth < 768 ? ".18em" : ".22em",
              color: "#5a6a8a",
              fontWeight: 500,
              margin: 0,
              fontFamily: "'Inter', -apple-system, 'SF Pro Display', sans-serif",
              textShadow: "0 1px 4px rgba(255, 255, 255, 0.6)",
            }}
          >
            Sovereign AI Corridor
          </p>
        </div>

        {/* Elegant vignette overlay */}
        <div style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.03) 100%)"
        }} />
      </main>
    </>
  );
}