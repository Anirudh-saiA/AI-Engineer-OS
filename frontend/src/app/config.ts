// Central configuration for frontend API endpoints
// NEXT_PUBLIC_API_URL should be set in Vercel environment variables
// Fallback points to the live Render backend for production
export const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "https://ai-engineer-os-backend.onrender.com");

