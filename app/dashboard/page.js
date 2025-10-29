"use client";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [results, setResults] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState({
    title: "",
    body: "",
    isGlobal: true,
  });

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // 🧩 استخراج نقش کاربر از JWT
  useEffect(() => {
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser(payload);
    } catch (err) {
      console.warn("توکن نامعتبر:", err);
    }
  }, [token]);

  // 📊 گرفتن نتایج و پیام‌ها
  useEffect(() => {
    if (!token) return;

    const safeJsonParse = async (res) => {
      try {
        const text = await res.text();
        return text ? JSON.parse(text) : {};
      } catch {
        return {};
      }
    };

    const fetchData = async () => {
      try {
        const [resResults, resMessages] = await Promise.all([
          fetch("/api/results", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/messages", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const dataResults = await safeJsonParse(resResults);
        const dataMessages = await safeJsonParse(resMessages);

        setResults(dataResults.results || []);
        setMessages(dataMessages.messages || []);
      } catch (err) {
        console.error("خطا در دریافت داده‌ها:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // ✉️ ارسال پیام توسط مدیر
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.title || !newMessage.body)
      return alert("تمام فیلدها را پر کنید.");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newMessage),
      });

      const data = await res.json().catch(() => ({}));
      alert(data.message || "پیام ارسال شد.");
      setNewMessage({ title: "", body: "", isGlobal: true });
    } catch (err) {
      console.error("خطا در ارسال پیام:", err);
      alert("ارسال پیام با خطا مواجه شد.");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <p className="text-gray-600 text-lg">در حال بارگذاری...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-6">
      <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-3xl p-8 text-right">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-700">
          داشبورد کاربری
        </h1>

        {/* ✅ اطلاعات کاربر */}
        {user && (
          <div className="mb-8 text-gray-700 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <p>
              <strong>کاربر:</strong> {user.email}
            </p>
            <p>
              <strong>نقش:</strong>{" "}
              {user.role === "admin" ? "مدیر سیستم" : "کاربر عادی"}
            </p>
          </div>
        )}

        {/* 📊 نتایج آزمون */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            📈 نتایج آزمون‌ها
          </h2>
          {results.length ? (
            <div className="grid gap-4">
              {results.map((r) => (
                <div
                  key={r._id}
                  className="p-4 border rounded-xl shadow-sm bg-gray-50"
                >
                  <p>
                    <strong>زبان:</strong> {r.lang?.toUpperCase()}
                  </p>
                  <p>
                    <strong>نمره:</strong> {r.score}/{r.total} ({r.percent}%)
                  </p>
                  <p className="text-sm text-gray-500">
                    تاریخ:{" "}
                    {r.date
                      ? new Date(r.date).toLocaleDateString("fa-IR")
                      : "نامشخص"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">نتیجه‌ای برای نمایش وجود ندارد.</p>
          )}
        </section>

        {/* 💬 پیام‌ها */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            💬 پیام‌های مدیر
          </h2>
          {messages.length ? (
            <div className="space-y-3">
              {messages.map((m) => (
                <div
                  key={m._id}
                  className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-xl"
                >
                  <p className="font-semibold text-blue-800">{m.title}</p>
                  <p className="text-gray-700">{m.body}</p>
                  <p className="text-xs text-gray-500 text-left">
                    {m.createdAt
                      ? new Date(m.createdAt).toLocaleDateString("fa-IR")
                      : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">پیامی برای شما وجود ندارد.</p>
          )}
        </section>

        {/* 📨 فرم ارسال پیام فقط برای مدیر */}
        {user?.role === "admin" && (
          <section className="border-t pt-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">
              📨 ارسال پیام جدید (مدیر)
            </h2>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <input
                type="text"
                placeholder="عنوان پیام"
                className="w-full border p-2 rounded-lg"
                value={newMessage.title}
                onChange={(e) =>
                  setNewMessage({ ...newMessage, title: e.target.value })
                }
              />
              <textarea
                placeholder="متن پیام..."
                rows="4"
                className="w-full border p-2 rounded-lg"
                value={newMessage.body}
                onChange={(e) =>
                  setNewMessage({ ...newMessage, body: e.target.value })
                }
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newMessage.isGlobal}
                  onChange={(e) =>
                    setNewMessage({
                      ...newMessage,
                      isGlobal: e.target.checked,
                    })
                  }
                />
                ارسال برای همه کاربران
              </label>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow transition"
              >
                ارسال پیام
              </button>
            </form>
          </section>
        )}

        {/* 📝 دکمه انتخاب زبان و شروع آزمون */}
        <section className="border-t pt-6 mt-8 text-center">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            📝 شروع آزمون زبان
          </h2>
          <p className="text-gray-600 mb-6">
            برای آغاز آزمون، ابتدا زبان مورد نظر خود را انتخاب کنید.
          </p>
          <a
            href="/select-language"
            className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-8 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all"
          >
            🎯 انتخاب زبان و شروع آزمون
          </a>
        </section>
      </div>
    </div>
  );
}
