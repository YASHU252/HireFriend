// This file's ONLY job is to load .env before anything else does.
//
// FIX: use import.meta.url to resolve the .env path relative to THIS file,
// not process.cwd(). Without this, `dotenv.config()` fails silently if you
// run node from any directory other than backend/ — and since authController
// and authMiddleware read JWT_SECRET at module top-level, the server would
// crash on startup with "JWT_SECRET environment variable is not set".
//
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });
