const { normalizeResult } = require("./commandTool");

const MAX_MATRIX_ROWS = 32;
const MAX_MATRIX_COLS = 32;
const MAX_VECTOR_LENGTH = 32;
const ZERO_TOLERANCE = 1e-12;
const SUPPORTED_OPERATIONS = new Set([
  "matrix_add",
  "matrix_subtract",
  "scalar_multiply",
  "matrix_vector_multiply",
  "matrix_multiply",
  "transpose",
  "identity",
  "determinant_2x2",
  "determinant_3x3"
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

function getMatrix(input, key, operation) {
  if (!Array.isArray(input[key])) {
    throw new Error(`${operation} requires ${key} matrix`);
  }

  const matrix = input[key];

  if (matrix.length === 0) {
    throw new Error(`${operation} requires ${key} to contain at least 1 row`);
  }

  if (matrix.length > MAX_MATRIX_ROWS) {
    throw new Error(`${operation} requires ${key} to contain no more than ${MAX_MATRIX_ROWS} rows`);
  }

  let columnCount = null;

  matrix.forEach((row, rowIndex) => {
    if (!Array.isArray(row)) {
      throw new Error(`${key}[${rowIndex}] must be an array`);
    }

    if (row.length === 0) {
      throw new Error(`${operation} requires ${key} rows to contain at least 1 column`);
    }

    if (row.length > MAX_MATRIX_COLS) {
      throw new Error(`${operation} requires ${key} rows to contain no more than ${MAX_MATRIX_COLS} columns`);
    }

    if (columnCount === null) {
      columnCount = row.length;
    } else if (row.length !== columnCount) {
      throw new Error(`${operation} requires ${key} to be rectangular`);
    }

    row.forEach((value, columnIndex) => {
      if (!isFiniteNumber(value)) {
        throw new Error(`${key}[${rowIndex}][${columnIndex}] must be a finite number`);
      }
    });
  });

  return {
    matrix,
    rows: matrix.length,
    cols: columnCount
  };
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

function getSize(input) {
  if (!Number.isInteger(input.size) || input.size < 1 || input.size > MAX_MATRIX_ROWS) {
    throw new Error(`identity requires size integer between 1 and ${MAX_MATRIX_ROWS}`);
  }

  return input.size;
}

function assertSameShape(left, right, operation) {
  if (left.rows !== right.rows || left.cols !== right.cols) {
    throw new Error(`${operation} requires matrices with the same rows and columns`);
  }
}

function normalizeScalarResult(value, operation) {
  const result = normalizeNumber(value);

  if (!Number.isFinite(result)) {
    throw new Error(`${operation} produced a non-finite result`);
  }

  return result;
}

function normalizeVectorResult(values, operation) {
  const result = values.map(value => normalizeNumber(value));

  result.forEach((value, index) => {
    if (!Number.isFinite(value)) {
      throw new Error(`${operation} produced a non-finite result at index ${index}`);
    }
  });

  return result;
}

function normalizeMatrixResult(matrix, operation) {
  const result = matrix.map(row => row.map(value => normalizeNumber(value)));

  result.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      if (!Number.isFinite(value)) {
        throw new Error(`${operation} produced a non-finite result at [${rowIndex}][${columnIndex}]`);
      }
    });
  });

  return result;
}

function buildMatrixPayload(operation, rows, cols, result, extra = {}) {
  return {
    status: "success",
    operation,
    ...extra,
    rows,
    cols,
    result
  };
}

