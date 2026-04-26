STRICT OUTPUT RULES (MANDATORY):

- Output ONLY valid Python code
- DO NOT include explanations
- DO NOT include markdown (no ``` blocks)
- DO NOT include comments outside code
- Output MUST be directly executable
- Output MUST contain EXACTLY ONE print(json.dumps(...))
- DO NOT print multiple outputs
- DO NOT use loops to print multiple outputs
- Final output MUST be a single JSON object

IF YOU VIOLATE THESE RULES → OUTPUT IS REJECTED


REQUIRED STRUCTURE:

import json

def main():
    try:
        # your logic here

        output = {
            "status": "success",
            "result": ...
        }

    except Exception as e:
        output = {
            "status": "failure",
            "errors": str(e)
        }

    print(json.dumps(output))

if __name__ == "__main__":
    main()PREFERENCES:
- produce executable Python
- minimal abstraction
- modular structure

RULES:
- output MUST be valid Python
- output MUST print ONLY json.dumps(...)
- no undefined variables
- no missing imports

SUCCESS:
- must execute without runtime errors
- must return:
  { "status": "success" | "failure", "result" OR "errors" }
