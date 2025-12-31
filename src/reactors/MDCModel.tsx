import DualChamberReactor, { DualChamberReactorProps } from './DualChamberReactor';

interface MDCModelProps {
  scale?: number;
  showAnimation?: boolean;
  visualizationMode?: 'static' | 'biofilm' | 'flow';
  parameters?: DualChamberReactorProps['parameters'];
}

export default function MDCModel({
  scale = 1,
  showAnimation = false,
  visualizationMode = 'static',
  parameters = {},
}: MDCModelProps) {
  return (
    <DualChamberReactor
      scale={scale}
      showAnimation={showAnimation}
      visualizationMode={visualizationMode}
      systemType="MDC"
      parameters={{
        chamberLength: 120,
        chamberWidth: 60,
        chamberHeight: 40,
        electrodeSpacing: 15,
        membraneThickness: 0.3,
        anodeMaterial: 'carbon-cloth',
        cathodeMaterial: 'carbon',
        membraneType: 'cation',
        temperature: 25,
        ph: 7.5,
        flowRate: 20,
        biofilmThickness: 0.12,
        externalResistance: 1500,
        operatingVoltage: 0,
        ...parameters,
      }}
    />
  );
}