async function run(input = {}) {
  try {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new Error("matrix tool requires JSON object input");
    }

    const operation = getOperation(input);

    if (!SUPPORTED_OPERATIONS.has(operation)) {
      return normalizeResult("error", "", `Unknown matrix operation: ${operation || "none"}`);
    }

    let payload;

    switch (operation) {
      case "matrix_add": {
        const left = getMatrix(input, "left", operation);
        const right = getMatrix(input, "right", operation);
        assertSameShape(left, right, operation);

        payload = buildMatrixPayload(
          operation,
          left.rows,
          left.cols,
          normalizeMatrixResult(
            left.matrix.map((row, rowIndex) => row.map((value, columnIndex) => value + right.matrix[rowIndex][columnIndex])),
            operation
          )
        );
        break;
      }
      case "matrix_subtract": {
        const left = getMatrix(input, "left", operation);
        const right = getMatrix(input, "right", operation);
        assertSameShape(left, right, operation);

        payload = buildMatrixPayload(
          operation,
          left.rows,
          left.cols,
          normalizeMatrixResult(
            left.matrix.map((row, rowIndex) => row.map((value, columnIndex) => value - right.matrix[rowIndex][columnIndex])),
            operation
          )
        );
        break;
      }
      case "scalar_multiply": {
        const scalar = getScalar(input, operation);
        const matrix = getMatrix(input, "matrix", operation);

        payload = buildMatrixPayload(
          operation,
          matrix.rows,
          matrix.cols,
          normalizeMatrixResult(
            matrix.matrix.map(row => row.map(value => scalar * value)),
            operation
          )
        );
        break;
      }
      case "matrix_vector_multiply": {
        const matrix = getMatrix(input, "matrix", operation);
        const vector = getVector(input, "vector", operation);

        if (matrix.cols !== vector.length) {
          throw new Error(`${operation} requires matrix column count to equal vector length`);
        }

        payload = {
          status: "success",
          operation,
          dimension: matrix.rows,
          result: normalizeVectorResult(
            matrix.matrix.map(row => row.reduce((sum, value, index) => sum + (value * vector[index]), 0)),
            operation
          )
        };
        break;
      }
      case "matrix_multiply": {
        const left = getMatrix(input, "left", operation);
        const right = getMatrix(input, "right", operation);

        if (left.cols !== right.rows) {
          throw new Error(`${operation} requires left column count to equal right row count`);
        }

        payload = buildMatrixPayload(
          operation,
          left.rows,
          right.cols,
          normalizeMatrixResult(
            Array.from({ length: left.rows }, (_, rowIndex) =>
              Array.from({ length: right.cols }, (_, columnIndex) => {
                let total = 0;

                for (let innerIndex = 0; innerIndex < left.cols; innerIndex += 1) {
                  total += left.matrix[rowIndex][innerIndex] * right.matrix[innerIndex][columnIndex];
                }

                return total;
              })
            ),
            operation
          )
        );
        break;
      }
      case "transpose": {
        const matrix = getMatrix(input, "matrix", operation);

        payload = buildMatrixPayload(
          operation,
          matrix.cols,
          matrix.rows,
          normalizeMatrixResult(
            Array.from({ length: matrix.cols }, (_, columnIndex) =>
              Array.from({ length: matrix.rows }, (_, rowIndex) => matrix.matrix[rowIndex][columnIndex])
            ),
            operation
          )
        );
        break;
      }
      case "identity": {
        const size = getSize(input);
        const result = Array.from({ length: size }, (_, rowIndex) =>
          Array.from({ length: size }, (_, columnIndex) => (rowIndex === columnIndex ? 1 : 0))
        );

        payload = buildMatrixPayload(operation, size, size, result, { size });
        break;
      }
      case "determinant_2x2": {
        const matrix = getMatrix(input, "matrix", operation);

        if (matrix.rows !== 2 || matrix.cols !== 2) {
          throw new Error("determinant_2x2 requires exactly 2x2 matrix");
        }

        payload = {
          status: "success",
          operation,
          size: 2,
          result: normalizeScalarResult(
            (matrix.matrix[0][0] * matrix.matrix[1][1]) - (matrix.matrix[0][1] * matrix.matrix[1][0]),
            operation
          )
        };
        break;
      }
      case "determinant_3x3": {
        const matrix = getMatrix(input, "matrix", operation);

        if (matrix.rows !== 3 || matrix.cols !== 3) {
          throw new Error("determinant_3x3 requires exactly 3x3 matrix");
        }

        const a = matrix.matrix[0][0];
        const b = matrix.matrix[0][1];
        const c = matrix.matrix[0][2];
        const d = matrix.matrix[1][0];
        const e = matrix.matrix[1][1];
        const f = matrix.matrix[1][2];
        const g = matrix.matrix[2][0];
        const h = matrix.matrix[2][1];
        const i = matrix.matrix[2][2];

        payload = {
          status: "success",
          operation,
          size: 3,
          result: normalizeScalarResult(
            (a * ((e * i) - (f * h))) - (b * ((d * i) - (f * g))) + (c * ((d * h) - (e * g))),
            operation
          )
        };
        break;
      }
      default:
        return normalizeResult("error", "", `Unknown matrix operation: ${operation || "none"}`);
    }

    return normalizeResult("success", JSON.stringify(payload), "", { data: payload });
  } catch (err) {
    return normalizeResult("error", "", err.message);
  }
}

module.exports = {
  name: "matrix",
  run
};
