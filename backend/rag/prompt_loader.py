import os

BASE_PATH = "prompts"


def load_prompt(name="legal"):

    file_map = {
        "legal": "legal_prompt.txt",
        "corporate": "corporate_prompt.txt",
        "rights": "rights_prompt.txt",
        "voice": "voice_prompt.txt",
    }

    file_name = file_map.get(name, "legal_prompt.txt")

    path = os.path.join(BASE_PATH, file_name)

    with open(path, "r", encoding="utf-8") as f:
        return f.read()