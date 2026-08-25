/**
 * Scientific Calculation Utilities for MES Research Tools
 * Common functions and constants used across researcher tools
 */

// Physical constants from NIST
export const PHYSICAL_CONSTANTS = {
  FARADAY: 96485.33212, // C/mol (CODATA 2018)
  GAS_CONSTANT: 8.314462618, // J/(mol·K)
  PLANCK: 6.62607015e-34, // J·s
  AVOGADRO: 6.02214076e23, // mol⁻¹
  BOLTZMANN: 1.380649e-23, // J/K
  SPEED_OF_LIGHT: 299792458, // m/s
  ELEMENTARY_CHARGE: 1.602176634e-19, // C
} as const;

// Common MES system constants
export const MES_CONSTANTS = {
  STANDARD_TEMP: 298.15, // K (25°C)
  STANDARD_PRESSURE: 101325, // Pa
  WATER_DENSITY: 1000, // kg/m³
  WATER_VISCOSITY: 0.001, // Pa·s at 25°C
} as const;

/**
 * Temperature dependence models
 */
export const TemperatureDependence = {
  /**
   * Arrhenius temperature dependence
   */
  arrhenius: (temperature: number, activationEnergy = 6000): number => {
    const T = temperature + 273.15; // Convert to Kelvin
    return Math.exp(-activationEnergy * (1 / T - 1 / MES_CONSTANTS.STANDARD_TEMP));
  },

  /**
   * Van't Hoff temperature dependence
   */
  vantHoff: (temperature: number, standardTemp = 25, theta = 1.08): number => {
    return Math.pow(theta, temperature - standardTemp);
  },

  /**
   * Gaussian temperature optimum curve
   */
  gaussian: (temperature: number, optimum = 35, width = 10): number => {
    return Math.exp(-Math.pow(temperature - optimum, 2) / (2 * width * width));
  },
};

/**
 * pH dependence models
 */
export const pHDependence = {
  /**
   * Symmetric pH optimum (Gaussian)
   */
  gaussian: (pH: number, optimum = 7.0, width = 1.0): number => {
    return Math.exp(-Math.pow(pH - optimum, 2) / (2 * width * width));
  },

  /**
   * Asymmetric pH curve for biological systems
   */
  asymmetric: (pH: number, optimum = 7.0, acidWidth = 1.5, alkalineWidth = 0.8): number => {
    const width = pH < optimum ? acidWidth : alkalineWidth;
    return Math.exp(-Math.pow(pH - optimum, 2) / (2 * width * width));
  },

  /**
   * Henderson-Hasselbalch equation
   */
  hendersonHasselbalch: (pH: number, pKa: number): number => {
    return 1 / (1 + Math.pow(10, pKa - pH));
  },
};

/**
 * Mass transfer and kinetics
 */
export const MassTransfer = {
  /**
   * Monod kinetics
   */
  monod: (substrate: number, km: number): number => {
    return substrate / (km + substrate);
  },

  /**
   * Haldane inhibition kinetics
   */
  haldane: (substrate: number, km: number, ki: number): number => {
    return substrate / (km + substrate + (substrate * substrate) / ki);
  },

  /**
   * Sherwood number correlation for mass transfer
   */
  sherwood: (reynoldsNumber: number, schmidtNumber: number): number => {
    return 2.0 + 0.6 * Math.pow(reynoldsNumber, 0.5) * Math.pow(schmidtNumber, 1 / 3);
  },
};

/**
 * Electrochemical calculations
 */
export const Electrochemistry = {
  /**
   * Nernst equation
   */
  nernst: (standardPotential: number, temperature: number, n: number, activity = 1): number => {
    const T = temperature + 273.15;
    return (
      standardPotential -
      ((PHYSICAL_CONSTANTS.GAS_CONSTANT * T) / (n * PHYSICAL_CONSTANTS.FARADAY)) *
        Math.log(activity)
    );
  },

  /**
   * Butler-Volmer equation
   */
  butlerVolmer: (
    overpotential: number,
    exchangeCurrent: number,
    alpha = 0.5,
    n = 2,
    temperature = 25
  ): number => {
    const T = temperature + 273.15;
    const f = PHYSICAL_CONSTANTS.FARADAY / (PHYSICAL_CONSTANTS.GAS_CONSTANT * T);
    const anodic = Math.exp(alpha * n * f * overpotential);
    const cathodic = Math.exp(-(1 - alpha) * n * f * overpotential);
    return exchangeCurrent * (anodic - cathodic);
  },

  /**
   * Tafel equation (high overpotential limit)
   */
  tafel: (
    overpotential: number,
    exchangeCurrent: number,
    alpha = 0.5,
    n = 2,
    temperature = 25
  ): number => {
    const T = temperature + 273.15;
    const b = (PHYSICAL_CONSTANTS.GAS_CONSTANT * T) / (alpha * n * PHYSICAL_CONSTANTS.FARADAY);
    return exchangeCurrent * Math.exp(overpotential / b);
  },
};

