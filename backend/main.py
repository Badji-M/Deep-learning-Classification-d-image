"""
FastAPI Backend for Product Classification
Serves ML models and provides prediction endpoints
"""

import os
import json
import numpy as np
import cv2
from pathlib import Path
from typing import List
import time

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import tensorflow as tf

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Configuration
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ROOT = Path(__file__).parent.parent
MODELS_DIR = ROOT / "outputs" / "models"
RESULTS_DIR = ROOT / "outputs" / "results"

app = FastAPI(title="Product Classification API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
models_cache = {}
metadata = None

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Startup & Shutdown
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.on_event("startup")
async def startup():
    """Load models and metadata on startup"""
    global models_cache, metadata
    
    print("[INFO] Starting up FastAPI server...")
    
    # Load metadata
    try:
        results_file = RESULTS_DIR / "all_results.pkl"
        if not results_file.exists():
            results_file = RESULTS_DIR / "all_results.json"
        
        if results_file.suffix == ".json":
            with open(results_file) as f:
                metadata = json.load(f)
        else:
            import pickle
            with open(results_file, 'rb') as f:
                metadata = pickle.load(f)
        
        print(f"[OK] Loaded metadata: {len(metadata.get('class_names', []))} classes")
    except Exception as e:
        print(f"[ERROR] Failed to load metadata: {e}")
        metadata = None
    
    # Load models
    try:
        for model_info in metadata.get("models", []):
            model_name = model_info["name"]
            model_file = model_info["model_file"]
            model_path = MODELS_DIR / model_file
            
            if model_path.exists():
                model = tf.keras.models.load_model(str(model_path))
                models_cache[model_name] = model
                print(f"[OK] Loaded model: {model_name}")
            else:
                print(f"[WARN] Model not found: {model_file}")
    except Exception as e:
        print(f"[ERROR] Failed to load models: {e}")

@app.on_event("shutdown")
async def shutdown():
    """Cleanup on shutdown"""
    print("[INFO] Shutting down...")
    models_cache.clear()

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Utilities
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def preprocess_image(image_bytes: bytes, img_size: List[int]) -> np.ndarray:
    """Preprocess image for model prediction"""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, tuple(img_size))
    return np.expand_dims(img.astype(np.float32) / 255.0, 0)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Routes
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.get("/")
async def root():
    """Health check"""
    return {"status": "ok", "service": "Product Classification API"}

@app.get("/api/metadata")
async def get_metadata():
    """Get dataset metadata and model info"""
    if not metadata:
        raise HTTPException(status_code=500, detail="Metadata not loaded")
    
    return {
        "class_names": metadata.get("class_names", []),
        "n_classes": metadata.get("n_classes", 0),
        "img_size": metadata.get("img_size", [96, 96]),
        "models": [
            {
                "name": m["name"],
                "accuracy": m["accuracy"],
                "f1_score": m["f1_score"]
            }
            for m in metadata.get("models", [])
        ]
    }

@app.get("/api/models")
async def get_models():
    """Get list of available models"""
    return {"models": list(models_cache.keys())}

@app.get("/api/plots/{filename}")
async def get_plot(filename: str):
    """Serve plot images from outputs/plots directory"""
    # Sanitize filename to prevent directory traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    plot_path = ROOT / "outputs" / "plots" / filename
    if not plot_path.exists():
        raise HTTPException(status_code=404, detail=f"Plot {filename} not found")
    
    return FileResponse(plot_path, media_type="image/png")

@app.get("/api/sample-images")
async def get_sample_images():
    """Get list of sample images for demo"""
    images_dir = ROOT / "data" / "raw" / "images"
    if not images_dir.exists():
        return {"samples": []}
    
    # Get first few images from different parts of the directory
    all_images = sorted([f.name for f in images_dir.glob("*") if f.is_file() and f.suffix.lower() in ['.jpg', '.png', '.jpeg']])
    
    # Take 4 samples spread throughout the list
    samples = []
    if len(all_images) >= 4:
        indices = [0, len(all_images)//3, 2*len(all_images)//3, len(all_images)-1]
        samples = [all_images[i] for i in indices]
    else:
        samples = all_images[:4]
    
    return {"samples": samples}

@app.get("/api/sample-images/{filename}")
async def get_sample_image(filename: str):
    """Serve sample image"""
    # Sanitize filename
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    image_path = ROOT / "data" / "raw" / "images" / filename
    if not image_path.exists():
        raise HTTPException(status_code=404, detail=f"Image {filename} not found")
    
    return FileResponse(image_path, media_type="image/jpeg")

@app.post("/api/predict")
async def predict(file: UploadFile = File(...), model_name: str = "ResNet50 (TL)"):
    """Predict image class with specific model"""
    if model_name not in models_cache:
        raise HTTPException(status_code=404, detail=f"Model {model_name} not found")
    
    if not metadata:
        raise HTTPException(status_code=500, detail="Metadata not loaded")
    
    try:
        # Read image
        image_bytes = await file.read()
        
        # Preprocess
        img_size = metadata.get("img_size", [96, 96])
        X = preprocess_image(image_bytes, img_size)
        
        # Predict
        t0 = time.time()
        model = models_cache[model_name]
        probs = model.predict(X, verbose=0)[0]
        elapsed = (time.time() - t0) * 1000
        
        pred_idx = int(np.argmax(probs))
        confidence = float(np.max(probs))
        
        class_names = metadata.get("class_names", [])
        pred_class = class_names[pred_idx] if pred_idx < len(class_names) else f"Class {pred_idx}"
        
        # Top-5
        top5_idx = np.argsort(probs)[-5:][::-1]
        top5 = [
            {
                "class": class_names[idx] if idx < len(class_names) else f"Class {idx}",
                "probability": float(probs[idx])
            }
            for idx in top5_idx
        ]
        
        return {
            "predicted_class": pred_class,
            "confidence": confidence,
            "elapsed_ms": elapsed,
            "top5": top5,
            "probabilities": probs.tolist()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict_all")
async def predict_all(file: UploadFile = File(...)):
    """Predict with all models"""
    if not models_cache or not metadata:
        raise HTTPException(status_code=500, detail="Models or metadata not loaded")
    
    try:
        image_bytes = await file.read()
        img_size = metadata.get("img_size", [96, 96])
        X = preprocess_image(image_bytes, img_size)
        class_names = metadata.get("class_names", [])
        
        results = []
        for model_name, model in models_cache.items():
            t0 = time.time()
            probs = model.predict(X, verbose=0)[0]
            elapsed = (time.time() - t0) * 1000
            
            pred_idx = int(np.argmax(probs))
            confidence = float(np.max(probs))
            pred_class = class_names[pred_idx] if pred_idx < len(class_names) else f"Class {pred_idx}"
            
            results.append({
                "model": model_name,
                "predicted_class": pred_class,
                "confidence": confidence,
                "elapsed_ms": elapsed
            })
        
        return {"results": results}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
