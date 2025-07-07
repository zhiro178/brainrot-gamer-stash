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

## If Still Having Issues

1. Check browser console for specific error messages
2. Verify Supabase credentials are correct
3. Check Render build logs for any specific errors
4. Try a fresh deployment after clearing build cache