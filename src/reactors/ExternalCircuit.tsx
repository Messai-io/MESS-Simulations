import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ExternalCircuitProps {
  anodePosition: [number, number, number];
  cathodePosition: [number, number, number];
  showAnimation?: boolean;
  resistance?: number;
  voltage?: number;
  systemType?: 'MFC' | 'MEC' | 'MDC' | 'MES';
}

export default function ExternalCircuit({
  anodePosition,
  cathodePosition,
  showAnimation = true,
  resistance = 1000,
  voltage = 0,
  systemType = 'MFC',
}: ExternalCircuitProps) {
  const circuitRef = useRef<THREE.Group>(null);
  const currentFlowRef = useRef<THREE.Group>(null);
  const resistorRef = useRef<THREE.Mesh>(null);
  const voltageSourceRef = useRef<THREE.Mesh>(null);

  const circuitPath = useMemo(() => {
    const anode = new THREE.Vector3(...anodePosition);
    const cathode = new THREE.Vector3(...cathodePosition);

    const midY = Math.max(anode.y, cathode.y) + 0.5;

    return {
      anodeWireStart: anode,
      anodeWireEnd: new THREE.Vector3(anode.x, midY, anode.z),
      topWireStart: new THREE.Vector3(anode.x, midY, anode.z),
      topWireEnd: new THREE.Vector3(cathode.x, midY, cathode.z),
      cathodeWireStart: new THREE.Vector3(cathode.x, midY, cathode.z),
      cathodeWireEnd: cathode,
      resistorPos: new THREE.Vector3((anode.x + cathode.x) / 2, midY, anode.z),
    };
  }, [anodePosition, cathodePosition]);

  const currentColor = useMemo(() => {
    const colors = {
      MFC: '#ffd700',
      MEC: '#9c27b0',
      MDC: '#00bcd4',
      MES: '#ff9800',
    };
    return colors[systemType];
  }, [systemType]);

  const current = useMemo(() => {
    if (voltage > 0 && resistance > 0) {
      return (voltage / resistance) * 1000;
    }
    return 0.5;
  }, [voltage, resistance]);

  useFrame((state, delta) => {
    if (currentFlowRef.current && showAnimation) {
      currentFlowRef.current.children.forEach((child, index) => {
        const mesh = child as THREE.Mesh;
        const offset = index * 0.2;
        const progress = (state.clock.elapsedTime * current + offset) % 1;

        let position: THREE.Vector3;

        if (progress < 0.25) {
          const t = progress / 0.25;
          position = circuitPath.anodeWireStart.clone().lerp(circuitPath.anodeWireEnd, t);
        } else if (progress < 0.5) {
          const t = (progress - 0.25) / 0.25;
          position = circuitPath.topWireStart.clone().lerp(circuitPath.topWireEnd, t);
        } else if (progress < 0.75) {
          const t = (progress - 0.5) / 0.25;
          position = circuitPath.cathodeWireStart.clone().lerp(circuitPath.cathodeWireEnd, t);
        } else {
          position = circuitPath.cathodeWireEnd.clone();
        }

        mesh.position.copy(position);

        const material = mesh.material as THREE.MeshStandardMaterial;
        const intensity = 0.3 + Math.sin(state.clock.elapsedTime * 5 + offset * 2) * 0.4;
        material.emissiveIntensity = intensity;
      });
    }

    if (resistorRef.current && showAnimation) {
      const material = resistorRef.current.material as THREE.MeshStandardMaterial;
      const heat = 0.1 + (current / 10) * 0.3;
      material.emissiveIntensity = heat;
    }

    if (voltageSourceRef.current && voltage > 0) {
      voltageSourceRef.current.rotation.y += delta * 2;
    }
  });

  useEffect(() => {
    return () => {
      if (circuitRef.current) {
        circuitRef.current.traverse((child) => {
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

  const createWire = (start: THREE.Vector3, end: THREE.Vector3, color: string) => {
    const direction = end.clone().sub(start);
    const length = direction.length();
    const position = start.clone().add(direction.multiplyScalar(0.5));

    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());

    return (
      <mesh position={position.toArray()} quaternion={quaternion.toArray() as any}>
        <cylinderGeometry args={[0.01, 0.01, length]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </mesh>
    );
  };

  return (
    <group ref={circuitRef}>
      {/* Anode to Top Wire */}
      {createWire(circuitPath.anodeWireStart, circuitPath.anodeWireEnd, '#ff5722')}

      {/* Top Horizontal Wire */}
      {createWire(circuitPath.topWireStart, circuitPath.topWireEnd, '#607d8b')}

      {/* Cathode Wire Down */}
      {createWire(circuitPath.cathodeWireStart, circuitPath.cathodeWireEnd, '#2196f3')}

      {/* Resistor */}
      <mesh ref={resistorRef} position={circuitPath.resistorPos.toArray()}>
        <cylinderGeometry args={[0.03, 0.03, 0.15]} />
        <meshStandardMaterial
          color="#8d6e63"
          metalness={0.5}
          roughness={0.5}
          emissive="#ff5722"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Resistor Bands (color coding) */}
      <mesh
        position={[
          circuitPath.resistorPos.x,
          circuitPath.resistorPos.y + 0.05,
          circuitPath.resistorPos.z,
        ]}
      >
        <cylinderGeometry args={[0.031, 0.031, 0.02]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh
        position={[
          circuitPath.resistorPos.x,
          circuitPath.resistorPos.y - 0.05,
          circuitPath.resistorPos.z,
        ]}
      >
        <cylinderGeometry args={[0.031, 0.031, 0.02]} />
        <meshStandardMaterial color="#FFD700" />
      </mesh>

      {/* Voltage Source (for MEC/MES) */}
      {voltage > 0 && (
        <mesh
          ref={voltageSourceRef}
          position={[
            circuitPath.resistorPos.x + 0.3,
            circuitPath.resistorPos.y,
            circuitPath.resistorPos.z,
          ]}
        >
          <cylinderGeometry args={[0.05, 0.05, 0.1]} />
          <meshStandardMaterial
            color={systemType === 'MEC' ? '#9c27b0' : '#ff9800'}
            metalness={0.9}
            roughness={0.1}
            emissive={systemType === 'MEC' ? '#9c27b0' : '#ff9800'}
            emissiveIntensity={0.3}
          />
        </mesh>
      )}

      {/* Voltage Source Terminals */}
      {voltage > 0 && (
        <>
          <mesh
            position={[
              circuitPath.resistorPos.x + 0.3,
              circuitPath.resistorPos.y + 0.07,
              circuitPath.resistorPos.z,
            ]}
          >
            <boxGeometry args={[0.02, 0.01, 0.02]} />
            <meshStandardMaterial color="#ff5722" />
          </mesh>
          <mesh
            position={[
              circuitPath.resistorPos.x + 0.3,
              circuitPath.resistorPos.y - 0.07,
              circuitPath.resistorPos.z,
            ]}
          >
            <boxGeometry args={[0.02, 0.01, 0.02]} />
            <meshStandardMaterial color="#2196f3" />
          </mesh>
        </>
      )}

      {/* Current Flow Particles */}
      {showAnimation && (
        <group ref={currentFlowRef}>
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh key={i}>
              <sphereGeometry args={[0.015, 6, 4]} />
              <meshStandardMaterial
                color={currentColor}
                emissive={currentColor}
                emissiveIntensity={0.5}
                transparent
                opacity={0.9}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* Connection Points */}
      <mesh position={circuitPath.anodeWireStart.toArray()}>
        <sphereGeometry args={[0.02, 8, 6]} />
        <meshStandardMaterial color="#ff5722" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={circuitPath.cathodeWireEnd.toArray()}>
        <sphereGeometry args={[0.02, 8, 6]} />
        <meshStandardMaterial color="#2196f3" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}
