import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req) {
  await connectDB();

  try {
    const { email, password } = await req.json();

    if (!email || !password)
      return Response.json({ message: "تمام فیلدها الزامی‌اند" }, { status: 400 });

    const user = await User.findOne({ email });
    if (!user)
      return Response.json({ message: "کاربری با این ایمیل یافت نشد" }, { status: 404 });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return Response.json({ message: "رمز عبور اشتباه است" }, { status: 401 });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return Response.json(
      {
        message: "ورود موفق ✅",
        token,
        user: { id: user._id, name: user.name, email: user.email },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return Response.json({ message: "خطا در ورود کاربر ❌" }, { status: 500 });
  }
}
