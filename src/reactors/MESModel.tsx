import DualChamberReactor, { DualChamberReactorProps } from './DualChamberReactor';

interface MESModelProps {
  scale?: number;
  showAnimation?: boolean;
  visualizationMode?: 'static' | 'biofilm' | 'flow';
  parameters?: DualChamberReactorProps['parameters'];
}

export default function MESModel({
  scale = 1,
  showAnimation = false,
  visualizationMode = 'static',
  parameters = {},
}: MESModelProps) {
  return (
    <DualChamberReactor
      scale={scale}
      showAnimation={showAnimation}
      visualizationMode={visualizationMode}
      systemType="MES"
      parameters={{
        chamberLength: 100,
        chamberWidth: 50,
        chamberHeight: 35,
        electrodeSpacing: 12,
        membraneThickness: 0.4,
        anodeMaterial: 'graphite',
        cathodeMaterial: 'carbon-pt',
        membraneType: 'nafion',
        temperature: 28,
        ph: 6.8,
        flowRate: 12,
        biofilmThickness: 0.13,
        externalResistance: 800,
        operatingVoltage: 0.5,
        ...parameters,
      }}
    />
  );
}
