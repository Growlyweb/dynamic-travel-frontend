import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './app/App'
import Providers from './app/providers'
import { configProblem } from './app/config'
import './styles/index.css'

const root = ReactDOM.createRoot(document.getElementById('root'))

if (configProblem) {
  root.render(
    <div style={{ maxWidth: 560, margin: '15vh auto', padding: 24, fontFamily: 'system-ui, sans-serif', lineHeight: 1.5 }}>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>The dashboard is not set up</h1>
      <p>{configProblem}</p>
    </div>,
  )
} else {
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <Providers>
          <App />
        </Providers>
      </BrowserRouter>
    </React.StrictMode>,
  )
}
