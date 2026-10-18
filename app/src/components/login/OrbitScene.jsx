import * as THREE from 'three'
import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'

/* Slowly rotating wireframe globe in brand teal. */
function WireGlobe() {
  const ref = useRef(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.1
  })
  return (
    <group ref={ref} rotation={[0.32, 0, 0.12]}>
      <mesh>
        <icosahedronGeometry args={[1.7, 2]} />
        <meshBasicMaterial wireframe color="#2a9698" transparent opacity={0.38} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.68, 1]} />
        <meshBasicMaterial wireframe color="#46b2b2" transparent opacity={0.15} />
      </mesh>
    </group>
  )
}

/* Tilted orbit ring with a small stylised satellite circling it. */
function OrbitRing() {
  const sat = useRef(null)
  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.45
    if (sat.current) sat.current.position.set(Math.cos(t) * 2.4, Math.sin(t) * 0.5, Math.sin(t) * 2.4)
  })
  return (
    <group rotation={[0.32, 0, 0.12]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.4, 0.008, 8, 160]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.5} />
      </mesh>
      <group ref={sat}>
        <mesh>
          <boxGeometry args={[0.13, 0.13, 0.13]} />
          <meshBasicMaterial color="#1e6166" />
        </mesh>
        <mesh rotation={[0, 0.5, 0.35]}>
          <boxGeometry args={[0.34, 0.016, 0.1]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.85} />
        </mesh>
      </group>
    </group>
  )
}

/* Expanding signal pulse, like a downlink ringing out from the globe. */
function SignalPulse() {
  const ref = useRef(null)
  useFrame((state) => {
    if (!ref.current) return
    const t = (state.clock.elapsedTime % 2.6) / 2.6
    ref.current.scale.setScalar(0.55 + t * 1.5)
    ref.current.material.opacity = 0.45 * (1 - t)
  })
  return (
    <group rotation={[0.32, 0, 0.12]}>
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.9, 1.96, 80]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

/*
 * Light-section backdrop: a calm wireframe globe with an orbiting
 * satellite behind the circular satellite photo on the landing page.
 * Rendered on a transparent canvas so the white section shows through.
 */
export function OrbitScene() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.6, 5.4], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <WireGlobe />
      <OrbitRing />
      <SignalPulse />
      <Sparkles count={60} scale={[5, 4, 4]} size={1.6} speed={0.2} opacity={0.5} color="#7ccfcd" position={[0, 0, -0.5]} />
    </Canvas>
  )
}
