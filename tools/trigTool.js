const { normalizeResult } = require("./commandTool");

const EPSILON = 1e-12;
const FORWARD_OPERATIONS = new Set(["sin", "cos", "tan"]);
const INVERSE_OPERATIONS = new Set(["asin", "acos", "atan"]);

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeNumber(value) {
  if (!Number.isFinite(value)) {
    throw new Error("Trigonometry operation produced a non-finite result");
  }

  if (Math.abs(value) < EPSILON) {
    return 0;
  }

  return Object.is(value, -0) ? 0 : value;
}

function toRadians(angle, angleUnit) {
  if (angleUnit === "rad") {
    return angle;
  }

  if (angleUnit === "deg") {
    return (angle * Math.PI) / 180;
  }

  throw new Error(`Invalid angleUnit: ${angleUnit === undefined ? "none" : String(angleUnit)}`);
}

function fromRadians(angle, resultUnit) {
  if (resultUnit === "rad") {
    return angle;
  }

  if (resultUnit === "deg") {
    return (angle * 180) / Math.PI;
  }

  throw new Error(`Invalid resultUnit: ${resultUnit === undefined ? "none" : String(resultUnit)}`);
}

function getOperation(input) {
  return typeof input.operation === "string" ? input.operation : "";
}

function getForwardAngle(input, operation) {
  if (!isFiniteNumber(input.angle)) {
    throw new Error(`${operation} requires a finite numeric angle`);
  }

  if (input.angleUnit !== "rad" && input.angleUnit !== "deg") {
    throw new Error(`Invalid angleUnit: ${input.angleUnit === undefined ? "none" : String(input.angleUnit)}`);
  }

  return {
    angle: input.angle,
    angleUnit: input.angleUnit,
    angleRadians: toRadians(input.angle, input.angleUnit)
  };
}

function getInverseValue(input, operation) {
  if (!isFiniteNumber(input.value)) {
    throw new Error(`${operation} requires a finite numeric value`);
  }

  if (input.resultUnit !== "rad" && input.resultUnit !== "deg") {
    throw new Error(`Invalid resultUnit: ${input.resultUnit === undefined ? "none" : String(input.resultUnit)}`);
  }

  if ((operation === "asin" || operation === "acos") && (input.value < -1 || input.value > 1)) {
    throw new Error(`${operation} requires value in [-1, 1]`);
  }

  return {
    value: input.value,
    resultUnit: input.resultUnit
  };
}

async function run(input = {}) {
  try {
    const operation = getOperation(input);

    if (FORWARD_OPERATIONS.has(operation)) {
      const { angle, angleUnit, angleRadians } = getForwardAngle(input, operation);
      let result;

      switch (operation) {
        case "sin":
          result = Math.sin(angleRadians);
          break;
        case "cos":
          result = Math.cos(angleRadians);
          break;
        case "tan":
          if (Math.abs(Math.cos(angleRadians)) < EPSILON) {
            throw new Error("tan is undefined for singular or near-singular angles");
          }
          result = Math.tan(angleRadians);
          break;
        default:
          return normalizeResult("error", "", `Unknown trig operation: ${operation || "none"}`);
      }

      const payload = {
        status: "success",
        operation,
        angle,
        angleUnit,
        result: normalizeNumber(result)
      };

      return normalizeResult("success", JSON.stringify(payload), "", { data: payload });
    }

    if (INVERSE_OPERATIONS.has(operation)) {
      const { value, resultUnit } = getInverseValue(input, operation);
      let resultRadians;

      switch (operation) {
        case "asin":
          resultRadians = Math.asin(value);
          break;
        case "acos":
          resultRadians = Math.acos(value);
          break;
        case "atan":
          resultRadians = Math.atan(value);
          break;
        default:
          return normalizeResult("error", "", `Unknown trig operation: ${operation || "none"}`);
      }

      const payload = {
        status: "success",
        operation,
        value,
        resultUnit,
        result: normalizeNumber(fromRadians(resultRadians, resultUnit))
      };

      return normalizeResult("success", JSON.stringify(payload), "", { data: payload });
    }

    return normalizeResult("error", "", `Unknown trig operation: ${operation || "none"}`);
  } catch (err) {
    return normalizeResult("error", "", err.message);
  }
}

module.exports = {
  name: "trig",
  run
};
