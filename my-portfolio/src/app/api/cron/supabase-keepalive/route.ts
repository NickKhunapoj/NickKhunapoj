import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type KeepaliveStatus = {
  id: string;
  last_ping_at: string;
  ping_count: number;
  source: string | null;
  updated_at: string;
};

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return { ok: false, status: 503, error: 'cron_secret_not_configured' };
  }

  const authorization = request.headers.get('authorization');
  const queryToken = request.nextUrl.searchParams.get('token');

  if (authorization === `Bearer ${cronSecret}` || queryToken === cronSecret) {
    return { ok: true, status: 200, error: null };
  }

  return { ok: false, status: 401, error: 'unauthorized' };
}

function getSource(request: NextRequest) {
  return request.headers.get('x-vercel-cron') ? 'vercel-cron' : 'manual';
}

export async function GET(request: NextRequest) {
  const authorization = isAuthorized(request);

  if (!authorization.ok) {
    return NextResponse.json(
      { ok: false, error: authorization.error },
      { status: authorization.status },
    );
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('record_keepalive_ping', {
      source_arg: getSource(request),
    });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: 'keepalive_failed',
          detail: error.code === 'PGRST202' || error.code === 'PGRST205'
            ? 'Run database/migrations/007_create_keepalive_status.sql and refresh the Supabase schema cache.'
            : error.message,
        },
        { status: 500 },
      );
    }

    const status = data as KeepaliveStatus | null;

    return NextResponse.json({
      ok: true,
      keepalive: {
        lastPingAt: status?.last_ping_at ?? null,
        pingCount: status?.ping_count ?? null,
        source: status?.source ?? null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'keepalive_failed',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { ok: false, error: 'method_not_allowed' },
    { status: 405, headers: { Allow: 'GET' } },
  );
}
