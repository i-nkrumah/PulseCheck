// src/app/api/dashboard/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID.' }, { status: 400 });
    }

    // Fetch Received Feedback Data
    const receivedFeedbacks = await prisma.feedback.findMany({
      where: { toUserId: userId },
      include: { topic: true },
    });

    const averageRating = receivedFeedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) / receivedFeedbacks.length;

    const topicDistribution = receivedFeedbacks.reduce((acc, feedback) => {
      acc[feedback.topic.name] = (acc[feedback.topic.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ratingDistribution = receivedFeedbacks.reduce((acc, feedback) => {
      acc[feedback.rating] = (acc[feedback.rating] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Fetch Given Feedback Data
    const totalGivenFeedbacks = await prisma.feedback.count({
      where: { fromUserId: userId },
    });

    const recentGivenFeedbacks = await prisma.feedback.findMany({
      where: { fromUserId: userId },
      orderBy: { created_at: 'desc' },
      take: 5,
      include: {
        toUser: { select: { name: true } },
        topic: { select: { name: true } },
      },
    });

    const dashboardData = {
      receivedFeedback: {
        averageRating,
        topicDistribution,
        ratingDistribution,
      },
      givenFeedback: {
        totalGiven: totalGivenFeedbacks,
        recentFeedbacks: recentGivenFeedbacks.map(feedback => ({
          id: feedback.id,
          toUser: { name: feedback.toUser.name },
          topic: { name: feedback.topic.name },
          rating: feedback.rating,
          created_at: feedback.created_at,
        })),
      },
    };

    return NextResponse.json(dashboardData, { status: 200 });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}