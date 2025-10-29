import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import Result from "@/models/Result";

export async function GET(req, { params }) {
  try {
    await connectDB();

    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token)
      return NextResponse.json({ message: "توکن وجود ندارد" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { id } = await params; // ✅ اصلاح شد

    const result = await Result.findOne({ _id: id, userId: decoded.id });
    if (!result)
      return NextResponse.json({ message: "نتیجه‌ای یافت نشد" }, { status: 404 });
console.log("RESULT DATA:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching result:", error);
    
    return NextResponse.json({ message: "خطا در دریافت نتیجه" }, { status: 500 });
  }
}
