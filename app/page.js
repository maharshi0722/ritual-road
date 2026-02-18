"use client";

import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* ================= CONFIG ================= */

const CW = 4.8;
const CH = 3.6;
const SEG = 9;
const POOL = 10;
const SPEED = 4.5;

const IMAGES = [
  "/images/IMG_8007.JPG",
  "/images/IMG_8008.JPG",
  "/images/IMG_8009.JPG",
  "/images/IMG_8010.JPG",
  "/images/IMG_8011.JPG",
  "/images/IMG_8012.JPG",
  "/images/IMG_8013.JPG",
  "/images/IMG_8014.JPG",
  "/images/IMG_8015.JPG",
  "/images/IMG_8016.JPG",
  "/images/IMG_8017.JPG",
  "/images/IMG_8018.JPG",
  "/images/IMG_8019.JPG",
];

/* ================= TEXTURE HOOK ================= */

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

/* ================= FRAME ================= */

function Frame({ pos, rotY, img }) {
  const tex = useTexture(img);
  if (!tex) return null;

  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh>
        <boxGeometry args={[1.4, 1.8, 0.12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>

      <mesh position={[0, 0, 0.07]}>
        <planeGeometry args={[1.2, 1.6]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ================= SEGMENT ================= */

function Segment({ z, left, right, setRef }) {
  const hw = CW / 2;
  const hh = CH / 2;
  const frameZ = -SEG / 2 + 1.8;

  return (
    <group ref={setRef} position={[0, 0, z]}>
      {/* walls */}
      <mesh position={[-hw, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[SEG, CH]} />
        <meshStandardMaterial color="#faf7f2" roughness={0.9} />
      </mesh>

      <mesh position={[hw, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[SEG, CH]} />
        <meshStandardMaterial color="#f7f4ef" roughness={0.9} />
      </mesh>

      {/* ceiling */}
      <mesh position={[0, hh, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[CW, SEG]} />
        <meshStandardMaterial color="#f9f7f3" />
      </mesh>

      {/* ceiling light */}
      <mesh position={[0, hh - 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.6, SEG]} />
        <meshStandardMaterial
          color="#fff6e6"
          emissive="#fff6e6"
          emissiveIntensity={0.7}
          toneMapped={false}
        />
      </mesh>

      {/* floor */}
      <mesh position={[0, -hh, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[CW, SEG]} />
        <meshStandardMaterial color="#e0d8ce" />
      </mesh>

      {/* carpet */}
      <mesh position={[0, -hh + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.3, SEG]} />
        <meshStandardMaterial
          color="#b81d1d"
          emissive="#6a0000"
          emissiveIntensity={0.25}
        />
      </mesh>

      <pointLight position={[0, hh - 0.3, 0]} intensity={20} />

      <Frame pos={[-hw + 0.06, 0.3, frameZ]} rotY={Math.PI / 2} img={left} />
      <Frame pos={[hw - 0.06, 0.3, frameZ]} rotY={-Math.PI / 2} img={right} />
    </group>
  );
}

/* ================= SCENE ================= */

function Scene() {
  const { camera } = useThree();
  const refs = useRef([]);
  const pos = useRef(Array.from({ length: POOL }, (_, i) => -(i * SEG + SEG / 2)));
  const camZ = useRef(-2);

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
        const min = Math.min(...pos.current);
        pos.current[i] = min - SEG;
        g.position.z = pos.current[i];
      }
    }
  });

  return (
    <>
     <fog attach="fog" args={["#f4efe8", 8, 55]} />

{/* soft base light */}
<ambientLight intensity={0.45} />

{/* main overhead light */}
<directionalLight
  position={[0, 6, -4]}
  intensity={0.9}
  color="#fff3e0"
/>

{/* left wall wash */}
<pointLight
  position={[-3, 1.5, -4]}
  intensity={8}
  color="#fff0dd"
/>

{/* right wall wash */}
<pointLight
  position={[3, 1.5, -4]}
  intensity={8}
  color="#fff0dd"
/>

{/* subtle back glow */}
<pointLight
  position={[0, 1, 3]}
  intensity={4}
  color="#ffd8c0"
/>


      {pairs.slice(0, POOL).map((p, i) => (
        <Segment
          key={i}
          z={pos.current[i]}
          left={p.L}
          right={p.R}
          setRef={el => (refs.current[i] = el)}
        />
      ))}
    </>
  );
}

/* ================= PAGE ================= */

export default function Page() {
  return (
    <main style={{ width: "100vw", height: "100vh", background: "#f4efe8" }}>
      <Canvas camera={{ position: [0, 0.2, 2], fov: 65 }}>
        <Scene />
      </Canvas>

      {/* UI HERO */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transform: "translateY(-280px)",
          pointerEvents: "none",
        }}
      >
        <img src="/images/logo.png" style={{ width: 70, marginBottom: 12 }} />

        <h1 style={{ letterSpacing: "0.35em", fontWeight: 300, color: "#222" }}>
          RITUAL NET
        </h1>

        <p style={{ marginTop: 6, color: "#666", fontSize: "0.7rem", letterSpacing: "0.2em" }}>
          Sovereign AI Corridor
        </p>
      </div>
    </main>
  );
}
