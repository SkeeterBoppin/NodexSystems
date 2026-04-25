const { normalizeResult } = require("./commandTool");

const SUPPORTED_OPERATIONS = new Set(["not", "and", "or", "xor", "implies", "iff"]);

function isBoolean(value) {
  return value === true || value === false;
}

function getOperation(input) {
  return typeof input.operation === "string" ? input.operation : "";
}

function getOperands(input, operation, { minLength, maxLength }) {
  if (!Array.isArray(input.operands)) {
    throw new Error(`${operation} requires operands array`);
  }

  if (minLength === maxLength && input.operands.length !== minLength) {
    throw new Error(`${operation} requires exactly ${minLength} operand${minLength === 1 ? "" : "s"}`);
  }

  if (input.operands.length < minLength) {
    throw new Error(`${operation} requires at least ${minLength} operands`);
  }

  if (input.operands.length > maxLength) {
    throw new Error(`${operation} requires no more than ${maxLength} operands`);
  }

  input.operands.forEach((operand, index) => {
    if (!isBoolean(operand)) {
      throw new Error(`operands[${index}] must be boolean`);
    }
  });

  return input.operands;
}

async function run(input = {}) {
  try {
    const operation = getOperation(input);

    if (!SUPPORTED_OPERATIONS.has(operation)) {
      return normalizeResult("error", "", `Unknown logic operation: ${operation || "none"}`);
    }

    let operands;
    let result;

    switch (operation) {
      case "not":
        operands = getOperands(input, operation, { minLength: 1, maxLength: 1 });
        result = !operands[0];
        break;
      case "and":
        operands = getOperands(input, operation, { minLength: 2, maxLength: Infinity });
        result = operands.every(operand => operand === true);
        break;
      case "or":
        operands = getOperands(input, operation, { minLength: 2, maxLength: Infinity });
        result = operands.some(operand => operand === true);
        break;
      case "xor":
        operands = getOperands(input, operation, { minLength: 2, maxLength: 2 });
        result = operands[0] !== operands[1];
        break;
      case "implies":
        operands = getOperands(input, operation, { minLength: 2, maxLength: 2 });
        result = (!operands[0]) || operands[1];
        break;
      case "iff":
        operands = getOperands(input, operation, { minLength: 2, maxLength: 2 });
        result = operands[0] === operands[1];
        break;
      default:
        return normalizeResult("error", "", `Unknown logic operation: ${operation || "none"}`);
    }

    if (!isBoolean(result)) {
      return normalizeResult("error", "", `Logic operation produced a non-boolean result for ${operation}`);
    }

    const payload = {
      status: "success",
      operation,
      operands,
      result
    };

    return normalizeResult("success", JSON.stringify(payload), "", { data: payload });
  } catch (err) {
    return normalizeResult("error", "", err.message);
  }
}

module.exports = {
  name: "logic",
  run
};
