// app/exam/[lang]/page.js
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

/**
 * صفحهٔ آزمون — نسخهٔ اصلاح شده
 * ✅ تایمر 45 دقیقه‌ای
 * ✅ بخش Listening: همه سوالات یک سطح در یک صفحه، پخش یک‌باره، دکمه پخش مجدد، امکان پاسخ‌دهی در حین یا بعد از پخش
 * ✅ بخش Reading: نمایش passage فقط یک‌بار (از اولین سوال آن سطح)، سپس همه سوالات زیر متن
 * ✅ keys یکتا شده‌اند تا خطای duplicate key حذف شود
 * ✅ جلوگیری از crash وقتی به انتها رسیدیم — handleSubmit اجرا شده و تایمر/صدا پاک می‌شوند
 * ✅ ذخیرهٔ نتیجه در /api/results (با JWT) یا localStorage
 *
 * مسیر فایل‌های صوتی (طبق تایید شما):
 * public/audio/{lang}/{level}-hoerverstehen.mp3
 * مثال: /audio/de/a1-hoerverstehen.mp3
 */

const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];
const SKILL_ORDER = ["grammar", "vocabulary", "listening", "reading"];
const EXAM_DURATION = 45 * 60; // 45 minutes in seconds

export default function ExamPageClient() {
  const { lang } = useParams();
  const router = useRouter();

  // state
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [inListeningBlock, setInListeningBlock] = useState(false);
  const [listeningBlockQuestions, setListeningBlockQuestions] = useState([]);
  const [audioPlayingLevel, setAudioPlayingLevel] = useState(null);
  const [audioPlayAttemptFailed, setAudioPlayAttemptFailed] = useState(false);
  const [inReadingBlock, setInReadingBlock] = useState(false);
  const [readingBlockQuestions, setReadingBlockQuestions] = useState([]);
  const [readingText, setReadingText] = useState("");
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [submitting, setSubmitting] = useState(false);

  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  // ---------------- load questions ----------------
  useEffect(() => {
    mountedRef.current = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/exam/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lang }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "خطا در بارگذاری سوالات");

        const all = data.questions || [];

        // normalize
        all.forEach((q) => {
          if (q.level) q.level = String(q.level).toUpperCase();
          if (q.skill) q.skill = String(q.skill).toLowerCase();
        });

        // order by LEVEL_ORDER then SKILL_ORDER (preserve relative order)
        const grouped = [];
        for (const lvl of LEVEL_ORDER) {
          const lvlQs = all.filter((q) => q.level === lvl);
          if (!lvlQs.length) continue;
          for (const skill of SKILL_ORDER) {
            const skillQs = lvlQs.filter((q) => q.skill === skill);
            if (skillQs.length) grouped.push(...skillQs);
          }
        }
        const matched = new Set(grouped.map((q) => q.id));
        const leftovers = all.filter((q) => !matched.has(q.id));
        const finalList = [...grouped, ...leftovers];

        if (mountedRef.current) {
          setQuestions(finalList);
          setIndex(0);
        }
      } catch (err) {
        console.error("exam load error:", err);
        alert("خطا در بارگذاری سوالات: " + (err?.message || err));
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };
    load();

    return () => {
      mountedRef.current = false;
    };
  }, [lang]);

  // ---------------- timer ----------------
  useEffect(() => {
    if (!questions.length) return;
    // reset timer on question load
    setTimeLeft(EXAM_DURATION);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          // auto submit when time's up
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  // ---------------- prevent accidental leaving ----------------
  useEffect(() => {
    const beforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const onPopState = () => {
      // block back
      history.pushState(null, "", location.href);
      alert("بازگشت در طول آزمون مجاز نیست.");
    };
    window.addEventListener("beforeunload", beforeUnload);
    history.pushState(null, "", location.href);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  // ---------------- when index changes: detect listening/reading blocks ----------------
  useEffect(() => {
    if (!questions.length) return;
    const q = questions[index];
    if (!q) return;

    if (q.skill === "listening") {
      // ✅ Listening block: gather all listening questions for this level and set audio
      const lvl = q.level;
      const block = questions.filter((x) => x.skill === "listening" && x.level === lvl);
      setListeningBlockQuestions(block);
      setInListeningBlock(true);
      setInReadingBlock(false);

      // set audio src and try to play. if autoplay blocked, set flag and show manual play
      try {
        if (audioRef.current) {
          audioRef.current.src = `/audio/${lang}/${lvl.toLowerCase()}-hoerverstehen.mp3`;
          audioRef.current.play().catch((err) => {
            console.warn("autoplay blocked:", err);
            setAudioPlayAttemptFailed(true);
          });
          setAudioPlayingLevel(lvl);
          setAudioPlayAttemptFailed(false);
        }
      } catch (err) {
        console.error("Audio error:", err);
        setAudioPlayAttemptFailed(true);
      }
    } else if (q.skill === "reading") {
      // ✅ Reading block: gather reading questions for this level, extract one passage
      const lvl = q.level;
      const block = questions.filter((x) => x.skill === "reading" && x.level === lvl);
      setReadingBlockQuestions(block);
      setInReadingBlock(true);
      setInListeningBlock(false);

      // choose first available passage/text as the single passage shown
      const first = block.find((b) => b.passage || b.text) || block[0] || {};
      setReadingText(first?.passage ?? first?.text ?? "");
    } else {
      // normal question
      setInListeningBlock(false);
      setInReadingBlock(false);
    }
  }, [index, questions, lang]);

  // ---------------- select answer ----------------
  const handleSelect = (qId, option) => {
    setAnswers((s) => ({ ...s, [qId]: option }));
  };

  // ---------------- goNext (ادامه) ----------------
  const goNext = () => {
    // if in listening block => jump to after block and stop audio
    if (inListeningBlock) {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch (e) {}
      }
      const lvl = listeningBlockQuestions[0]?.level;
      let lastIdx = -1;
      questions.forEach((q, i) => {
        if (q.skill === "listening" && q.level === lvl) lastIdx = i;
      });
      if (lastIdx >= 0) {
        setInListeningBlock(false);
        setAudioPlayingLevel(null);
        setIndex(Math.min(lastIdx + 1, questions.length)); // if last, submit handler covers it
        return;
      }
    }

    // if in reading block => jump to after block
    if (inReadingBlock) {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch (e) {}
      }
      const lvl = readingBlockQuestions[0]?.level;
      let lastIdx = -1;
      questions.forEach((q, i) => {
        if (q.skill === "reading" && q.level === lvl) lastIdx = i;
      });
      if (lastIdx >= 0) {
        setInReadingBlock(false);
        setIndex(Math.min(lastIdx + 1, questions.length));
        return;
      }
    }

    // normal next (skip allowed)
    if (index < questions.length - 1) {
      setIndex((i) => i + 1);
    } else {
      // reached end
      handleSubmit();
    }
  };

  const calculateScore = () => {
  let correct = 0;
  questions.forEach((q) => {
    const got = answers[q.id];
    if (got != null && String(got).trim() === String(q.answer).trim()) correct++;
  });
  return { correct, total: questions.length, percent: Math.round((correct / questions.length) * 100) };
};


const handleSubmit = async () => {
  try {
    setSubmitting(true);

    const { correct, total, percent } = calculateScore();
    const language = lang;
    const token = localStorage.getItem("token");

    const res = await fetch("/api/results", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({
        language,
        totalQuestions: total,
        correctAnswers: correct,
        percent,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("server error:", data);
      throw new Error(data.message || "خطا در ذخیره نتیجه");
    }

    const resultId = data?.result?._id || null;
    if (resultId) {
      router.push(`/result/${resultId}`);
    } else {
      router.push(`/result?correct=${correct}&total=${total}&percent=${percent}`);
    }
  } catch (err) {
    console.error("submit error:", err);
    const { total } = calculateScore();
    router.push(`/result?correct=0&total=${total}&percent=0`);
  } finally {
    setSubmitting(false);
  }
};







  // ---------------- audio handlers ----------------
  const onAudioEnded = () => {
    setAudioPlayingLevel(null);
    setAudioPlayAttemptFailed(false);
    // note: we intentionally allow user to answer anytime (no forced lock)
  };

  const manualPlayAudio = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => setAudioPlayAttemptFailed(false)).catch(() => setAudioPlayAttemptFailed(true));
    }
  };

  // ---------------- defensive: if index out of range, submit ----------------
  useEffect(() => {
    if (!loading && questions.length > 0 && (index >= questions.length || index < 0)) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, questions, loading]);

  // ---------------- render ----------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-gray-700">در حال بارگذاری سوالات...</div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-700">هیچ سوالی یافت نشد.</div>
      </div>
    );
  }

  // prepare lists (not strictly required but handy)
  const listeningLevels = [...new Set(questions.filter((q) => q.skill === "listening").map((q) => q.level))];

  const timeColorClass = timeLeft < 60 ? "text-red-600" : timeLeft < 300 ? "text-orange-600" : "text-gray-700";
  const currentQuestion = questions[index];
