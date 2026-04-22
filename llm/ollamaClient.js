const http = require("http");

function parseOllamaStream(body) {
  const lines = body.split("\n").filter(line => line.trim() !== "");
  let fullResponse = "";

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.response) fullResponse += parsed.response;
    } catch {}
  }

  return fullResponse;
}

function generate({
  prompt,
  model = process.env.NODEX_OLLAMA_MODEL || "llama3",
  hostname = process.env.NODEX_OLLAMA_HOST || "localhost",
  port = Number(process.env.NODEX_OLLAMA_PORT || 11434),
  path = "/api/generate",
  apiKey = "",
  retries = 3,
  retryDelayMs = 1000
}) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const makeRequest = () => {
      const requestData = JSON.stringify({ model, prompt });
      const headers = {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestData)
      };

      if (apiKey) {
        headers.Authorization = "Bearer " + apiKey;
      }

      const options = {
        hostname,
        port,
        path,
        method: "POST",
        headers
      };

      const req = http.request(options, res => {
        let body = "";

        res.on("data", chunk => {
          body += chunk;
        });

        res.on("end", () => {
          try {
            resolve(parseOllamaStream(body));
          } catch (err) {
            if (attempts < retries) {
              attempts++;
              setTimeout(makeRequest, retryDelayMs);
              return;
            }
            reject(err);
          }
        });
      });

      req.on("error", err => {
        if (attempts < retries) {
          attempts++;
          setTimeout(makeRequest, retryDelayMs);
          return;
        }
        reject(err);
      });

      req.write(requestData);
      req.end();
    };

    makeRequest();
  });
}

module.exports = {
  generate,
  parseOllamaStream
};
