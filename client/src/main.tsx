import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// COMPREHENSIVE DEBUGGING FOR RENDER DEPLOYMENT
console.log('=== 592 STOCK DEBUG START ===');
console.log('1. Main.tsx is loading...');
console.log('2. Environment:', {
  NODE_ENV: (import.meta as any).env?.MODE || 'unknown',
  SUPABASE_URL: (import.meta as any).env?.VITE_SUPABASE_URL || 'missing',
  HAS_SUPABASE_KEY: !!((import.meta as any).env?.VITE_SUPABASE_ANON_KEY),
  BASE_URL: (import.meta as any).env?.BASE_URL || 'unknown',
  DEV: (import.meta as any).env?.DEV,
  PROD: (import.meta as any).env?.PROD
});

// Test if document and basic DOM is available
console.log('3. Document ready state:', document.readyState);
console.log('4. Root element exists:', !!document.getElementById("root"));

// Clear the loading state first
const rootElement = document.getElementById("root");
if (rootElement) {
  console.log('5. Root element found, clearing loading content...');
  // Clear loading content
  rootElement.innerHTML = '';
} else {
  console.error('5. CRITICAL: Root element not found!');
  document.body.innerHTML = `
    <div style="background: red; color: white; padding: 20px; text-align: center;">
      <h1>CRITICAL ERROR: Root element not found!</h1>
      <p>The #root div is missing from the HTML</p>
    </div>
  `;
}

try {
  console.log('6. Creating React root...');
  const root = createRoot(rootElement!);
  console.log('7. Root created successfully, rendering App...');
  
  // Test if App component loads
  console.log('8. App component:', typeof App);
  root.render(<App />);
  console.log('9. ✅ App rendered successfully!');
  console.log('=== 592 STOCK DEBUG END ===');
} catch (error) {
  console.error('6-9. ❌ CRITICAL ERROR in main.tsx:', error);
  console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
  
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
          background: rgba(239, 68, 68, 0.1);
          border: 2px solid rgba(239, 68, 68, 0.5);
          border-radius: 12px;
          padding: 32px;
          max-width: 600px;
          text-align: center;
        ">
          <h1 style="color: #ef4444; margin: 0 0 16px 0; font-size: 24px;">
            592 Stock - Critical Loading Error
          </h1>
          <p style="margin: 0 0 16px 0; color: #e2e8f0;">
            The application failed to start. This indicates a fundamental issue with the build or environment.
          </p>
          <div style="background: #1a1b2e; padding: 16px; border-radius: 8px; margin: 16px 0; text-align: left;">
            <h3 style="color: #8b5cf6; margin: 0 0 8px 0; font-size: 16px;">Error Details:</h3>
            <pre style="
              color: #ef4444;
              font-size: 12px;
              overflow: auto;
              white-space: pre-wrap;
              margin: 0;
            ">${error}</pre>
          </div>
          <div style="margin-top: 20px;">
            <button 
              onclick="console.log('Reload button clicked'); window.location.reload();" 
              style="
                background: linear-gradient(135deg, #8b5cf6, #a855f7);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 14px;
                cursor: pointer;
                margin-right: 12px;
              "
            >
              Reload Page
            </button>
            <button 
              onclick="console.log('Debug info:', window.location, navigator.userAgent); alert('Check browser console for debug info');" 
              style="
                background: rgba(139, 92, 246, 0.2);
                color: #8b5cf6;
                border: 1px solid #8b5cf6;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 14px;
                cursor: pointer;
              "
            >
              Debug Info
            </button>
          </div>
        </div>
      </div>
    `;
  } else {
    // Last resort if even root element is missing
    document.body.innerHTML = `
      <div style="background: #000; color: #fff; padding: 20px; text-align: center; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
        <div>
          <h1 style="color: red;">FATAL ERROR</h1>
          <p>Both React and root element failed to load</p>
          <pre style="color: yellow; text-align: left; background: #222; padding: 10px; border-radius: 5px;">${error}</pre>
          <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 10px; background: blue; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Reload
          </button>
        </div>
      </div>
    `;
  }
}

// Additional debugging - check if this script even runs completely
setTimeout(() => {
  console.log('10. Script execution completed - if you see this, the JS file loaded successfully');
}, 100);
