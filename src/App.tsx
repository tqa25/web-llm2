import React, { useState, useEffect } from "react";
import { CreateWebWorkerMLCEngine, prebuiltAppConfig } from "https://esm.run/@mlc-ai/web-llm";
import * as webllm from "@mlc-ai/web-llm";

export default function App() {
  const [engine, setEngine] = useState<webllm.MLCEngineInterface | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string>("Chưa tải model");
  const [selectedModel, setSelectedModel] = useState("Llama-3-8B-Instruct-q4f32_1-MLC");

  const models = [
    "Llama-3-8B-Instruct-q4f32_1-MLC",
    "Phi-3-mini-4k-instruct-q4f16_1-MLC",
    "Gemma-2-2B-it-q4f32_1-MLC"
  ];

  // ===========================
  // 🔹 Khởi tạo WebLLM Engine
  // ===========================
  useEffect(() => {
    const init = async () => {
      try {
        console.log("🚀 Khởi tạo WebLLM...");
        setProgress("⏳ Đang tải model...");

        const worker = new Worker(new URL("./webllm.worker.ts", import.meta.url), { type: "module" });

        const newEngine = await CreateWebWorkerMLCEngine(worker, selectedModel, {
          appConfig: prebuiltAppConfig,
          initProgressCallback: (report) => {
            const percent = Math.floor(report.progress * 100);
            setProgress(`${percent}% - ${report.text}`);
          },
        });

        console.log("✅ Model đã sẵn sàng:", selectedModel);
        setEngine(newEngine);
        setProgress("✅ Model đã sẵn sàng!");
      } catch (err) {
        console.error("❌ Lỗi khi khởi tạo model:", err);
        setProgress("❌ Lỗi khi tải model!");
      }
    };

    init();
  }, [selectedModel]);

  // ===========================
  // 🔹 Gửi tin nhắn
  // ===========================
  const sendMessage = async () => {
    if (!engine || !input.trim()) return;

    const newMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setLoading(true);

    try {
      const reply = await engine.chat.completions.create({
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          ...messages,
          newMsg,
        ],
      });

      const content = reply.choices[0].message.content;
      setMessages((prev) => [...prev, { role: "assistant", content }]);
    } catch (err) {
      console.error("❌ Lỗi khi gửi tin nhắn:", err);
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // 🔹 Giao diện
  // ===========================
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "600px", margin: "auto" }}>
      <h2>🤖 WebLLM Chat Demo</h2>

      <div style={{ marginBottom: "10px" }}>
        <label>Chọn model: </label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          style={{ padding: "5px", marginLeft: "10px" }}
        >
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "10px", color: "gray" }}>Tiến trình: {progress}</div>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "10px",
          height: "400px",
          overflowY: "auto",
          marginBottom: "10px",
          background: "#fafafa",
        }}
      >
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: "8px" }}>
            <b>{m.role === "user" ? "🧑" : "🤖"}:</b> {m.content}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flex: 1, padding: "8px" }}
          placeholder="Nhập tin nhắn..."
        />
        <button onClick={sendMessage} disabled={!engine || loading}>
          {loading ? "Đang trả lời..." : "Gửi"}
        </button>
      </div>
    </div>
  );
}
