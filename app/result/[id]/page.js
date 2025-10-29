"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Home } from "lucide-react";

export default function ResultPage() {
  const { id } = useParams();
  const router = useRouter();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchResult = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/results/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setResult(data);
      } catch (err) {
        console.error("Error loading result:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 text-lg text-gray-600">
        در حال بارگذاری نتیجه...
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <p className="text-lg text-gray-700 mb-6">نتیجه‌ای یافت نشد.</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl shadow hover:bg-blue-700 transition"
        >
          بازگشت به داشبورد
        </button>
      </div>
    );
  }

 const percent = result.scorePercent?.toFixed(2) || 0;
 const correct = result.correctAnswers || 0;
 const total = result.totalQuestions || 0;
 const lang = result.language || "نامشخص";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-gray-800 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-lg text-center rtl"
      >
        <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold mb-2">نتیجه آزمون {lang.toUpperCase()}</h1>
        <p className="text-gray-500 mb-6">تبریک! آزمون شما با موفقیت به پایان رسید.</p>

        <div className="relative flex justify-center mb-6">
          <svg className="w-40 h-40">
            <circle
              className="text-gray-200"
              strokeWidth="10"
              stroke="currentColor"
              fill="transparent"
              r="60"
              cx="80"
              cy="80"
            />
            <circle
              className="text-green-500"
              strokeWidth="10"
              strokeDasharray={`${(percent / 100) * 377} 377`}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="60"
              cx="80"
              cy="80"
            />
          </svg>
          <span className="absolute top-1/2 left-1/2 text-3xl font-semibold transform -translate-x-1/2 -translate-y-1/2 text-green-600">
            {percent}%
          </span>
        </div>

        <div className="flex justify-between text-lg font-medium mb-8">
          <span>تعداد پاسخ‌های درست:</span>
          <span className="text-green-600">{correct}</span>
        </div>

        <div className="flex justify-between text-lg font-medium mb-8">
          <span>تعداد کل سؤالات:</span>
          <span>{total}</span>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/dashboard")}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl transition shadow-lg"
        >
          <Home size={20} />
          بازگشت به داشبورد
        </motion.button>
      </motion.div>
    </div>
  );
}
