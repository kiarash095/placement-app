// app/api/exam/start/route.js
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function loadQuestionsForLang(lang) {
  const basePath = path.join(process.cwd(), "data", lang);
  if (!fs.existsSync(basePath)) return [];

  const files = fs
    .readdirSync(basePath)
    .filter(f => f.endsWith(".json")); // فقط فایل‌های JSON

  let all = [];
  for (const file of files) {
    const filePath = path.join(basePath, file);
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const data = JSON.parse(raw);
      if (Array.isArray(data)) all = all.concat(data);
    } catch (err) {
      console.warn("خطا در خواندن فایل:", filePath, err.message);
    }
  }

  return all;
}

export async function POST(req) {
  try {
    const { lang } = await req.json();
    if (!lang)
      return NextResponse.json({ message: "زبان مشخص نشده" }, { status: 400 });

    const questions = loadQuestionsForLang(lang);
    if (!questions.length)
      return NextResponse.json({ message: "هیچ سوالی یافت نشد" }, { status: 404 });

    return NextResponse.json({ total: questions.length, questions });
  } catch (err) {
    console.error("exam.start POST error:", err);
    return NextResponse.json(
      { message: "خطا در بارگذاری سوالات" },
      { status: 500 }
    );
  }
}

// GET برای تست سریع از مرورگر
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const lang = url.searchParams.get("lang");
    if (!lang)
      return NextResponse.json({ message: "پارامتر زبان وجود ندارد" }, { status: 400 });

    const questions = loadQuestionsForLang(lang);
    return NextResponse.json({ total: questions.length, questions });
  } catch (err) {
    console.error("exam.start GET error:", err);
    return NextResponse.json({ message: "خطا" }, { status: 500 });
  }
}
