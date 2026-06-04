import { useMemo, useRef, useState } from "react";
import "./App.css";

const API_BASE_URL = "web-production-1a3eb.up.railway.app";

function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! Ask me anything about the knowledge base. I’ll answer using the provided dataset.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const chatHistory = useMemo(
    () =>
      messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role,
          content: m.content,
        })),
    [messages]
  );

  async function sendMessage(e) {
    e.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setError("");

    const userMessage = {
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          history: chatHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer || "I could not generate an answer.",
          sources: data.sources || [],
        },
      ]);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I could not reach the backend. Please check the API URL and deployment.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  return (
    <main className="page">
      <section className="chatShell">
        <header className="header">
          <div>
            <p className="eyebrow">Agentic RAG Chat</p>
            <h1>Knowledge Base Assistant</h1>
          </div>
          <div className="status">
            <span className="statusDot" />
            Live
          </div>
        </header>

        <section className="messages">
          {messages.map((message, index) => (
            <article
              key={index}
              className={`messageRow ${message.role === "user" ? "messageRowUser" : ""
                }`}
            >
              <div
                className={`bubble ${message.role === "user" ? "bubbleUser" : "bubbleAssistant"
                  }`}
              >
                <p>{message.content}</p>

                {message.sources?.length > 0 && (
                  <details className="sources">
                    <summary>Sources used</summary>
                    <ul>
                      {message.sources.slice(0, 3).map((source, i) => (
                        <li key={i}>
                          {source.question || "Knowledge base source"}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </article>
          ))}

          {isLoading && (
            <article className="messageRow">
              <div className="bubble bubbleAssistant typing">
                <span />
                <span />
                <span />
              </div>
            </article>
          )}
        </section>

        {error && <div className="error">{error}</div>}

        <form className="composer" onSubmit={sendMessage}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about the knowledge base..."
            disabled={isLoading}
          />
          <button disabled={isLoading || !input.trim()}>
            {isLoading ? "Thinking..." : "Send"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default App;
