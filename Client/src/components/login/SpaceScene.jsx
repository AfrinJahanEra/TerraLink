import { Component, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Line, Sparkles } from '@react-three/drei'

const EARTH_RADIUS = 2
const EARTH_TILT = 0.4
const MOTION_OK = typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches

function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

const STATIONS = [
  { lat: 23.8, lon: 90.4 }, // Dhaka
  { lat: 24.0, lon: 89.0 },
  { lat: 22.4, lon: 91.8 },
  { lat: 25.1, lon: 89.0 },
]

function Earth() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshStandardMaterial color="#0c352c" roughness={0.95} metalness={0.08} />
      </mesh>
      <mesh scale={1.06}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.08} blending={2} depthWrite={false} />
      </mesh>
      {/* Low-poly land hints on the night side */}
      <mesh scale={1.008}>
        <icosahedronGeometry args={[EARTH_RADIUS, 1]} />
        <meshBasicMaterial color="#12443a" wireframe transparent opacity={0.1} />
      </mesh>
    </group>
  )
}

function GroundStations() {
  return (
    <group>
      {STATIONS.map((station) => (
        <mesh key={`${station.lat}-${station.lon}`} position={latLonToVector3(station.lat, station.lon, EARTH_RADIUS * 1.01)}>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshBasicMaterial color="#a5f3fc" />
        </mesh>
      ))}
    </group>
  )
}

/* Great-circle communication arcs between the Dhaka station and the others. */
function StationArcs() {
  const materials = useRef([])
  const arcs = useMemo(() => {
    const origin = latLonToVector3(STATIONS[0].lat, STATIONS[0].lon, EARTH_RADIUS * 1.006)
    return STATIONS.slice(1).map((station) => {
      const end = latLonToVector3(station.lat, station.lon, EARTH_RADIUS * 1.006)
      const points = []
      const segments = 42
      for (let i = 0; i <= segments; i += 1) {
        const t = i / segments
        const point = origin.clone().lerp(end, t).normalize()
        point.multiplyScalar(EARTH_RADIUS * (1.006 + 0.16 * Math.sin(Math.PI * t)))
        points.push(point)
      }
      return points
    })
  }, [])
  useFrame((state) => {
    if (!MOTION_OK) return
    const t = state.clock.getElapsedTime()
    materials.current.forEach((material) => {
      if (material) material.dashOffset = -t * 0.35
    })
  })
  return (
    <group>
      {arcs.map((points, index) => (
        <Line
          key={`${STATIONS[index + 1].lat}-${STATIONS[index + 1].lon}`}
          points={points}
          color="#67e8f9"
          lineWidth={1}
          transparent
          opacity={0.45}
          dashed
          dashSize={0.13}
          gapSize={0.09}
          ref={(element) => {
            materials.current[index] = element?.material
          }}
        />
      ))}
    </group>
  )
}

/* Expanding radar-style ring at the primary ground station. */
function ScanPulse() {
  const ring = useRef()
  useFrame((state) => {
    if (!MOTION_OK || !ring.current) return
    const t = (state.clock.getElapsedTime() % 2.4) / 2.4
    ring.current.scale.setScalar(0.2 + t * 0.9)
    ring.current.material.opacity = 0.4 * (1 - t)
  })
  return (
    <mesh
      ref={(element) => element?.lookAt(0, 0, 0)}
      position={latLonToVector3(STATIONS[0].lat, STATIONS[0].lon, EARTH_RADIUS * 1.015)}
    >
      <ringGeometry args={[0.42, 0.5, 40]} />
      <meshBasicMaterial color="#22d3ee" transparent opacity={0.3} side={2} depthWrite={false} />
    </mesh>
  )
}

function Satellite({ radius, speed, offset = 0, reverse = false, size = 1, instrumented = false }) {
  const pivot = useRef()
  const pulseA = useRef()
  const pulseB = useRef()
  const beamMaterial = useRef()
  const beamLength = radius - EARTH_RADIUS + 0.02
  useFrame((state) => {
    if (!pivot.current || !MOTION_OK) return
    const t = state.clock.getElapsedTime()
    pivot.current.rotation.y = offset + t * speed * (reverse ? -1 : 1)
    pivot.current.rotation.x = 0.32 + Math.sin(t * 0.4) * 0.03
    if (instrumented) {
      if (beamMaterial.current) beamMaterial.current.dashOffset = -t * 0.6
      ;[pulseA, pulseB].forEach((pulse, index) => {
        if (pulse.current) pulse.current.position.x = -(((t * 0.5 + index * 0.5) % 1) * beamLength)
      })
    }
  })
  return (
    <group ref={pivot} rotation={[0.32, offset, 0]}>
      <group position={[radius, 0, 0]}>
        <Float speed={MOTION_OK ? 2.2 : 0} rotationIntensity={MOTION_OK ? 0.3 : 0} floatIntensity={MOTION_OK ? 0.7 : 0}>
          <group scale={size}>
            <mesh>
              <boxGeometry args={[0.2, 0.14, 0.14]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0, 0.075]}>
              <boxGeometry args={[0.14, 0.1, 0.014]} />
              <meshStandardMaterial color="#164e63" emissive="#22d3ee" emissiveIntensity={0.45} />
            </mesh>
            <mesh position={[-0.24, 0, 0]}>
              <boxGeometry args={[0.26, 0.012, 0.15]} />
              <meshStandardMaterial color="#155e75" metalness={0.4} roughness={0.4} />
            </mesh>
            <mesh position={[0.24, 0, 0]}>
              <boxGeometry args={[0.26, 0.012, 0.15]} />
              <meshStandardMaterial color="#155e75" metalness={0.4} roughness={0.4} />
            </mesh>
          </group>
        </Float>
        {instrumented && (
          <group>
            {/* Downlink beam with data pulses travelling toward the surface */}
            <Line
              points={[[-0.12, 0, 0], [-beamLength, 0, 0]]}
              color="#22d3ee"
              lineWidth={1}
              transparent
              opacity={0.3}
              dashed
              dashSize={0.12}
              gapSize={0.1}
              ref={(element) => {
                beamMaterial.current = element?.material
              }}
            />
            <mesh ref={pulseA}>
              <sphereGeometry args={[0.032, 8, 8]} />
              <meshBasicMaterial color="#a5f3fc" />
            </mesh>
            <mesh ref={pulseB}>
              <sphereGeometry args={[0.032, 8, 8]} />
              <meshBasicMaterial color="#a5f3fc" />
            </mesh>
            {/* Wide, faint scanning cone under the satellite */}
            <mesh position={[-0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <coneGeometry args={[0.5, 1.35, 24, 1, true]} />
              <meshBasicMaterial color="#22d3ee" transparent opacity={0.05} side={2} depthWrite={false} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  )
}

function OrbitPath({ radius, opacity = 0.22 }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.004, 8, 128]} />
      <meshBasicMaterial color="#67e8f9" transparent opacity={opacity} />
    </mesh>
  )
}

