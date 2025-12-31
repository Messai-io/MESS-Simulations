import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ElectronFlowParticlesProps {
  startPosition: [number, number, number];
  endPosition: [number, number, number];
  particleCount?: number;
  speed?: number;
  systemType?: 'MFC' | 'MEC' | 'MDC' | 'MES';
}

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  progress: number;
  id: number;
}

export default function ElectronFlowParticles({
  startPosition,
  endPosition,
  particleCount = 20,
  speed = 1,
  systemType = 'MFC',
}: ElectronFlowParticlesProps) {
  const particlesRef = useRef<THREE.Group>(null);
  const particleDataRef = useRef<Particle[]>([]);

  const pathVector = useMemo(() => {
    const start = new THREE.Vector3(...startPosition);
    const end = new THREE.Vector3(...endPosition);
    return end.sub(start);
  }, [startPosition, endPosition]);

  const particleColor = useMemo(() => {
    const colors = {
      MFC: '#ffd700',
      MEC: '#9c27b0',
      MDC: '#00bcd4',
      MES: '#ff9800',
    };
    return colors[systemType];
  }, [systemType]);

  useEffect(() => {
    particleDataRef.current = Array.from({ length: particleCount }).map((_, i) => ({
      position: new THREE.Vector3(...startPosition),
      velocity: pathVector
        .clone()
        .normalize()
        .multiplyScalar(speed * 0.01),
      progress: i / particleCount,
      id: i,
    }));

    return () => {
      particleDataRef.current = [];
    };
  }, [particleCount, speed, pathVector, startPosition]);

  useFrame((state, delta) => {
    if (!particlesRef.current) return;

    particleDataRef.current.forEach((particle, index) => {
      particle.progress += delta * speed * 0.2;

      if (particle.progress >= 1) {
        particle.progress = 0;
      }

      const start = new THREE.Vector3(...startPosition);
      const currentPos = start.clone().add(pathVector.clone().multiplyScalar(particle.progress));

      const yOffset = Math.sin(particle.progress * Math.PI * 2 + state.clock.elapsedTime * 2) * 0.1;
      currentPos.y += yOffset;

      const mesh = particlesRef.current?.children[index] as THREE.Mesh;
      if (mesh) {
        mesh.position.copy(currentPos);

        const material = mesh.material as THREE.MeshStandardMaterial;
        const intensity = 0.3 + Math.sin(particle.progress * Math.PI) * 0.5;
        material.emissiveIntensity = intensity;

        const scale = 0.7 + Math.sin(particle.progress * Math.PI) * 0.3;
        mesh.scale.setScalar(scale);
      }
    });
  });

  useEffect(() => {
    return () => {
      if (particlesRef.current) {
        particlesRef.current.traverse((child) => {
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
    <group ref={particlesRef}>
      {Array.from({ length: particleCount }).map((_, i) => (
        <mesh key={i} position={startPosition}>
          <sphereGeometry args={[0.03, 8, 6]} />
          <meshStandardMaterial
            color={particleColor}
            emissive={particleColor}
            emissiveIntensity={0.5}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}
