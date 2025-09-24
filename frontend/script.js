// Scale AI Car Damage Analysis Frontend

// Configuration
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
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');

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
    if (event.target === uploadArea || uploadArea.contains(event.target)) {
        fileInput.click();
    }
}

async function checkAPIConnection() {
    try {
        console.log('Connecting to Scale AI backend...');
        const response = await fetch('/health');
        const data = await response.json();
        if (response.ok && data.status === 'healthy') {
            console.log('Scale AI backend connected successfully:', data.service);
        } else {
            console.warn('API health check failed:', data);
        }
    } catch (error) {
        console.warn('API connection failed:', error);
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
    if (!uploadArea.contains(event.relatedTarget)) {
        uploadArea.classList.remove('dragover');
    }
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
            showError('Please drop an image file (JPG, PNG)');
        }
    }
}

function previewFile(file) {
    if (!file.type.startsWith('image/')) {
        showError('Please select an image file (JPG, PNG)');
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
        showError('Unable to load image from URL. Please verify the URL is accessible.');
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
        showError('Please upload an image file or enter an image URL to analyze');
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
            throw new Error(data.error || 'Analysis failed - please try again');
        }
        
    } catch (error) {
        console.error('Scale AI analysis error:', error);
        if (error.message.includes('fetch')) {
            showError('Unable to connect to Scale AI services. Please check your connection and try again.');
        } else {
            showError(error.message || 'Failed to analyze image. Please try again.');
        }
    } finally {
        hideLoading();
    }
}

function showLoading() {
    // Hide all sections
    resultsSection.style.display = 'none';
    errorSection.style.display = 'none';
    
    // Show loading
    loadingSection.style.display = 'flex';
    
    // Update analyze button
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = `
        <div class="loading-spinner" style="width: 16px; height: 16px; margin-right: 8px;"></div>
        <span class="btn-text">Analyzing with Scale AI...</span>
    `;
}

function hideLoading() {
    loadingSection.style.display = 'none';
    
    // Reset analyze button
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = `
        <span class="btn-text">Analyze with Scale AI</span>
        <svg class="btn-arrow" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3.204 11L6.5 7.704 3.204 4.408l.592-.592L8 7.716l.592.592-4.796 4.796L3.204 11z"/>
        </svg>
    `;
}

function showResults(data) {
    // Update result fields
    document.getElementById('carMake').textContent = data.make || 'Unknown';
    document.getElementById('carModel').textContent = data.model || 'Unknown';
    document.getElementById('carColor').textContent = data.color || 'Unknown';
    document.getElementById('damageSummary').textContent = data.damage_summary || 'No damage assessment available';
    document.getElementById('repairCost').textContent = data.repair_cost_estimate || 'Unable to estimate';
    
    // Hide loading and error
    loadingSection.style.display = 'none';
    errorSection.style.display = 'none';
    
    // Show results with animation
    resultsSection.style.display = 'block';
    resultsSection.classList.add('fade-in');
    
    // Remove animation class after animation completes
    setTimeout(() => {
        resultsSection.classList.remove('fade-in');
    }, 500);
    
    // Scroll to results
    resultsSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    
    // Hide loading and results
    loadingSection.style.display = 'none';
    resultsSection.style.display = 'none';
    
    // Show error
    errorSection.style.display = 'flex';
    errorSection.classList.add('fade-in');
    
    // Remove animation class after animation completes
    setTimeout(() => {
        errorSection.classList.remove('fade-in');
    }, 500);
    
    hideLoading();
}

function resetForm() {
    // Clear form
    clearFile();
    clearUrl();
    
    // Reset data
    currentAnalysisData = null;
    
    // Hide all sections
    resultsSection.style.display = 'none';
    errorSection.style.display = 'none';
    loadingSection.style.display = 'none';
    
    // Reset button
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = `
        <span class="btn-text">Analyze with Scale AI</span>
        <svg class="btn-arrow" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3.204 11L6.5 7.704 3.204 4.408l.592-.592L8 7.716l.592.592-4.796 4.796L3.204 11z"/>
        </svg>
    `;
    
    // Scroll to top
    window.scrollTo({ 
        top: 0, 
        behavior: 'smooth' 
    });
}

function downloadReport() {
    if (!currentAnalysisData) {
        showError('No analysis data available to download');
        return;
    }
    
    const reportData = {
        timestamp: new Date().toISOString(),
        service: 'Scale AI Car Damage Analysis',
        vehicle: {
            make: currentAnalysisData.make,
            model: currentAnalysisData.model,
            color: currentAnalysisData.color
        },
        damage: {
            summary: currentAnalysisData.damage_summary,
            estimated_cost: currentAnalysisData.repair_cost_estimate
        },
        analysis_method: 'AI-powered analysis using Scale AI and OpenAI GPT-4o',
        disclaimer: 'This is an automated assessment for estimation purposes only. Professional inspection is recommended for accurate damage evaluation.'
    };
    
    const reportText = `
SCALE AI - VEHICLE DAMAGE ANALYSIS REPORT
Generated: ${new Date().toLocaleString()}

ANALYSIS SERVICE:
${reportData.service}

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

IMPORTANT DISCLAIMER:
${reportData.disclaimer}

ABOUT SCALE AI:
Scale delivers breakthrough AI from data to deployment, powering 
the next generation of AI applications for enterprises and governments.

---
Report generated by Scale AI Car Damage Analysis
${new Date().toISOString()}
    `.trim();
    
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Scale_AI_Vehicle_Analysis_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
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

// Handle network status
window.addEventListener('online', function() {
    console.log('Scale AI connection restored');
});

window.addEventListener('offline', function() {
    showError('No internet connection. Please check your network and try again.');
});

// Add some Scale AI branding touches
console.log('Scale AI Car Damage Analysis - Breakthrough AI from Data to Deployment');
console.log('Powered by Scale AI and OpenAI GPT-4o');

// Export functions for testing
window.ScaleAI = {
    analyzeImage,
    resetForm,
    downloadReport,
    previewUrl
};