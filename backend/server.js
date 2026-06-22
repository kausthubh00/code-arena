const express = require("express");
const cors = require("cors");
const { Queue } = require("bullmq");
const IORedis = require("ioredis");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

// 1. Connect to our Dockerized Redis instance
const redisConnection = new IORedis({ maxRetriesPerRequest: null });

// 2. Initialize the submission queue
const submissionQueue = new Queue("codeSubmissions", { connection: redisConnection });

app.post("/submit", async (req, res) => {
  const { code } = req.body;

  try {
    // 3. Generate a unique job ID and add it to the Redis queue
    const jobId = uuidv4();
    const job = await submissionQueue.add("compileAndRun", { code, jobId }, { jobId });
    
    // 4. Instantly reply to the frontend
    res.json({ status: "Queued", jobId: job.id });
  } catch (error) {
    res.status(500).json({ status: "Error", message: error.message });
  }
});
// NEW: Safer Status Check Endpoint
app.get("/status/:id", async (req, res) => {
  try {
    const job = await submissionQueue.getJob(req.params.id);
    if (!job) return res.status(404).json({ status: "Error", output: "Job not found in queue" });

    const state = await job.getState();
    
    if (state === "completed") {
      // Safely extract the return value, providing fallbacks if it's missing
      const finalStatus = job.returnvalue?.status || "Success";
      const finalOutput = job.returnvalue?.output || "Execution finished, but output was empty.";
      
      return res.json({ status: finalStatus, output: finalOutput });
    } else if (state === "failed") {
      return res.json({ status: "Error", output: job.failedReason || "Worker process crashed" });
    } else {
      // Still waiting in line or currently executing
      return res.json({ status: "Queued" });
    }
  } catch (error) {
    res.status(500).json({ status: "Error", output: error.message });
  }
});

app.listen(8081, () => console.log("API Server acting as Producer on port 8081"));