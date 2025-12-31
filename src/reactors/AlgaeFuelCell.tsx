import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AlgaeFuelCellProps {
  scale?: number;
  showAnimation?: boolean;
  visualizationMode?: 'static' | 'biofilm' | 'flow';
}

// Particle system for flow and electron animations
interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  age: number;
  maxAge: number;
  type: 'algae' | 'electron';
}

export default function AlgaeFuelCell({
  scale = 1,
  showAnimation = false,
  visualizationMode = 'static',
}: AlgaeFuelCellProps) {
  const groupRef = useRef<THREE.Group>(null);
  const flowRef = useRef<THREE.Mesh>(null);
  const biofilmRef = useRef<THREE.Mesh>(null);
  const flowParticlesRef = useRef<THREE.InstancedMesh>(null);
  const electronParticlesRef = useRef<THREE.InstancedMesh>(null);
  const anodeGlowRef = useRef<THREE.Mesh>(null);
  const cathodeGlowRef = useRef<THREE.Mesh>(null);
  const anodeLEDRef = useRef<THREE.Mesh>(null);
  const cathodeLEDRef = useRef<THREE.Mesh>(null);

  // Initialize particle systems
  const particles = useMemo(() => {
    const flowParticles: Particle[] = [];
    const electronParticles: Particle[] = [];

    // Initialize flow particles
    for (let i = 0; i < 40; i++) {
      flowParticles.push({
        position: new THREE.Vector3(-4.2, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 3),
        velocity: new THREE.Vector3(0.5 + Math.random() * 0.5, 0, 0),
        age: Math.random() * 100,
        maxAge: 100,
        type: 'algae',
      });
    }

    // Initialize electron particles
    for (let i = 0; i < 20; i++) {
      electronParticles.push({
        position: new THREE.Vector3(-3, 2.5, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        age: i * 5,
        maxAge: 100,
        type: 'electron',
      });
    }

    return { flowParticles, electronParticles };
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current && showAnimation) {
      // Gentle rotation animation
      groupRef.current.rotation.y += delta * 0.05;
    }

    // Flow animation for algae culture
    if (flowRef.current && visualizationMode === 'flow') {
      const material = flowRef.current.material as THREE.MeshStandardMaterial;
      material.opacity = 0.4 + Math.sin(state.clock.elapsedTime * 1.5) * 0.2;
    }

    // Biofilm growth animation
    if (biofilmRef.current && visualizationMode === 'biofilm') {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      biofilmRef.current.scale.setScalar(scale);
    }

    // Animate flow particles
    if (flowParticlesRef.current && visualizationMode === 'flow') {
      const tempMatrix = new THREE.Matrix4();
      const tempPosition = new THREE.Vector3();

      particles.flowParticles.forEach((particle, i) => {
        particle.age += delta * 30;

        // Reset particle when it completes its journey
        if (particle.age >= particle.maxAge || particle.position.x > 4.2) {
          particle.position.set(-4.2, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 3);
          particle.age = 0;
          particle.velocity.x = 0.5 + Math.random() * 0.5;
        }

        // Update position with circular flow pattern
        particle.position.x += particle.velocity.x * delta * 3;
        particle.position.y += Math.sin(particle.position.x * 0.5) * 0.02;
        particle.position.z += Math.cos(particle.position.x * 0.3) * 0.01;

        // Add turbulence in the middle section
        if (Math.abs(particle.position.x) < 2) {
          particle.position.y += Math.sin(state.clock.elapsedTime * 2 + i) * 0.01;
          particle.position.z += Math.cos(state.clock.elapsedTime * 1.5 + i) * 0.01;
        }

        // Update instance matrix
        tempPosition.copy(particle.position);
        tempMatrix.makeTranslation(tempPosition.x, tempPosition.y, tempPosition.z);
        flowParticlesRef.current!.setMatrixAt(i, tempMatrix);
      });

      flowParticlesRef.current.instanceMatrix.needsUpdate = true;
    }

    // Animate electron flow
    if (electronParticlesRef.current && visualizationMode === 'flow') {
      const tempMatrix = new THREE.Matrix4();
      const tempPosition = new THREE.Vector3();

      particles.electronParticles.forEach((particle, i) => {
        particle.age += delta * 50;

        const progress = (particle.age % particle.maxAge) / particle.maxAge;

        // Electron path: from anode to cathode through external circuit
        if (progress < 0.3) {
          // Move up from anode
          const t = progress / 0.3;
          particle.position.set(-3, 0.5 + t * 2, 0);
        } else if (progress < 0.7) {
          // Arc over to cathode
          const t = (progress - 0.3) / 0.4;
          const arcHeight = 3.5;
          particle.position.set(-3 + t * 6, 2.5 + Math.sin(t * Math.PI) * arcHeight, 0);
        } else {
          // Move down to cathode
          const t = (progress - 0.7) / 0.3;
          particle.position.set(3, 2.5 - t * 2, 0);
        }

        // Update instance matrix
        tempPosition.copy(particle.position);
        tempMatrix.makeTranslation(tempPosition.x, tempPosition.y, tempPosition.z);
        electronParticlesRef.current!.setMatrixAt(i, tempMatrix);
      });

      electronParticlesRef.current.instanceMatrix.needsUpdate = true;
    }

    // Animate electrode glows and LEDs
    if (visualizationMode === 'flow') {
      const glowIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.2;

      if (anodeGlowRef.current && cathodeGlowRef.current) {
        (anodeGlowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
          glowIntensity;
        (cathodeGlowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
          glowIntensity;
      }

      // Pulse LEDs in sync with electron flow
      if (anodeLEDRef.current && cathodeLEDRef.current) {
        const ledIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 4) * 0.5;
        (anodeLEDRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
          ledIntensity;
        (cathodeLEDRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
          ledIntensity * 0.8;
      }
    }
  });

  return (
    <group ref={groupRef} scale={scale}>
      {/* Main reactor chamber */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[8, 2, 4]} />
        <meshStandardMaterial
          color="#1B5E20"
          transparent
          opacity={0.85}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* Top transparent section */}
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[7.8, 0.4, 3.8]} />
        <meshStandardMaterial color="#4CAF50" transparent opacity={0.3} />
      </mesh>

      {/* Left electrode assembly (Anode) */}
      <group position={[-3, 0.5, 0]}>
        {/* Electrode base */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.5, 1.5, 1]} />
          <meshStandardMaterial color="#2E7D32" />
        </mesh>

        {/* Electrode glow effect */}
        {visualizationMode === 'flow' && (
          <mesh ref={anodeGlowRef} position={[0, 0, 0]}>
            <boxGeometry args={[0.6, 1.6, 1.1]} />
            <meshStandardMaterial
              color="#4CAF50"
              emissive="#4CAF50"
              emissiveIntensity={0.3}
              transparent
              opacity={0.3}
            />
          </mesh>
        )}

        {/* Electrode post */}
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 2]} />
          <meshStandardMaterial color="#212121" />
        </mesh>

        {/* Connection terminal */}
        <mesh position={[0, 2.5, 0]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial color="#212121" />
        </mesh>
      </group>

      {/* Right electrode assembly (Cathode) */}
      <group position={[3, 0.5, 0]}>
        {/* Electrode base */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.5, 1.5, 1]} />
          <meshStandardMaterial color="#2E7D32" />
        </mesh>

        {/* Electrode glow effect */}
        {visualizationMode === 'flow' && (
          <mesh ref={cathodeGlowRef} position={[0, 0, 0]}>
            <boxGeometry args={[0.6, 1.6, 1.1]} />
            <meshStandardMaterial
              color="#2196F3"
              emissive="#2196F3"
              emissiveIntensity={0.3}
              transparent
              opacity={0.3}
            />
          </mesh>
        )}

        {/* Electrode post */}
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 2]} />
          <meshStandardMaterial color="#212121" />
        </mesh>

        {/* Connection terminal */}
        <mesh position={[0, 2.5, 0]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial color="#212121" />
        </mesh>
      </group>

      {/* Center viewing window */}
      <mesh position={[0, 0.3, 2.1]}>
        <boxGeometry args={[3, 1, 0.2]} />
        <meshStandardMaterial
          color="#ECEFF1"
          transparent
          opacity={0.8}
          roughness={0.1}
          metalness={0.3}
        />
      </mesh>

      {/* Side inlet/outlet ports */}
      <mesh position={[-4.2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.8]} />
        <meshStandardMaterial color="#37474F" />
      </mesh>

      <mesh position={[4.2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.8]} />
        <meshStandardMaterial color="#37474F" />
      </mesh>

      {/* Internal algae culture (flow visualization) */}
      {visualizationMode === 'flow' && (
        <mesh ref={flowRef} position={[0, 0, 0]}>
          <boxGeometry args={[7.5, 1.5, 3.5]} />
          <meshStandardMaterial
            color="#4CAF50"
            transparent
            opacity={0.4}
            emissive="#2E7D32"
            emissiveIntensity={0.1}
          />
        </mesh>
      )}

      {/* Biofilm growth on electrodes */}
      {visualizationMode === 'biofilm' && (
        <>
          <mesh ref={biofilmRef} position={[-2.8, 0, 0]}>
            <sphereGeometry args={[0.8, 16, 16]} />
            <meshStandardMaterial color="#66BB6A" transparent opacity={0.6} roughness={0.8} />
          </mesh>
          <mesh position={[2.8, 0, 0]}>
            <sphereGeometry args={[0.8, 16, 16]} />
            <meshStandardMaterial color="#66BB6A" transparent opacity={0.6} roughness={0.8} />
          </mesh>
        </>
      )}

      {/* Corner supports */}
      {[
        [-3.8, -1.2, -1.8],
        [3.8, -1.2, -1.8],
        [-3.8, -1.2, 1.8],
        [3.8, -1.2, 1.8],
      ].map((position, index) => (
        <mesh key={index} position={position as [number, number, number]}>
          <cylinderGeometry args={[0.1, 0.1, 0.4]} />
          <meshStandardMaterial color="#455A64" />
        </mesh>
      ))}

      {/* Base platform */}
      <mesh position={[0, -1.5, 0]}>
        <boxGeometry args={[9, 0.2, 5]} />
        <meshStandardMaterial color="#37474F" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Control/monitoring units */}
      <mesh position={[-5, 0.5, 0]}>
        <boxGeometry args={[1, 0.8, 0.6]} />
        <meshStandardMaterial color="#263238" />
      </mesh>

      <mesh position={[5, 0.5, 0]}>
        <boxGeometry args={[1, 0.8, 0.6]} />
        <meshStandardMaterial color="#263238" />
      </mesh>

      {/* LED indicators (pulse with flow in flow mode) */}
      <mesh ref={anodeLEDRef} position={[-5, 0.9, 0.4]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial
          color="#4CAF50"
          emissive="#4CAF50"
          emissiveIntensity={visualizationMode === 'flow' ? 0.3 : 0.5}
        />
      </mesh>

      <mesh ref={cathodeLEDRef} position={[5, 0.9, 0.4]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial
          color="#2196F3"
          emissive="#2196F3"
          emissiveIntensity={visualizationMode === 'flow' ? 0.3 : 0.5}
        />
      </mesh>

      {/* Flow particles (algae culture) */}
      {visualizationMode === 'flow' && (
        <instancedMesh ref={flowParticlesRef} args={[undefined, undefined, 40]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial
            color="#8BC34A"
            emissive="#4CAF50"
            emissiveIntensity={0.3}
            transparent
            opacity={0.8}
          />
        </instancedMesh>
      )}

      {/* Electron flow particles */}
      {visualizationMode === 'flow' && (
        <instancedMesh ref={electronParticlesRef} args={[undefined, undefined, 20]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshStandardMaterial
            color="#00E5FF"
            emissive="#00E5FF"
            emissiveIntensity={1.0}
            transparent
            opacity={0.9}
          />
        </instancedMesh>
      )}

      {/* Electrical connection visualization */}
      {visualizationMode === 'flow' && (
        <group>
          {/* Wire from anode to top */}
          <mesh position={[-3, 3.5, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 2]} />
            <meshStandardMaterial color="#424242" emissive="#00E5FF" emissiveIntensity={0.1} />
          </mesh>

          {/* Top connecting wire */}
          <mesh position={[0, 4.5, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 6]} />
            <meshStandardMaterial color="#424242" emissive="#00E5FF" emissiveIntensity={0.1} />
          </mesh>

          {/* Wire from top to cathode */}
          <mesh position={[3, 3.5, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 2]} />
            <meshStandardMaterial color="#424242" emissive="#00E5FF" emissiveIntensity={0.1} />
          </mesh>
        </group>
      )}
    </group>
  );
}
