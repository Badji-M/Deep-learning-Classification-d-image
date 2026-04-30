# FlipClass - Deep Learning Image Classification Platform

A modern deep learning platform for product image classification using three different neural network architectures. Built with React + FastAPI stack with real-time predictions and comprehensive performance analysis.

## Overview

FlipClass is an end-to-end image classification system that compares three different deep learning models on Flipkart product images. The platform provides an intuitive interface for model testing, performance visualization, and comparative analysis.

## Features

- Real-time image classification with multiple models
- Interactive model comparison
- Performance metrics visualization (accuracy, F1-score, confusion matrices)
- Responsive web interface
- Fast inference (< 50ms per prediction)
- Support for 7 product categories
- REST API for model predictions

## Architecture

### Frontend
- React 18 - UI framework
- TypeScript - Type-safe development
- Tailwind CSS - Styling
- Vite 5.4 - Build tool and dev server
- Axios - HTTP client

### Backend
- FastAPI - Modern Python web framework
- TensorFlow 2.x - Deep learning framework
- Keras 3 - High-level neural networks API
- OpenCV 4 - Image processing
- Python 3.11 - Runtime

## Models

### 1. CNN Scratch
- Type: Custom convolutional neural network
- Accuracy: 15.2%
- Purpose: Baseline reference model
- Description: Fully custom architecture trained from zero to establish performance baseline

### 2. ResNet50
- Type: Transfer Learning (ImageNet pre-trained)
- Accuracy: 77.4%
- Size: 179 MB
- Purpose: Balanced performance
- Description: Deep residual network with excellent performance to model size ratio

### 3. EfficientNetB0 (Recommended)
- Type: Transfer Learning (ImageNet pre-trained)
- Accuracy: 79.4%
- Size: 37.4 MB
- Purpose: Production-ready optimal model
- Description: Most efficient model with highest accuracy and smallest footprint

## Dataset

- Total Images: 1,050
- Categories: 7
- Resolution: 96x96 pixels
- Source: Flipkart products
- Format: Normalized RGB images
- Augmentation: Applied during training for improved generalization

## Project Structure

```
Deep learning/
├── backend/
│   ├── main.py                 - FastAPI application
│   ├── requirements.txt         - Python dependencies
│   ├── venv311/                 - Virtual environment
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── App.tsx            - Main React component
│   │   ├── components/         - React components
│   │   ├── api.ts             - API client
│   │   └── ...
│   ├── package.json           - Node dependencies
│   ├── vite.config.ts         - Vite configuration
│   └── ...
├── data/
│   ├── raw/                   - Raw dataset
│   └── processed/             - Processed features and splits
├── notebooks/                 - Jupyter notebooks for training
│   ├── 01_exploration.ipynb      - Dataset exploration and analysis
│   ├── 02_preprocessing.ipynb     - Data preprocessing and augmentation
│   ├── 03_cnn_scratch.ipynb       - Custom CNN from scratch training
│   ├── 04_resnet50.ipynb          - ResNet50 transfer learning
│   ├── 05_efficientnet.ipynb      - EfficientNetB0 transfer learning
│   ├── 06_comparaison.ipynb       - Comparative analysis of models
│   └── cifar.ipynb                - Additional CIFAR experiments
├── outputs/
│   ├── models/               - Trained model files
│   ├── plots/                - Generated visualizations
│   └── results/              - Performance metrics JSON
└── .gitignore

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 16+
- npm or yarn

### Backend Setup

```bash
cd backend
python -m venv venv311
./venv311/Scripts/Activate.ps1  # Windows
source venv311/bin/activate     # Linux/Mac
pip install -r requirements.txt
python main.py
```

Backend runs on `http://localhost:8001`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

## API Endpoints

### GET /api/metadata
Returns model names, classes, and accuracy metrics

### POST /api/predict
Predict with a single model
- Parameter: `model_name` (query param)
- Body: Image file (multipart/form-data)
- Returns: Predictions with confidence scores

### POST /api/predict_all
Predict with all models simultaneously
- Body: Image file (multipart/form-data)
- Returns: Predictions from all models

### GET /api/sample-images
Returns sample images for testing

## Performance Metrics

| Model | Accuracy | F1-Score | Size | Latency |
|-------|----------|----------|------|---------|
| CNN Scratch | 15.2% | 14.1% | Small | ~50ms |
| ResNet50 | 77.4% | 76.8% | 179 MB | ~50ms |
| EfficientNetB0 | 79.4% | 78.9% | 37.4 MB | ~50ms |

## Usage

1. Open `http://localhost:3000` in your browser
2. Navigate to the Prediction tab to test models
3. Upload an image to get predictions from all models
4. Visit Performance tab to see metrics and visualizations
5. Check About section for technical stack details

## Development

### Adding New Models

1. Train model in Jupyter notebook and save as `.keras`
2. Add model to `backend/main.py` models dictionary
3. Update metadata JSON
4. Frontend automatically detects new models

### Modifying Frontend

```bash
cd frontend
npm run dev      # Development server with hot reload
npm run build    # Production build
npm run lint     # ESLint check
```

### Modifying Backend

Edit `backend/main.py` and the dev server auto-reloads with Uvicorn

## Notebooks

Training notebooks are available in the `notebooks/` directory:

- `01_exploration.ipynb` - Dataset exploration
- `02_preprocessing.ipynb` - Data preprocessing
- `03_cnn_scratch.ipynb` - Custom CNN training
- `04_resnet50.ipynb` - ResNet50 transfer learning
- `05_efficientnet.ipynb` - EfficientNetB0 transfer learning
- `06_comparaison.ipynb` - Model comparison analysis

## Model Files

All trained models are stored in `outputs/models/`:
- `cnn_scratch.keras` (custom CNN)
- `resnet50.keras` (ResNet50 transfer learning)
- `efficientnet.keras` (EfficientNetB0 transfer learning)

Results and metrics are saved in `outputs/results/`

## Troubleshooting

### Backend won't start
- Ensure Python 3.11+ is installed
- Check TensorFlow/CUDA compatibility
- Verify all dependencies: `pip install -r requirements.txt`

### Frontend build errors
- Clear `node_modules/`: `rm -rf node_modules && npm install`
- Ensure TypeScript types match: `npm run build`

### Models not loading
- Check model file paths in `backend/main.py`
- Verify Keras `.keras` format compatibility
- Check TensorFlow version matches training version

## Performance Optimization

- Models run on CPU (Windows GPU support requires WSL2 or DirectML)
- Image preprocessing cached in memory
- Frontend uses React.memo for component optimization
- Vite production build includes code splitting

## CORS

CORS is enabled on backend for development. Modify in `backend/main.py` for production.

## License

MIT License

## Author

Developed as a deep learning classification project using modern web technologies and transfer learning techniques.

## Deployment

For production deployment:

1. Build frontend: `npm run build` -> use `dist/` folder
2. Deploy frontend to Vercel, Netlify, or similar
3. Deploy backend to Heroku, AWS, Google Cloud, etc.
4. Update CORS origins in backend configuration
5. Use environment variables for API endpoints

## Support

For issues or questions, check the notebooks for training details or review the source code comments.
