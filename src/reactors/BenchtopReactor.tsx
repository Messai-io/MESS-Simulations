import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BenchtopReactorProps {
  scale?: number;
  showAnimation?: boolean;
  visualizationMode?: 'static' | 'biofilm' | 'flow';
}

export default function BenchtopReactor({
  scale = 1,
  showAnimation = false,
  visualizationMode = 'static',
}: BenchtopReactorProps) {
  const groupRef = useRef<THREE.Group>(null);
  const liquidRef = useRef<THREE.Mesh>(null);
  const bubbleRefs = useRef<THREE.Mesh[]>([]);

  useFrame((state, delta) => {
    if (groupRef.current && showAnimation) {
      groupRef.current.rotation.y += delta * 0.08;
    }

    // Liquid surface animation
    if (liquidRef.current && visualizationMode === 'flow') {
      liquidRef.current.position.y = 0.2 + Math.sin(state.clock.elapsedTime) * 0.05;
    }

    // Bubble animation
    if (visualizationMode === 'flow') {
      bubbleRefs.current.forEach((bubble) => {
        if (bubble) {
          bubble.position.y += delta * 0.5;
          if (bubble.position.y > 1.2) {
            bubble.position.y = -0.5;
          }
        }
      });
    }
  });

  return (
    <group ref={groupRef} scale={scale}>
      {/* Base support platform */}
      <mesh position={[0, -1, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.1]} />
        <meshStandardMaterial color="#37474f" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Main reactor vessel (glass) */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[1, 1, 2]} />
        <meshStandardMaterial
          color="#e8f5e8"
          transparent
          opacity={0.3}
          roughness={0.1}
          metalness={0.0}
        />
      </mesh>

      {/* Reactor liquid medium */}
      <mesh position={[0, 0.2, 0]} ref={liquidRef}>
        <cylinderGeometry args={[0.95, 0.95, 1.6]} />
        <meshStandardMaterial
          color={visualizationMode === 'biofilm' ? '#66bb6a' : '#81c784'}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Central electrode assembly */}
      <group>
        {/* Anode (center) */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 1.5]} />
          <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Cathode (surrounding) */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.7, 0.7, 1.3, 32, 1, true]} />
          <meshStandardMaterial
            color="#c0c0c0"
            metalness={0.9}
            roughness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Electrode supports */}
        {Array.from({ length: 4 }).map((_, i) => (
          <mesh
            key={i}
            position={[Math.cos((i * Math.PI) / 2) * 0.8, 0.8, Math.sin((i * Math.PI) / 2) * 0.8]}
          >
            <cylinderGeometry args={[0.02, 0.02, 0.3]} />
            <meshStandardMaterial color="#424242" />
          </mesh>
        ))}
      </group>

      {/* Biofilm on anode (biofilm mode) */}
      {visualizationMode === 'biofilm' && (
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 1.4]} />
          <meshStandardMaterial
            color="#4caf50"
            transparent
            opacity={0.8}
            emissive="#2e7d32"
            emissiveIntensity={0.3}
          />
        </mesh>
      )}

      {/* Gas bubbles (flow mode) */}
      {visualizationMode === 'flow' && (
        <>
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh
              key={i}
              position={[
                (Math.random() - 0.5) * 1.5,
                -0.5 + Math.random() * 2,
                (Math.random() - 0.5) * 1.5,
              ]}
              ref={(el) => {
                if (el) bubbleRefs.current[i] = el;
              }}
            >
              <sphereGeometry args={[0.02 + Math.random() * 0.03, 8, 6]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.8} />
            </mesh>
          ))}
        </>
      )}

      {/* Input ports */}
      <mesh position={[1.2, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.3]} />
        <meshStandardMaterial color="#607d8b" />
      </mesh>

      {/* Output port */}
      <mesh position={[1.2, -0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.3]} />
        <meshStandardMaterial color="#607d8b" />
      </mesh>

      {/* Gas outlet */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.2]} />
        <meshStandardMaterial color="#455a64" />
      </mesh>

      {/* pH probe */}
      <mesh position={[0.8, 0.8, 0.8]}>
        <cylinderGeometry args={[0.03, 0.03, 0.6]} />
        <meshStandardMaterial color="#795548" />
      </mesh>

      {/* Temperature probe */}
      <mesh position={[-0.8, 0.6, 0.8]}>
        <cylinderGeometry args={[0.025, 0.025, 0.5]} />
        <meshStandardMaterial color="#ff9800" />
      </mesh>

      {/* Electrical connections */}
      <mesh position={[0.2, 1.0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3]} />
        <meshStandardMaterial color="#f44336" />
      </mesh>
      <mesh position={[-0.2, 1.0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3]} />
        <meshStandardMaterial color="#2196f3" />
      </mesh>

      {/* Mixing/stirring element */}
      <group position={[0, 0.9, 0]}>
        <mesh>
          <cylinderGeometry args={[0.01, 0.01, 0.8]} />
          <meshStandardMaterial color="#263238" />
        </mesh>
        <mesh position={[0, -0.3, 0]}>
          <boxGeometry args={[0.3, 0.02, 0.05]} />
          <meshStandardMaterial color="#263238" />
        </mesh>
        <mesh position={[0, -0.3, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.3, 0.02, 0.05]} />
          <meshStandardMaterial color="#263238" />
        </mesh>
      </group>

      {/* Support legs */}
      {Array.from({ length: 3 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i * 2 * Math.PI) / 3) * 1.1,
            -0.5,
            Math.sin((i * 2 * Math.PI) / 3) * 1.1,
          ]}
        >
          <cylinderGeometry args={[0.03, 0.03, 1]} />
          <meshStandardMaterial color="#37474f" />
        </mesh>
      ))}

      {/* Control panel */}
      <mesh position={[1.5, 0, 0]}>
        <boxGeometry args={[0.1, 0.6, 0.4]} />
        <meshStandardMaterial color="#263238" />
      </mesh>

      {/* Display screen */}
      <mesh position={[1.55, 0.1, 0]}>
        <boxGeometry args={[0.02, 0.25, 0.15]} />
        <meshStandardMaterial color="#00bcd4" emissive="#006064" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}
