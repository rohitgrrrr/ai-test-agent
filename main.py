from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ai_engine import analyze_gaps, generate_fix

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    code: str
    test_cases: str

class FixRequest(BaseModel):
    code: str
    issue: dict

@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    return analyze_gaps(req.code, req.test_cases)

@app.post("/fix")
async def fix(req: FixRequest):
    return generate_fix(req.code, req.issue)

@app.get("/")
def health_check():
    return {"status": "AI Test Coverage Agent is running"}