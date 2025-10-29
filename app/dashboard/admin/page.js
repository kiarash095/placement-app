"use client";
import { useState, useEffect } from "react";

export default function AdminDashboard() {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchMessages = async () => {
    const res = await fetch("/api/messages");
    const data = await res.json();
    setMessages(data);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;

    setLoading(true);
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMsg }),
    });
    setNewMsg("");
    setLoading(false);
    fetchMessages();
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 p-6 text-right">
      <div className="max-w-3xl mx-auto bg-white/90 p-8 rounded-3xl shadow-xl">
        <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">پنل مدیر</h1>

        <form onSubmit={sendMessage} className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="پیام خود را بنویسید..."
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            className="flex-1 border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl transition shadow-md"
          >
            {loading ? "در حال ارسال..." : "ارسال"}
          </button>
        </form>

        <div className="space-y-3">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center">پیامی وجود ندارد.</p>
          ) : (
            messages.map((msg) => (
              <div key={msg._id} className="bg-blue-50 border-r-4 border-blue-500 p-4 rounded-lg">
                <p className="text-gray-800">{msg.content}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(msg.date).toLocaleString("fa-IR")}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
