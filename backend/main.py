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
import urllib.request
import threading

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
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
models_cache = {}
metadata = None

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Startup & Shutdown
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def download_model_from_release(model_name: str, url: str, save_path: Path) -> bool:
    """Download model from GitHub Releases if not exists"""
    if save_path.exists():
        print(f"[OK] Model exists: {model_name}")
        return True
    
    try:
        print(f"[INFO] Downloading {model_name} from GitHub Releases...")
        save_path.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(url, str(save_path))
        print(f"[OK] Downloaded {model_name} ({save_path.stat().st_size / 1e6:.1f} MB)")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to download {model_name}: {e}")
        return False

def _download_models_background():
    """Download models in background thread"""
    print("[INFO] Background: Starting model downloads...")
    resnet50_path = MODELS_DIR / "resnet50.keras"
    download_model_from_release(
        "ResNet50",
        "https://github.com/Badji-M/Deep-learning-Classification-d-image/releases/download/v1.0-resnet50/resnet50.keras",
        resnet50_path
    )
    # Load the model after download
    if resnet50_path.exists():
        try:
            print(f"[DEBUG] Background: Loading ResNet50 from {resnet50_path}...")
            model = tf.keras.models.load_model(str(resnet50_path))
            models_cache["ResNet50 (TL)"] = model  # Use correct name from metadata
            print("[OK] ✅ ResNet50 (TL) loaded in background after download")
        except Exception as e:
            print(f"[ERROR] ❌ Failed to load ResNet50 after download: {type(e).__name__}: {e}")
            import traceback
            print(f"[ERROR] Traceback: {traceback.format_exc()}")
    else:
        print("[ERROR] ResNet50 file not found after download attempt")

def get_model(model_name: str):
    """Get model from cache or load if missing"""
    print(f"[get_model] Looking for '{model_name}'")
    
    if model_name in models_cache:
        print(f"[get_model] Found in cache")
        return models_cache[model_name]
    
    # Try to load from disk if not in cache
    print(f"[get_model] Not in cache, searching in metadata...")
    model_file = next((m["model_file"] for m in metadata.get("models", []) if m["name"] == model_name), None)
    print(f"[get_model] model_file for '{model_name}': {model_file}")
    
    if model_file:
        model_path = MODELS_DIR / model_file
        print(f"[get_model] Checking path: {model_path}")
        print(f"[get_model] Path exists: {model_path.exists()}")
        
        # If model doesn't exist and it's ResNet50, try to download it
        if not model_path.exists() and model_name == "ResNet50 (TL)":
            print(f"[get_model] ResNet50 not found, attempting download...")
            download_model_from_release(
                "ResNet50",
                "https://github.com/Badji-M/Deep-learning-Classification-d-image/releases/download/v1.0-resnet50/resnet50.keras",
                model_path
            )
        
        if model_path.exists():
            try:
                model = tf.keras.models.load_model(str(model_path))
                models_cache[model_name] = model
                print(f"[OK] Loaded {model_name} on-demand")
                return model
            except Exception as e:
                print(f"[ERROR] Failed to load {model_name}: {e}")
    
    print(f"[get_model] Model '{model_name}' not found")
    return None

@app.on_event("startup")
async def startup():
    """Load models and metadata on startup"""
    global models_cache, metadata
    
    print("[INFO] Starting up FastAPI server...")
    
    # Don't start background download on free tier Render (512 MB limit)
    # ResNet50 will be downloaded on-demand when requested
    # threading.Thread(target=_download_models_background, daemon=True).start()
    
    # Load metadata immediately
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
    
    # Load available models (skip ResNet50 to save memory on startup)
    try:
        print(f"[INFO] Loading models from metadata...")
        for model_info in metadata.get("models", []):
            model_name = model_info["name"]
            model_file = model_info["model_file"]
            model_path = MODELS_DIR / model_file
            
            # Skip ResNet50 on free tier to save memory
            if "ResNet50" in model_name:
                print(f"[SKIP] Skipping {model_name} (will load on-demand)")
                continue
            
            print(f"[DEBUG] Attempting to load: {model_name} from {model_path}")
            
            if model_path.exists():
                try:
                    print(f"[DEBUG] File exists ({model_path.stat().st_size / 1e6:.1f} MB), loading with tf.keras...")
                    model = tf.keras.models.load_model(str(model_path))
                    models_cache[model_name] = model
                    print(f"[OK] ✅ Loaded model: {model_name} (cache size: {len(models_cache)})")
                except Exception as e:
                    print(f"[ERROR] ❌ Failed to load {model_name}: {type(e).__name__}: {e}")
                    import traceback
                    print(f"[ERROR] Traceback: {traceback.format_exc()}")
            else:
                print(f"[WARN] Model not found: {model_file} at {model_path}")
        
        print(f"[INFO] Startup complete. Models in cache: {list(models_cache.keys())}")
    except Exception as e:
        print(f"[ERROR] Failed to load models: {type(e).__name__}: {e}")

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

