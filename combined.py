import json

def input_stage():
    return [i ** 2 for i in range(10)]

def transformation_stage(data):
    return [{"value": x} for x in data]

def analysis_stage(transformed):
    return {"sum": sum(x["value"] for x in transformed)}

def output_stage(result):
    print(json.dumps({"status": "success", "result": result}))

def main():
    try:
        data = input_stage()
        transformed = transformation_stage(data)
        result = analysis_stage(transformed)
        output_stage(result)
    except Exception as e:
        print(json.dumps({"status": "failure", "errors": str(e)}))

if __name__ == "__main__":
    main()