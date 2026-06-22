"use client";
import { useState } from "react";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export default function CodeArena() {
  const [code, setCode] = useState(
    "#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << \"Hello from the Docker Sandbox!\" << endl;\n    return 0;\n}"
  );
  const [output, setOutput] = useState("Output will appear here...");

  const runCode = async () => {
    setOutput("Submitting job to queue...");
    try {
      const response = await fetch("http://localhost:8081/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (data.status === "Queued") {
        setOutput(`Job Queued! Ticket ID: ${data.jobId}\nWaiting for background worker...`);

        // Polling the backend for status
        const pollInterval = setInterval(async () => {
          const statusRes = await fetch(`http://localhost:8081/status/${data.jobId}`);
          const statusData = await statusRes.json();

          if (statusData.status === "Success" || statusData.status === "Error") {
            clearInterval(pollInterval);
            setOutput(statusData.output);
          }
        }, 1000);
      } else {
        setOutput(data.output || "Error connecting to queue.");
      }
    } catch (error) {
      setOutput("Fatal Error: Could not connect to backend.");
    }
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-white p-8 flex gap-4">
      <div className="w-1/2 flex flex-col gap-4">
        <h2 className="text-xl font-bold">Code Arena</h2>
        <div className="h-[60vh] rounded overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage="cpp"
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || "")}
          />
        </div>
        <button
          onClick={runCode}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-fit"
        >
          Run Code
        </button>
      </div>
      <div className="w-1/2 flex flex-col gap-4">
        <h2 className="text-xl font-bold">Console</h2>
        <pre className="bg-black p-4 rounded h-[60vh] overflow-auto whitespace-pre-wrap font-mono">
          {output}
        </pre>
      </div>
    </div>
  );
}