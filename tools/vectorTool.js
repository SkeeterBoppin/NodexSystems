const { normalizeResult } = require("./commandTool");

const MAX_VECTOR_LENGTH = 128;
const ZERO_TOLERANCE = 1e-12;
const SUPPORTED_OPERATIONS = new Set([
  "vector_add",
  "vector_subtract",
  "scalar_multiply",
  "dot_product",
  "magnitude",
  "normalize",
  "cross_product_3d"
]);

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeNumber(value) {
  if (!Number.isFinite(value)) {
    return value;
  }

  if (Math.abs(value) < ZERO_TOLERANCE || Object.is(value, -0)) {
    return 0;
  }

  return value;
}

function getOperation(input) {
  return typeof input.operation === "string" ? input.operation : "";
}

function getVector(input, key, operation) {
  if (!Array.isArray(input[key])) {
    throw new Error(`${operation} requires ${key} array`);
  }

  const vector = input[key];

  if (vector.length === 0) {
    throw new Error(`${operation} requires ${key} to contain at least 1 element`);
  }

  if (vector.length > MAX_VECTOR_LENGTH) {
    throw new Error(`${operation} requires ${key} to contain no more than ${MAX_VECTOR_LENGTH} elements`);
  }

  vector.forEach((value, index) => {
    if (!isFiniteNumber(value)) {
      throw new Error(`${key}[${index}] must be a finite number`);
    }
  });

  return vector;
}

function getScalar(input, operation) {
  if (!isFiniteNumber(input.scalar)) {
    throw new Error(`${operation} requires a finite scalar`);
  }

  return input.scalar;
}

function assertSameLength(left, right, operation) {
  if (left.length !== right.length) {
    throw new Error(`${operation} requires vectors of the same length`);
  }
}

function getMagnitude(vector) {
  let total = 0;

  vector.forEach(component => {
    total += component * component;
  });

  return Math.sqrt(total);
}

function normalizeArrayResult(values, operation) {
  const result = values.map(value => normalizeNumber(value));

  result.forEach((value, index) => {
    if (!Number.isFinite(value)) {
      throw new Error(`${operation} produced a non-finite result at index ${index}`);
    }
  });

  return result;
}

function normalizeScalarResult(value, operation) {
  const result = normalizeNumber(value);

  if (!Number.isFinite(result)) {
    throw new Error(`${operation} produced a non-finite result`);
  }

  return result;
}

async function run(input = {}) {
  try {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new Error("vector tool requires JSON object input");
    }

    const operation = getOperation(input);

    if (!SUPPORTED_OPERATIONS.has(operation)) {
      return normalizeResult("error", "", `Unknown vector operation: ${operation || "none"}`);
    }

    let dimension;
    let result;

    switch (operation) {
      case "vector_add": {
        const left = getVector(input, "left", operation);
        const right = getVector(input, "right", operation);
        assertSameLength(left, right, operation);
        dimension = left.length;
        result = normalizeArrayResult(left.map((value, index) => value + right[index]), operation);
        break;
      }
      case "vector_subtract": {
        const left = getVector(input, "left", operation);
        const right = getVector(input, "right", operation);
        assertSameLength(left, right, operation);
        dimension = left.length;
        result = normalizeArrayResult(left.map((value, index) => value - right[index]), operation);
        break;
      }
      case "scalar_multiply": {
        const scalar = getScalar(input, operation);
        const vector = getVector(input, "vector", operation);
        dimension = vector.length;
        result = normalizeArrayResult(vector.map(value => scalar * value), operation);
        break;
      }
      case "dot_product": {
        const left = getVector(input, "left", operation);
        const right = getVector(input, "right", operation);
        assertSameLength(left, right, operation);
        dimension = left.length;
        result = normalizeScalarResult(
          left.reduce((total, value, index) => total + (value * right[index]), 0),
          operation
        );
        break;
      }
      case "magnitude": {
        const vector = getVector(input, "vector", operation);
        dimension = vector.length;
        result = normalizeScalarResult(getMagnitude(vector), operation);
        break;
      }
      case "normalize": {
        const vector = getVector(input, "vector", operation);
        const magnitude = getMagnitude(vector);

        if (magnitude === 0) {
          throw new Error("normalize requires non-zero vector");
        }

        dimension = vector.length;
        result = normalizeArrayResult(vector.map(value => value / magnitude), operation);
        break;
      }
      case "cross_product_3d": {
        const left = getVector(input, "left", operation);
        const right = getVector(input, "right", operation);

        if (left.length !== 3 || right.length !== 3) {
          throw new Error("cross_product_3d requires both vectors to have exactly 3 elements");
        }

        dimension = 3;
        result = normalizeArrayResult([
          left[1] * right[2] - left[2] * right[1],
          left[2] * right[0] - left[0] * right[2],
          left[0] * right[1] - left[1] * right[0]
        ], operation);
        break;
      }
      default:
        return normalizeResult("error", "", `Unknown vector operation: ${operation || "none"}`);
    }

    const payload = {
      status: "success",
      operation,
      dimension,
      result
    };

    return normalizeResult("success", JSON.stringify(payload), "", { data: payload });
  } catch (err) {
    return normalizeResult("error", "", err.message);
  }
}

module.exports = {
  name: "vector",
  run
};
