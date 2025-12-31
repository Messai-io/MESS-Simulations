import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface StackedFuelCellProps {
  scale?: number;
  showAnimation?: boolean;
  visualizationMode?: 'static' | 'biofilm' | 'flow';
}

export default function StackedFuelCell({
  scale = 1,
  showAnimation = false,
  visualizationMode = 'static',
}: StackedFuelCellProps) {
  const groupRef = useRef<THREE.Group>(null);
  const stackRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state, delta) => {
    if (groupRef.current && showAnimation) {
      groupRef.current.rotation.y += delta * 0.15;
    }

    // Animate individual stack elements
    if (visualizationMode === 'flow') {
      stackRefs.current.forEach((ref, i) => {
        if (ref) {
          const offset = Math.sin(state.clock.elapsedTime * 2 + i * 0.5) * 0.02;
          ref.position.y = i * 0.35 + offset;
        }
      });
    }
  });

  const stackCount = 5;

  return (
    <group ref={groupRef} scale={scale}>
      {/* Base platform */}
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[3, 0.1, 1.5]} />
        <meshStandardMaterial color="#37474f" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Stacked fuel cell units */}
      {Array.from({ length: stackCount }).map((_, i) => {
        const isAnode = i % 2 === 0;
        const yPosition = i * 0.35;

        return (
          <group key={i}>
            {/* Main cell body */}
            <mesh
              position={[0, yPosition, 0]}
              ref={(el) => {
                stackRefs.current[i] = el;
              }}
            >
              <boxGeometry args={[2.5, 0.25, 1.2]} />
              <meshStandardMaterial
                color={isAnode ? '#81c784' : '#64b5f6'}
                transparent
                opacity={0.8}
                metalness={0.3}
                roughness={0.4}
              />
            </mesh>

            {/* Electrode tabs */}
            <mesh position={[1.4, yPosition, 0]}>
              <boxGeometry args={[0.2, 0.15, 0.8]} />
              <meshStandardMaterial
                color={isAnode ? '#ffd700' : '#c0c0c0'}
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>

            {/* Internal electrode structure */}
            <mesh position={[0, yPosition + 0.05, 0]}>
              <boxGeometry args={[2.3, 0.05, 1.0]} />
              <meshStandardMaterial color="#424242" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Separator membrane */}
            <mesh position={[0, yPosition + 0.1, 0]}>
              <boxGeometry args={[2.4, 0.02, 1.1]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.7} />
            </mesh>

            {/* Flow visualizations */}
            {visualizationMode === 'flow' && (
              <>
                {/* Hydrogen flow (anode side) */}
                {isAnode &&
                  Array.from({ length: 3 }).map((_, j) => (
                    <mesh key={`h-${j}`} position={[-0.8 + j * 0.8, yPosition + 0.15, 0]}>
                      <sphereGeometry args={[0.03, 8, 6]} />
                      <meshStandardMaterial
                        color="#e3f2fd"
                        transparent
                        opacity={0.8}
                        emissive="#1976d2"
                        emissiveIntensity={0.1}
                      />
                    </mesh>
                  ))}

                {/* Oxygen flow (cathode side) */}
                {!isAnode &&
                  Array.from({ length: 3 }).map((_, j) => (
                    <mesh key={`o-${j}`} position={[-0.8 + j * 0.8, yPosition + 0.15, 0]}>
                      <sphereGeometry args={[0.025, 8, 6]} />
                      <meshStandardMaterial
                        color="#ffebee"
                        transparent
                        opacity={0.8}
                        emissive="#d32f2f"
                        emissiveIntensity={0.1}
                      />
                    </mesh>
                  ))}
              </>
            )}

            {/* Biofilm on electrodes (biofilm mode) */}
            {visualizationMode === 'biofilm' && isAnode && (
              <mesh position={[0, yPosition + 0.08, 0]}>
                <boxGeometry args={[2.2, 0.03, 0.9]} />
                <meshStandardMaterial
                  color="#4caf50"
                  transparent
                  opacity={0.6}
                  emissive="#2e7d32"
                  emissiveIntensity={0.2}
                />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Series connection wires */}
      <mesh position={[1.8, stackCount * 0.175, 0]}>
        <cylinderGeometry args={[0.03, 0.03, stackCount * 0.35]} />
        <meshStandardMaterial color="#ff7043" metalness={0.8} />
      </mesh>

      {/* Parallel connection option */}
      <mesh position={[-1.8, stackCount * 0.175, 0]}>
        <cylinderGeometry args={[0.03, 0.03, stackCount * 0.35]} />
        <meshStandardMaterial color="#2196f3" metalness={0.8} />
      </mesh>

      {/* Terminal connections */}
      <mesh position={[1.8, stackCount * 0.35 + 0.1, 0]}>
        <boxGeometry args={[0.15, 0.1, 0.3]} />
        <meshStandardMaterial color="#d32f2f" metalness={0.7} />
      </mesh>
      <mesh position={[-1.8, -0.1, 0]}>
        <boxGeometry args={[0.15, 0.1, 0.3]} />
        <meshStandardMaterial color="#1976d2" metalness={0.7} />
      </mesh>

      {/* Mounting hardware */}
      {[0, stackCount * 0.35].map((y, i) => (
        <group key={i}>
          <mesh position={[-1.5, y, 0.8]}>
            <cylinderGeometry args={[0.05, 0.05, 0.2]} />
            <meshStandardMaterial color="#616161" metalness={0.8} />
          </mesh>
          <mesh position={[1.5, y, 0.8]}>
            <cylinderGeometry args={[0.05, 0.05, 0.2]} />
            <meshStandardMaterial color="#616161" metalness={0.8} />
          </mesh>
          <mesh position={[-1.5, y, -0.8]}>
            <cylinderGeometry args={[0.05, 0.05, 0.2]} />
            <meshStandardMaterial color="#616161" metalness={0.8} />
          </mesh>
          <mesh position={[1.5, y, -0.8]}>
            <cylinderGeometry args={[0.05, 0.05, 0.2]} />
            <meshStandardMaterial color="#616161" metalness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
