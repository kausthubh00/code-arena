# Code Arena: Distributed Remote Code Execution Engine

A horizontally scalable, highly concurrent remote code execution (RCE) environment. This system allows users to submit C++ code via a React client, buffers requests through an in-memory message queue, and safely executes the untrusted code within ephemeral, hardware-constrained Docker containers.

## 🚀 System Architecture

The project implements a decoupled **Producer-Consumer** microservices architecture to ensure fault tolerance and prevent server starvation under heavy load.

```text
[ Next.js Client ] 
       │  (1. HTTP POST Code)
       ▼
[ Node.js API Server (Producer) ]
       │  (2. Enqueue Job Ticket)
       ▼
[ Redis DB (BullMQ Message Queue) ] ◄─── (3. Acts as Concurrency Buffer)
       │
       ▼  (4. Polls & Consumes Ticket)
[ Node.js Worker (Consumer) ]
       │  (5. Spawns Sandboxed Mount)
       ▼
[ Docker Container (Linux Isolation) ] ───► Compile (G++) ───► Execute Binary ───► Return Output
```

## 🛠️ Tech Stack

* **Frontend:** Next.js, React, Tailwind CSS, Monaco Editor
* **Backend API (Producer):** Node.js, Express.js
* **Message Queue:** Redis, BullMQ
* **Worker Engine (Consumer):** Node.js, Child Processes
* **Containerization & Sandboxing:** Docker, Linux (Alpine/Ubuntu)
* **Target Language:** C++ (GCC/G++)

## ✨ Key Technical Features

* **Asynchronous Task Queueing:** Utilizes Redis and BullMQ to act as a shock absorber during traffic spikes. The API instantly returns a tracking Ticket ID rather than holding the HTTP request open.
* **Sandboxed Execution:** Untrusted user code is executed inside isolated, single-use Docker containers. 
* **Hardware Constraints:** Docker instances are strictly throttled (`--cpus="0.5" --memory="256m"`) to prevent memory leaks or malicious system overloads.
* **Client-Side Polling:** The React frontend implements an optimized polling mechanism to asynchronously fetch job states without locking the UI thread.

## 💻 Local Setup & Installation

**Prerequisites:** You must have [Node.js](https://nodejs.org/) and [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

**1. Clone the repository:**
```bash
git clone https://github.com/kausthubh00/code-arena.git
cd code-arena
```

**2. Start the Redis Queue:**
```bash
docker run -d --name arena-redis -p 6379:6379 redis
```

**3. Install dependencies and start the backend Producer:**
```bash
cd backend
npm install
npm run dev
```

**4. Start the background Worker (in a new terminal):**
```bash
cd backend
node worker.js
```

**5. Install dependencies and start the Next.js Client (in a new terminal):**
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:3000` to interact with the code editor.

## 🔮 Future Roadmap (V2)

* **Execution Timeouts:** Implement strict 3-second container teardowns to neutralize infinite loops.
* **Multi-Language Support:** Dynamic base image routing to support Python, Java, and Go.
* **Persistent Storage:** Integrate PostgreSQL to store historical execution logs, compilation metrics, and user profiles.