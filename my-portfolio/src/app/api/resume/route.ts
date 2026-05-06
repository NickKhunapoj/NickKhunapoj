import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const RESUME_URL = '/resume.pdf';
const MAX_RESUME_SIZE = 10 * 1024 * 1024;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return Boolean(user);
}

function resumePath() {
  return join(process.cwd(), 'storage', 'resume.pdf');
}

export async function PUT(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Resume PDF is required.' }, { status: 400 });
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files are supported.' }, { status: 400 });
  }

  if (file.size > MAX_RESUME_SIZE) {
    return NextResponse.json({ error: 'Resume PDF must be 10 MB or smaller.' }, { status: 400 });
  }

  await mkdir(join(process.cwd(), 'storage'), { recursive: true });
  await writeFile(resumePath(), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: RESUME_URL });
}

export async function DELETE() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await unlink(resumePath());
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      return NextResponse.json({ error: 'Unable to delete resume.' }, { status: 500 });
    }
  }

  return NextResponse.json({ url: '', deleted: true });
}
