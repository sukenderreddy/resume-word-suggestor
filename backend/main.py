from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import fitz  # PyMuPDF for PDF parsing
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import string
import logging
from typing import List, Set, Tuple
import io

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Download NLTK resources
try:
    nltk.download("punkt", quiet=True)
    nltk.download("stopwords", quiet=True)
    STOPWORDS = set(stopwords.words("english"))
except Exception as e:
    logger.error(f"Error downloading NLTK resources: {e}")
    STOPWORDS = set()

app = FastAPI(title="Resume ATS Analyzer API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def extract_text_from_pdf(pdf_file: UploadFile) -> str:
    """Extract text content from a PDF file."""
    try:
        pdf_data = await pdf_file.read()
        doc = fitz.open(stream=pdf_data, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        raise HTTPException(status_code=400, detail=f"Error processing PDF: {str(e)}")

def extract_important_keywords(text: str) -> Set[str]:
    """Extract important keywords from text, excluding stopwords and punctuation."""
    try:
        # Tokenize and lowercase
        words = word_tokenize(text.lower())
        
        # Remove stopwords and punctuation
        words = [word for word in words if word not in STOPWORDS 
                and word not in string.punctuation
                and len(word) > 2]  # Exclude very short words
        
        # Return unique keywords
        return set(words)
    except Exception as e:
        logger.error(f"Error extracting keywords: {e}")
        return set()

def calculate_ats_score(resume_keywords: Set[str], job_keywords: Set[str]) -> Tuple[float, List[str], List[str]]:
    """Calculate ATS score based on keyword matching."""
    try:
        if not job_keywords:
            return 0.0, [], []
            
        # Find matched and missing keywords
        matched_keywords = resume_keywords.intersection(job_keywords)
        missing_keywords = job_keywords - resume_keywords
        
        # Calculate score as percentage of matched keywords
        score = (len(matched_keywords) / len(job_keywords)) * 100
        
        return score, list(matched_keywords), list(missing_keywords)
    except Exception as e:
        logger.error(f"Error calculating ATS score: {e}")
        return 0.0, [], []

@app.get("/")
async def root():
    return {"message": "Resume ATS Score API is running. Use /analyze-resume/ endpoint."}

@app.post("/analyze-resume/")
async def analyze_resume(
    job_description: str = Form(...), 
    resume: UploadFile = File(...)
):
    """
    Analyze a resume against a job description to calculate ATS score.
    
    Parameters:
    - job_description: The job description text
    - resume: PDF resume file
    
    Returns:
    - ats_score: Percentage match score
    - matched_keywords: Keywords found in both resume and job description
    - missing_keywords: Keywords from job description missing in resume
    """
    logger.info(f"Received analysis request: Resume={resume.filename}, Job description length={len(job_description)}")
    
    # Validate PDF
    if resume.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Please upload a valid PDF file")
    
    try:
        # Extract text from PDF
        resume_text = await extract_text_from_pdf(resume)
        logger.info(f"Extracted {len(resume_text)} characters from resume")
        
        # Extract keywords
        resume_keywords = extract_important_keywords(resume_text)
        job_keywords = extract_important_keywords(job_description)
        
        logger.info(f"Found {len(resume_keywords)} unique keywords in resume and {len(job_keywords)} in job description")
        
        # Calculate ATS score
        ats_score, matched, missing = calculate_ats_score(resume_keywords, job_keywords)
        
        # Sort keywords alphabetically for better readability
        matched.sort()
        missing.sort()
        
        logger.info(f"Analysis complete. ATS Score: {ats_score:.2f}%, Matched: {len(matched)}, Missing: {len(missing)}")
        
        return {
            "ats_score": round(ats_score, 2),
            "matched_keywords": matched,
            "missing_keywords": missing
        }
    except Exception as e:
        logger.error(f"Error in analyze_resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing resume: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)