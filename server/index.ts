import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, createViteServer } from "./vite";
import { createServer } from "http";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      console.log(logLine);
    }
  });

  next();
});

// সার্ভার তৈরি এবং রাউট রেজিস্টার করা
// Vercel-এর জন্য httpServer গ্লোবাল স্কোপে থাকা জরুরি নয়, কিন্তু Replit-এর স্ট্রাকচার ঠিক রাখতে আমরা এভাবে রাখছি
const httpServer = createServer(app);
registerRoutes(app); // এখানে httpServer এর বদলে app পাঠানো হলো, কারণ Vercel app-কে হ্যান্ডেল করে

// Error Handling Middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  throw err;
});

// Vercel vs Local Development Logic
// এই অংশটি চেক করে: যদি এটি প্রোডাকশন (Vercel) না হয়, তবেই পোর্ট লিসেন করবে।
if (process.env.NODE_ENV !== "production") {
  (async () => {
    // শুধুমাত্র ডেভেলপমেন্ট মোডে Vite সেটআপ হবে
    if (app.get("env") === "development") {
      await setupVite(app, httpServer);
    } else {
      serveStatic(app);
    }

    const PORT = 5000;
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  })();
}

// Vercel-এর জন্য সবচেয়ে গুরুত্বপূর্ণ লাইন
export default app;
