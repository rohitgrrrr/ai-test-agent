import os, json
from openai import OpenAI
from dotenv import load_dotenv
from prompts import ANALYZE_PROMPT, FIX_PROMPT

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def analyze_gaps(code: str, test_cases: str) -> dict:
    user_message = f"SOURCE CODE:\n{code}\n\nTEST CASES:\n{test_cases}"
    response = client.chat.completions.create(
        model="gpt-4o",
        response_format={"type": "json_object"},  # Forces JSON output
        messages=[
            {"role": "system", "content": ANALYZE_PROMPT},
            {"role": "user",   "content": user_message}
        ]
    )
    return json.loads(response.choices[0].message.content)

def generate_fix(code: str, issue: dict) -> dict:
    user_message = f"SOURCE CODE:\n{code}\n\nISSUE:\n{json.dumps(issue)}"
    response = client.chat.completions.create(
        model="gpt-4o",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": FIX_PROMPT},
            {"role": "user",   "content": user_message}
        ]
    )
    return json.loads(response.choices[0].message.content)
