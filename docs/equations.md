# Equations reference — mess-simulations

This document states the equations **as implemented** in
[`src/core/scientific-calculations.ts`](../src/core/scientific-calculations.ts),
with the exact units each function expects. Where the code uses a specific
convention (e.g. temperature in °C, `n` inside the Butler-Volmer exponent), that
convention is documented rather than the textbook default.

Constants used below (from `PHYSICAL_CONSTANTS`):

- `F` = Faraday constant = `96485.3329` C/mol
- `R` = gas constant = `8.314462618` J/(mol·K)

All temperature inputs to these functions are in **degrees Celsius (°C)**; the
code converts internally via `T[K] = T[°C] + 273.15`.

## Butler-Volmer equation

`Electrochemistry.butlerVolmer(overpotential, exchangeCurrent, alpha=0.5, n=2, temperature=25)`

```
f = F / (R · T)

i = i0 · ( exp( α · n · f · η )  −  exp( −(1 − α) · n · f · η ) )
```

| Symbol | Argument          | Unit                                                                 |
| ------ | ----------------- | -------------------------------------------------------------------- |
| `η`    | `overpotential`   | V                                                                    |
| `i0`   | `exchangeCurrent` | any current / current-density unit; `i` is returned in the same unit |
| `α`    | `alpha`           | dimensionless (default 0.5)                                          |
| `n`    | `n`               | number of electrons transferred (default 2)                          |
| `T`    | `temperature`     | °C (default 25; converted to K internally)                           |

> **Convention note:** the implementation includes the electron count `n` inside
> the exponent (`α·n·f·η`). The classic single-electron Butler-Volmer form omits
> `n`; set `n = 1` to recover it.

## Tafel equation (high-overpotential limit)

`Electrochemistry.tafel(overpotential, exchangeCurrent, alpha=0.5, n=2, temperature=25)`

```
b = (R · T) / (α · n · F)          // Tafel slope, V

i = i0 · exp( η / b )
```

Same units as Butler-Volmer. This is the anodic-branch (high positive `η`)
approximation.

## Nernst equation

`Electrochemistry.nernst(standardPotential, temperature, n, activity=1)`

```
E = E0 − ( R · T / (n · F) ) · ln( activity )
```

| Symbol     | Argument            | Unit                                            |
| ---------- | ------------------- | ----------------------------------------------- |
| `E0`       | `standardPotential` | V (e.g. vs SHE)                                 |
| `T`        | `temperature`       | °C (converted to K internally)                  |
| `n`        | `n`                 | number of electrons transferred (dimensionless) |
| `activity` | `activity`          | dimensionless reaction quotient (default 1)     |

Returns the electrode potential `E` in **volts (V)**. Note the `activity`
argument is the full reaction-quotient / activity term the log acts on (not a
separate oxidized/reduced pair).

## Monod kinetics

`MassTransfer.monod(substrate, km)`

```
μ_factor = S / (Km + S)
```

Returns a **dimensionless** growth-limitation factor in `[0, 1)`. `substrate`
(`S`) and `km` (half-saturation constant `Km`) must be in the **same
concentration unit** (e.g. both mg/L or both mM); the unit cancels.

### Haldane inhibition (substrate-inhibited variant)

`MassTransfer.haldane(substrate, km, ki)`

```
factor = S / (Km + S + S² / Ki)
```

`Ki` is the inhibition constant, in the **same concentration unit** as `S` and
`Km`. Dimensionless result.

## Mass-transfer correlation (Sherwood number)

`MassTransfer.sherwood(reynoldsNumber, schmidtNumber)`

```
Sh = 2 + 0.6 · Re^0.5 · Sc^(1/3)
```

All three (`Re`, `Sc`, `Sh`) are **dimensionless**. Recover a mass-transfer
coefficient as `k = Sh · D / L` with diffusivity `D` in m²/s and characteristic
length `L` in m, giving `k` in m/s.

## Biofilm growth (Picioreanu-style)

`Biofilm.growthRate(substrate, maxGrowthRate, ks=5, yieldCoeff=0.6)`

```
rate = μ_max · Y · ( S / (Ks + S) )
```

- `maxGrowthRate` (`μ_max`) — 1/h (or your chosen inverse-time unit; carried
  through unchanged)
- `yieldCoeff` (`Y`) — dimensionless yield (default 0.6)
- `substrate` (`S`) and `ks` (`Ks`) — same concentration unit (default `Ks = 5`)

`Biofilm.thicknessGrowth(time, initialThickness, growthRate)`:

```
thickness(t) = thickness0 + growthRate · t · (1 − exp(−t / 24))
```

The `24` is a characteristic time in **hours**, so `time` should be in hours and
thickness/growthRate in consistent length / length-per-time units.

## Temperature and pH response

- `TemperatureDependence.arrhenius(temperature, activationEnergy=6000)` —
  `exp(−Ea·(1/T − 1/T_std))`, with `temperature` in °C (converted to K) and
  `T_std = 298.15 K`.
- `TemperatureDependence.vantHoff(temperature, standardTemp=25, theta=1.08)` —
  `θ^(T − T_std)`, temperatures in °C.
- `pHDependence.gaussian(pH, optimum=7.0, width=1.0)` — Gaussian around a pH
  optimum, dimensionless factor in `(0, 1]`.

## Source of truth

All of the above are transcribed from
[`src/core/scientific-calculations.ts`](../src/core/scientific-calculations.ts).
If the code changes, treat the code as authoritative and update this file.
