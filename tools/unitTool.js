const { normalizeResult } = require("./commandTool")

const ABSOLUTE_ZERO_EPSILON = 1e-12

const DIMENSIONS = {
  length: {
    type: "linear",
    units: {
      m: { factor: 1, aliases: ["m", "meter", "meters"] },
      cm: { factor: 0.01, aliases: ["cm", "centimeter", "centimeters"] },
      mm: { factor: 0.001, aliases: ["mm", "millimeter", "millimeters"] },
      km: { factor: 1000, aliases: ["km", "kilometer", "kilometers"] },
      in: { factor: 0.0254, aliases: ["in", "inch", "inches"] },
      ft: { factor: 0.3048, aliases: ["ft", "foot", "feet"] }
    }
  },
  mass: {
    type: "linear",
    units: {
      kg: { factor: 1, aliases: ["kg", "kilogram", "kilograms"] },
      g: { factor: 0.001, aliases: ["g", "gram", "grams"] },
      mg: { factor: 0.000001, aliases: ["mg", "milligram", "milligrams"] },
      lb: { factor: 0.45359237, aliases: ["lb", "pound", "pounds"] },
      oz: { factor: 0.028349523125, aliases: ["oz", "ounce", "ounces"] }
    }
  },
  time: {
    type: "linear",
    units: {
      s: { factor: 1, aliases: ["s", "sec", "second", "seconds"] },
      min: { factor: 60, aliases: ["min", "minute", "minutes"] },
      h: { factor: 3600, aliases: ["h", "hr", "hour", "hours"] }
    }
  },
  angle: {
    type: "linear",
    units: {
      rad: { factor: 1, aliases: ["rad", "radian", "radians"] },
      deg: { factor: Math.PI / 180, aliases: ["deg", "degree", "degrees"] }
    }
  },
  temperature: {
    type: "temperature",
    units: {
      c: {
        aliases: ["c", "celsius"],
        toKelvin(value) {
          return value + 273.15
        },
        fromKelvin(value) {
          return value - 273.15
        }
      },
      f: {
        aliases: ["f", "fahrenheit"],
        toKelvin(value) {
          return ((value - 32) * 5) / 9 + 273.15
        },
        fromKelvin(value) {
          return ((value - 273.15) * 9) / 5 + 32
        }
      },
      k: {
        aliases: ["k", "kelvin"],
        toKelvin(value) {
          return value
        },
        fromKelvin(value) {
          return value
        }
      }
    }
  }
}

const UNIT_INDEX = buildUnitIndex(DIMENSIONS)

function buildUnitIndex(dimensions) {
  const index = new Map()

  Object.entries(dimensions).forEach(([dimension, definition]) => {
    Object.entries(definition.units).forEach(([canonical, unitDefinition]) => {
      unitDefinition.aliases.forEach(alias => {
        index.set(alias, { dimension, canonical, definition: unitDefinition })
      })
    })
  })

  return index
}

function normalizeUnitName(unit) {
  if (typeof unit !== "string") {
    return ""
  }

  return unit.trim().toLowerCase()
}

function resolveUnit(unit, label) {
  const normalized = normalizeUnitName(unit)

  if (!normalized) {
    throw new Error(`Unknown ${label} unit: ${unit === undefined ? "none" : String(unit)}`)
  }

  const resolved = UNIT_INDEX.get(normalized)

  if (!resolved) {
    throw new Error(`Unknown ${label} unit: ${unit}`)
  }

  return resolved
}

function normalizeNumber(value) {
  if (!Number.isFinite(value)) {
    throw new Error("Unit conversion produced a non-finite result")
  }

  if (Math.abs(value) < ABSOLUTE_ZERO_EPSILON) {
    return 0
  }

  return Object.is(value, -0) ? 0 : value
}

function ensureAboveAbsoluteZero(kelvinValue) {
  if (kelvinValue < -ABSOLUTE_ZERO_EPSILON) {
    throw new Error("Temperature conversion cannot go below absolute zero")
  }

  return kelvinValue < 0 ? 0 : kelvinValue
}

function convertLinear(value, fromUnit, toUnit) {
  const baseValue = value * fromUnit.definition.factor
  return baseValue / toUnit.definition.factor
}

function convertTemperature(value, fromUnit, toUnit) {
  const kelvinValue = ensureAboveAbsoluteZero(fromUnit.definition.toKelvin(value))
  const result = toUnit.definition.fromKelvin(kelvinValue)

  if (toUnit.canonical === "k") {
    ensureAboveAbsoluteZero(result)
  }

  return result
}

async function run(input = {}) {
  try {
    const operation = typeof input.operation === "string" ? input.operation : ""

    if (operation !== "convert") {
      return normalizeResult("error", "", `Unknown unit operation: ${operation || "none"}`)
    }

    if (typeof input.value !== "number" || !Number.isFinite(input.value)) {
      return normalizeResult("error", "", "convert requires a finite numeric value")
    }

    const fromUnit = resolveUnit(input.from, "from")
    const toUnit = resolveUnit(input.to, "to")

    if (fromUnit.dimension !== toUnit.dimension) {
      return normalizeResult(
        "error",
        "",
        `Incompatible unit dimensions: ${fromUnit.canonical} (${fromUnit.dimension}) to ${toUnit.canonical} (${toUnit.dimension})`
      )
    }

    const result = normalizeNumber(
      fromUnit.dimension === "temperature"
        ? convertTemperature(input.value, fromUnit, toUnit)
        : convertLinear(input.value, fromUnit, toUnit)
    )

    const payload = {
      status: "success",
      operation: "convert",
      dimension: fromUnit.dimension,
      value: input.value,
      from: fromUnit.canonical,
      to: toUnit.canonical,
      result
    }

    return normalizeResult("success", JSON.stringify(payload), "", {
      data: {
        operation: payload.operation,
        dimension: payload.dimension,
        value: payload.value,
        from: payload.from,
        to: payload.to,
        result: payload.result
      }
    })
  } catch (err) {
    return normalizeResult("error", "", err.message)
  }
}

module.exports = {
  name: "unit",
  run
}
