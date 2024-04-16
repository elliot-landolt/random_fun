import openai

file = open("/Users/Elliot/Downloads/interview.m4a", "rb")
transcription = openai.Audio.transcribe("whisper-2",file)
print(transcription)