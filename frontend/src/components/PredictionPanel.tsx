import React, { useState, useEffect } from 'react'
import { api } from '../api'

interface PredictionPanelProps {
  metadata: any
}

export default function PredictionPanel({ metadata }: PredictionPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedModel, setSelectedModel] = useState('CNN (scratch)')
  const [prediction, setPrediction] = useState<any>(null)
  const [allPredictions, setAllPredictions] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [sampleImages, setSampleImages] = useState<string[]>([])

  useEffect(() => {
    const loadSamples = async () => {
      try {
        const data = await api.getSampleImages()
        setSampleImages(data.samples || [])
      } catch (err) {
        console.error('Failed to load sample images:', err)
      }
    }
    loadSamples()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const processFile = (file: File) => {
    setSelectedFile(file)
    setError(null)
    setPrediction(null)
    setAllPredictions(null)

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handlePredict = async () => {
    if (!selectedFile) return

    setLoading(true)
    setError(null)
    try {
      if (selectedModel === 'All Models') {
        const result = await api.predictAll(selectedFile)
        setAllPredictions(result)
        setPrediction(null)
      } else {
        const result = await api.predict(selectedFile, selectedModel)
        setPrediction(result)
        setAllPredictions(null)
      }
    } catch (err: any) {
      setError(err.message || 'Prediction failed')
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.75) return 'from-green-400 to-green-600'
    if (conf >= 0.55) return 'from-yellow-400 to-yellow-600'
    return 'from-red-400 to-red-600'
  }

  const getConfidenceText = (conf: number) => {
    if (conf >= 0.75) return 'Très confiant'
    if (conf >= 0.55) return 'Moyen'
    return 'Faible'
  }

  const loadSampleImage = async (filename: string) => {
    try {
      const response = await api.getSampleImageBlob(filename)
      const file = new File([response], filename, { type: 'image/jpeg' })
      processFile(file)
    } catch (err) {
      setError('Failed to load sample image')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Input Panel */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Configuration</h2>

        {/* Model Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Sélectionnez un modèle
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          >
            {metadata.models.map((m: any) => (
              <option key={m.name} value={m.name}>
                {m.name} ({(m.accuracy * 100).toFixed(1)}% acc.)
              </option>
            ))}
            <option value="All Models">Tous les modèles</option>
          </select>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Télécharger une image
          </label>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
              dragActive
                ? 'border-blue-500 bg-blue-50 scale-105'
                : 'border-gray-300 hover:border-blue-400'
            }`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <div className="text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-lg font-semibold">Déposer une image ici</p>
                <p className="text-xs text-gray-400 mt-2">PNG, JPG, WebP (max 10MB)</p>
              </div>
            </label>
          </div>

          {selectedFile && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg animate-in fade-in slide-in-from-bottom-2">
              <p className="text-sm font-semibold text-green-700">
                ✓ {selectedFile.name}
              </p>
            </div>
          )}
        </div>

        {/* Sample Images Gallery */}
        {sampleImages.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">Essayer avec des exemples</p>
            <div className="grid grid-cols-4 gap-2">
              {sampleImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => loadSampleImage(img)}
                  className="relative group overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-400 transition hover:shadow-md"
                >
                  <img
                    src={api.getSampleImageURL(img)}
                    alt={`Sample ${idx + 1}`}
                    className="w-full h-20 object-cover group-hover:scale-110 transition"
                  />
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">Charger</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className="mb-6 animate-in fade-in duration-300">
            <p className="text-sm font-semibold text-gray-700 mb-3">Aperçu</p>
            <div className="bg-gray-50 rounded-lg border-2 border-gray-200 p-4 flex items-center justify-center max-h-96 overflow-hidden">
              <img
                src={preview}
                alt="preview"
                className="max-h-96 w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Predict Button */}
        <button
          onClick={handlePredict}
          disabled={!selectedFile || loading}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : !selectedFile
              ? 'bg-gray-300 cursor-not-allowed'
              : 'btn-primary hover:shadow-lg hover:scale-105'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyse en cours...
            </span>
          ) : (
            'Analyser l\'image'
          )}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg animate-in fade-in">
            <p className="text-sm text-red-800 font-semibold">Erreur: {error}</p>
          </div>
        )}
      </div>

      {/* Results Panel */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Résultats</h2>

        {!prediction && !allPredictions && (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>Téléchargez une image pour voir les résultats</p>
          </div>
        )}

        {/* Single Model Prediction */}
        {prediction && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Main Result */}
            <div className={`bg-gradient-to-br ${getConfidenceColor(prediction.confidence)} p-6 rounded-xl text-white shadow-lg`}>
              <p className="text-sm opacity-90 uppercase tracking-wide">Classe prédite</p>
              <p className="text-3xl font-bold mt-2">{prediction.predicted_class}</p>
              <p className="text-sm mt-2 opacity-80">{getConfidenceText(prediction.confidence)}</p>
            </div>

            {/* Confidence & Speed */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-xs text-blue-600 uppercase tracking-wide font-semibold">Confiance</p>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-blue-700">{(prediction.confidence * 100).toFixed(1)}%</p>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${prediction.confidence * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                <p className="text-xs text-purple-600 uppercase tracking-wide font-semibold">Temps</p>
                <p className="text-2xl font-bold text-purple-700 mt-3">{prediction.elapsed_ms.toFixed(0)}ms</p>
              </div>
            </div>

            {/* Top 5 */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Top 5 prédictions</p>
              <div className="space-y-2">
                {prediction.top5.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-transparent rounded-lg border border-gray-200 hover:shadow-md transition">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{idx + 1}. {item.class}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{(item.probability * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* All Models Comparison */}
        {allPredictions && (
          <div className="space-y-3 animate-in fade-in duration-500">
            {allPredictions.results.map((result: any, idx: number) => (
              <div key={idx} className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg transition hover:border-blue-300">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-gray-800">{result.model}</p>
                  <p className="text-xs font-semibold text-gray-500">{result.elapsed_ms.toFixed(0)}ms</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-600">Classe</p>
                    <p className="font-semibold text-gray-800">{result.predicted_class}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Confiance</p>
                    <p className="font-bold text-blue-600">{(result.confidence * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
