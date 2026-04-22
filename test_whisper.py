from faster_whisper import WhisperModel

model = WhisperModel("C:\\whisper_model", compute_type="float16")

segments, _ = model.transcribe("C:\\Users\\Zak\\OneDrive\\Desktop\\Nodex System\\Node\\test.wav")

for segment in segments:
    print(segment.text)