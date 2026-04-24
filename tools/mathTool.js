const { normalizeResult } = require("./commandTool");

const DEFAULT_ROUND_DECIMALS = 6;

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function getOperands(input, operation, { minLength = 1, maxLength = Infinity } = {}) {
  if (!Array.isArray(input.operands) || input.operands.length < minLength) {
    throw new Error(`${operation} requires operands`);
  }

  if (input.operands.length > maxLength) {
    throw new Error(`${operation} received too many operands`);
  }

  input.operands.forEach((operand, index) => {
    if (!isFiniteNumber(operand)) {
      throw new Error(`operands[${index}] must be a finite number`);
    }
  });

  return input.operands;
}

function getValue(input, operation) {
  if (!isFiniteNumber(input.value)) {
    throw new Error(`${operation} requires a finite numeric value`);
  }

  return input.value;
}

function getRoundDecimals(input) {
  if (input.decimals === undefined) {
    return DEFAULT_ROUND_DECIMALS;
  }

  if (!isFiniteNumber(input.decimals) || !Number.isInteger(input.decimals) || input.decimals < 0) {
    throw new Error("round decimals must be a non-negative integer");
  }

  return input.decimals;
}

async function run(input = {}) {
  try {
    const operation = typeof input.operation === "string" ? input.operation : "";
    let result;

    switch (operation) {
      case "add": {
        const operands = getOperands(input, operation);
        result = operands.reduce((sum, operand) => sum + operand, 0);
        break;
      }
      case "subtract": {
        const operands = getOperands(input, operation);
        result = operands.slice(1).reduce((current, operand) => current - operand, operands[0]);
        break;
      }
      case "multiply": {
        const operands = getOperands(input, operation);
        result = operands.reduce((product, operand) => product * operand, 1);
        break;
      }
      case "divide": {
        const operands = getOperands(input, operation);
        result = operands.slice(1).reduce((current, operand) => {
          if (operand === 0) {
            throw new Error("divide by zero");
          }

          return current / operand;
        }, operands[0]);
        break;
      }
      case "power": {
        const operands = getOperands(input, operation, { minLength: 2, maxLength: 2 });
        result = Math.pow(operands[0], operands[1]);
        break;
      }
      case "sqrt": {
        const value = getValue(input, operation);
        if (value < 0) {
          throw new Error("sqrt requires a non-negative value");
        }

        result = Math.sqrt(value);
        break;
      }
      case "abs": {
        const value = getValue(input, operation);
        result = Math.abs(value);
        break;
      }
      case "round": {
        const value = getValue(input, operation);
        const decimals = getRoundDecimals(input);
        const factor = 10 ** decimals;
        result = Math.round(value * factor) / factor;
        break;
      }
      case "constant": {
        if (input.constant === "pi") {
          result = Math.PI;
          break;
        }

        if (input.constant === "e") {
          result = Math.E;
          break;
        }

        throw new Error("constant must be 'pi' or 'e'");
      }
      default:
        return normalizeResult("error", "", `Unknown math operation: ${operation || "none"}`);
    }

    if (!Number.isFinite(result)) {
      return normalizeResult("error", "", `Math operation produced a non-finite result for ${operation}`);
    }

    return normalizeResult(
      "success",
      JSON.stringify({
        status: "success",
        result,
        operation
      }),
      ""
    );
  } catch (err) {
    return normalizeResult("error", "", err.message);
  }
}

module.exports = {
  name: "math",
  run
};
