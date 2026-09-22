import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

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
  `);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
