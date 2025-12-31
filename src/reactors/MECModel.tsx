import DualChamberReactor, { DualChamberReactorProps } from './DualChamberReactor';

interface MECModelProps {
  scale?: number;
  showAnimation?: boolean;
  visualizationMode?: 'static' | 'biofilm' | 'flow';
  parameters?: DualChamberReactorProps['parameters'];
}

export default function MECModel({
  scale = 1,
  showAnimation = false,
  visualizationMode = 'static',
  parameters = {},
}: MECModelProps) {
  return (
    <DualChamberReactor
      scale={scale}
      showAnimation={showAnimation}
      visualizationMode={visualizationMode}
      systemType="MEC"
      parameters={{
        chamberLength: 100,
        chamberWidth: 50,
        chamberHeight: 30,
        electrodeSpacing: 10,
        membraneThickness: 0.5,
        anodeMaterial: 'carbon-felt',
        cathodeMaterial: 'carbon-pt',
        membraneType: 'nafion',
        temperature: 30,
        ph: 7.0,
        flowRate: 15,
        biofilmThickness: 0.15,
        externalResistance: 500,
        operatingVoltage: 0.8,
        ...parameters,
      }}
    />
  );
}
