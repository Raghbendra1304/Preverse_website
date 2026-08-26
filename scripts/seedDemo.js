#!/usr/bin/env node
// Node script to seed demo data into Supabase using service role key
// Usage: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seedDemo.js

const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
    console.log('Running fallback inserts (limited demo data)');
    await fallbackInserts(supabase);
    console.log('Seed completed via JS fallback. For full SQL seed, run db/seeds/demo_seed.sql in Supabase SQL editor.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message || err);
    process.exit(1);
  }
}

async function fallbackInserts(supabase) {
  console.log('Running fallback inserts (limited demo data)');
  const exams = [
    { slug: 'upsc', name: 'UPSC', description: 'Union Public Service Commission - Civil Services Examination' },
    { slug: 'ssc-cgl', name: 'SSC CGL', description: 'Staff Selection Commission - Combined Graduate Level Examination' },
    { slug: 'neet', name: 'NEET', description: 'National Eligibility cum Entrance Test' },
    { slug: 'jee', name: 'JEE', description: 'Joint Entrance Examination' },
    { slug: 'banking', name: 'Banking', description: 'Banking and Financial Services Exams' },
  ];

  for (const ex of exams) {
    const { data, error } = await supabase.from('exams').upsert(ex, { onConflict: 'slug' }).select();
    if (error) console.error('Exam insert error', error.message);
  }

  // Subjects for JEE
  const { data: jee } = await supabase.from('exams').select('id').eq('slug', 'jee').maybeSingle();
  if (jee?.id) {
    const subjects = [
      { exam_id: jee.id, name: 'Physics', slug: 'physics' },
      { exam_id: jee.id, name: 'Chemistry', slug: 'chemistry' },
      { exam_id: jee.id, name: 'Mathematics', slug: 'mathematics' },
    ];
    for (const s of subjects) {
      const { error } = await supabase.from('subjects').upsert(s, { onConflict: 'slug' });
      if (error) console.error('Subject insert error', error.message);
    }
  }

  console.log('Fallback inserts done. Note: for full seed, run SQL via psql or Supabase SQL editor.');
}

main();
