"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.token) {
        // ✅ ذخیره توکن در localStorage
        localStorage.setItem("token", data.token);
        setMessage("ورود با موفقیت انجام شد ✅");

        // هدایت به داشبورد
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        setMessage(data.message || "خطا در ورود ❌");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoading(false);
      setMessage("مشکلی پیش آمد ❌");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-blue-50 via-indigo-100 to-blue-200 p-6">
      <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md text-right border border-gray-100 transition-all hover:shadow-blue-200">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">
          ورود به حساب کاربری
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              ایمیل
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition outline-none text-gray-700"
              placeholder="example@mail.com"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              رمز عبور
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition outline-none text-gray-700"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-lg font-semibold shadow-md hover:shadow-lg transition-all"
          >
            {loading ? "در حال ورود..." : "ورود"}
          </button>

          {message && (
            <p
              className={`text-center text-sm font-medium mt-3 ${
                message.includes("✅") ? "text-green-600" : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}
        </form>

        <p className="text-center mt-6 text-sm text-gray-600">
          حساب ندارید؟{" "}
          <a
            href="/auth/register"
            className="text-blue-600 hover:underline font-medium"
          >
            ثبت‌نام کنید
          </a>
        </p>
      </div>
    </div>
  );
}
