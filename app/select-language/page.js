"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function SelectLanguagePage() {
  const router = useRouter();

  const languages = [
    { code: "en", name: "انگلیسی", flag: "🇬🇧", color: "from-blue-400 to-blue-600" },
    { code: "de", name: "آلمانی", flag: "🇩🇪", color: "from-yellow-400 to-red-500" },
    { code: "tr", name: "ترکی استانبولی", flag: "🇹🇷", color: "from-red-400 to-pink-600" },
    { code: "fr", name: "فرانسوی", flag: "🇫🇷", color: "from-indigo-400 to-blue-500" },
  ];

  const handleSelect = (lang) => {
    router.push(`/exam/${lang}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 p-4 text-right">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 w-full max-w-2xl border border-gray-200"
      >
        <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-8">
          انتخاب زبان آزمون
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {languages.map((lang) => (
            <motion.button
              key={lang.code}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(lang.code)}
              className={`w-full py-6 px-4 rounded-2xl text-white text-lg font-semibold shadow-lg transition-all bg-gradient-to-r ${lang.color}`}
            >
              <span className="text-3xl ml-2">{lang.flag}</span>
              {lang.name}
            </motion.button>
          ))}
        </div>

        <p className="text-center text-sm text-gray-600 mt-8">
          زبان مورد نظر خود را برای شروع آزمون انتخاب کنید.
        </p>
      </motion.div>
    </div>
  );
}
