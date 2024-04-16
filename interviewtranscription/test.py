from openai import OpenAI
OPENAI_API_KEY = "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"
client = OpenAI(api_key=OPENAI_API_KEY)
audio_file = open("/Users/Elliot/Downloads/interview.m4a", "rb")
transcription = client.audio.transcriptions.create(
    model = "whisper-1",
    file = audio_file
)
print(transcription.text)
