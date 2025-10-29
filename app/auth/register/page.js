"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setMessage("✅ ثبت‌نام با موفقیت انجام شد!");
        setTimeout(() => router.push("/auth/login"), 1500);
      } else {
        setMessage(data.message || "❌ خطا در ثبت‌نام");
      }
    } catch (error) {
      setLoading(false);
      setMessage("❌ مشکلی در ارتباط با سرور پیش آمده است");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-100 to-blue-200 p-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 text-right border border-gray-100">
        <h2 className="text-3xl font-extrabold text-gray-800 text-center mb-6">
          ثبت‌نام در آزمون تعیین سطح
        </h2>
        <p className="text-center text-gray-600 mb-8 text-sm">
          لطفاً اطلاعات خود را وارد کنید تا حساب کاربری ایجاد شود.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-1 font-medium text-gray-700">نام کامل</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-2.5 text-gray-800 focus:ring-2 focus:ring-blue-400 outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">ایمیل</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-2.5 text-gray-800 focus:ring-2 focus:ring-blue-400 outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">رمز عبور</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-2.5 text-gray-800 focus:ring-2 focus:ring-blue-400 outline-none transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-white font-semibold shadow-lg transition-all duration-300 ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600"
            }`}
          >
            {loading ? "در حال ثبت..." : "ثبت‌نام"}
          </button>

          {message && (
            <p
              className={`text-center mt-3 font-medium ${
                message.includes("❌") ? "text-red-500" : "text-green-600"
              }`}
            >
              {message}
            </p>
          )}
        </form>

        <p className="text-center mt-6 text-sm text-gray-700">
          حساب دارید؟{" "}
          <a
            href="/auth/login"
            className="font-semibold text-blue-600 hover:text-blue-800 transition"
          >
            ورود به حساب
          </a>
        </p>
      </div>
    </div>
  );
}
