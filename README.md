# MESS-Simulations

<!-- MIRROR_DISCLOSURE_START -->

> **This repository is a downstream mirror.** Source of truth lives in the
> `messai-ai` monorepo; this mirror is updated on each release. Issues and
> Discussions are welcome here. PRs against this mirror will be redirected — see
> [CONTRIBUTING.md](./CONTRIBUTING.md).
>
> History was reset as part of the 2026 monorepo consolidation. Versions tagged
> before that (e.g. `v0.2.0`) remain accessible as historical refs.

<!-- MIRROR_DISCLOSURE_END -->

**Physics-based simulation and modeling tools for Microbial Electrochemical
Systems**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/@messai-io%2Fmess-simulations.svg)](https://www.npmjs.com/package/@messai-io/mess-simulations)

## Overview

MESS-Simulations provides physics-based simulation tools for MES research:

- **Butler-Volmer Kinetics** - Electrode kinetics with Tafel approximation
- **Biofilm Growth Simulator** - Time-lapse biofilm modeling
- **COMSOL Integration** - MPH/CSV/TXT file parsing
- **3D Reactor Models** - Interactive Three.js visualizations
- **Scientific Calculations** - Nernst, Monod, kLa, regression
- **Unit Converter** - SI/US/EU standards conversion
- **NIST Constants** - Validated physical constants

## Installation

```bash
npm install @messai-io/mess-simulations
# or
pip install mess-simulations
```

## Features

### Butler-Volmer Kinetics

```javascript
import { ButlerVolmer } from '@messai-io/mess-simulations';

const bv = new ButlerVolmer({
  exchangeCurrentDensity: 1e-6, // A/m²
  transferCoefficient: 0.5,
  temperature: 298.15, // K
});

// Calculate current density at overpotential
const current = bv.currentDensity(0.1); // η = 100 mV
```

### Biofilm Growth Simulation

```javascript
import { BiofilmSimulator } from '@messai-io/mess-simulations';

const sim = new BiofilmSimulator({
  initialThickness: 10e-6, // 10 μm
  growthRate: 0.1, // 1/h
  substrate: 'acetate',
  substrateConcentration: 10, // mM
});

const results = sim.simulate({ duration: 168, timestep: 1 }); // 1 week
```

### Scientific Calculations

```javascript
import {
  nernstPotential,
  monodKinetics,
  massTransferCoefficient,
} from '@messai-io/mess-simulations';

// Nernst equation
const E = nernstPotential({
  E0: -0.414, // V vs SHE
  n: 2,
  oxidized: 1e-3,
  reduced: 1e-6,
});

// Monod kinetics
const mu = monodKinetics({
  muMax: 0.5, // 1/h
  Ks: 10, // mg/L
  S: 100, // mg/L
});

// Mass transfer coefficient
const kLa = massTransferCoefficient({
  diffusivity: 1.5e-9, // m²/s
  characteristicLength: 0.01, // m
  sherwoodNumber: 2,
});
```

### Unit Conversion

```javascript
import { UnitConverter } from '@messai-io/mess-simulations';

const converter = new UnitConverter();

// Convert power density
const mW_cm2 = converter.convert(150, 'W/m²', 'mW/cm²');

// Temperature conversion
const celsius = converter.convert(298.15, 'K', '°C');
```

### Physical Constants

```javascript
import { constants } from '@messai-io/mess-simulations';

console.log(constants.FARADAY); // 96485.33212 C/mol
console.log(constants.R); // 8.314462618 J/(mol·K)
console.log(constants.AVOGADRO); // 6.02214076e23 1/mol
```

### COMSOL Integration

```javascript
import { COMSOLParser } from '@messai-io/mess-simulations';

const parser = new COMSOLParser();

// Parse COMSOL mesh file
const mesh = await parser.parseMesh('reactor.mph');

// Convert to Three.js geometry
const geometry = mesh.toThreeJSGeometry();
```

## 3D Reactor Models

Interactive reactor visualizations using Three.js:

```javascript
import { ReactorModel } from '@messai-io/mess-simulations/models';

const mfc = new ReactorModel('dual-chamber-mfc');
mfc.setElectrodeSpacing(0.02); // 2 cm
mfc.setBiofilmThickness(50e-6); // 50 μm
mfc.render(canvasElement);
```

## API Reference

See [API Documentation](docs/API.md) for complete reference.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [MESSAI Platform](https://messai.io)
- [Documentation](https://docs.messai.io/simulations)
- [Examples](examples/)
