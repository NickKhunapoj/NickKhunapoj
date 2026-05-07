import { NextRequest, NextResponse } from 'next/server';
import { createAnalyticsAdminClient, requireAdminUser } from '@/lib/analytics/server';

export const runtime = 'nodejs';

async function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.ANALYTICS_CRON_SECRET || process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');

  if (cronSecret && authorization === `Bearer ${cronSecret}`) return true;

  const user = await requireAdminUser();
  return Boolean(user);
}

async function runCleanup() {
  const admin = createAnalyticsAdminClient();
  const { data, error } = await admin.rpc('cleanup_analytics_data');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ cleanup: data });
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return runCleanup();
}

export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return runCleanup();
}
