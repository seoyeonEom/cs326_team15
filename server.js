import express from "express";
import activitiesRouter from "./routes/activities.js";
import goalsRouter from "./routes/goals.js";

const app = express();
const PORT = process.env.PORT || 3000;

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