function Orbits() {
  const group = useRef()
  useFrame((state) => {
    if (MOTION_OK && group.current) group.current.rotation.z = 0.38 + Math.sin(state.clock.getElapsedTime() * 0.08) * 0.03
  })
  return (
    <group ref={group} rotation={[0.32, 0, 0.38]}>
      <OrbitPath radius={3.1} opacity={0.3} />
      <OrbitPath radius={3.7} opacity={0.18} />
      <Satellite radius={3.1} speed={0.32} offset={0.9} instrumented />
      <Satellite radius={3.7} speed={0.21} offset={3.6} reverse size={0.8} />
      <mesh position={[-3.7, 0, 0]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#e2e8f0" />
      </mesh>
    </group>
  )
}

function SpinningEarth() {
  const group = useRef()
  useFrame((_, delta) => {
    if (MOTION_OK && group.current) group.current.rotation.y += delta * 0.05
  })
  return (
    <group ref={group} rotation={[EARTH_TILT, 0.4, 0]}>
      <Earth />
      <GroundStations />
      <StationArcs />
      <ScanPulse />
      {/* Sweeping scan beam */}
      <mesh position={[0, 1.25, 0]} rotation={[0.5, 0, 0.35]}>
        <coneGeometry args={[1.6, 2.6, 40, 1, true]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.045} side={2} depthWrite={false} />
      </mesh>
    </group>
  )
}

/* Gentle idle drift plus pointer parallax; keeps the planet framed right of the hero copy. */
function CameraRig({ variant }) {
  const wide = useThree((state) => state.size.width >= 1024)
  useFrame((state, delta) => {
    if (!MOTION_OK) return
    const t = state.clock.getElapsedTime()
    const embedded = variant === 'feature'
    const targetX = (embedded ? 0 : 0.4) + state.pointer.x * (embedded ? 0.24 : 0.5)
    const targetY = (embedded ? 0.62 : 1.05) + state.pointer.y * (embedded ? 0.16 : 0.28) + Math.sin(t * 0.22) * 0.12
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, targetX, 2.2, delta)
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, targetY, 2.2, delta)
    state.camera.lookAt(embedded ? 0 : wide ? 0.5 : 0, embedded ? -0.2 : -0.1, 0)
  })
  return null
}

/* Reframes the full scene for either a wide hero or a contained feature panel. */
function SceneContent({ variant }) {
  const width = useThree((state) => state.size.width)
  const embedded = variant === 'feature'
  const offset = embedded ? [0, -0.25, 0] : width >= 1024 ? [3.05, -0.45, 0] : [0, -0.3, 0]
  return (
    <group position={offset} scale={embedded ? 0.82 : 1}>
      <SpinningEarth />
      <Orbits />
      <Sparkles count={embedded ? 110 : 170} scale={[13, 9, 8]} size={1.5} speed={MOTION_OK ? 0.25 : 0} opacity={0.55} color="#a5f3fc" position={[0, 0.5, -1.5]} />
    </group>
  )
}

export function ThreeScene({ variant = 'hero' }) {
  const embedded = variant === 'feature'
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: embedded ? [0, 0.62, 9.4] : [0.4, 1.1, 8.6], fov: embedded ? 44 : 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 4, 5]} intensity={1.6} color="#e2f5f2" />
      <directionalLight position={[-6, -2, -4]} intensity={0.5} color="#0e7490" />
      <SceneContent variant={variant} />
      <CameraRig variant={variant} />
    </Canvas>
  )
}

function StaticFallback() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div className="absolute -bottom-44 -right-40 size-[520px] rounded-full border border-white/10" />
      <div className="absolute -bottom-28 -right-24 size-[380px] rounded-full border border-white/10" />
      <div className="absolute -bottom-12 -right-8 size-[250px] rounded-full border border-cyan-300/20" />
      <div className="absolute right-24 top-24 size-2 rounded-full bg-cyan-300/70" />
      <div className="absolute right-64 top-48 size-1.5 rounded-full bg-white/40" />
      <div className="absolute bottom-64 right-10 size-1.5 rounded-full bg-white/30" />
    </div>
  )
}

/* Renders the WebGL scene; falls back to static rings where WebGL is unavailable. */
export class SceneBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.warn('TerraLink space scene fell back to static visuals:', error)
  }

  render() {
    if (this.state.failed) return <StaticFallback />
    return <ThreeScene variant={this.props.variant} />
  }
}

export function SpaceScene({ variant = 'hero' }) {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <SceneBoundary variant={variant} />
    </div>
  )
}
