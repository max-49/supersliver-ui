// server.js
import express from "express";
import { SliverClient, ParseConfigFile } from "sliver-script";
const app = express();

// Create a helper function to connect to Sliver
async function connectToSliver() {
  try {
    const config = await ParseConfigFile("./webui_10.1.1.55.cfg");
    const client = new SliverClient(config);

    console.log(`Connecting to client ...`);
    await client.connect();

    const sessions = await client.sessions();
    console.log("Active sessions:", sessions);

    return sessions;
  } catch (err) {
    console.error("Error connecting to Sliver:", err);
    return [];
  }
}

// Define an API endpoint that fetches sessions
app.get("/api/sessions", async (req, res) => {
  const sessions = await connectToSliver();
  res.json(sessions);
});

// Root route
app.get("/", (req, res) => {
  res.send("Sliver Node.js server is running.");
});

// Start server
app.listen(3000, () => {
  console.log(`✅ Server running at http://localhost:3000`);
});