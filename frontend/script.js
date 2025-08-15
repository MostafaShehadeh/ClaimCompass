// ClaimCompass Frontend JavaScript

// Configuration - Same origin requests (no cross-origin issues)
const API_BASE_URL = '';
const API_ENDPOINT = '/api/analyze';

let currentAnalysisData = null;

// DOM Elements
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const previewImage = document.getElementById('previewImage');
const filePreview = document.getElementById('filePreview');
const imageUrlInput = document.getElementById('imageUrl');
const urlPreviewImage = document.getElementById('urlPreviewImage');
const urlPreview = document.getElementById('urlPreview');
const analysisForm = document.getElementById('analysisForm');
const analyzeBtn = document.getElementById('analyzeBtn');
const loadingCard = document.getElementById('loadingCard');
const resultsCard = document.getElementById('resultsCard');
const errorCard = document.getElementById('errorCard');
const welcomeCard = document.getElementById('welcomeCard');

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    checkAPIConnection();
});

function setupEventListeners() {
    // File upload events
    fileInput.addEventListener('change', handleFileSelect);
    uploadArea.addEventListener('click', handleUploadAreaClick);
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Form submission
    analysisForm.addEventListener('submit', handleFormSubmit);
    
    // URL input events
    imageUrlInput.addEventListener('input', clearFileWhenUrlEntered);
    
    // Prevent Enter key from triggering file finder on form elements
    analysisForm.addEventListener('keydown', handleFormKeyDown);
}

function handleUploadAreaClick(event) {
    // Simple click handler - just trigger file input
    fileInput.click();
}

async function checkAPIConnection() {
    try {
        console.log('Attempting to connect to API...');
        const response = await fetch('/health');
        const data = await response.json();
        if (response.ok && data.status === 'healthy') {
            console.log('API connected successfully:', data.service);
        } else {
            console.warn('API health check failed:', data);
        }
    } catch (error) {
        console.warn('API connection failed:', error);
        // Don't show error immediately on page load
    }
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        clearUrl();
        previewFile(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            fileInput.files = files;
            clearUrl();
            previewFile(file);
        } else {
            showError('Please drop an image file');
        }
    }
}

