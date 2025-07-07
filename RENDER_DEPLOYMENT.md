# Render Deployment Guide

## Fix for Black Page Issue

The black page issue on Render is typically caused by missing environment variables and build configuration. Follow these steps:

## Required Environment Variables

In your Render dashboard, add these environment variables:

```
NODE_ENV=production
VITE_SUPABASE_URL=https://uahxenisnppufpswupnz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHhlbmlzbnBwdWZwc3d1cG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NzE5MzgsImV4cCI6MjA2NzE0NzkzOH0.2Ojgzc6b...
```

## Build Configuration

### Build Command:
```bash
npm install && npm run build
```

### Start Command:
```bash
npm start
```

## Render Service Settings

1. **Environment**: Node
2. **Branch**: main (or your default branch)
3. **Root Directory**: `.` (leave empty if deploying from root)
4. **Build Command**: `npm install && npm run build`
5. **Start Command**: `npm start`

## Troubleshooting Steps

1. **Check Build Logs**: Look for any build failures in Render's build logs
2. **Verify Environment Variables**: Ensure all required env vars are set
3. **Check Console**: Open browser dev tools and check for JavaScript errors
4. **Force Deploy**: Try a manual redeploy from Render dashboard

## Manual Deployment Steps

1. **In Render Dashboard:**
   - Create new Web Service
   - Connect your GitHub repository
   - Set build command: `npm install && npm run build`
   - Set start command: `npm start`

2. **Add Environment Variables:**
   ```
   NODE_ENV=production
   VITE_SUPABASE_URL=https://uahxenisnppufpswupnz.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHhlbmlzbnBwdWZwc3d1cG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NzE5MzgsImV4cCI6MjA2NzE0NzkzOH0.2Ojgzc6b...
   ```

3. **Deploy**

## Recent Fixes Applied

✅ **HTML Template**: Added proper title, meta tags, and loading state
✅ **Server Configuration**: Improved production environment detection
✅ **Loading State**: Added visible loading spinner to prevent blank page
✅ **Environment Detection**: Better NODE_ENV handling
✅ **Removed Replit Scripts**: Cleaned up development-only scripts

## Expected Results

- The page should now show a loading spinner instead of black screen
- Environment variables are properly configured
- Build process should complete successfully
- App should load with proper styling and functionality

## Additional Fixes Applied

✅ **Dynamic Import Issues**: Fixed all dynamic imports that were causing build warnings and loading issues
✅ **Better Vite Config**: Improved build configuration with proper chunk splitting and asset handling  
✅ **Enhanced Server**: Better static file serving with proper MIME types and CORS headers
✅ **Import Consistency**: All imports are now static for better build optimization

## If Still Having Issues

### 1. Check Browser Console
Open DevTools (F12) and check for specific errors:
- `Failed to load module` - indicates import/asset issues
- `Network errors` - indicates server connectivity issues  
- `SyntaxError` - indicates JavaScript parsing issues

### 2. Verify Build Logs in Render
Look for these specific errors in Render build logs:
- `Module not found` errors
- TypeScript compilation errors
- Missing environment variables warnings

### 3. Test Build Command Locally
Run this to test if build works locally:
```bash
npm install
npm run build
```

### 4. Force Fresh Deploy
In Render dashboard:
1. Go to your service
2. Click "Manual Deploy" 
3. Select "Clear build cache" 
4. Deploy from latest commit

### 5. Check Environment Variables
Ensure these are set in Render:
- `NODE_ENV=production`
- `VITE_SUPABASE_URL=https://uahxenisnppufpswupnz.supabase.co`  
- `VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 6. Debugging Steps
If page is still black:
1. Check if `/assets/index-[hash].js` loads (Network tab)
2. Look for CORS errors in console
3. Verify index.html is being served correctly
4. Test if app works with JavaScript disabled (should show loading spinner)

### 7. Alternative Quick Fix
If all else fails, try this simple test:
1. Add `console.log('APP STARTING')` to the very top of `client/src/main.tsx`
2. Deploy and check if this log appears in browser console
3. This will tell us if the JavaScript is loading at all