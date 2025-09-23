import json
import os
import base64
import requests
from io import BytesIO
from PIL import Image
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel
from typing import Optional
from pathlib import Path

# the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
# do not change this unless explicitly requested by the user
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

# Initialize OpenAI client with error handling
openai_client = None
if OPENAI_API_KEY:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
else:
    print("Warning: OPENAI_API_KEY not found. Analysis features will be disabled.")

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"


app = FastAPI(
    title="ClaimCompass API", 
    description="Car Damage Analysis API",
    version="1.0.0"
)

# Mount static files from frontend directory
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

class ImageAnalysisRequest(BaseModel):
    image_url: Optional[str] = None

class CarAnalysisResponse(BaseModel):
    make: str
    model: str
    color: str
    damage_summary: str
    repair_cost_estimate: str
    success: bool
    error: Optional[str] = None



def download_image_from_url(url: str) -> bytes:
    """Download image from URL and return bytes"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Verify it's an image
        content_type = response.headers.get('content-type', '')
        if not content_type.startswith('image/'):
            raise ValueError("URL does not point to an image")
        
        return response.content
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to download image: {str(e)}")

def process_image_bytes(image_bytes: bytes) -> str:
    """Process image bytes and return base64 encoded string"""
    try:
        # Open and verify the image
        image = Image.open(BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize if too large (OpenAI has size limits)
        max_size = (1024, 1024)
        if image.size[0] > max_size[0] or image.size[1] > max_size[1]:
            image.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Convert back to bytes
        buffer = BytesIO()
        image.save(buffer, format='JPEG', quality=85)
        image_bytes = buffer.getvalue()
        
        # Encode to base64
        return base64.b64encode(image_bytes).decode('utf-8')
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process image: {str(e)}")

def analyze_car_damage(base64_image: str) -> CarAnalysisResponse:
    """Analyze car damage using OpenAI GPT-4o vision"""
    if not openai_client:
        return CarAnalysisResponse(
            make="Unknown",
            model="Unknown",
            color="Unknown",
            damage_summary="OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.",
            repair_cost_estimate="Unable to estimate without API key",
            success=False,
            error="OpenAI API key not configured"
        )
    
    try:
        system_prompt = """You are an expert automotive insurance adjuster with extensive vehicle identification experience. Analyze this car image carefully.

VEHICLE IDENTIFICATION PRIORITY: Look for these visual clues to identify make/model/color:
- Brand badges, emblems, or logos (on grille, steering wheel, trunk, doors)
- Distinctive headlight shapes and grille designs
- Body panel lines, door handle styles, mirror designs
- Wheel rim patterns and tire sizes
- Model-specific design features
- Paint color and finish type

Return ONLY valid JSON in this exact format:
{
  "make": "Vehicle manufacturer (look for badges/logos before saying Unknown)",
  "model": "Specific model name (identify from body design features)", 
  "color": "Actual visible paint color (describe what you see)",
  "damage_summary": "Professional description of all visible damage",
  "repair_cost_estimate": "USD cost range based on damage severity and parts needed"
}

IMPORTANT: Only use "Unknown" for make/model/color if genuinely not identifiable. Most vehicles have visible identifying features - examine carefully before concluding Unknown. Base repair estimates on actual visible damage considering paint work, panel replacement, and labor costs."""

        response = openai_client.chat.completions.create(
            model="gpt-4o",  # the newest OpenAI model is "gpt-4o"
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Analyze this vehicle image. First identify the make, model, and color by carefully examining badges, logos, design features, and paint. Then assess any damage. Provide your complete assessment in the required JSON format."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            response_format={"type": "json_object"},
            max_tokens=1000,
            temperature=0.1
        )
        
        # Parse the JSON response
        content = response.choices[0].message.content
        if not content:
            raise ValueError("Empty response from OpenAI")
        result = json.loads(content)
        
        return CarAnalysisResponse(
            make=result.get("make", "Unknown"),
            model=result.get("model", "Unknown"),
            color=result.get("color", "Unknown"),
            damage_summary=result.get("damage_summary", "Unable to assess damage"),
            repair_cost_estimate=result.get("repair_cost_estimate", "Unable to estimate"),
            success=True
        )
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

@app.get("/")
async def root():
    """Serve the main application"""
    return FileResponse(FRONTEND_DIR / "index.html")

@app.get("/api")
async def api_root():
    """API root endpoint"""
    return {
        "service": "ClaimCompass API",
        "version": "1.0.0",
        "status": "healthy",
        "endpoints": {
            "analyze": "/api/analyze",
            "health": "/health"
        }
    }



@app.post("/api/analyze", response_model=CarAnalysisResponse)
async def analyze_damage(
    file: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None)
):
    """
    Analyze car damage from uploaded file or URL
    """
    if not file and not image_url:
        raise HTTPException(status_code=400, detail="Either file upload or image URL is required")
    
    if file and image_url:
        raise HTTPException(status_code=400, detail="Please provide either a file or URL, not both")
    
    try:
        # Process image from file upload
        if file:
            if not file.content_type or not file.content_type.startswith('image/'):
                raise HTTPException(status_code=400, detail="File must be an image")
            
            image_bytes = await file.read()
            base64_image = process_image_bytes(image_bytes)
        
        # Process image from URL
        else:
            if not image_url:
                raise HTTPException(status_code=400, detail="Image URL is required")
            image_bytes = download_image_from_url(image_url)
            base64_image = process_image_bytes(image_bytes)
        
        # Analyze the image
        result = analyze_car_damage(base64_image)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        return CarAnalysisResponse(
            make="Unknown",
            model="Unknown", 
            color="Unknown",
            damage_summary="Analysis failed",
            repair_cost_estimate="Unable to estimate",
            success=False,
            error=str(e)
        )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ClaimCompass API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
