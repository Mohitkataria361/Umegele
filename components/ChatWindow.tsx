"use client";

import { useEffect, useState, useCallback } from "react";
import { socket } from "@/lib/socket";
import WebRTCVideo from "@/components/WebRTCVideo";

type Message = {
  id: number;
  text: string;
  sender: "you" | "stranger";
};

export default function ChatWindow() {
  const [callSeconds, setCallSeconds] = useState(0);

  const [message, setMessage] = useState("");

  const [matched, setMatched] = useState(false);

  const [roomId, setRoomId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);

  const [isSearching, setIsSearching] = useState(true);

  const [strangerLeft, setStrangerLeft] = useState(false);

  const [reported, setReported] = useState(false);

  const [initiator, setInitiator] = useState(false);

  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected"
  >("connecting");

  // --------------------------------
  // AI SUGGESTIONS
  // --------------------------------

  const [suggestions, setSuggestions] = useState<string[]>([]);

  const [isGeneratingSuggestions, setIsGeneratingSuggestions] =
    useState(false);

  const [aiError, setAiError] = useState("");

  // --------------------------------
  // CONNECTION STATUS
  // --------------------------------

  const handleConnectionChange = useCallback(
    (connected: boolean) => {
      setConnectionStatus(
        connected ? "connected" : "connecting"
      );
    },
    []
  );

  // --------------------------------
  // CALL TIMER
  // --------------------------------

  useEffect(() => {
    if (!matched) {
      setCallSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setCallSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [matched]);

  // --------------------------------
  // SOCKET EVENTS
  // --------------------------------

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const handleWaiting = () => {
      console.log("Waiting for stranger...");

      setIsSearching(true);
      setMatched(false);
      setRoomId(null);
      setInitiator(false);
      setConnectionStatus("connecting");

      setSuggestions([]);
      setAiError("");
    };

    const handleMatched = ({
      roomId,
      initiator,
    }: {
      roomId: string;
      initiator: boolean;
    }) => {
      console.log("========== MATCHED ==========");
      console.log("Room:", roomId);
      console.log("Initiator:", initiator);

      setRoomId(roomId);
      setInitiator(initiator);

      setMatched(true);
      setIsSearching(false);

      setStrangerLeft(false);
      setReported(false);

      setConnectionStatus("connecting");

      setMessages([]);
      setMessage("");

      setSuggestions([]);
      setAiError("");
    };

    const handleReceiveMessage = ({
      message,
    }: {
      message: string;
    }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: message,
          sender: "stranger",
        },
      ]);

      // Remove old suggestions when stranger sends
      // a new message because we want fresh suggestions.
      setSuggestions([]);
      setAiError("");
    };

    const handleStrangerLeft = () => {
      console.log("Stranger disconnected");

      setMatched(false);
      setIsSearching(false);

      setRoomId(null);
      setInitiator(false);

      setConnectionStatus("connecting");

      setMessages([]);
      setMessage("");

      setSuggestions([]);
      setAiError("");

      setStrangerLeft(true);
    };

    const handleCallEnded = () => {
      console.log("Stranger ended the call");

      setMatched(false);
      setIsSearching(false);

      setRoomId(null);
      setInitiator(false);

      setConnectionStatus("connecting");

      setMessages([]);
      setMessage("");

      setSuggestions([]);
      setAiError("");

      setStrangerLeft(true);
    };

    socket.on("waiting", handleWaiting);

    socket.on("matched", handleMatched);

    socket.on(
      "receive-message",
      handleReceiveMessage
    );

    socket.on(
      "stranger-left",
      handleStrangerLeft
    );

    socket.on(
      "call-ended",
      handleCallEnded
    );

    socket.emit("find-stranger");

    return () => {
      socket.off("waiting", handleWaiting);

      socket.off("matched", handleMatched);

      socket.off(
        "receive-message",
        handleReceiveMessage
      );

      socket.off(
        "stranger-left",
        handleStrangerLeft
      );

      socket.off(
        "call-ended",
        handleCallEnded
      );
    };
  }, []);

  // --------------------------------
  // SEND MESSAGE
  // --------------------------------

  const sendMessage = () => {
    const text = message.trim();

    if (!text || !roomId || !matched) {
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        text,
        sender: "you",
      },
    ]);

    socket.emit("send-message", {
      roomId,
      message: text,
    });

    setMessage("");

    // Clear suggestions after sending
    setSuggestions([]);
    setAiError("");
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  // --------------------------------
  // AI SUGGESTIONS
  // --------------------------------

  const generateSuggestions = async () => {
    if (!matched || isGeneratingSuggestions) {
      return;
    }

    try {
      setIsGeneratingSuggestions(true);
      setAiError("");
      setSuggestions([]);

      const response = await fetch("/api/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to generate suggestions"
        );
      }

      if (
        !data.suggestions ||
        !Array.isArray(data.suggestions)
      ) {
        throw new Error(
          "Invalid suggestions received"
        );
      }

      setSuggestions(
        data.suggestions
          .filter(
            (suggestion: unknown): suggestion is string =>
              typeof suggestion === "string" &&
              suggestion.trim().length > 0
          )
          .slice(0, 3)
      );
    } catch (error) {
      console.error(
        "AI suggestion error:",
        error
      );

      setAiError(
        "Couldn't generate suggestions. Try again."
      );
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const selectSuggestion = (
    suggestion: string
  ) => {
    setMessage(suggestion);

    // Hide suggestions after selecting one
    setSuggestions([]);
    setAiError("");
  };

  // --------------------------------
  // NEXT STRANGER
  // --------------------------------

  const nextStranger = () => {
    console.log(
      "Finding next stranger..."
    );

    setMatched(false);
    setIsSearching(true);

    setStrangerLeft(false);

    setRoomId(null);
    setInitiator(false);

    setConnectionStatus("connecting");

    setMessages([]);
    setMessage("");

    setSuggestions([]);
    setAiError("");

    socket.emit("next-stranger");
  };

  // --------------------------------
  // END CALL
  // --------------------------------

  const endCall = () => {
    console.log("Ending call...");

    setMatched(false);
    setIsSearching(false);

    setStrangerLeft(true);

    setRoomId(null);
    setInitiator(false);

    setConnectionStatus("connecting");

    setMessages([]);
    setMessage("");

    setSuggestions([]);
    setAiError("");

    socket.emit("end-call");
  };

  // --------------------------------
  // REPORT
  // --------------------------------

  const reportStranger = () => {
    if (!matched) {
      return;
    }

    console.log(
      "Reported stranger:",
      roomId
    );

    setReported(true);
  };

  // --------------------------------
  // SEARCHING
  // --------------------------------

 if (isSearching) {
  return (
    <div className="w-full max-w-5xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl p-10">
      
      <div className="text-5xl mb-6">
       🔎
      </div>

      <h1 className="text-3xl font-bold mb-3">
        Finding a stranger...
      </h1>

      <p className="text-zinc-400">
        Please wait while we find someone for you.
      </p>

      <div className="flex gap-2 mt-6">
        <span className="h-2 w-2 bg-white rounded-full animate-bounce" />

        <span className="h-2 w-2 bg-white rounded-full animate-bounce [animation-delay:150ms]" />

        <span className="h-2 w-2 bg-white rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}
  // --------------------------------
  // CALL ENDED
  // --------------------------------

  if (strangerLeft) {
    return (
      <div className="w-full max-w-5xl h-[750px] bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col items-center justify-center shadow-2xl px-6 text-center">
        <div className="text-5xl mb-6">
          👋
        </div>

        <h1 className="text-3xl font-bold mb-3">
          Call ended
        </h1>

        <p className="text-zinc-400 mb-8">
          Your conversation has ended.
        </p>

        <button
          onClick={nextStranger}
          className="px-8 h-12 rounded-xl bg-white text-zinc-950 font-semibold hover:bg-zinc-200 transition"
        >
          Find New Stranger
        </button>
      </div>
    );
  }

  // --------------------------------
  // FORMAT TIME
  // --------------------------------

  function formatTime(
    callSeconds: number
  ) {
    const totalSeconds = Math.max(
      0,
      Math.floor(callSeconds)
    );

    const minutes = Math.floor(
      totalSeconds / 60
    );

    const seconds =
      totalSeconds % 60;

    return `${minutes}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  // --------------------------------
  // MAIN CHAT
  // --------------------------------

  return (
    <div className="w-full max-w-5xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl">

      {/* HEADER */}

      <div className="h-16 px-6 border-b border-zinc-800 flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div className="h-10 w-10 rounded-full bg-zinc-700 flex items-center justify-center">
            👤
          </div>

          <div>

            <h2 className="font-semibold">
              Stranger
            </h2>

            <div className="flex items-center gap-1.5">

              <span
                className={`h-2 w-2 rounded-full ${connectionStatus ===
                  "connected"
                  ? "bg-green-500"
                  : "bg-yellow-500 animate-pulse"
                  }`}
              />

              <span className="text-xs text-zinc-400">
                {connectionStatus ===
                  "connected"
                  ? `Connected (${formatTime(
                    callSeconds
                  )})`
                  : "Connecting..."}
              </span>

            </div>

          </div>

        </div>

        <button
          onClick={reportStranger}
          disabled={reported}
          className="text-sm text-zinc-400 hover:text-red-400 disabled:text-green-500 transition"
        >
          {reported
            ? "Reported ✓"
            : "Report"}
        </button>

      </div>

      {/* VIDEO */}

      <div className="p-4 border-b border-zinc-800">

        <WebRTCVideo
          initiator={initiator}
          matched={matched}
          onConnectionChange={
            handleConnectionChange
          }
        />

      </div>

      {/* CHAT */}

      <div className="h-52 overflow-y-auto px-6 py-4 space-y-3">

        {messages.length === 0 && (
          <div className="text-center text-zinc-600 text-sm mt-4">
            Say hello to your new stranger 👋
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "you"
              ? "justify-end"
              : "justify-start"
              }`}
          >

            <div
              className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${msg.sender === "you"
                ? "bg-white text-zinc-950 rounded-br-md"
                : "bg-zinc-800 text-white rounded-bl-md"
                }`}
            >
              {msg.text}
            </div>

          </div>
        ))}

      </div>

      {/* AI SUGGESTIONS */}

      {suggestions.length > 0 && (
        <div className="px-4 pb-3">

          <div className="bg-zinc-800/70 border border-zinc-700 rounded-2xl p-3">

            <div className="flex items-center justify-between mb-2">

              <span className="text-xs text-zinc-400">
                ✨ AI suggestions
              </span>

              <button
                onClick={() => {
                  setSuggestions([]);
                  setAiError("");
                }}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Close
              </button>

            </div>

            <div className="flex flex-col gap-2">

              {suggestions.map(
                (suggestion, index) => (
                  <button
                    key={`${suggestion}-${index}`}
                    onClick={() =>
                      selectSuggestion(
                        suggestion
                      )
                    }
                    className="text-left px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
                  >
                    {suggestion}
                  </button>
                )
              )}

            </div>

          </div>

        </div>
      )}

      {/* AI ERROR */}

      {aiError && (
        <div className="px-4 pb-3">
          <p className="text-xs text-red-400 text-center">
            {aiError}
          </p>
        </div>
      )}

      {/* MESSAGE INPUT */}

      <div className="p-4 border-t border-zinc-800">

        <div className="flex gap-3">

          <input
            type="text"
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 h-12 px-4 rounded-xl bg-zinc-800 border border-zinc-700 outline-none focus:border-zinc-500 placeholder:text-zinc-500"
          />

          {/* AI BUTTON */}

          <button
            onClick={generateSuggestions}
            disabled={
              !matched ||
              isGeneratingSuggestions
            }
            className="px-4 h-12 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Get AI message suggestions"
          >
            {isGeneratingSuggestions
              ? "✨ ..."
              : "✨ Suggest"}
          </button>

          {/* SEND */}

          <button
            onClick={sendMessage}
            disabled={!message.trim()}
            className="px-5 h-12 rounded-xl bg-white text-zinc-950 font-semibold hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            Send
          </button>

        </div>

      </div>

      {/* ACTIONS */}

      <div className="px-4 pb-4 flex gap-3">

        <button
          onClick={nextStranger}
          className="flex-1 h-12 rounded-xl bg-zinc-800 border border-zinc-700 font-semibold hover:bg-zinc-700 transition"
        >
          Next Stranger →
        </button>

        {/* END CALL */}

        {/* 
        <button
          onClick={endCall}
          className="px-7 h-12 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500 transition"
        >
          End Call
        </button>
        */}

      </div>

    </div>
  );
}