@app.get("/api/debug")
async def debug():
    """Debug endpoint to check backend state"""
    import os
    
    models_status = {}
    for model_name in ["CNN (scratch)", "ResNet50 (TL)", "EfficientNetB0 (TL)"]:
        file_mapping = {
            "CNN (scratch)": "cnn_scratch.keras",
            "ResNet50 (TL)": "resnet50.keras",
            "EfficientNetB0 (TL)": "efficientnet.keras"
        }
        model_file = file_mapping.get(model_name)
        model_path = MODELS_DIR / model_file if model_file else None
        
        models_status[model_name] = {
            "in_cache": model_name in models_cache,
            "file": model_file,
            "path": str(model_path) if model_path else None,
            "exists": model_path.exists() if model_path else False,
            "size_mb": model_path.stat().st_size / 1e6 if model_path and model_path.exists() else 0
        }
    
    return {
        "cache_keys": list(models_cache.keys()),
        "metadata_loaded": metadata is not None,
        "models": models_status,
        "models_dir": str(MODELS_DIR),
        "models_dir_exists": MODELS_DIR.exists(),
        "files_in_dir": os.listdir(MODELS_DIR) if MODELS_DIR.exists() else []
    }

@app.get("/api/test-load/{model_name}")
async def test_load(model_name: str):
    """Test loading a specific model and return detailed error info"""
    import os
    
    file_mapping = {
        "cnn": "cnn_scratch.keras",
        "resnet": "resnet50.keras",
        "efficientnet": "efficientnet.keras"
    }
    
    model_file = file_mapping.get(model_name.lower(), f"{model_name}.keras")
    model_path = MODELS_DIR / model_file
    
    result = {
        "model_name": model_name,
        "file": model_file,
        "path": str(model_path),
        "exists": model_path.exists()
    }
    
    if not model_path.exists():
        result["error"] = "File not found"
        return result
    
    result["size_mb"] = model_path.stat().st_size / 1e6
    
    try:
        print(f"[TEST-LOAD] Attempting to load {model_file}...")
        model = tf.keras.models.load_model(str(model_path))
        result["success"] = True
        result["model_type"] = str(type(model))
        result["input_shape"] = str(model.input_shape)
    except Exception as e:
        result["success"] = False
        result["error"] = str(e)
        result["error_type"] = type(e).__name__
        import traceback
        result["traceback"] = traceback.format_exc()
    
    return result

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
    
    response = FileResponse(plot_path, media_type="image/png")
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response

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
    
    response = FileResponse(image_path, media_type="image/jpeg")
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response

@app.post("/api/predict")
async def predict(file: UploadFile = File(...), model_name: str = "ResNet50 (TL)"):
    """Predict image class with specific model"""
    
    print(f"[DEBUG] Predict called with model_name='{model_name}'")
    print(f"[DEBUG] models_cache keys: {list(models_cache.keys())}")
    print(f"[DEBUG] metadata.models names: {[m['name'] for m in metadata.get('models', [])] if metadata else 'None'}")
    
    if not metadata:
        print(f"[ERROR] Metadata not loaded")
        raise HTTPException(status_code=500, detail="Metadata not loaded")
    
    # Try to get model from cache or load from disk
    model = get_model(model_name)
    print(f"[DEBUG] get_model returned: {model is not None}")
    
    if not model:
        print(f"[ERROR] Model '{model_name}' not found or failed to load")
        raise HTTPException(status_code=404, detail=f"Model {model_name} not found or failed to load")
    
    try:
        # Read image
        image_bytes = await file.read()
        
        # Preprocess
        img_size = metadata.get("img_size", [96, 96])
        X = preprocess_image(image_bytes, img_size)
        
        # Predict
        t0 = time.time()
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
    if not metadata:
        raise HTTPException(status_code=500, detail="Metadata not loaded")
    
    try:
        image_bytes = await file.read()
        img_size = metadata.get("img_size", [96, 96])
        X = preprocess_image(image_bytes, img_size)
        class_names = metadata.get("class_names", [])
        
        results = []
        for model_info in metadata.get("models", []):
            model_name = model_info["name"]
            model = get_model(model_name)
            
            if not model:
                results.append({
                    "model": model_name,
                    "error": "Model not found or failed to load"
                })
                continue
            
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
