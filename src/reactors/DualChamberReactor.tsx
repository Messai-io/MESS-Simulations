import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import ElectronFlowParticles from './ElectronFlowParticles';
import ProtonFlowVisualization from './ProtonFlowVisualization';
import BiofilmLayer from './BiofilmLayer';
import ExternalCircuit from './ExternalCircuit';

export interface DualChamberReactorProps {
  scale?: number;
  showAnimation?: boolean;
  visualizationMode?: 'static' | 'biofilm' | 'flow';
  systemType?: 'MFC' | 'MEC' | 'MDC' | 'MES';
  parameters?: {
    chamberLength?: number;
    chamberWidth?: number;
    chamberHeight?: number;
    electrodeSpacing?: number;
    membraneThickness?: number;
    anodeMaterial?: string;
    cathodeMaterial?: string;
    membraneType?: string;
    temperature?: number;
    ph?: number;
    flowRate?: number;
    biofilmThickness?: number;
    externalResistance?: number;
    operatingVoltage?: number;
  };
}

export default function DualChamberReactor({
  scale = 1,
  showAnimation = false,
  visualizationMode = 'static',
  systemType = 'MFC',
  parameters = {},
}: DualChamberReactorProps) {
  const groupRef = useRef<THREE.Group>(null);
  const anodeChamberRef = useRef<THREE.Mesh>(null);
  const cathodeChamberRef = useRef<THREE.Mesh>(null);
  const membraneRef = useRef<THREE.Mesh>(null);

  const dimensions = useMemo(() => {
    const baseLength = (parameters.chamberLength || 100) / 50;
    const baseWidth = (parameters.chamberWidth || 50) / 50;
    const baseHeight = (parameters.chamberHeight || 30) / 30;
    const spacing = (parameters.electrodeSpacing || 10) / 10;
    const membraneThick = (parameters.membraneThickness || 0.5) / 10;

    return {
      length: baseLength,
      width: baseWidth,
      height: baseHeight,
      spacing,
      membraneThickness: membraneThick,
      chamberOffset: spacing / 2,
    };
  }, [parameters]);

  const materialColors = useMemo(() => {
    const anodeColors: Record<string, string> = {
      'carbon-cloth': '#2c2c2c',
      'carbon-paper': '#424242',
      graphite: '#616161',
      'carbon-felt': '#1a1a1a',
    };

    const cathodeColors: Record<string, string> = {
      platinum: '#c0c0c0',
      'carbon-pt': '#9e9e9e',
      mno2: '#8d6e63',
      carbon: '#424242',
    };

    const membraneColors: Record<string, string> = {
      nafion: '#8bc34a',
      ultrex: '#4caf50',
      cation: '#66bb6a',
      anion: '#81c784',
    };

    return {
      anode: anodeColors[parameters.anodeMaterial || 'carbon-cloth'] || '#2c2c2c',
      cathode: cathodeColors[parameters.cathodeMaterial || 'platinum'] || '#c0c0c0',
      membrane: membraneColors[parameters.membraneType || 'nafion'] || '#8bc34a',
    };
  }, [parameters]);

  const systemConfig = useMemo(() => {
    const configs = {
      MFC: {
        chamberColor: '#4fc3f7',
        anodeLabel: 'Anaerobic',
        cathodeLabel: 'Aerobic',
        showHydrogen: false,
        showDesalination: false,
        voltage: 0,
      },
      MEC: {
        chamberColor: '#9c27b0',
        anodeLabel: 'Substrate',
        cathodeLabel: 'H₂ Production',
        showHydrogen: true,
        showDesalination: false,
        voltage: parameters.operatingVoltage || 0.8,
      },
      MDC: {
        chamberColor: '#00bcd4',
        anodeLabel: 'Wastewater',
        cathodeLabel: 'Treated Water',
        showHydrogen: false,
        showDesalination: true,
        voltage: 0,
      },
      MES: {
        chamberColor: '#ff9800',
        anodeLabel: 'Waste Stream',
        cathodeLabel: 'Product Synthesis',
        showHydrogen: false,
        showDesalination: false,
        voltage: parameters.operatingVoltage || 0.5,
      },
    };

    return configs[systemType];
  }, [systemType, parameters.operatingVoltage]);

  useFrame((state, delta) => {
    if (groupRef.current && showAnimation) {
      groupRef.current.rotation.y += delta * 0.05;
    }

    if (anodeChamberRef.current && visualizationMode === 'flow') {
      const material = anodeChamberRef.current.material as THREE.MeshStandardMaterial;
      material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }

    if (membraneRef.current && showAnimation) {
      const material = membraneRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.1 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
    }
  });

  useEffect(() => {
    return () => {
      if (groupRef.current) {
        groupRef.current.traverse((child) => {
          if ('geometry' in child && child.geometry) {
            (child.geometry as any).dispose();
          }
          if ('material' in child && child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((material: any) => material.dispose());
            } else {
              (child.material as any).dispose();
            }
          }
        });
      }
    };
  }, []);

  return (
    <group ref={groupRef} scale={scale} position={[0, 0, 0]}>
      {/* Anode Chamber */}
      <mesh
        ref={anodeChamberRef}
        position={[-dimensions.chamberOffset, 0, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[dimensions.length, dimensions.height, dimensions.width]} />
        <meshStandardMaterial
          color={systemConfig.chamberColor}
          transparent
          opacity={visualizationMode === 'flow' ? 0.4 : 0.3}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Cathode Chamber */}
      <mesh
        ref={cathodeChamberRef}
        position={[dimensions.chamberOffset, 0, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[dimensions.length, dimensions.height, dimensions.width]} />
        <meshStandardMaterial
          color={systemConfig.chamberColor}
          transparent
          opacity={visualizationMode === 'flow' ? 0.4 : 0.3}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Proton Exchange Membrane */}
      <mesh ref={membraneRef} position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[dimensions.membraneThickness, dimensions.height, dimensions.width]} />
        <meshStandardMaterial
          color={materialColors.membrane}
          transparent
          opacity={0.6}
          roughness={0.2}
          metalness={0.0}
          emissive={materialColors.membrane}
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Anode Electrode */}
      <mesh
        position={[-dimensions.chamberOffset - dimensions.length * 0.3, 0, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry
          args={[dimensions.length * 0.05, dimensions.height * 0.8, dimensions.width * 0.8]}
        />
        <meshStandardMaterial color={materialColors.anode} roughness={0.7} metalness={0.5} />
      </mesh>

      {/* Cathode Electrode */}
      <mesh
        position={[dimensions.chamberOffset + dimensions.length * 0.3, 0, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry
          args={[dimensions.length * 0.05, dimensions.height * 0.8, dimensions.width * 0.8]}
        />
        <meshStandardMaterial color={materialColors.cathode} roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Biofilm Layer on Anode */}
      {visualizationMode === 'biofilm' && (
        <BiofilmLayer
          position={[-dimensions.chamberOffset - dimensions.length * 0.25, 0, 0]}
          thickness={parameters.biofilmThickness || 0.1}
          size={[dimensions.length * 0.1, dimensions.height * 0.8, dimensions.width * 0.8]}
          showAnimation={showAnimation}
          ph={parameters.ph}
          temperature={parameters.temperature}
        />
      )}

      {/* Electron Flow Visualization */}
      {showAnimation && (
        <ElectronFlowParticles
          startPosition={[
            -dimensions.chamberOffset - dimensions.length * 0.3,
            dimensions.height * 0.3,
            0,
          ]}
          endPosition={[
            dimensions.chamberOffset + dimensions.length * 0.3,
            dimensions.height * 0.3,
            0,
          ]}
          particleCount={20}
          speed={parameters.flowRate ? parameters.flowRate / 10 : 1}
          systemType={systemType}
        />
      )}

      {/* Proton Flow Through Membrane */}
      {showAnimation && (
        <ProtonFlowVisualization
          position={[0, 0, 0]}
          membraneThickness={dimensions.membraneThickness}
          chamberHeight={dimensions.height}
          particleCount={15}
          speed={parameters.flowRate ? parameters.flowRate / 15 : 0.7}
        />
      )}

      {/* External Circuit */}
      <ExternalCircuit
        anodePosition={[
          -dimensions.chamberOffset - dimensions.length * 0.3,
          dimensions.height * 0.5,
          -dimensions.width * 0.5,
        ]}
        cathodePosition={[
          dimensions.chamberOffset + dimensions.length * 0.3,
          dimensions.height * 0.5,
          -dimensions.width * 0.5,
        ]}
        showAnimation={showAnimation}
        resistance={parameters.externalResistance}
        voltage={systemConfig.voltage}
        systemType={systemType}
      />

      {/* Hydrogen Bubbles for MEC */}
      {systemConfig.showHydrogen && showAnimation && (
        <group position={[dimensions.chamberOffset + dimensions.length * 0.3, 0, 0]}>
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh
              key={i}
              position={[
                (Math.random() - 0.5) * 0.3,
                dimensions.height * 0.3 + (Math.random() - 0.5) * 0.4,
                (Math.random() - 0.5) * 0.3,
              ]}
            >
              <sphereGeometry args={[0.02 + Math.random() * 0.02, 8, 6]} />
              <meshStandardMaterial
                color="#ffffff"
                transparent
                opacity={0.6}
                emissive="#4fc3f7"
                emissiveIntensity={0.2}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* Desalination Chamber for MDC */}
      {systemConfig.showDesalination && (
        <mesh position={[0, dimensions.height * 1.5, 0]}>
          <boxGeometry
            args={[
              dimensions.length * 2 + dimensions.membraneThickness,
              dimensions.height * 0.4,
              dimensions.width,
            ]}
          />
          <meshStandardMaterial
            color="#81d4fa"
            transparent
            opacity={0.25}
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>
      )}

      {/* Chamber Labels (invisible hitboxes for selection) */}
      <mesh
        position={[-dimensions.chamberOffset, 0, 0]}
        userData={{ label: systemConfig.anodeLabel, type: 'anode-chamber' }}
        visible={false}
      >
        <boxGeometry args={[dimensions.length, dimensions.height, dimensions.width]} />
      </mesh>
      <mesh
        position={[dimensions.chamberOffset, 0, 0]}
        userData={{ label: systemConfig.cathodeLabel, type: 'cathode-chamber' }}
        visible={false}
      >
        <boxGeometry args={[dimensions.length, dimensions.height, dimensions.width]} />
      </mesh>
    </group>
  );
}
