const express = require("express");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const kill = require("tree-kill");

const app = express();
const PORT = 80;

// Handle root route
app.get("/", (req, res) => {
  const userAgent = req.headers["user-agent"];
  const isCurl = userAgent && userAgent.startsWith("curl");

  if (!isCurl) {
    // Redirect to GitHub if not using curl
    res.redirect(302, "https://github.com/YourGitHubRepo/ascii-art.git");
    return;
  }

  const bannerMessage = `
\x1b[1;32mWelcome to the ASCII Art Server!\x1b[0m
Use the following command to enjoy sound effects:
\x1b[1;33mcurl -sN http://yourserver.com | bash\x1b[0m
    `;

  // Spawn a child process to display ASCII art
  const artFile = path.join(__dirname, "art.txt");
  if (!fs.existsSync(artFile)) {
    res.write("ASCII art file not found.");
    res.end();
    return;
  }

  const displayProcess = spawn("cat", [artFile]);

  res.write(bannerMessage + "\n\n");

  displayProcess.stdout.on("data", (data) => {
    res.write(data.toString());
  });

  displayProcess.stderr.on("data", (err) => {
    console.error("Error:", err.toString());
  });

  // Clean up when the connection is closed
  res.on("close", () => {
    if (!displayProcess.killed) {
      kill(displayProcess.pid);
    }
  });

  // End response when the process exits
  displayProcess.on("exit", () => {
    res.end();
  });
});

// Serve Python script
app.get("/win.py", (req, res) => {
  const scriptPath = path.join(__dirname, "win.py");
  if (fs.existsSync(scriptPath)) {
    const scriptContent = fs
      .readFileSync(scriptPath, "utf-8")
      .replace(/\n/g, "\r\n");
    res.write(scriptContent);
  } else {
    res.write("Python script not found.");
  }
  res.end();
});

// Serve ASCII art file
app.get("/art.txt", (req, res) => {
  const artPath = path.join(__dirname, "art.txt");
  if (fs.existsSync(artPath)) {
    res.sendFile(artPath);
  } else {
    res.status(404).send("Art file not found.");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`ASCII Art Server is running on http://localhost:${PORT}`);
});
