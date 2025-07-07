import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('Main.tsx is loading...');

// Clear the loading state first
const rootElement = document.getElementById("root");
if (rootElement) {
  // Clear loading content
  rootElement.innerHTML = '';
}

try {
  const root = createRoot(rootElement!);
  console.log('Root created, rendering App...');
  root.render(<App />);
  console.log('App rendered successfully');
} catch (error) {
  console.error('Error rendering app:', error);
  
  // Show error with better styling that matches the app theme
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="
        min-height: 100vh;
        background: linear-gradient(135deg, #0a0b0f 0%, #1a1b2e 100%);
        color: #ffffff;
        font-family: system-ui, -apple-system, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      ">
        <div style="
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 12px;
          padding: 32px;
          max-width: 500px;
          text-align: center;
        ">
          <h1 style="color: #8b5cf6; margin: 0 0 16px 0; font-size: 24px;">
            592 Stock - Loading Error
          </h1>
          <p style="margin: 0 0 16px 0; color: #e2e8f0;">
            There was an error loading the application. Please refresh the page or check your internet connection.
          </p>
          <details style="text-align: left; margin-top: 16px;">
            <summary style="color: #8b5cf6; cursor: pointer; margin-bottom: 8px;">
              Technical Details
            </summary>
            <pre style="
              background: #1a1b2e;
              color: #ef4444;
              padding: 12px;
              border-radius: 8px;
              font-size: 12px;
              overflow: auto;
              white-space: pre-wrap;
            ">${error}</pre>
          </details>
          <button 
            onclick="window.location.reload()" 
            style="
              background: linear-gradient(135deg, #8b5cf6, #a855f7);
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 14px;
              cursor: pointer;
              margin-top: 16px;
            "
          >
            Reload Page
          </button>
        </div>
      </div>
    `;
  }
}
