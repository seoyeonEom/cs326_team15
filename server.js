import express from "express";
import activitiesRouter from "./routes/activities.js";
import goalsRouter from "./routes/goals.js";
import mongoose from "mongoose";
import activityRecordsRouter from "./routes/activityRecords.js";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://dev:devpassword@mongo:27017/devdb?authSource=admin";

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

const app = express();
app.disable("x-powered-by");
const PORT = process.env.PORT || 3000;

//livereload dev tool
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
    port: 35729,
  });

  lReloadServer.watch([path.join(dir, "public"), path.join(dir, "views")]);

  lReloadServer.server.once("connection", () => {
    setTimeout(() => {
      lReloadServer.refresh("/");
    }, 100);
  });

  app.use(connectLReload.default({ port: 35729 }));
}

app.set("view engine", "ejs");
app.set("views", "views");

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Home Page
app.get("/", (req, res) => {
  res.send("Welcome to our Carbon Footprint Tracker!");
});

// Domain-Specific Page
app.get("/dashboard", (req, res) => {
  res.send(`
    <h1>Carbon Footprint Dashboard</h1>
    <p>Track your daily carbon footprint and monitor your environmental impact<p>
    <p>View your carbon intensity, daily goals, and progress over time</p>
    <p><a href="/activities">Transportation Activities</a></p>
  `);
});

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
