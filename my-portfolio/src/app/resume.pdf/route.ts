import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function resumePath() {
  return join(process.cwd(), 'storage', 'resume.pdf');
}

const inlinePdfHeaders = {
  'Content-Type': 'application/pdf',
  'Content-Disposition': 'inline; filename="resume.pdf"',
  'Cache-Control': 'public, max-age=0, must-revalidate',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET() {
  try {
    const resume = await readFile(resumePath());

    return new NextResponse(resume, {
      headers: inlinePdfHeaders,
    });
  } catch {
    return NextResponse.json({ error: 'Resume PDF not found.' }, { status: 404 });
  }
}

export async function HEAD() {
  try {
    await readFile(resumePath());
    return new NextResponse(null, { headers: inlinePdfHeaders });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
