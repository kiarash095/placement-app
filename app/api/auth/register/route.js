import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcrypt";

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password)
      return new Response("Missing fields", { status: 400 });

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return new Response("User already exists", { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    return new Response("User registered successfully", { status: 201 });
  } catch (error) {
    console.error(error);
    return new Response("Server error", { status: 500 });
  }
}
