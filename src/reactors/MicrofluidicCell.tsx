import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MicrofluidicCellProps {
  scale?: number;
  showAnimation?: boolean;
  visualizationMode?: 'static' | 'biofilm' | 'flow';
}

export default function MicrofluidicCell({
  scale = 1,
  showAnimation = false,
  visualizationMode = 'static',
}: MicrofluidicCellProps) {
  const groupRef = useRef<THREE.Group>(null);
  const flowRef = useRef<THREE.Mesh>(null);
  const biofilmRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (groupRef.current && showAnimation) {
      // Gentle rotation animation
      groupRef.current.rotation.y += delta * 0.1;
    }

    // Flow animation
    if (flowRef.current && visualizationMode === 'flow') {
      const material = flowRef.current.material as THREE.MeshStandardMaterial;
      material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }

    // Biofilm animation
    if (biofilmRef.current && visualizationMode === 'biofilm') {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      biofilmRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={groupRef} scale={scale} position={[0, 0, 0]}>
      {/* Base microscope slide - centered */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[4, 0.1, 1.5]} />
        <meshStandardMaterial
          color="#e3f2fd"
          transparent
          opacity={0.8}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>

      {/* Glass cover layer */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[3.8, 0.02, 1.3]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.3}
          roughness={0.0}
          metalness={0.0}
        />
      </mesh>

      {/* Anode electrode (left) */}
      <mesh position={[-1.5, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.4]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Cathode electrode (right) */}
      <mesh position={[1.5, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.4]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Magnetic positioning elements */}
      <mesh position={[-1.5, -0.25, 0]}>
        <boxGeometry args={[0.3, 0.1, 0.3]} />
        <meshStandardMaterial color="#8B4513" metalness={0.5} />
      </mesh>
      <mesh position={[1.5, -0.25, 0]}>
        <boxGeometry args={[0.3, 0.1, 0.3]} />
        <meshStandardMaterial color="#8B4513" metalness={0.5} />
      </mesh>

      {/* Fluid channels */}
      <mesh position={[0, 0.05, 0]} ref={flowRef}>
        <boxGeometry args={[3.6, 0.08, 1.2]} />
        <meshStandardMaterial
          color={visualizationMode === 'flow' ? '#00bcd4' : '#4fc3f7'}
          transparent
          opacity={visualizationMode === 'flow' ? 0.4 : 0.6}
        />
      </mesh>

      {/* Hydrogel membrane layer */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[3.4, 0.03, 1.0]} />
        <meshStandardMaterial color="#8bc34a" transparent opacity={0.5} />
      </mesh>

      {/* Biofilm visualization (only in biofilm mode) */}
      {visualizationMode === 'biofilm' && (
        <mesh position={[-1.5, 0.1, 0]} ref={biofilmRef}>
          <sphereGeometry args={[0.2, 16, 12]} />
          <meshStandardMaterial
            color="#4caf50"
            transparent
            opacity={0.7}
            emissive="#2e7d32"
            emissiveIntensity={0.1}
          />
        </mesh>
      )}

      {/* Flow particles (only in flow mode) */}
      {visualizationMode === 'flow' && (
        <>
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh key={i} position={[-1.5 + i * 0.6, 0.05, 0]}>
              <sphereGeometry args={[0.02, 8, 6]} />
              <meshStandardMaterial color="#01579b" transparent opacity={0.8} />
            </mesh>
          ))}
        </>
      )}

      {/* Connection wires */}
      <mesh position={[-1.5, 0.3, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.2]} />
        <meshStandardMaterial color="#ff5722" />
      </mesh>
      <mesh position={[1.5, 0.3, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.2]} />
        <meshStandardMaterial color="#2196f3" />
      </mesh>

      {/* Input/output ports */}
      <mesh position={[-2.2, 0.05, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.15]} />
        <meshStandardMaterial color="#607d8b" />
      </mesh>
      <mesh position={[2.2, 0.05, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.15]} />
        <meshStandardMaterial color="#607d8b" />
      </mesh>
    </group>
  );
}
