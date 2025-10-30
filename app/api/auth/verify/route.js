export const runtime = "nodejs";

import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req) {
  await connectDB();

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return Response.json({ message: "توکن ارسال نشده" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user)
      return Response.json({ message: "کاربر یافت نشد" }, { status: 404 });

    return Response.json({ user });
  } catch (error) {
    return Response.json({ message: "توکن نامعتبر است ❌" }, { status: 401 });
  }
}
