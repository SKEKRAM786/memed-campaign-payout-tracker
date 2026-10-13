import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type AuthRole = "brand" | "creator";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: AuthRole;
  };
}

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authReq = req as AuthenticatedRequest;
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authentication token required" });
    return;
  }

  const token = authorization.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({
      message: "Server authentication is not configured",
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret);

    if (
      typeof decoded === "string" ||
      typeof decoded.userId !== "string" ||
      !["brand", "creator"].includes(decoded.role as string)
    ) {
      res.status(401).json({ message: "Invalid authentication token" });
      return;
    }

    authReq.user = {
      userId: decoded.userId,
      role: decoded.role as AuthRole,
    };

    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireRole(...roles: AuthRole[]) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!roles.includes(authReq.user.role)) {
      res.status(403).json({ message: "You do not have permission" });
      return;
    }

    next();
  };
}