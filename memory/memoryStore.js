const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const MEMORY_DIR = path.join(ROOT_DIR, "memory");

function readText(relativePath, fallback = "") {
  const filePath = path.join(ROOT_DIR, relativePath);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf-8") : fallback;
}

function writeText(relativePath, value) {
  fs.writeFileSync(path.join(ROOT_DIR, relativePath), value);
}

function appendText(relativePath, value) {
  fs.appendFileSync(path.join(ROOT_DIR, relativePath), value);
}

function readJson(relativePath, fallback) {
  const raw = readText(relativePath, "");
  if (!raw.trim()) return fallback;

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(relativePath, value) {
  writeText(relativePath, JSON.stringify(value, null, 2));
}

function readJsonArray(relativePath) {
  const value = readJson(relativePath, []);
  return Array.isArray(value) ? value : [];
}

function readJsonObject(relativePath) {
  const value = readJson(relativePath, {});
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function readMemoryText(fileName, fallback = "") {
  const filePath = path.join(MEMORY_DIR, fileName);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf-8") : fallback;
}

function getRootDir() {
  return ROOT_DIR;
}

module.exports = {
  ROOT_DIR,
  MEMORY_DIR,
  readText,
  writeText,
  appendText,
  readJson,
  writeJson,
  readJsonArray,
  readJsonObject,
  readMemoryText,
  getRootDir
};
