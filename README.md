ClaimCompass

AI-powered car damage analysis. Upload or link a vehicle photo to receive vehicle identification, damage assessment, and repair cost estimates.

---

## 📐 Design Explanation

### Why These Tools
- **Replit** – Given the complexity of the problem and the time constraint (3-4 hours), Replit, an online IDE that simplifies software development by providing a browser-based workspace and integrated AI tools for code completion, debugging, and generating code based on prompts, was used. Replit enabled quick setup of a FastAPI backend and static frontend with live previews and collaboration features.
- **FastAPI** – A type-hinted Python framework with automatic OpenAPI docs, strong performance with Uvicorn, and a clean developer experience.
- **Vanilla HTML, CSS, and JavaScript** – Keeps the client lightweight and easy to host anywhere. Bootstrap 5 and Font Awesome speed up layout and icons without heavy frameworks.
- **OpenAI GPT-4o** – A multimodal model that accepts images and returns structured text, simplifying the stack as a single model handles vision and language.

### How the AI Logic Works
1. **User Input** – Users upload an image or provide an image URL.
2. **Pre-processing** – The backend validates and resizes the image if needed; URLs are downloaded to memory.
3. **AI Analysis** – The backend sends the image and a structured prompt to GPT-4o, requesting:
   - Vehicle make, model, color, and year range (if visible).
   - Detailed damage assessment.
   - Estimated repair cost range with rationale.
4. **Post-processing** – AI output is validated and converted into structured JSON.
5. **Frontend Output** – Displays results and allows users to download a report.

#### Why This AI Approach?
There are two main approaches to this problem:
- **Using a pretrained model** that allows testing and fine-tuning:
  - **Pros**: Customizable, potentially more accurate with fine-tuning.
  - **Cons**: Requires high-quality data, complex testing for accuracy, and background infrastructure setup.
- **Calling an API of a reputable LLM** and sending the image with the correct prompt.

Given the short time constraint, inability to gather high-quality data, and complexity of testing and infrastructure, the second method was chosen. As a prototype, functionality was prioritized over internal logic.

### Potential Improvements
- **Database** for storing analysis history and reports.
- **Authentication** for secure access to stored data.
- **Integration with parts/labor APIs** for more accurate estimates.
- **Batch processing** for multi-image analysis.
- **Human-in-the-loop review** for adjusters to verify results.
- **Role-based prompts** for adjuster/customer modes.
- **Localization** for multiple languages.

---

## 🧭 Table of Contents
- [Project Structure](#project-structure)
- [Features](#features)
- [Local Setup](#local-setup)
- [API Documentation](#api-documentation)
- [Frontend](#frontend)
- [Backend](#backend)
- [Security Notes](#security-notes)
- [Troubleshooting](#troubleshooting)
- [Cost Information](#cost-information)
- [License](#license)

---

## 📂 Project Structure
```
ClaimCompass
├── backend/ — FastAPI backend service
│   ├── app.py — Main API application
│   ├── requirements.txt — Python dependencies
├── frontend/ — Frontend web interface
│   ├── index.html — Main application page
│   ├── script.js — Application logic
│   ├── style.css — Custom styling
└── README.md — Project overview
```

---

## 🚀 Features
- RESTful API for damage analysis
- AI-powered analysis using OpenAI GPT-4o
- Image upload and image URL input
- Vehicle identification for make, model, and color
- Damage assessment with plain language details
- Repair cost estimate range
- Responsive, lightweight UI
- Downloadable analysis report

---

## 💻 Local Setup

### Prerequisites
- Python 3.8 or newer
- pip
- OpenAI API key

### Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Configure the API Key
- **Environment variable**:
  - **macOS or Linux**:
    ```bash
    export OPENAI_API_KEY=your_api_key_here
    ```
  - **Windows (Command Prompt)**:
    ```bash
    set OPENAI_API_KEY=your_api_key_here
    ```
- **Optional `.env` in `backend/`**:
  ```
  OPENAI_API_KEY=your_api_key_here
  ```

### Run the Backend
```bash
cd backend
python -m uvicorn app:app --host 0.0.0.0 --port ${PORT:-5000} --reload
```

---

## 📜 API Documentation

### Base URL
`http://localhost:5000`

### Endpoints
| Method | Endpoint            | Description                              |
|--------|---------------------|------------------------------------------|
| GET    | `/`                 | API info or serves the frontend if configured |
| GET    | `/health`           | Health status                            |
| GET    | `/api`              | API information                          |
| POST   | `/api/analyze`      | Analyze car damage from file or image URL |

### Analyze by File
```bash
curl -X POST http://localhost:5000/api/analyze \
  -F "file=@/path/to/vehicle.jpg"
```

### Analyze by URL
```bash
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"image_url": "https://example.com/vehicle.jpg"}'
```

### Example JSON Response
```json
{
  "vehicle": {
    "make": "Toyota",
    "model": "Camry",
    "year_range": "2018-2021",
    "color": "Silver"
  },
  "damage": [
    {
      "area": "Front bumper",
      "severity": "Moderate",
      "notes": "Scratches and dent near grille"
    }
  ],
  "estimate": {
    "currency": "USD",
    "low": 350,
    "high": 900,
    "rationale": "Refinish plus minor bumper repair"
  },
  "report": {
    "summary": "Moderate cosmetic damage on front bumper",
    "generated_at": "2025-08-15T10:00:00Z"
  }
}
```

---

## 🎨 Frontend
- Drag-and-drop upload and URL input
- Real-time image preview
- Results view for vehicle identification, damage assessment, and cost estimate
- Downloadable text report
- **Tech Stack**: HTML, CSS, JavaScript

---

## 🖥 Backend
- FastAPI application in `backend/app.py`
- Handles image upload and image URL download
- Integrates with OpenAI GPT-4o for multimodal analysis
- Post-processes model output into structured JSON

---

## 🔒 Security Notes
- Keep your OpenAI API key private and out of version control.
- Use HTTPS in production.
- Validate image types and sizes on both client and server.
- Consider authentication and rate limiting for production use.

---

## 🛠 Troubleshooting

### Module Not Found
```bash
pip install <missing_package>
```

### Port Already in Use
```bash
PORT=8000 python -m uvicorn app:app --host 0.0.0.0 --port $PORT --reload
# then open http://localhost:8000
```

### Invalid API Key
- Ensure the key starts with `sk-`.
- Ensure the key is present in the environment where the server runs.
- Check that your OpenAI account has credits.

### Browser Cannot Reach the App
- Ensure the server is running.
- Try `http://127.0.0.1:${PORT:-5000}`.
- Check firewall or VPN settings.

---

## 💰 Cost Information
- Uses OpenAI GPT-4o for image understanding.
- A single analysis typically costs a few cents, depending on prompt and image size.
- Monitor usage in the OpenAI dashboard.

---

## 📄 License
This is a demo application for insurance technology purposes.