const finishExam = () => {
  // تعداد کل سوالات و پاسخ‌های درست
  const total = questions.length;
  const correct = answers.filter((a, i) => a === questions[i].correctAnswer).length;

  // محاسبه درصد
  const percent = Math.round((correct / total) * 100);

  // می‌تونی سطح کاربر رو هم از همینجا تعیین کنی
  let level = "beginner";
  if (percent >= 80) level = "advanced";
  else if (percent >= 50) level = "intermediate";

  console.log("✅ آزمون به پایان رسید:");
  console.log("درست:", correct);
  console.log("کل:", total);
  console.log("درصد:", percent);
  console.log("سطح:", level);

  // فراخوانی تابع ذخیره نتیجه
  handleSubmit();
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 p-6 text-right">
      <div className="max-w-3xl mx-auto bg-white/90 rounded-3xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4 gap-4">
          <h1 className="text-2xl font-bold">آزمون زبان — {lang?.toUpperCase()}</h1>

          <div className="flex items-center gap-3">
            <div className={`font-mono text-lg px-3 py-1 rounded-lg bg-gray-100 ${timeColorClass}`}>⏳ {formatTime(timeLeft)}</div>
            <button
              onClick={() => {
                if (confirm("می‌خواهید از آزمون خارج شوید؟ تغییرات ذخیره نمی‌شود.")) router.push("/dashboard");
              }}
              className="text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg"
            >
              خروج
            </button>
          </div>
        </div>

        {/* Hidden audio element (we control play/pause from UI) */}
        <audio ref={audioRef} onEnded={onAudioEnded} className="hidden" preload="auto" />

        {/* ---------------- Listening Block ---------------- */}
        {inListeningBlock ? (
          <div>
            <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
              <p className="font-semibold mb-1">بخش شنیداری — سطح {listeningBlockQuestions[0]?.level}</p>
              <p className="text-sm text-gray-700">فایل صوتی پخش می‌شود. می‌توانید هر زمان پاسخ دهید یا ادامه دهید.</p>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => {
                    if (audioRef.current) {
                      // toggle play/pause
                      if (audioRef.current.paused) {
                        audioRef.current.play().catch(() => setAudioPlayAttemptFailed(true));
                      } else {
                        audioRef.current.pause();
                      }
                    }
                  }}
                  className="bg-blue-600 text-white px-3 py-1 rounded-lg"
                >
                  پخش/توقف
                </button>

                <button onClick={manualPlayAudio} className="bg-gray-200 px-3 py-1 rounded-lg">پخش مجدد</button>

                {audioPlayAttemptFailed && (
                  <div className="text-sm text-red-600">پخش خودکار ممکن است توسط مرورگر مسدود شده باشد — از دکمهٔ پخش استفاده کنید.</div>
                )}
              </div>
            </div>

            {listeningBlockQuestions.map((q, i) => (
              <div key={`${q.id}-${i}`} className="mb-6 p-4 bg-gray-50 rounded-xl">
                <p className="font-medium mb-2">{i + 1}. {q.question}</p>
                <div className="grid grid-cols-2 gap-3">
                  {q.options.map((opt, j) => {
                    const selected = answers[q.id] === opt;
                    return (
                      <label key={`${q.id}_opt_${j}`} className={`p-3 rounded-lg border text-center cursor-pointer transition ${selected ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-blue-50"}`}>
                        <input type="radio" className="hidden" name={q.id} value={opt} checked={selected} onChange={() => handleSelect(q.id, opt)} />
                        {opt}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="mt-4">
              <button onClick={goNext} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:scale-[1.02] transition">ادامه آزمون ⏭</button>
            </div>
          </div>

        ) : inReadingBlock ? (
          /* ---------------- Reading Block ---------------- */
          <div>
            <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
              <p className="font-semibold">بخش درک مطلب — سطح {readingBlockQuestions[0]?.level}</p>
              <p className="text-sm text-gray-700">متن فقط یک‌بار نمایش داده می‌شود — سوالات زیر متن قرار دارند.</p>
            </div>

            {/* passage single (show once) */}
            <div className="mb-6 p-4 bg-gray-100 rounded-xl whitespace-pre-wrap leading-relaxed">
              {readingText || "متن این بخش موجود نیست."}
            </div>

            {/* questions list */}
            {readingBlockQuestions.map((q, i) => (
              <div key={`${q.id}-${i}`} className="mb-6 p-4 bg-gray-50 rounded-xl">
                <p className="font-medium mb-2">{i + 1}. {q.question}</p>
                <div className="grid grid-cols-2 gap-3">
                  {q.options.map((opt, j) => {
                    const selected = answers[q.id] === opt;
                    return (
                      <label key={`${q.id}_opt_${j}`} className={`p-3 rounded-lg border text-center cursor-pointer transition ${selected ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-blue-50"}`}>
                        <input type="radio" className="hidden" name={q.id} value={opt} checked={selected} onChange={() => handleSelect(q.id, opt)} />
                        {opt}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="mt-4">
              <button onClick={goNext} className="bg-green-600 text-white px-5 py-2 rounded-lg hover:scale-[1.02] transition">ادامه آزمون ⏭</button>
            </div>
          </div>

        ) : (
          /* ---------------- Normal one-by-one questions ---------------- */
          <>
            {currentQuestion ? (
              <div>
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <p className="font-semibold text-lg">{index + 1}. {currentQuestion.question}</p>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {currentQuestion.options.map((opt, j) => {
                      const selected = answers[currentQuestion.id] === opt;
                      return (
                        <label key={`${currentQuestion.id}_opt_${j}`} className={`p-3 rounded-lg border text-center cursor-pointer transition ${selected ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-blue-50"}`}>
                          <input className="hidden" type="radio" name={`q-${currentQuestion.id}`} checked={selected} onChange={() => handleSelect(currentQuestion.id, opt)} />
                          {opt}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">سطح: {currentQuestion.level} | مهارت: {currentQuestion.skill}</div>
                  <button onClick={goNext} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl shadow-md hover:scale-[1.02] transition">
                    {index < questions.length - 1 ? "سؤال بعدی" : "ارسال و مشاهده نتیجه"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-gray-700">در حال پردازش نتیجه...</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
