import { useState } from "react";
import MessageInput from "../MessageInput";

export default function MessageInputExample() {
  const [messages, setMessages] = useState<string[]>([]);

  const handleSend = (message: string) => {
    console.log("Sending message:", message);
    setMessages([...messages, message]);
  };

  return (
    <div className="max-w-3xl bg-background">
      <div className="p-4 space-y-2">
        {messages.map((msg, idx) => (
          <div key={idx} className="p-2 bg-card rounded text-sm">
            {msg}
          </div>
        ))}
      </div>
      <MessageInput onSend={handleSend} />
    </div>
  );
}