function previewFile(file) {
    if (!file.type.startsWith('image/')) {
        showError('Please select an image file');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        previewImage.src = e.target.result;
        filePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function previewUrl() {
    const url = imageUrlInput.value.trim();
    if (!url) {
        showError('Please enter an image URL');
        return;
    }
    
    clearFile();
    urlPreviewImage.src = url;
    urlPreviewImage.onload = function() {
        urlPreview.style.display = 'block';
    };
    urlPreviewImage.onerror = function() {
        showError('Unable to load image from URL. Please check the URL and try again.');
        urlPreview.style.display = 'none';
    };
}

function clearFile() {
    fileInput.value = '';
    filePreview.style.display = 'none';
    previewImage.src = '';
}

function clearUrl() {
    imageUrlInput.value = '';
    urlPreview.style.display = 'none';
    urlPreviewImage.src = '';
}

function clearFileWhenUrlEntered() {
    if (imageUrlInput.value.trim()) {
        clearFile();
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    const file = fileInput.files[0];
    const url = imageUrlInput.value.trim();
    
    if (!file && !url) {
        showError('Please upload an image file or enter an image URL');
        return;
    }
    
    if (file && url) {
        showError('Please provide either a file or URL, not both');
        return;
    }
    
    await analyzeImage(file, url);
}

async function analyzeImage(file, url) {
    showLoading();
    
    try {
        const formData = new FormData();
        
        if (file) {
            formData.append('file', file);
        }
        
        if (url) {
            formData.append('image_url', url);
        }
        
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Analysis failed');
        }
        
        const data = await response.json();
        
        if (data.success) {
            currentAnalysisData = data;
            showResults(data);
        } else {
            throw new Error(data.error || 'Analysis failed');
        }
        
    } catch (error) {
        console.error('Analysis error:', error);
        if (error.message.includes('fetch')) {
            showError('Unable to connect to the analysis service. Please check if the backend server is running.');
        } else {
            showError(error.message || 'Failed to analyze image. Please try again.');
        }
    } finally {
        hideLoading();
    }
}

function showLoading() {
    welcomeCard.style.display = 'none';
    resultsCard.style.display = 'none';
    errorCard.style.display = 'none';
    loadingCard.style.display = 'block';
    loadingCard.classList.add('pulse');
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = 'Analyzing...';
}

function hideLoading() {
    loadingCard.style.display = 'none';
    loadingCard.classList.remove('pulse');
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = 'Analyze Damage';
}

function showResults(data) {
    // Update result fields
    document.getElementById('carMake').textContent = data.make || 'Unknown';
    document.getElementById('carModel').textContent = data.model || 'Unknown';
    document.getElementById('carColor').textContent = data.color || 'Unknown';
    document.getElementById('damageSummary').textContent = data.damage_summary || 'No damage assessment available';
    document.getElementById('repairCost').textContent = data.repair_cost_estimate || 'Unable to estimate';
    
    // Show results card with animation
    welcomeCard.style.display = 'none';
    errorCard.style.display = 'none';
    resultsCard.style.display = 'block';
    resultsCard.classList.add('slide-in', 'success-glow');
    
    // Remove animation classes after animation completes
    setTimeout(() => {
        resultsCard.classList.remove('slide-in', 'success-glow');
    }, 1000);
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    
    welcomeCard.style.display = 'none';
    resultsCard.style.display = 'none';
    errorCard.style.display = 'block';
    errorCard.classList.add('error-shake');
    
    // Remove shake animation after it completes
    setTimeout(() => {
        errorCard.classList.remove('error-shake');
    }, 500);
    
    hideLoading();
}

function resetForm() {
    // Clear form
    clearFile();
    clearUrl();
    
    // Reset UI
    currentAnalysisData = null;
    resultsCard.style.display = 'none';
    errorCard.style.display = 'none';
    welcomeCard.style.display = 'block';
    
    // Reset button
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = 'Analyze Damage';
}

function downloadReport() {
    if (!currentAnalysisData) {
        showError('No analysis data available to download');
        return;
    }
    
    const reportData = {
        timestamp: new Date().toISOString(),
        vehicle: {
            make: currentAnalysisData.make,
            model: currentAnalysisData.model,
            color: currentAnalysisData.color
        },
        damage: {
            summary: currentAnalysisData.damage_summary,
            estimated_cost: currentAnalysisData.repair_cost_estimate
        },
        analysis_method: 'AI-powered analysis using OpenAI GPT-4o',
        disclaimer: 'This is an automated assessment for estimation purposes only. Professional inspection is recommended for accurate damage evaluation.'
    };
    
    const reportText = `
CLAIMCOMPASS DAMAGE ANALYSIS REPORT
Generated: ${new Date().toLocaleString()}

VEHICLE INFORMATION:
Make: ${reportData.vehicle.make}
Model: ${reportData.vehicle.model}
Color: ${reportData.vehicle.color}

DAMAGE ASSESSMENT:
${reportData.damage.summary}

ESTIMATED REPAIR COST:
${reportData.damage.estimated_cost}

ANALYSIS METHOD:
${reportData.analysis_method}

DISCLAIMER:
${reportData.disclaimer}

---
Report generated by ClaimCompass
AI-Powered Insurance Technology Demo
    `.trim();
    
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ClaimCompass_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Form Key Handler
function handleFormKeyDown(event) {
    // Prevent Enter key from triggering file finder when not in a text input
    if (event.key === 'Enter' && event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
        event.preventDefault();
    }
}

// Handle network errors gracefully
window.addEventListener('online', function() {
    console.log('Connection restored');
});

window.addEventListener('offline', function() {
    showError('No internet connection. Please check your network and try again.');
});