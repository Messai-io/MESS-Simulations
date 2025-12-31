import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ProtonFlowVisualizationProps {
  position: [number, number, number];
  membraneThickness: number;
  chamberHeight: number;
  particleCount?: number;
  speed?: number;
}

interface Proton {
  position: THREE.Vector3;
  progress: number;
  yOffset: number;
  zOffset: number;
}

export default function ProtonFlowVisualization({
  position,
  membraneThickness,
  chamberHeight,
  particleCount = 15,
  speed = 0.7,
}: ProtonFlowVisualizationProps) {
  const protonsRef = useRef<THREE.Group>(null);
  const protonDataRef = useRef<Proton[]>([]);

  useEffect(() => {
    protonDataRef.current = Array.from({ length: particleCount }).map((_, i) => ({
      position: new THREE.Vector3(
        position[0] - membraneThickness / 2,
        position[1] + (Math.random() - 0.5) * chamberHeight * 0.8,
        position[2] + (Math.random() - 0.5) * chamberHeight * 0.8
      ),
      progress: i / particleCount,
      yOffset: (Math.random() - 0.5) * chamberHeight * 0.8,
      zOffset: (Math.random() - 0.5) * chamberHeight * 0.8,
    }));

    return () => {
      protonDataRef.current = [];
    };
  }, [particleCount, membraneThickness, chamberHeight, position]);

  useFrame((state, delta) => {
    if (!protonsRef.current) return;

    protonDataRef.current.forEach((proton, index) => {
      proton.progress += delta * speed * 0.3;

      if (proton.progress >= 1) {
        proton.progress = 0;
        proton.yOffset = (Math.random() - 0.5) * chamberHeight * 0.8;
        proton.zOffset = (Math.random() - 0.5) * chamberHeight * 0.8;
      }

      const xPos = position[0] - membraneThickness / 2 + proton.progress * membraneThickness;

      const wiggle = Math.sin(proton.progress * Math.PI * 4 + state.clock.elapsedTime * 3) * 0.05;
      const yPos = position[1] + proton.yOffset + wiggle;
      const zPos = position[2] + proton.zOffset + Math.cos(proton.progress * Math.PI * 3) * 0.05;

      const mesh = protonsRef.current?.children[index] as THREE.Mesh;
      if (mesh) {
        mesh.position.set(xPos, yPos, zPos);

        const material = mesh.material as THREE.MeshStandardMaterial;
        const opacity = 0.3 + Math.sin(proton.progress * Math.PI) * 0.4;
        material.opacity = opacity;

        const intensity = 0.2 + Math.sin(proton.progress * Math.PI) * 0.3;
        material.emissiveIntensity = intensity;
      }
    });
  });

  useEffect(() => {
    return () => {
      if (protonsRef.current) {
        protonsRef.current.traverse((child) => {
          if ('geometry' in child && child.geometry) {
            (child.geometry as any).dispose();
          }
          if ('material' in child && child.material) {
            (child.material as any).dispose();
          }
        });
      }
    };
  }, []);

  return (
    <group ref={protonsRef} position={position}>
      {Array.from({ length: particleCount }).map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.02, 8, 6]} />
          <meshStandardMaterial
            color="#ff6b6b"
            emissive="#ff6b6b"
            emissiveIntensity={0.3}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}
