import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface NanowireMFCModelProps {
  scale?: number;
  showAnimation?: boolean;
  visualizationMode?: 'static' | 'biofilm' | 'flow';
  parameters?: {
    // Existing parameters
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
    microbialSpecies?: string;

    // Nanowire-specific parameters
    nanowireCount?: number;
    nanowireDiameter?: number; // 50nm (converted to scene units)
    nanowireLength?: number; // 2.5μm (converted to scene units)
    nanowireSpacing?: number; // Calculated from density
    nanowireDensity?: number; // 850 per mm²
    nanowireOrientation?: 'vertical' | 'random' | 'aligned';
    nanowireMaterial?: 'nickel-silicide' | 'nickel' | 'carbon';
    substrateType?: 'foam' | 'flat' | 'textured';
    substrateThickness?: number; // 1.5mm
    substrateMaterial?: string; // 'nickel-foam'

    // Microfluidic parameters
    flowChannelWidth?: number; // 500μm
    flowChannelHeight?: number; // 200μm
    mainChannelWidth?: number; // 12mm
    mainChannelHeight?: number; // 2mm
  };
}

export default function NanowireMFCModel({
  scale = 1,
  showAnimation = false,
  visualizationMode = 'static',
  parameters = {},
}: NanowireMFCModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const nanowiresRef = useRef<THREE.Group>(null);
  const flowRef = useRef<THREE.Mesh>(null);
  const biofilmRef = useRef<THREE.Mesh>(null);

  // Calculate proper dimensions for microfluidic chip
  const dimensions = useMemo(() => {
    // Base dimensions for a 25mm x 12mm x 2mm microfluidic chip
    const baseLength = 2.5; // 25mm → 2.5 scene units
    const baseWidth = 1.2; // 12mm → 1.2 scene units
    const baseHeight = 0.2; // 2mm → 0.2 scene units

    // Scale based on parameters
    const lengthScale = parameters.chamberLength ? parameters.chamberLength / 25 : 1;
    const widthScale = parameters.chamberWidth ? parameters.chamberWidth / 12 : 1;
    const heightScale = parameters.chamberHeight ? parameters.chamberHeight / 2 : 1;

    return {
      length: baseLength * lengthScale,
      width: baseWidth * widthScale,
      height: baseHeight * heightScale,
      substrateThickness: 0.15, // 1.5mm substrate
      electrodeSpacing: baseLength * 0.6, // electrodes apart
      flowChannelHeight: parameters.flowChannelHeight || 0.02, // 200μm default
      flowChannelWidth: parameters.flowChannelWidth || 0.05, // 500μm default
    };
  }, [parameters]);

  // Nanowire array parameters
  const nanowireParams = useMemo(() => {
    const density = parameters.nanowireDensity || 850; // per mm²
    const electrodeArea =
      parameters.chamberLength && parameters.chamberWidth
        ? (parameters.chamberLength * parameters.chamberWidth) / 100 // Convert to mm²
        : 25; // Default 25 mm²

    const totalNanowires = Math.floor(density * electrodeArea);
    const nanowireCount = parameters.nanowireCount || totalNanowires;

    // Convert nanoscale dimensions to scene units
    const nanowireDiameter = parameters.nanowireDiameter
      ? parameters.nanowireDiameter / 50e-6
      : 0.02;
    const nanowireLength = parameters.nanowireLength ? parameters.nanowireLength / 2.5e-6 : 0.3;
    const nanowireSpacing = parameters.nanowireSpacing ? parameters.nanowireSpacing / 34.1e-6 : 0.2;

    return {
      count: nanowireCount,
      diameter: nanowireDiameter,
      length: nanowireLength,
      spacing: nanowireSpacing,
      density,
      electrodeArea,
    };
  }, [parameters]);

  // Material colors based on selections
  const materialColors = useMemo(() => {
    const nanowireMaterialColors: Record<string, string> = {
      'nickel-silicide': '#C0C0C0',
      nickel: '#D4D4D4',
      carbon: '#424242',
    };

    const substrateMaterialColors: Record<string, string> = {
      'nickel-foam': '#D4D4D4',
      glass: '#F0F0F0',
      silicon: '#2F4F4F',
    };

    const anodeColor =
      nanowireMaterialColors[parameters.nanowireMaterial || 'nickel-silicide'] || '#C0C0C0';
    const substrateColor =
      substrateMaterialColors[parameters.substrateMaterial || 'nickel-foam'] || '#D4D4D4';

    const cathodeColor =
      {
        platinum: '#c0c0c0',
        'carbon-pt': '#9e9e9e',
        mno2: '#8d6e63',
        carbon: '#424242',
      }[parameters.cathodeMaterial || 'platinum'] || '#c0c0c0';

    const membraneColor =
      {
        nafion: '#8bc34a',
        ultrex: '#4caf50',
        cation: '#66bb6a',
        anion: '#81c784',
      }[parameters.membraneType || 'nafion'] || '#8bc34a';

    return { anodeColor, substrateColor, cathodeColor, membraneColor };
  }, [parameters]);

  // Environmental effects
  const environmentalEffects = useMemo(() => {
    const temp = parameters.temperature || 25;
    const ph = parameters.ph || 7.0;
    const flowRate = parameters.flowRate || 5;

    // Temperature affects color intensity
    const tempIntensity = Math.max(0.3, Math.min(1.0, (temp - 15) / 25));

    // pH affects biofilm color
    const biofilmColor = ph < 6.5 ? '#ff9800' : ph > 7.5 ? '#2196f3' : '#4caf50';

    // Flow rate affects animation speed
    const flowSpeed = Math.max(0.5, Math.min(3.0, flowRate / 5));

    return { tempIntensity, biofilmColor, flowSpeed };
  }, [parameters]);

  // Level of Detail (LOD) system for nanowires
  const lodLevel = useMemo(() => {
    if (nanowireParams.count <= 100) return 'high';
    if (nanowireParams.count <= 1000) return 'medium';
    return 'low';
  }, [nanowireParams.count]);

  // Generate nanowire positions
  const nanowirePositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    const gridSize = Math.sqrt(nanowireParams.count);
    const spacing = nanowireParams.spacing;

    for (let i = 0; i < nanowireParams.count; i++) {
      const x = (i % gridSize) * spacing - (gridSize * spacing) / 2;
      const z = Math.floor(i / gridSize) * spacing - (gridSize * spacing) / 2;
      const y = dimensions.substrateThickness * 0.5;

      // Add some randomness for more realistic positioning
      const randomX = x + (Math.random() - 0.5) * spacing * 0.2;
      const randomZ = z + (Math.random() - 0.5) * spacing * 0.2;

      positions.push([randomX, y, randomZ]);
    }

    return positions;
  }, [nanowireParams, dimensions]);

  useFrame((state, delta) => {
    if (groupRef.current && showAnimation) {
      // Gentle rotation animation
      groupRef.current.rotation.y += delta * 0.1;
    }

    // Nanowire animation (subtle vibration)
    if (nanowiresRef.current && showAnimation) {
      const vibrationAmount = 0.001;
      nanowiresRef.current.position.y += Math.sin(state.clock.elapsedTime * 10) * vibrationAmount;
    }

    // Flow animation with dynamic speed
    if (flowRef.current && visualizationMode === 'flow') {
      const material = flowRef.current.material as THREE.MeshStandardMaterial;
      const baseOpacity =
        0.3 + Math.sin(state.clock.elapsedTime * 2 * environmentalEffects.flowSpeed) * 0.2;
      material.opacity = baseOpacity * environmentalEffects.tempIntensity;
    }

    // Biofilm animation with thickness parameter
    if (biofilmRef.current && visualizationMode === 'biofilm') {
      const biofilmScale = (parameters.biofilmThickness || 10) / 10;
      const pulseScale = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      biofilmRef.current.scale.setScalar(biofilmScale * pulseScale);
    }
  });

  // Cleanup Three.js objects on unmount
  useEffect(() => {
    return () => {
      // Cleanup refs and their associated Three.js objects
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

  // Render nanowires based on LOD level
  const renderNanowires = () => {
    if (lodLevel === 'high') {
      // Individual nanowires for high detail
      return nanowirePositions.slice(0, 100).map((position, index) => (
        <mesh key={index} position={position}>
          <cylinderGeometry
            args={[nanowireParams.diameter, nanowireParams.diameter, nanowireParams.length]}
          />
          <meshStandardMaterial
            color={materialColors.anodeColor}
            metalness={0.9}
            roughness={0.1}
            emissive={materialColors.anodeColor}
            emissiveIntensity={0.05}
          />
        </mesh>
      ));
    } else if (lodLevel === 'medium') {
      // Instanced geometry for medium detail
      return (
        <instancedMesh
          args={[
            new THREE.CylinderGeometry(
              nanowireParams.diameter,
              nanowireParams.diameter,
              nanowireParams.length
            ),
            new THREE.MeshStandardMaterial({
              color: materialColors.anodeColor,
              metalness: 0.9,
              roughness: 0.1,
              emissive: materialColors.anodeColor,
              emissiveIntensity: 0.05,
            }),
            Math.min(nanowireParams.count, 1000),
          ]}
        />
      );
    } else {
      // Texture-based representation for low detail
      return (
        <mesh position={[0, dimensions.substrateThickness * 0.5, 0]}>
          <boxGeometry
            args={[dimensions.length * 0.8, nanowireParams.length, dimensions.width * 0.8]}
          />
          <meshStandardMaterial
            color={materialColors.anodeColor}
            metalness={0.8}
            roughness={0.3}
            emissive={materialColors.anodeColor}
            emissiveIntensity={0.1}
          />
        </mesh>
      );
    }
  };

  return (
    <group ref={groupRef} scale={scale} position={[0, 0, 0]}>
      {/* Glass substrate base */}
      <mesh position={[0, -dimensions.height, 0]}>
        <boxGeometry args={[dimensions.length, dimensions.height * 0.5, dimensions.width]} />
        <meshStandardMaterial
          color="#F0F0F0"
          transparent
          opacity={0.9}
          roughness={0.05}
          metalness={0.0}
        />
      </mesh>

      {/* Nickel foam substrate */}
      <mesh position={[0, -dimensions.height * 0.5, 0]}>
        <boxGeometry
          args={[dimensions.length * 0.9, dimensions.substrateThickness, dimensions.width * 0.9]}
        />
        <meshStandardMaterial
          color={materialColors.substrateColor}
          metalness={0.8}
          roughness={0.6}
          emissive={materialColors.substrateColor}
          emissiveIntensity={0.02}
        />
      </mesh>

      {/* Nanowire array */}
      <group ref={nanowiresRef} position={[0, 0, 0]}>
        {renderNanowires()}
      </group>

      {/* Microfluidic chamber walls */}
      <mesh position={[0, dimensions.height * 2, 0]}>
        <boxGeometry args={[dimensions.length, dimensions.height * 0.3, dimensions.width]} />
        <meshStandardMaterial
          color="#e3f2fd"
          transparent
          opacity={0.8}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>

      {/* Cathode electrode */}
      <mesh position={[dimensions.electrodeSpacing, dimensions.height, 0]}>
        <boxGeometry args={[0.2, 0.05, dimensions.width * 0.8]} />
        <meshStandardMaterial color={materialColors.cathodeColor} metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Flow channels */}
      <mesh position={[0, dimensions.height * 1.5, 0]} ref={flowRef}>
        <boxGeometry
          args={[dimensions.length * 0.9, dimensions.flowChannelHeight, dimensions.width * 0.8]}
        />
        <meshStandardMaterial
          color={visualizationMode === 'flow' ? '#00bcd4' : '#4fc3f7'}
          transparent
          opacity={visualizationMode === 'flow' ? 0.4 : 0.6}
        />
      </mesh>

      {/* Inlet channel */}
      <mesh position={[-dimensions.length * 0.45, dimensions.height * 1.5, 0]}>
        <boxGeometry args={[0.1, dimensions.flowChannelHeight, dimensions.flowChannelWidth]} />
        <meshStandardMaterial color="#607d8b" />
      </mesh>

      {/* Outlet channel */}
      <mesh position={[dimensions.length * 0.45, dimensions.height * 1.5, 0]}>
        <boxGeometry args={[0.1, dimensions.flowChannelHeight, dimensions.flowChannelWidth]} />
        <meshStandardMaterial color="#607d8b" />
      </mesh>

      {/* Biofilm visualization (only in biofilm mode) */}
      {visualizationMode === 'biofilm' && (
        <mesh position={[0, dimensions.height * 0.5, 0]} ref={biofilmRef}>
          <boxGeometry args={[dimensions.length * 0.8, 0.02, dimensions.width * 0.8]} />
          <meshStandardMaterial
            color={environmentalEffects.biofilmColor}
            transparent
            opacity={0.7 * environmentalEffects.tempIntensity}
            emissive={environmentalEffects.biofilmColor}
            emissiveIntensity={0.1}
          />
        </mesh>
      )}

      {/* Flow particles (only in flow mode) */}
      {visualizationMode === 'flow' && (
        <>
          {Array.from({ length: 5 }).map((_, i) => (
            <mesh
              key={i}
              position={[
                -dimensions.length * 0.4 + i * ((dimensions.length * 0.8) / 5),
                dimensions.height * 1.5,
                0,
              ]}
            >
              <sphereGeometry args={[0.02, 8, 6]} />
              <meshStandardMaterial color="#01579b" transparent opacity={0.8} />
            </mesh>
          ))}
        </>
      )}

      {/* Connection wires */}
      <mesh position={[0, dimensions.height * 3, -dimensions.width * 0.5]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3]} />
        <meshStandardMaterial color="#ff5722" />
      </mesh>
      <mesh
        position={[dimensions.electrodeSpacing, dimensions.height * 3, -dimensions.width * 0.5]}
      >
        <cylinderGeometry args={[0.02, 0.02, 0.3]} />
        <meshStandardMaterial color="#2196f3" />
      </mesh>

      {/* Performance indicator (shows power density) */}
      {showAnimation && (
        <mesh position={[0, dimensions.height * 4, 0]}>
          <sphereGeometry args={[0.1, 16, 12]} />
          <meshStandardMaterial
            color="#ffc107"
            emissive="#ffc107"
            emissiveIntensity={0.5 + Math.sin(Date.now() * 0.001) * 0.3}
          />
        </mesh>
      )}
    </group>
  );
}
