const { normalizeResult } = require("./commandTool");

const ZERO_TOLERANCE = 1e-12;
const MAX_FORMULA_COUNT = 32;
const MAX_AST_DEPTH = 16;
const MAX_AST_ARGS = 8;
const FORMULA_ID_PATTERN = /^[a-z0-9_]+$/;
const SUPPORTED_OPERATIONS = new Set([
  "list_formulas",
  "get_formula",
  "evaluate_formula"
]);
const SUPPORTED_AST_OPERATIONS = new Set([
  "add",
  "subtract",
  "multiply",
  "divide",
  "power",
  "sqrt"
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
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

function getAstArity(operation) {
  switch (operation) {
    case "add":
    case "subtract":
    case "multiply":
    case "divide":
      return { min: 2, max: MAX_AST_ARGS };
    case "power":
      return { min: 2, max: 2 };
    case "sqrt":
      return { min: 1, max: 1 };
    default:
      throw new Error(`Unknown AST operation: ${operation}`);
  }
}

function validateVariableDefinition(definition, formulaId, variableName) {
  if (!isPlainObject(definition)) {
    throw new Error(`Formula ${formulaId} variable ${variableName} definition must be object`);
  }

  if (definition.type !== "number") {
    throw new Error(`Formula ${formulaId} variable ${variableName} type must be "number"`);
  }

  if (typeof definition.required !== "boolean") {
    throw new Error(`Formula ${formulaId} variable ${variableName} required must be boolean`);
  }

  if (typeof definition.quantity !== "string") {
    throw new Error(`Formula ${formulaId} variable ${variableName} quantity must be string`);
  }
}

function validateOutputDefinition(definition, formulaId) {
  if (!isPlainObject(definition)) {
    throw new Error(`Formula ${formulaId} output must be object`);
  }

  if (definition.type !== "number") {
    throw new Error(`Formula ${formulaId} output type must be "number"`);
  }

  if (typeof definition.quantity !== "string") {
    throw new Error(`Formula ${formulaId} output quantity must be string`);
  }
}

function validateExpressionNode(node, variableNames, depth, path) {
  if (depth > MAX_AST_DEPTH) {
    throw new Error(`${path} exceeds max depth ${MAX_AST_DEPTH}`);
  }

  if (isFiniteNumber(node)) {
    return;
  }

  if (typeof node === "number") {
    throw new Error(`${path} must be finite number literal`);
  }

  if (typeof node === "string") {
    throw new Error(`${path} must not be string expression`);
  }

  if (!isPlainObject(node)) {
    throw new Error(`${path} must be finite number, variable node, or operation node`);
  }

  if (Object.prototype.hasOwnProperty.call(node, "var")) {
    if (Object.keys(node).length !== 1 || typeof node.var !== "string" || node.var.length === 0) {
      throw new Error(`${path} variable node is malformed`);
    }

    if (!variableNames.has(node.var)) {
      throw new Error(`${path} references unknown variable ${node.var}`);
    }

    return;
  }

  if (Object.prototype.hasOwnProperty.call(node, "op") || Object.prototype.hasOwnProperty.call(node, "args")) {
    if (Object.keys(node).length !== 2 || typeof node.op !== "string") {
      throw new Error(`${path} operation node is malformed`);
    }

    if (!SUPPORTED_AST_OPERATIONS.has(node.op)) {
      throw new Error(`${path} uses unsupported op ${node.op}`);
    }

    if (!Array.isArray(node.args)) {
      throw new Error(`${path}.args must be array`);
    }

    const { min, max } = getAstArity(node.op);

    if (node.args.length < min) {
      throw new Error(`${path}.${node.op} is missing args`);
    }

    if (node.args.length > max || node.args.length > MAX_AST_ARGS) {
      throw new Error(`${path}.${node.op} has too many args`);
    }

    node.args.forEach((arg, index) => {
      validateExpressionNode(arg, variableNames, depth + 1, `${path}.args[${index}]`);
    });

    return;
  }

  throw new Error(`${path} must be finite number, variable node, or operation node`);
}

function validateFormulaDefinition(formula, index, formulasById) {
  if (!isPlainObject(formula)) {
    throw new Error(`Formula at index ${index} must be object`);
  }

  if (typeof formula.id !== "string" || formula.id.length === 0) {
    throw new Error(`Formula at index ${index} id must be non-empty string`);
  }

  if (!FORMULA_ID_PATTERN.test(formula.id)) {
    throw new Error(`Formula ${formula.id} id must match ${FORMULA_ID_PATTERN}`);
  }

  if (formulasById.has(formula.id)) {
    throw new Error(`Duplicate formula id: ${formula.id}`);
  }

  ["domain", "name", "description"].forEach(field => {
    if (typeof formula[field] !== "string") {
      throw new Error(`Formula ${formula.id} ${field} must be string`);
    }
  });

  if (!isPlainObject(formula.variables)) {
    throw new Error(`Formula ${formula.id} variables must be object`);
  }

  Object.entries(formula.variables).forEach(([variableName, definition]) => {
    validateVariableDefinition(definition, formula.id, variableName);
  });

  validateOutputDefinition(formula.output, formula.id);
  validateExpressionNode(formula.expression, new Set(Object.keys(formula.variables)), 1, `formula ${formula.id} expression`);
}

function loadRegistryState() {
  try {
    const registry = require("../Knowledge/formulas/foundation.json");

    if (!isPlainObject(registry)) {
      throw new Error("Registry root must be object");
    }

    if (registry.version !== 1) {
      throw new Error("Registry version must be 1");
    }

    if (!Array.isArray(registry.formulas)) {
      throw new Error("Registry formulas must be array");
    }

    if (registry.formulas.length < 1 || registry.formulas.length > MAX_FORMULA_COUNT) {
      throw new Error(`Registry formula count must be between 1 and ${MAX_FORMULA_COUNT}`);
    }

    const formulasById = new Map();

    registry.formulas.forEach((formula, index) => {
      validateFormulaDefinition(formula, index, formulasById);
      formulasById.set(formula.id, formula);
    });

    return {
      error: "",
      formulas: registry.formulas,
      formulasById
    };
  } catch (err) {
    return {
      error: `Formula registry invalid: ${err.message}`,
      formulas: [],
      formulasById: new Map()
    };
  }
}

const registryState = loadRegistryState();

function getFormulaOrThrow(formulaId) {
  if (typeof formulaId !== "string" || formulaId.length === 0) {
    throw new Error("formulaId must be non-empty string");
  }

  const formula = registryState.formulasById.get(formulaId);

  if (!formula) {
    throw new Error(`Unknown formulaId: ${formulaId}`);
  }

  return formula;
}

function getEvaluationVariables(inputVariables, formula) {
  if (!isPlainObject(inputVariables)) {
    throw new Error("evaluate_formula requires variables object");
  }

  const resolvedVariables = {};
  const knownVariables = new Set(Object.keys(formula.variables));

  Object.keys(inputVariables).forEach(variableName => {
    if (!knownVariables.has(variableName)) {
      throw new Error(`Unknown variable: ${variableName}`);
    }

    if (!isFiniteNumber(inputVariables[variableName])) {
      throw new Error(`Variable ${variableName} must be a finite number`);
    }
  });

  Object.entries(formula.variables).forEach(([variableName, definition]) => {
    if (definition.required && !Object.prototype.hasOwnProperty.call(inputVariables, variableName)) {
      throw new Error(`Missing required variable: ${variableName}`);
    }

    if (Object.prototype.hasOwnProperty.call(inputVariables, variableName)) {
      resolvedVariables[variableName] = inputVariables[variableName];
    }
  });

  return resolvedVariables;
}

function evaluateExpression(node, variables, depth, path) {
  if (depth > MAX_AST_DEPTH) {
    throw new Error(`Expression exceeds max depth ${MAX_AST_DEPTH}`);
  }

  if (isFiniteNumber(node)) {
    return node;
  }

  if (typeof node === "number") {
    throw new Error(`${path} must be finite number literal`);
  }

  if (typeof node === "string") {
    throw new Error(`${path} must not be string expression`);
  }

  if (!isPlainObject(node)) {
    throw new Error(`${path} is malformed`);
  }

  if (Object.prototype.hasOwnProperty.call(node, "var")) {
    if (!Object.prototype.hasOwnProperty.call(variables, node.var)) {
      throw new Error(`Missing variable in expression: ${node.var}`);
    }

    return variables[node.var];
  }

  if (!SUPPORTED_AST_OPERATIONS.has(node.op)) {
    throw new Error(`Unknown AST operation: ${node.op}`);
  }

  if (!Array.isArray(node.args)) {
    throw new Error(`${path}.args must be array`);
  }

  const { min, max } = getAstArity(node.op);

  if (node.args.length < min) {
    throw new Error(`${node.op} is missing args`);
  }

  if (node.args.length > max || node.args.length > MAX_AST_ARGS) {
    throw new Error(`${node.op} has too many args`);
  }

  const args = node.args.map((arg, index) => evaluateExpression(arg, variables, depth + 1, `${path}.args[${index}]`));
  let result;

  switch (node.op) {
    case "add":
      result = args.reduce((sum, value) => sum + value, 0);
      break;
    case "subtract":
      result = args.slice(1).reduce((value, operand) => value - operand, args[0]);
      break;
    case "multiply":
      result = args.reduce((product, value) => product * value, 1);
      break;
    case "divide":
      result = args.slice(1).reduce((value, operand) => {
        if (operand === 0) {
          throw new Error("divide by zero");
        }

        return value / operand;
      }, args[0]);
      break;
    case "power":
      result = Math.pow(args[0], args[1]);
      break;
    case "sqrt":
      if (args[0] < 0) {
        throw new Error("sqrt negative");
      }

      result = Math.sqrt(args[0]);
      break;
    default:
      throw new Error(`Unknown AST operation: ${node.op}`);
  }

  if (!Number.isFinite(result)) {
    throw new Error(`Non-finite intermediate result at ${path}`);
  }

  return result;
}

function buildListPayload() {
  return {
    status: "success",
    operation: "list_formulas",
    count: registryState.formulas.length,
    formulas: registryState.formulas.map(formula => ({
      id: formula.id,
      domain: formula.domain,
      name: formula.name,
      description: formula.description,
      variables: Object.keys(formula.variables),
      output: cloneJson(formula.output)
    }))
  };
}

function buildGetFormulaPayload(formula) {
  return {
    status: "success",
    operation: "get_formula",
    formulaId: formula.id,
    formula: cloneJson(formula)
  };
}

function buildEvaluatePayload(formula, variables) {
  const rawResult = evaluateExpression(formula.expression, variables, 1, `formula ${formula.id} expression`);

  if (!Number.isFinite(rawResult)) {
    throw new Error(`Formula ${formula.id} produced non-finite result`);
  }

  return {
    status: "success",
    operation: "evaluate_formula",
    formulaId: formula.id,
    domain: formula.domain,
    name: formula.name,
    variables: cloneJson(variables),
    output: cloneJson(formula.output),
    result: normalizeNumber(rawResult)
  };
}

async function run(input = {}) {
  try {
    if (registryState.error) {
      return normalizeResult("error", "", registryState.error);
    }

    if (!isPlainObject(input)) {
      throw new Error("formula tool requires JSON object input");
    }

    const operation = typeof input.operation === "string" ? input.operation : "";

    if (!SUPPORTED_OPERATIONS.has(operation)) {
      return normalizeResult("error", "", `Unknown formula operation: ${operation || "none"}`);
    }

    let payload;

    switch (operation) {
      case "list_formulas":
        payload = buildListPayload();
        break;
      case "get_formula":
        payload = buildGetFormulaPayload(getFormulaOrThrow(input.formulaId));
        break;
      case "evaluate_formula": {
        const formula = getFormulaOrThrow(input.formulaId);
        const variables = getEvaluationVariables(input.variables, formula);
        payload = buildEvaluatePayload(formula, variables);
        break;
      }
      default:
        return normalizeResult("error", "", `Unknown formula operation: ${operation || "none"}`);
    }

    return normalizeResult("success", JSON.stringify(payload), "", { data: payload });
  } catch (err) {
    return normalizeResult("error", "", err.message);
  }
}

module.exports = {
  name: "formula",
  run
};
