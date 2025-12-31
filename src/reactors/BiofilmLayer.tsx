import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BiofilmLayerProps {
  position: [number, number, number];
  thickness: number;
  size: [number, number, number];
  showAnimation?: boolean;
  ph?: number;
  temperature?: number;
}

export default function BiofilmLayer({
  position,
  thickness,
  size,
  showAnimation = true,
  ph = 7.0,
  temperature = 25,
}: BiofilmLayerProps) {
  const biofilmRef = useRef<THREE.Mesh>(null);
  const bacteriaRef = useRef<THREE.Group>(null);

  const biofilmColor = useMemo(() => {
    if (ph < 6.5) return '#ff9800';
    if (ph > 7.5) return '#2196f3';
    return '#4caf50';
  }, [ph]);

  const growthRate = useMemo(() => {
    const optimalTemp = 30;
    const tempDiff = Math.abs(temperature - optimalTemp);
    return Math.max(0.5, 1 - tempDiff / 20);
  }, [temperature]);

  const bacteriaCount = useMemo(() => {
    return Math.min(50, Math.floor(thickness * 200));
  }, [thickness]);

  useFrame((state, delta) => {
    if (biofilmRef.current && showAnimation) {
      const material = biofilmRef.current.material as THREE.MeshStandardMaterial;

      const pulseScale = 1 + Math.sin(state.clock.elapsedTime * growthRate) * 0.05;
      biofilmRef.current.scale.x = pulseScale;

      const baseIntensity = 0.1;
      const pulseIntensity = Math.sin(state.clock.elapsedTime * 2 * growthRate) * 0.05;
      material.emissiveIntensity = baseIntensity + pulseIntensity;
    }

    if (bacteriaRef.current && showAnimation) {
      bacteriaRef.current.children.forEach((child, index) => {
        const mesh = child as THREE.Mesh;
        const offset = index * 0.5;
        const wobble = Math.sin(state.clock.elapsedTime * 3 + offset) * 0.02;
        mesh.position.y = position[1] + (Math.random() - 0.5) * size[1] * 0.8 + wobble;
      });
    }
  });

  useEffect(() => {
    return () => {
      if (biofilmRef.current) {
        const mesh = biofilmRef.current;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          (mesh.material as any).dispose();
        }
      }
      if (bacteriaRef.current) {
        bacteriaRef.current.traverse((child) => {
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
    <group position={position}>
      {/* Biofilm Base Layer */}
      <mesh ref={biofilmRef}>
        <boxGeometry args={[thickness / 2, size[1], size[2]]} />
        <meshStandardMaterial
          color={biofilmColor}
          transparent
          opacity={0.7}
          roughness={0.8}
          metalness={0.0}
          emissive={biofilmColor}
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Individual Bacteria Visualization */}
      <group ref={bacteriaRef}>
        {Array.from({ length: bacteriaCount }).map((_, i) => {
          const xOffset = (Math.random() - 0.5) * thickness * 0.3;
          const yOffset = (Math.random() - 0.5) * size[1] * 0.8;
          const zOffset = (Math.random() - 0.5) * size[2] * 0.8;

          return (
            <mesh key={i} position={[xOffset, yOffset, zOffset]}>
              <sphereGeometry args={[0.01 + Math.random() * 0.01, 6, 4]} />
              <meshStandardMaterial
                color={biofilmColor}
                transparent
                opacity={0.8}
                emissive={biofilmColor}
                emissiveIntensity={0.2}
              />
            </mesh>
          );
        })}
      </group>

      {/* Extracellular Polymeric Substance (EPS) Matrix */}
      <mesh position={[thickness * 0.15, 0, 0]}>
        <boxGeometry args={[thickness * 0.2, size[1] * 0.95, size[2] * 0.95]} />
        <meshStandardMaterial
          color={biofilmColor}
          transparent
          opacity={0.3}
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>
    </group>
  );
}
