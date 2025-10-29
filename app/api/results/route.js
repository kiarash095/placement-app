// app/api/results/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Result from "@/models/Result";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    // 1️⃣ اتصال به دیتابیس
    await connectDB();

    // 2️⃣ گرفتن و بررسی توکن
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { message: "توکن وجود ندارد" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id; // مطمئن شو تو JWT همون‌جا id ذخیره شده

    // 3️⃣ گرفتن بدنه‌ی درخواست
    const body = await req.json();

    // 4️⃣ ساخت داده کامل برای ذخیره
    const data = {
      userId, // از توکن گرفته میشه
      language: body.language || "unknown",
      totalQuestions: body.totalQuestions ?? 0,
      correctAnswers: body.correctAnswers ?? 0,
      scorePercent:
        body.scorePercent ??
        (body.totalQuestions
          ? (body.correctAnswers / body.totalQuestions) * 100
          : 0),
    };

    // 5️⃣ ذخیره در دیتابیس
    const result = await Result.create(data);

    return NextResponse.json({ message: "✅ نتیجه ذخیره شد", result });
  } catch (error) {
    console.error("Error saving result:", error.errors || error.message);
     console.log("VALIDATION DETAILS:", error.errors);
    return NextResponse.json(
      { message: "❌ خطا در ذخیره نتیجه", error: error.message },
      { status: 500 }
    );
  }
}
export async function GET(req) {
  try {
    await connectDB();

    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token)
      return NextResponse.json({ message: "توکن وجود ندارد" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const results = await Result.find({ userId: decoded.id }).sort({ date: -1 });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching results:", error);
    return NextResponse.json(
      { message: "خطا در دریافت نتایج" },
      { status: 500 }
    );
  }
}
