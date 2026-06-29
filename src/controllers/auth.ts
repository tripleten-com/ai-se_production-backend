import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import User from '../models/user';

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      data: null,
      error: { message: 'email and password are required' },
    });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await User.create({ email, password: hashedPassword });
    res.status(201).json({
      success: true,
      data: { userId: user._id, email: user.email },
      error: null,
    });
  } catch (err: unknown) {
    if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
      res.status(409).json({
        success: false,
        data: null,
        error: { message: 'Email already in use' },
      });
      return;
    }
    throw err;
  }
};
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      data: null,
      error: { message: 'email and password are required' },
    });
    return;
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(401).json({
      success: false,
      data: null,
      error: { message: 'Invalid credentials' },
    });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401).json({
      success: false,
      data: null,
      error: { message: 'Invalid credentials' },
    });
    return;
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
    expiresIn: '7d',
  });

  res.status(200).json({
    success: true,
    data: {
      token,
      user: { userId: user._id, email: user.email },
    },
    error: null,
  });
};

export const getProfile = async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  const user = await User.findById(userId).select('-password');
  if (!user) {
    res.status(404).json({
      success: false,
      data: null,
      error: { message: 'No such user' },
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: { user },
    error: null,
  });
};
