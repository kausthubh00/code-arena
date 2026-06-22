const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const redisConnection = new IORedis({ maxRetriesPerRequest: null });

console.log("Worker Service is online and listening for jobs in Redis...");

// The Worker automatically pulls jobs from the "codeSubmissions" queue
const worker = new Worker("codeSubmissions", async (job) => {
  console.log(`\n[Queue] Processing Job ID: ${job.id}`);
  const { code, jobId } = job.data;
  
  const filePath = `./${jobId}.cpp`;
  // The bulletproof Windows path fix!
  const absolutePath = path.resolve(filePath).replace(/\\/g, "/");
  fs.writeFileSync(filePath, code);

  const dockerCmd = `docker run --rm --cpus="0.5" --memory="256m" --mount type=bind,source="${absolutePath}",target=/usr/src/app/main.cpp cpp-sandbox sh -c "g++ main.cpp && ./a.out"`;

  return new Promise((resolve, reject) => {
    exec(dockerCmd, (error, stdout, stderr) => {
      // Clean up the file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      if (error) {
        console.log(`[Queue] Job ${job.id} Failed!`);
        resolve({ status: "Error", output: stderr || error.message });
      } else {
        console.log(`[Queue] Job ${job.id} Success!`);
        resolve({ status: "Success", output: stdout });
      }
    });
  });
}, { connection: redisConnection });