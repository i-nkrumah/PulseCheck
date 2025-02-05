// src/app/api/auth/forgot-password/route.ts

import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    // Check if the user exists in the database
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Do not reveal if the email exists
      return NextResponse.json(
        { message: 'If this email exists, a password reset link will be sent.' },
        { status: 200 }
      );
    }

    // Generate a secure reset token and its expiry
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 3600000); // 1-hour expiry

    // Update user with the reset token and its expiry
    await prisma.user.update({
      where: { email },
      data: { resetPasswordToken: token, resetPasswordTokenExpiry: tokenExpiry },
    });

    // Configure nodemailer transport
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail email
        pass: process.env.EMAIL_PASS, // App password or OAuth2 setup
      },
    });

    // Generate the password reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password/${token}`;

    // Send the password reset email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click the link to reset your password: ${resetUrl}`,
    });

    return NextResponse.json(
      { message: 'If this email exists, a password reset link will be sent.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in forgot-password route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
