// This file's ONLY job is to load .env before anything else does.
// In ESM, every static `import` in server.js is fully evaluated before
// server.js's own body (including a `dotenv.config()` call placed there)
// ever runs — even if that call is written above the other imports.
// authController.js and authMiddleware.js read process.env.JWT_SECRET
// at module top-level, so this has to be the FIRST import in server.js,
// in its own file, or those reads happen before .env is loaded.
import dotenv from 'dotenv';
dotenv.config();
