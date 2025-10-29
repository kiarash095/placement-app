import { connectDB } from "@/lib/mongodb";
import Message from "@/models/Message";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    await connectDB();

    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "توکن یافت نشد" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const messages = await Message.find({
      $or: [{ receiverId: decoded.id }, { isGlobal: true }],
    }).sort({ createdAt: -1 });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "خطا در دریافت پیام‌ها" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "توکن یافت نشد" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { title, body, receiverId, isGlobal } = await req.json();

    const newMessage = new Message({
      senderId: decoded.id,
      receiverId: receiverId || null,
      title,
      body,
      isGlobal: !!isGlobal,
    });

    await newMessage.save();
    return NextResponse.json({ message: "پیام با موفقیت ارسال شد ✅" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "خطا در ارسال پیام" }, { status: 500 });
  }
}
