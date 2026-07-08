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

- **Electrochemistry** - Butler-Volmer, Tafel, and Nernst equations
- **Biofilm modeling** - Monod-based growth rate, thickness development,
  detachment
- **Mass transfer & kinetics** - Monod, Haldane inhibition, Sherwood correlation
- **Gas transfer** - Henry's law, kLa transfer rate, biogas composition
- **Temperature & pH response** - Arrhenius, Van't Hoff, Gaussian/asymmetric
  curves
- **3D Reactor Models** - React Three Fiber components (`src/reactors/`)
- **Statistics** - Linear regression, R², standard error
- **Unit conversions** - Targeted MES conversions (temperature, concentration,
  power/current density)
- **NIST physical constants** - `PHYSICAL_CONSTANTS` and `MES_CONSTANTS` tables

## Installation

This is a TypeScript/JavaScript package published to npm. There is no Python
distribution.

```bash
npm install @messai-io/mess-simulations
```

The 3D reactor models depend on Three.js as a peer dependency
(`three >=0.150.0`); install it alongside the package if you use them.

```bash
npm install three
```

## Features

The scientific calculations are exported as namespaced objects from
`src/core/scientific-calculations.ts`: `Electrochemistry`, `MassTransfer`,
`Biofilm`, `GasTransfer`, `TemperatureDependence`, `pHDependence`, `Statistics`,
`UnitConversions`, plus the constant tables `PHYSICAL_CONSTANTS` and
`MES_CONSTANTS`. Import the namespace you need and call its methods. Every unit
below is verified against the implementation.

### Butler-Volmer Kinetics

`Electrochemistry.butlerVolmer(overpotential, exchangeCurrent, alpha?, n?, temperature?)`

Units: `overpotential` in **volts (V)**; `exchangeCurrent` (the exchange current
or exchange current density i₀) in **any current or current-density unit** — the
result is returned in the same unit; `alpha` (charge-transfer coefficient) is
**dimensionless** (default `0.5`); `n` is the **number of electrons
transferred** (default `2`); `temperature` is in **degrees Celsius (°C)**
(default `25`, the code adds 273.15 internally to get kelvin).

```javascript
import { Electrochemistry } from '@messai-io/mess-simulations';

// i₀ = 1e-6 A/m², η = 0.1 V, α = 0.5, n = 2, T = 25 °C
// Returns net current density in A/m² (same unit as exchangeCurrent).
const current = Electrochemistry.butlerVolmer(
  0.1, // overpotential η [V]
  1e-6, // exchange current density i₀ [A/m²]
  0.5, // charge-transfer coefficient α [dimensionless]
  2, // electrons transferred n [–]
  25 // temperature [°C]
);
```

### Nernst Equation

`Electrochemistry.nernst(standardPotential, temperature, n, activity?)`

Units: `standardPotential` E⁰ in **volts (V)** (e.g. vs. SHE); `temperature` in
**degrees Celsius (°C)** (converted to kelvin internally); `n` is the **number
of electrons transferred** (dimensionless); `activity` is the **dimensionless
reaction quotient / activity term** (default `1`). Returns the potential in
**volts (V)**.

```javascript
import { Electrochemistry } from '@messai-io/mess-simulations';

// E = E0 − (RT/nF)·ln(activity)
const E = Electrochemistry.nernst(
  -0.414, // standard potential E0 [V vs SHE]
  25, // temperature [°C]
  2, // electrons transferred n [–]
  1e-3 // activity term (reaction quotient) [dimensionless]
);
```

### Monod Kinetics

`MassTransfer.monod(substrate, km)` returns the **dimensionless**
growth-limitation factor `S / (Km + S)`. `substrate` (S) and `km` (the
half-saturation constant Ks) must be expressed in the **same concentration
unit** (e.g. both mg/L or both mM); the ratio cancels the unit.

```javascript
import { MassTransfer } from '@messai-io/mess-simulations';

// S = 100 mg/L, Km = 10 mg/L → dimensionless factor in [0, 1)
const factor = MassTransfer.monod(
  100, // substrate concentration S [mg/L]
  10 // half-saturation constant Km [mg/L] (same unit as S)
);
```

### Mass-Transfer Correlation (Sherwood number)

The package does not expose a single "mass-transfer coefficient" helper; it
provides the Sherwood-number correlation instead.
`MassTransfer.sherwood(reynoldsNumber, schmidtNumber)` takes the
**dimensionless** Reynolds and Schmidt numbers and returns the **dimensionless**
Sherwood number `Sh = 2 + 0.6·Re^0.5·Sc^(1/3)`. Recover the mass-transfer
coefficient yourself as `k = Sh · D / L` (with diffusivity `D` in m²/s and
characteristic length `L` in m, giving `k` in m/s).

```javascript
import { MassTransfer } from '@messai-io/mess-simulations';

const Sh = MassTransfer.sherwood(
  100, // Reynolds number Re [dimensionless]
  1000 // Schmidt number Sc [dimensionless]
);
// k = Sh * D / L, e.g. D = 1.5e-9 m²/s, L = 0.01 m → k in m/s
const k = (Sh * 1.5e-9) / 0.01;
```

### Physical Constants

Exported as the frozen object `PHYSICAL_CONSTANTS`.

```javascript
import { PHYSICAL_CONSTANTS } from '@messai-io/mess-simulations';

console.log(PHYSICAL_CONSTANTS.FARADAY); // 96485.3329 C/mol
console.log(PHYSICAL_CONSTANTS.GAS_CONSTANT); // 8.314462618 J/(mol·K)
console.log(PHYSICAL_CONSTANTS.AVOGADRO); // 6.02214076e23 1/mol
```

### Unit Conversion

Unit conversions are individual functions on the `UnitConversions` namespace
(there is no `UnitConverter` class with a generic `.convert()` method).

```javascript
import { UnitConversions } from '@messai-io/mess-simulations';

// Power density: W/m² → μW/cm²  (multiply by 100)
const uW_cm2 = UnitConversions.wattPerM2ToMicroWattPerCm2(150); // 15000 μW/cm²

// Temperature: °C ↔ K
const kelvin = UnitConversions.celsiusToKelvin(25); // 298.15 K
const celsius = UnitConversions.kelvinToCelsius(298.15); // 25 °C
```

## 3D Reactor Models

The `src/reactors/` directory ships React Three Fiber components (default
exports), one per system type — for example `MFCModel`, `MECModel`, `MDCModel`,
`DualChamberReactor`, `AlgaeFuelCell`, `NanowireMFCModel`, and
`StackedFuelCell`. Render them inside a React Three Fiber `<Canvas>`; they are
components, not a `ReactorModel` class.

```jsx
import { Canvas } from '@react-three/fiber';
import MFCModel from '@messai-io/mess-simulations/src/reactors/MFCModel';

function ReactorScene(props) {
  return (
    <Canvas>
      <MFCModel {...props} />
    </Canvas>
  );
}
```

> **Note:** consult each component's `Props` interface in `src/reactors/` for
> the exact props it accepts.

## Equations

The exact equations implemented (Butler-Volmer, Tafel, Nernst, Monod, Haldane,
Sherwood, biofilm growth) with their units are documented in
[docs/equations.md](docs/equations.md).

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
