# ClaimCompass - AI Car Damage Analysis

## Overview
ClaimCompass is an AI-powered car damage analysis application that allows users to upload photos of damaged vehicles and receive automated assessments including vehicle identification, damage summary, and repair cost estimates.

## Recent Changes
- **2024-09-23**: Successfully imported and configured for Replit environment
  - Set up Python backend with FastAPI
  - Configured frontend static file serving
  - Added OpenAI integration support
  - Implemented graceful error handling for missing API key
  - Created workflow configuration for port 5000
  - Set up autoscale deployment configuration

## User Preferences
- Prioritize maintaining existing functionality while adapting to Replit environment
- Keep the AI model as gpt-4o (existing working configuration)
- Maintain separation between backend API and frontend static files

## Project Architecture
- **Backend**: FastAPI application (`backend/app.py`)
  - Serves API endpoints on `/api/*`
  - Handles image upload and URL processing
  - Integrates with OpenAI GPT-4o for image analysis
  - Serves frontend static files from `/static/*`
  - Root path serves main application page
  
- **Frontend**: Static HTML/CSS/JavaScript (`frontend/`)
  - Bootstrap 5 for responsive UI
  - Drag-and-drop file upload
  - Image URL input support
  - Real-time preview functionality
  - Report download feature

- **Dependencies**: 
  - Python 3.11 with fastapi, uvicorn, openai, pillow, pydantic, python-multipart, requests
  - Bootstrap 5 and Font Awesome (CDN)

## Environment Requirements
- **OPENAI_API_KEY**: Required for AI analysis functionality
  - Without this key, the application will start but analysis features will be disabled
  - Users will see a clear message indicating the API key is needed

## Key Features
- Vehicle identification (make, model, color)
- Damage assessment with detailed summary
- Repair cost estimation
- Support for both file upload and image URL input
- Responsive web interface
- Downloadable analysis reports
- Graceful error handling and user feedback

## Deployment
- Configured for Replit autoscale deployment
- Runs on port 5000 with proper host configuration (0.0.0.0)
- Ready for production deployment once API key is configured