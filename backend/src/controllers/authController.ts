import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";

function createToken(userId: string, role: string): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign({ userId, role }, secret, { expiresIn: "1d" });
}

export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, role } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !["brand", "creator"].includes(role)
    ) {
      res.status(400).json({ message: "Invalid signup details" });
      return;
    }

    if (name.trim().length < 2 || password.length < 8) {
      res.status(400).json({
        message: "Name must have at least 2 characters and password at least 8",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      res.status(400).json({ message: "Invalid email address" });
      return;
    }

    const existingUser = await User.findOne({ email: normalizedEmail }).select(
      "+passwordHash +password"
    );

    if (existingUser) {
      const storedHash =
        existingUser.passwordHash || (existingUser as unknown as { password?: string }).password;

      // If user enters matching password, log them in seamlessly
      if (storedHash && (await bcrypt.compare(password, storedHash))) {
        const token = createToken(existingUser.id, existingUser.role || role);
        res.status(200).json({
          message: "Account already exists. Logged in successfully!",
          token,
          user: {
            id: existingUser.id,
            name: existingUser.name || name.trim(),
            email: existingUser.email,
            role: existingUser.role || role,
          },
        });
        return;
      }

      res.status(409).json({
        message:
          "An account with this email already exists. Please log in with your password, or use a different email.",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
    });

    const token = createToken(user.id, user.role);

    res.status(201).json({
      message: "Account created successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: number }).code === 11000
    ) {
      res.status(409).json({
        message:
          "An account with this email already exists. Please log in with your password, or use a different email.",
      });
      return;
    }

    console.error("Signup error:", error);
    res.status(500).json({ message: "Unable to create account" });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+passwordHash +password");

    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const storedHash =
      user.passwordHash || (user as unknown as { password?: string }).password;

    if (!storedHash || !(await bcrypt.compare(password, storedHash))) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // Auto-heal legacy users if passwordHash or role or name were missing
    if (!user.passwordHash || !user.role || !user.name) {
      user.passwordHash = storedHash;
      user.role = user.role || "creator";
      user.name = user.name || normalizedEmail.split("@")[0];
      await user.save();
    }

    const token = createToken(user.id, user.role);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Unable to log in" });
  }
}
