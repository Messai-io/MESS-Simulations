import DualChamberReactor, { DualChamberReactorProps } from './DualChamberReactor';

interface MFCModelProps {
  scale?: number;
  showAnimation?: boolean;
  visualizationMode?: 'static' | 'biofilm' | 'flow';
  parameters?: DualChamberReactorProps['parameters'];
}

export default function MFCModel({
  scale = 1,
  showAnimation = false,
  visualizationMode = 'static',
  parameters = {},
}: MFCModelProps) {
  return (
    <DualChamberReactor
      scale={scale}
      showAnimation={showAnimation}
      visualizationMode={visualizationMode}
      systemType="MFC"
      parameters={{
        chamberLength: 100,
        chamberWidth: 50,
        chamberHeight: 30,
        electrodeSpacing: 10,
        membraneThickness: 0.5,
        anodeMaterial: 'carbon-cloth',
        cathodeMaterial: 'platinum',
        membraneType: 'nafion',
        temperature: 25,
        ph: 7.0,
        flowRate: 10,
        biofilmThickness: 0.1,
        externalResistance: 1000,
        operatingVoltage: 0,
        ...parameters,
      }}
    />
  );
}