/**
 * Biofilm modeling
 */
export const Biofilm = {
  /**
   * Biofilm growth rate (Picioreanu model)
   */
  growthRate: (substrate: number, maxGrowthRate: number, ks = 5, yieldCoeff = 0.6): number => {
    return maxGrowthRate * yieldCoeff * MassTransfer.monod(substrate, ks);
  },

  /**
   * Biofilm thickness development
   */
  thicknessGrowth: (time: number, initialThickness: number, growthRate: number): number => {
    return initialThickness + growthRate * time * (1 - Math.exp(-time / 24)); // 24h characteristic time
  },

  /**
   * Biofilm detachment rate
   */
  detachmentRate: (thickness: number, shearStress: number, detachmentCoeff = 0.1): number => {
    return detachmentCoeff * shearStress * Math.pow(thickness / 10, 1.5); // normalized to 10 μm
  },
};

/**
 * Gas transfer and biogas calculations
 */
export const GasTransfer = {
  /**
   * Henry's law for gas solubility
   */
  henryLaw: (partialPressure: number, henryConstant: number): number => {
    return partialPressure / henryConstant;
  },

  /**
   * Gas transfer rate (kLa)
   */
  transferRate: (kLa: number, cSat: number, cLiquid: number): number => {
    return kLa * (cSat - cLiquid);
  },

  /**
   * Biogas composition calculation
   */
  biogasComposition: (codRemoval: number, temperature: number) => {
    const tempFactor = TemperatureDependence.gaussian(temperature, 35, 15);
    const baseYield = 0.35; // L CH4/g COD removed
    const ch4Yield = baseYield * tempFactor * (codRemoval / 100);

    return {
      methane: Math.min(75, (ch4Yield * 100) / 0.6), // % CH4
      carbonDioxide: Math.max(20, 100 - (ch4Yield * 100) / 0.6 - 5), // % CO2
      other: 5, // % other gases
    };
  },
};

/**
 * Statistical analysis utilities
 */
export const Statistics = {
  /**
   * Linear regression
   */
  linearRegression: (x: number[], y: number[]) => {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  },

  /**
   * R-squared coefficient of determination
   */
  rSquared: (x: number[], y: number[], slope: number, intercept: number): number => {
    const yMean = y.reduce((a, b) => a + b, 0) / y.length;
    const ssRes = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    return 1 - ssRes / ssTot;
  },

  /**
   * Standard error calculation
   */
  standardError: (values: number[]): number => {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance / values.length);
  },
};

/**
 * Unit conversions for MES systems
 */
export const UnitConversions = {
  /**
   * Temperature conversions
   */
  celsiusToKelvin: (celsius: number): number => celsius + 273.15,
  kelvinToCelsius: (kelvin: number): number => kelvin - 273.15,

  /**
   * Concentration conversions
   */
  mgLToMolar: (mgL: number, molecularWeight: number): number => mgL / 1000 / molecularWeight,
  molarToMgL: (molar: number, molecularWeight: number): number => molar * molecularWeight * 1000,

  /**
   * Power density conversions
   */
  wattPerM2ToMicroWattPerCm2: (wm2: number): number => wm2 * 100, // W/m² to μW/cm²
  microWattPerCm2ToWattPerM2: (uwcm2: number): number => uwcm2 / 100,

  /**
   * Current density conversions
   */
  amperePerM2ToMicroAmperePerCm2: (am2: number): number => am2 / 10, // A/m² to μA/cm²
};

export default {
  PHYSICAL_CONSTANTS,
  MES_CONSTANTS,
  TemperatureDependence,
  pHDependence,
  MassTransfer,
  Electrochemistry,
  Biofilm,
  GasTransfer,
  Statistics,
  UnitConversions,
};
