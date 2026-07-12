import { useState, useEffect, useCallback } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, BarChart, Bar } from 'recharts'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard' or 'insights'
  const [formData, setFormData] = useState({
    study_hours: 5,
    attendance_percentage: 80,
    previous_exam_score: 70,
    sleep_hours: 7,
    extracurricular_hours: 2
  })
  const [prediction, setPrediction] = useState(null)
  const [whatIfStudyHours, setWhatIfStudyHours] = useState(5)
  const [whatIfPrediction, setWhatIfPrediction] = useState(null)
  const [insightsData, setInsightsData] = useState(null)
  const [loading, setLoading] = useState(false)

  // Fetch insights on load
  useEffect(() => {
    fetchInsights()
  }, [])

  // Debounce function
  const debounce = (func, delay) => {
    let timeoutId
    return (...args) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(this, args), delay)
    }
  }

  const fetchInsights = async () => {
    try {
      const res = await fetch(`${API_BASE}/insights`)
      const data = await res.json()
      setInsightsData(data)
    } catch (err) {
      console.error('Failed to fetch insights:', err)
    }
  }

  const predict = useCallback(async (data) => {
    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      return await res.json()
    } catch (err) {
      console.error('Prediction failed:', err)
      return null
    }
  }, [])

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const result = await predict(formData)
    if (result) setPrediction(result)
    setLoading(false)
  }

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'range' ? parseFloat(value) : parseFloat(value) || 0
    }))
  }

  // Debounced what-if prediction
  const debouncedWhatIfPredict = useCallback(
    debounce(async (hours) => {
      const result = await predict({ ...formData, study_hours: hours })
      if (result) setWhatIfPrediction(result)
    }, 300),
    [formData, predict]
  )

  useEffect(() => {
    debouncedWhatIfPredict(whatIfStudyHours)
  }, [whatIfStudyHours, debouncedWhatIfPredict])

  // Initial prediction for what-if
  useEffect(() => {
    debouncedWhatIfPredict(whatIfStudyHours)
  }, [])

  // Regression line for scatter plot
  const getRegressionLine = () => {
    if (!insightsData) return []
    // Simple linear regression on study_hours vs marks
    const points = insightsData.dataset_points
    const n = points.length
    const sumX = points.reduce((sum, p) => sum + p.study_hours, 0)
    const sumY = points.reduce((sum, p) => sum + p.marks, 0)
    const sumXY = points.reduce((sum, p) => sum + p.study_hours * p.marks, 0)
    const sumX2 = points.reduce((sum, p) => sum + p.study_hours * p.study_hours, 0)
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    const minX = Math.min(...points.map(p => p.study_hours))
    const maxX = Math.max(...points.map(p => p.study_hours))
    return [
      { study_hours: minX, marks: slope * minX + intercept },
      { study_hours: maxX, marks: slope * maxX + intercept }
    ]
  }

  return (
    <div className="min-h-screen bg-bg-dark text-text-light">
      {/* Navbar */}
      <nav className="bg-bg-card border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Student Marks Predictor</h1>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full pulse-green"></div>
          <span className="text-sm text-text-muted">Model: Active</span>
        </div>
      </nav>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-6 py-3 font-medium transition-colors ${activeTab === 'dashboard' ? 'text-accent-cyan border-b-2 border-accent-cyan' : 'text-text-muted hover:text-white'}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-6 py-3 font-medium transition-colors ${activeTab === 'insights' ? 'text-accent-violet border-b-2 border-accent-violet' : 'text-text-muted hover:text-white'}`}
        >
          Model Insights
        </button>
      </div>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Input Form & Result */}
            <div className="space-y-6">
              {/* Input Form Card */}
              <div className="bg-bg-card rounded-xl p-6 border border-gray-700 shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-white">Enter Details</h2>
                <form onSubmit={handleFormSubmit} className="space-y-5">
                  {[
                    { name: 'study_hours', label: 'Study Hours', min: 0, max: 15, step: 0.5 },
                    { name: 'attendance_percentage', label: 'Attendance %', min: 0, max: 100, step: 1 },
                    { name: 'previous_exam_score', label: 'Previous Exam Score', min: 0, max: 100, step: 1 },
                    { name: 'sleep_hours', label: 'Sleep Hours', min: 0, max: 12, step: 0.5 },
                    { name: 'extracurricular_hours', label: 'Extracurricular Hours', min: 0, max: 10, step: 0.5 }
                  ].map((field) => (
                    <div key={field.name} className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-text-light">{field.label}</label>
                        <input
                          type="number"
                          name={field.name}
                          value={formData[field.name]}
                          onChange={handleInputChange}
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          className="w-20 bg-bg-dark border border-gray-600 rounded px-2 py-1 text-center font-mono text-accent-cyan"
                        />
                      </div>
                      <input
                        type="range"
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleInputChange}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-cyan"
                      />
                    </div>
                  ))}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-4 bg-gradient-to-r from-accent-cyan to-accent-violet text-white font-semibold py-3 rounded-lg hover:shadow-glow-cyan transition-all disabled:opacity-50"
                  >
                    {loading ? 'Predicting...' : 'Predict Marks'}
                  </button>
                </form>
              </div>

              {/* Result Card */}
              {prediction && (
                <div className="bg-bg-card rounded-xl p-6 border border-gray-700 shadow-lg text-center">
                  <h3 className="text-lg font-medium text-text-muted mb-2">Predicted Marks</h3>
                  <div className="text-6xl font-bold font-mono text-accent-cyan mb-2 drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">
                    {Math.round(prediction.predicted_marks * 10) / 10}
                  </div>
                  <div className="text-text-muted font-mono">
                    ± {Math.round(prediction.confidence_range * 10) / 10} marks
                  </div>
                </div>
              )}

              {/* What-If Card */}
              <div className="bg-bg-card rounded-xl p-6 border border-gray-700 shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-white">What-If Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-text-light">Study Hours</label>
                      <span className="font-mono text-accent-violet">{whatIfStudyHours}h</span>
                    </div>
                    <input
                      type="range"
                      value={whatIfStudyHours}
                      onChange={(e) => setWhatIfStudyHours(parseFloat(e.target.value))}
                      min={0}
                      max={15}
                      step={0.5}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-violet"
                    />
                  </div>
                  {whatIfPrediction && (
                    <div className="text-center pt-2">
                      <div className="text-3xl font-bold font-mono text-accent-violet transition-all duration-300">
                        {Math.round(whatIfPrediction.predicted_marks * 10) / 10}
                      </div>
                      <div className="text-text-muted text-sm">predicted marks</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Scatter Plot */}
            <div className="bg-bg-card rounded-xl p-6 border border-gray-700 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-white">Study Hours vs Marks</h3>
              {insightsData && (
                <ResponsiveContainer width="100%" height={500}>
                  <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      type="number"
                      dataKey="study_hours"
                      name="Study Hours"
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af' }}
                    />
                    <YAxis
                      type="number"
                      dataKey="marks"
                      name="Marks"
                      domain={[0, 100]}
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af' }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1e26', borderColor: '#374151', color: '#e5e7eb' }}
                      itemStyle={{ color: '#00f0ff' }}
                    />
                    <Scatter
                      name="Actual Data"
                      data={insightsData.dataset_points}
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                    <Line
                      name="Regression Line"
                      data={getRegressionLine()}
                      stroke="#00f0ff"
                      strokeWidth={2}
                      dot={false}
                    />
                    {prediction && (
                      <Scatter
                        name="Your Prediction"
                        data={[{ study_hours: formData.study_hours, marks: prediction.predicted_marks }]}
                        fill="#a855f7"
                        stroke="#ffffff"
                        strokeWidth={2}
                        r={8}
                        style={{ filter: 'drop-shadow(0 0 10px #a855f7)' }}
                      />
                    )}
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {activeTab === 'insights' && insightsData && (
          <div className="space-y-6">
            {/* Model Comparison Table */}
            <div className="bg-bg-card rounded-xl p-6 border border-gray-700 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-white">Model Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="py-3 px-4 text-text-muted">Model</th>
                      <th className="py-3 px-4 text-text-muted">R²</th>
                      <th className="py-3 px-4 text-text-muted">MAE</th>
                      <th className="py-3 px-4 text-text-muted">RMSE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const bestR2 = Math.max(...insightsData.model_comparison.map(m => m['R²']))
                      return insightsData.model_comparison.map((model, idx) => (
                        <tr
                          key={idx}
                          className={`border-b border-gray-700 transition-colors ${model['R²'] === bestR2 ? 'bg-accent-violet/20' : ''}`}
                        >
                          <td className="py-3 px-4 font-medium">
                            {model.Model}
                            {model['R²'] === bestR2 && (
                              <span className="ml-2 text-accent-violet text-sm">(Best)</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono">{(model['R²'] * 100).toFixed(1)}%</td>
                          <td className="py-3 px-4 font-mono">{model.MAE.toFixed(2)}</td>
                          <td className="py-3 px-4 font-mono">{model.RMSE.toFixed(2)}</td>
                        </tr>
                      ))
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Feature Importance */}
            <div className="bg-bg-card rounded-xl p-6 border border-gray-700 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-white">Feature Coefficients</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={Object.entries(insightsData.coefficients).map(([key, value]) => ({
                    feature: key.replace(/_/g, ' ').replace(/ /g, ' '),
                    importance: Math.abs(value)
                  })).sort((a, b) => b.importance - a.importance)}
                  margin={{ top: 20, right: 30, bottom: 40, left: 60 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                  <YAxis
                    dataKey="feature"
                    type="category"
                    width={180}
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af' }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1e26', borderColor: '#374151', color: '#e5e7eb' }}
                    cursor={{ fill: '#1f2937' }}
                  />
                  <Bar dataKey="importance" fill="#a855f7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
