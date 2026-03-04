import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { CopilotChat } from './copilot/CopilotChat';
import { AnalyticsModal } from './copilot/AnalyticsModal';

function App() {
  const [count, setCount] = useState(0)
  const [showCopilot, setShowCopilot] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React + Copilot</h1>
      <div className="card flex gap-4 justify-center">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <button 
           onClick={() => setShowCopilot(!showCopilot)}
           className="bg-indigo-600 text-white hover:bg-indigo-700 transition"
        >
          {showCopilot ? 'Hide DB Copilot' : 'Open DB Copilot'}
        </button>
        <button 
           onClick={() => setShowAnalytics(true)}
           className="bg-teal-600 text-white hover:bg-teal-700 transition"
        >
          View Analytics
        </button>
      </div>

      {showCopilot && <CopilotChat onClose={() => setShowCopilot(false)} />}
      {showAnalytics && <AnalyticsModal onClose={() => setShowAnalytics(false)} />}
      
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
