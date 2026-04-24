const { normalizeResult } = require("./commandTool");

const SUPPORTED_OPERATIONS = new Set([
  "circle_area",
  "circle_circumference",
  "rectangle_area",
  "triangle_area",
  "right_triangle_hypotenuse",
  "distance_2d"
]);

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function getFiniteNumber(input, key) {
  if (!isFiniteNumber(input[key])) {
    throw new Error(`${key} must be a finite number`);
  }

  return input[key];
}

function getNonNegativeNumber(input, key) {
  const value = getFiniteNumber(input, key);

  if (value < 0) {
    throw new Error(`${key} must be greater than or equal to 0`);
  }

  return value;
}

async function run(input = {}) {
  try {
    const operation = typeof input.operation === "string" ? input.operation : "";

    if (!SUPPORTED_OPERATIONS.has(operation)) {
      return normalizeResult("error", "", `Unknown geometry operation: ${operation || "none"}`);
    }

    let result;

    switch (operation) {
      case "circle_area": {
        const radius = getNonNegativeNumber(input, "radius");
        result = Math.PI * radius * radius;
        break;
      }
      case "circle_circumference": {
        const radius = getNonNegativeNumber(input, "radius");
        result = 2 * Math.PI * radius;
        break;
      }
      case "rectangle_area": {
        const width = getNonNegativeNumber(input, "width");
        const height = getNonNegativeNumber(input, "height");
        result = width * height;
        break;
      }
      case "triangle_area": {
        const base = getNonNegativeNumber(input, "base");
        const height = getNonNegativeNumber(input, "height");
        result = 0.5 * base * height;
        break;
      }
      case "right_triangle_hypotenuse": {
        const a = getNonNegativeNumber(input, "a");
        const b = getNonNegativeNumber(input, "b");
        result = Math.sqrt(a * a + b * b);
        break;
      }
      case "distance_2d": {
        const x1 = getFiniteNumber(input, "x1");
        const y1 = getFiniteNumber(input, "y1");
        const x2 = getFiniteNumber(input, "x2");
        const y2 = getFiniteNumber(input, "y2");
        result = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        break;
      }
      default:
        return normalizeResult("error", "", `Unknown geometry operation: ${operation || "none"}`);
    }

    if (!Number.isFinite(result)) {
      return normalizeResult("error", "", `Geometry operation produced a non-finite result for ${operation}`);
    }

    const payload = {
      status: "success",
      operation,
      result
    };

    return normalizeResult("success", JSON.stringify(payload), "", { data: payload });
  } catch (err) {
    return normalizeResult("error", "", err.message);
  }
}

module.exports = {
  name: "geometry",
  run
};
