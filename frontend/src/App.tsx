import { useState, useEffect } from 'react'
import { api } from './api'
import PredictionPanel from './components/PredictionPanel'
import PerformancePanel from './components/PerformancePanel'
import './index.css'

function App() {
  const [currentPage, setCurrentPage] = useState<'prediction' | 'performance' | 'about'>('prediction')
  const [metadata, setMetadata] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const data = await api.getMetadata()
        setMetadata(data)
      } catch (error) {
        console.error('Failed to load metadata:', error)
      } finally {
        setLoading(false)
      }
    }
    loadMetadata()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-transparent border-t-blue-500 border-r-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-300 text-lg font-semibold">Chargement de la plateforme...</p>
        </div>
      </div>
    )
  }

  const navigationItems = [
    { id: 'prediction', label: 'Prédiction' },
    { id: 'performance', label: 'Performance' },
    { id: 'about', label: 'À propos' }
  ]

  const getIcon = (id: string) => {
    switch (id) {
      case 'prediction':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )
      case 'performance':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      case 'about':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white shadow-2xl transition-all duration-300 fixed left-0 top-0 h-screen flex flex-col z-50`}>
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-xl font-black">FlipClass</h1>
                <p className="text-xs text-gray-400">Deep Learning</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id as any)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${
                currentPage === item.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="flex-shrink-0">{getIcon(item.id)}</span>
              {sidebarOpen && <span className="font-semibold text-left">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Toggle Button */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-3 rounded-lg hover:bg-gray-700 transition text-gray-300"
            title={sidebarOpen ? 'Réduire' : 'Développer'}
          >
            <svg className={`w-6 h-6 transition-transform ${sidebarOpen ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <header className="gradient-bg text-white shadow-2xl">
          <div className="px-8 py-4">
            <h1 className="text-2xl font-bold">{navigationItems.find(item => item.id === currentPage)?.label}</h1>
            <p className="text-blue-100 text-xs mt-1">
              {currentPage === 'prediction' && 'Classifiez les images en temps réel avec nos modèles pré-entraînés'}
              {currentPage === 'performance' && 'Analysez la performance des modèles'}
              {currentPage === 'about' && 'Informations sur la plateforme'}
            </p>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 px-8 py-8 overflow-auto">
          {currentPage === 'prediction' && <PredictionPanel metadata={metadata} />}
          {currentPage === 'performance' && <PerformancePanel metadata={metadata} />}
          {currentPage === 'about' && (
            <div className="space-y-8">
              {/* Models Comparison */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Comparaison des modèles</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="card bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">CNN Scratch</h3>
                    <div className="space-y-3 text-sm text-gray-700">
                      <div className="flex justify-between"><span>Accuracy:</span><span className="font-semibold">15.2%</span></div>
                      <div className="flex justify-between"><span>Type:</span><span className="font-semibold">Custom</span></div>
                      <div className="flex justify-between"><span>Taille:</span><span className="font-semibold">Baseline</span></div>
                      <p className="text-xs text-gray-600 mt-4 pt-4 border-t border-red-200">Modèle de référence développé à partir de zéro pour établir une baseline de performance.</p>
                    </div>
                  </div>
                  <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">ResNet50</h3>
                    <div className="space-y-3 text-sm text-gray-700">
                      <div className="flex justify-between"><span>Accuracy:</span><span className="font-semibold">77.4%</span></div>
                      <div className="flex justify-between"><span>Type:</span><span className="font-semibold">Transfer Learning</span></div>
                      <div className="flex justify-between"><span>Taille:</span><span className="font-semibold">179 MB</span></div>
                      <p className="text-xs text-gray-600 mt-4 pt-4 border-t border-blue-200">Architecture profonde pré-entraînée sur ImageNet. Équilibre excellent entre performance et taille.</p>
                    </div>
                  </div>
                  <div className="card bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
                    <div className="inline-block bg-green-200 text-green-800 text-xs font-bold px-3 py-1 rounded-full mb-3">RECOMMANDÉ</div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">EfficientNetB0</h3>
                    <div className="space-y-3 text-sm text-gray-700">
                      <div className="flex justify-between"><span>Accuracy:</span><span className="font-semibold">79.4%</span></div>
                      <div className="flex justify-between"><span>Type:</span><span className="font-semibold">Transfer Learning</span></div>
                      <div className="flex justify-between"><span>Taille:</span><span className="font-semibold">37.4 MB</span></div>
                      <p className="text-xs text-gray-600 mt-4 pt-4 border-t border-green-200">Modèle optimal: meilleure accuracy avec le plus petit footprint. Idéal pour la production.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Stack - Frontend */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Stack technique - Frontend</h2>
                <div className="card">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div className="flex flex-col items-center text-center">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" alt="React" className="h-16 w-16 object-contain mb-3"/>
                      <h4 className="font-semibold text-gray-800 text-sm">React 18</h4>
                      <p className="text-xs text-gray-600 mt-1">UI Library</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <img src="https://cdn.worldvectorlogo.com/logos/typescript.svg" alt="TypeScript" className="h-16 w-16 object-contain mb-3"/>
                      <h4 className="font-semibold text-gray-800 text-sm">TypeScript</h4>
                      <p className="text-xs text-gray-600 mt-1">Langage</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <img src="https://cdn.worldvectorlogo.com/logos/tailwind-css-2.svg" alt="Tailwind" className="h-16 w-16 object-contain mb-3"/>
                      <h4 className="font-semibold text-gray-800 text-sm">Tailwind CSS</h4>
                      <p className="text-xs text-gray-600 mt-1">Styling</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <img src="https://cdn.worldvectorlogo.com/logos/vitejs.svg" alt="Vite" className="h-16 w-16 object-contain mb-3"/>
                      <h4 className="font-semibold text-gray-800 text-sm">Vite 5.4</h4>
                      <p className="text-xs text-gray-600 mt-1">Build Tool</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/axios.svg" alt="Axios" className="h-16 w-16 object-contain mb-3"/>
                      <h4 className="font-semibold text-gray-800 text-sm">Axios</h4>
                      <p className="text-xs text-gray-600 mt-1">HTTP Client</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Stack - Backend */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Stack technique - Backend</h2>
                <div className="card">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div className="flex flex-col items-center text-center">
                      <img src="https://cdn.worldvectorlogo.com/logos/fastapi-1.svg" alt="FastAPI" className="h-16 w-16 object-contain mb-3"/>
                      <h4 className="font-semibold text-gray-800 text-sm">FastAPI</h4>
                      <p className="text-xs text-gray-600 mt-1">Framework Web</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/2/2d/Tensorflow_logo.svg" alt="TensorFlow" className="h-16 w-16 object-contain mb-3"/>
                      <h4 className="font-semibold text-gray-800 text-sm">TensorFlow 2.x</h4>
                      <p className="text-xs text-gray-600 mt-1">Deep Learning</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/a/ae/Keras_logo.svg" alt="Keras" className="h-16 w-16 object-contain mb-3"/>
                      <h4 className="font-semibold text-gray-800 text-sm">Keras 3</h4>
                      <p className="text-xs text-gray-600 mt-1">High-level API</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/3/32/OpenCV_Logo_with_text_svg_version.svg" alt="OpenCV" className="h-16 w-16 object-contain mb-3"/>
                      <h4 className="font-semibold text-gray-800 text-sm">OpenCV 4</h4>
                      <p className="text-xs text-gray-600 mt-1">Image Processing</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg" alt="Python" className="h-16 w-16 object-contain mb-3"/>
                      <h4 className="font-semibold text-gray-800 text-sm">Python 3.11</h4>
                      <p className="text-xs text-gray-600 mt-1">Runtime</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dataset Information */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Dataset</h2>
                <div className="card bg-blue-50 border-l-4 border-blue-500">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">1,050</div>
                      <div className="text-xs text-gray-600">Images totales</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">7</div>
                      <div className="text-xs text-gray-600">Catégories</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">96x96</div>
                      <div className="text-xs text-gray-600">Résolution pixels</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">Flipkart</div>
                      <div className="text-xs text-gray-600">Source</div>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">Dataset curé manuellement contenant 1,050 images de produits Flipkart répartis en 7 catégories. Chaque image a été normalisée à 96x96 pixels et augmentée lors de l'entraînement pour améliorer la généralisation des modèles.</p>
                </div>
              </div>

              {/* Features */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Fonctionnalités principales</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card bg-gray-50 border-l-4 border-blue-500">
                    <h3 className="font-semibold text-gray-800 mb-2">Classification temps réel</h3>
                    <p className="text-sm text-gray-600">Upload une image et obtenez une prédiction en moins de 50ms</p>
                  </div>
                  <div className="card bg-gray-50 border-l-4 border-blue-500">
                    <h3 className="font-semibold text-gray-800 mb-2">Comparaison de modèles</h3>
                    <p className="text-sm text-gray-600">Testez plusieurs architectures sur la même image</p>
                  </div>
                  <div className="card bg-gray-50 border-l-4 border-blue-500">
                    <h3 className="font-semibold text-gray-800 mb-2">Analyse de performance</h3>
                    <p className="text-sm text-gray-600">Visualisez les métriques, matrices de confusion et courbes</p>
                  </div>
                  <div className="card bg-gray-50 border-l-4 border-blue-500">
                    <h3 className="font-semibold text-gray-800 mb-2">Interface responsive</h3>
                    <p className="text-sm text-gray-600">Fonctionne sur desktop, tablette et mobile</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="bg-gray-800 text-gray-400 text-center py-6 border-t border-gray-700">
          <p className="text-sm">FlipClass © 2026 | Deep Learning Classification Platform</p>
        </footer>
      </main>
    </div>
  )
}

export default App
