import express from "express";
import activitiesRouter from "./routes/activities.js";
import goalsRouter from "./routes/goals.js";
import mongoose from "mongoose";
import activityRecordsRouter from "./routes/activityRecords.js";
import cookieParser from "cookie-parser";
import { attachUser } from "./middleware/attachUser.js";
import authRouter from "./routes/auth.js";
import homeRouter from "./routes/home.js";

const app = express();
app.disable("x-powered-by");
const PORT = process.env.PORT || 3000;

const SESSION_SECRET = process.env.SESSION_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;

if (!SESSION_SECRET || !MONGODB_URI) {
  throw new Error("Missing required environment variables.");
}

try {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
} catch (error) {
  console.error(
    "Could not connect to MongoDB. Start the dev container's database " +
      "with `dc-up mongo`, or set MONGODB_URI to another instance.",
  );
  console.error(error.message);
  process.exit(1);
}

//livereload dev tool - Doesn't reload .css file changes: npm start for css
import path from "node:path";
import { fileURLToPath } from "node:url";
const filename = fileURLToPath(import.meta.url);
const dir = path.dirname(filename);

const isProduction = process.env.NODE_ENV === "production";

if (!isProduction) {
  const livereload = await import("livereload");
  const connectLReload = await import("connect-livereload");

  const lReloadServer = livereload.default.createServer({
    host: "0.0.0.0",
    port: 35730,
  });

  lReloadServer.watch([path.join(dir, "public"), path.join(dir, "views")]);

  lReloadServer.server.once("connection", () => {
    setTimeout(() => {
      lReloadServer.refresh("/");
    }, 100);
  });

  app.use(connectLReload.default({ port: 35730 }));
}

app.set("view engine", "ejs");
app.set("views", "views");

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Domain-Specific Page
app.get("/dashboard", (req, res) => {
  res.redirect("/");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(cookieParser(SESSION_SECRET));
app.use(attachUser);

app.use(authRouter);
app.use("/", homeRouter);
app.use("/activities", activitiesRouter);
app.use("/activities", activityRecordsRouter);
app.use("/goals", goalsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Page not found." });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    res.status(400).json({ error: "Malformed JSON request body." });
    return;
  }
  res.status(500).json({ error: "Something went wrong." });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
