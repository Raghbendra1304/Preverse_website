import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { appConfig } from '@/lib/config';

const geminiModel = 'gemini-3.6-flash';

async function callGemini(prompt: string) {
  if (!appConfig.geminiApiKey) {
    throw new Error('Gemini API key is not configured.');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${appConfig.geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: 'You are a helpful exam and interview coach.' }],
      },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.78,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorBody}`);
  }

  const result = await response.json();
  return result?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? '').join('') ?? '';
}

function parseJsonResponse(text: string) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(cleaned);
}

function normalizeFeedbackResults(results: any[], questions: any[], answers: Record<string, string>) {
  return questions.map((question) => {
    const result = results.find((item) => item.id === question.id) ?? {};
    const correct = question.type === 'multiple_choice' ? answers[question.id] === question.answer : Boolean(answers[question.id]?.trim());
    return {
      id: question.id,
      correct,
      selectedAnswer: answers[question.id] ?? '',
      correctAnswer: question.answer,
      explanation: correct ? '' : String(result.explanation ?? 'Review the concept and try this question again.').replace(/\s+/g, ' ').trim().slice(0, 240),
    };
  });
}

function fallbackPractice(topic: string, difficulty: string) {
  const normalizedTopic = topic.toLowerCase();
  const subjectQuestions = normalizedTopic.includes('biology') || normalizedTopic.includes('physiology')
    ? [
        { id: 1, type: 'multiple_choice', text: `Which organelle is primarily responsible for ATP production in ${topic}?`, options: ['Mitochondrion', 'Ribosome', 'Golgi apparatus', 'Lysosome'], answer: 'Mitochondrion' },
        { id: 2, type: 'multiple_choice', text: `Which process helps maintain homeostasis during ${topic}?`, options: ['Negative feedback', 'Random mutation', 'Binary fission', 'Transcription only'], answer: 'Negative feedback' },
        { id: 3, type: 'coding', text: `Design a simple data table to compare two biological variables related to ${topic}.`, answer: 'Define variables, record controlled observations, and compare the results.' },
        { id: 4, type: 'verbal', text: `Explain one real-world application of ${topic} and the biological principle behind it.`, answer: 'Explain the mechanism clearly and connect it to a practical example.' },
      ]
    : normalizedTopic.includes('mathematics') || normalizedTopic.includes('calculus') || normalizedTopic.includes('algebra') || normalizedTopic.includes('number theory')
      ? [
          { id: 1, type: 'multiple_choice', text: `Which strategy is most useful when solving a ${topic} problem?`, options: ['Identify constraints and structure', 'Guess without checking', 'Ignore units', 'Change the question'], answer: 'Identify constraints and structure' },
          { id: 2, type: 'multiple_choice', text: `What should you verify after obtaining a result in ${topic}?`, options: ['Domain and boundary conditions', 'Only the first step', 'The font size', 'Nothing'], answer: 'Domain and boundary conditions' },
          { id: 3, type: 'coding', text: `Write pseudocode for checking a solution to a ${topic} problem.`, answer: 'Validate inputs, apply the formula or algorithm, and test edge cases.' },
          { id: 4, type: 'verbal', text: `Explain the key idea behind a difficult ${topic} solution in three logical steps.`, answer: 'State the concept, show the transformation, and verify the conclusion.' },
        ]
      : normalizedTopic.includes('physics') || normalizedTopic.includes('mechanics') || normalizedTopic.includes('electrodynamics')
        ? [
            { id: 1, type: 'multiple_choice', text: `Which law is most directly applied to analyze a ${topic} situation?`, options: ['Conservation laws', 'Law of supply and demand', 'Mendelian inheritance', 'Opportunity cost'], answer: 'Conservation laws' },
            { id: 2, type: 'multiple_choice', text: `What must be identified before solving a numerical problem in ${topic}?`, options: ['Known quantities and units', 'The final answer only', 'A random diagram', 'Unrelated constants'], answer: 'Known quantities and units' },
            { id: 3, type: 'coding', text: `Describe an algorithm for calculating and checking a numerical result in ${topic}.`, answer: 'Convert units, apply the governing equation, and compare the result with limiting cases.' },
            { id: 4, type: 'verbal', text: `Explain a common misconception students have about ${topic}.`, answer: 'State the misconception, provide the correct principle, and demonstrate it with an example.' },
          ]
        : normalizedTopic.includes('chemistry') || normalizedTopic.includes('organic') || normalizedTopic.includes('chemical')
          ? [
              { id: 1, type: 'multiple_choice', text: `Which factor most affects the outcome of a reaction in ${topic}?`, options: ['Concentration and temperature', 'Alphabetical order', 'Screen brightness', 'Paper size'], answer: 'Concentration and temperature' },
              { id: 2, type: 'multiple_choice', text: `Why is balancing equations important in ${topic}?`, options: ['It follows conservation of atoms', 'It changes the elements', 'It removes products', 'It avoids measurement'], answer: 'It follows conservation of atoms' },
              { id: 3, type: 'coding', text: `Create a step-by-step method for identifying an unknown compound in ${topic}.`, answer: 'Use observations, apply relevant tests, and compare results with verified properties.' },
              { id: 4, type: 'verbal', text: `Compare two related concepts from ${topic} and explain when each applies.`, answer: 'Define both concepts, contrast their conditions, and give one example of each.' },
            ]
          : [
              { id: 1, type: 'multiple_choice', text: `What is the first step when approaching a ${difficulty} question in ${topic}?`, options: ['Understand the requirements', 'Skip the statement', 'Guess immediately', 'Ignore constraints'], answer: 'Understand the requirements' },
              { id: 2, type: 'multiple_choice', text: `Which habit improves accuracy while studying ${topic}?`, options: ['Review mistakes and verify reasoning', 'Memorize every option', 'Avoid practice', 'Skip explanations'], answer: 'Review mistakes and verify reasoning' },
              { id: 3, type: 'coding', text: `Describe a practical method for solving and checking a ${topic} problem.`, answer: 'Break the problem into steps, solve systematically, and test edge cases.' },
              { id: 4, type: 'verbal', text: `Teach one important ${topic} concept to a beginner using a simple example.`, answer: 'Define the concept clearly, illustrate it, and check understanding.' },
            ];

  return {
    questions: subjectQuestions,
  };
}

function fallbackInterview(topic: string, difficulty: string) {
  return {
    questions: [
      { id: 1, prompt: `Tell me about your experience with ${topic} problem solving in ${difficulty} interview scenarios.` },
      { id: 2, prompt: `What are the top three trade-offs to consider when designing a ${topic} system or process?` },
      { id: 3, prompt: `How would you explain a technical decision in ${topic} to a non-technical stakeholder?` },
    ],
  };
}

function fallbackFeedback(questions: any[], answers: Record<string, string>) {
  const correctResponses = questions
    .filter((question) => question.type === 'multiple_choice')
    .map((question) => `Q: ${question.text}\nCorrect: ${question.answer}`)
    .join('\n\n');

  return {
    explanation: `Your practice session is complete. Here are the key takeaways:\n\n${correctResponses}\n\nFor verbal and coding questions, review your answers for clarity, structure, and accurate terminology. Keep refining your approach by focusing on examples and concise explanations.`,
    results: questions.map((question) => ({
      id: question.id,
      correct: question.type === 'multiple_choice' ? answers[question.id] === question.answer : Boolean(answers[question.id]?.trim()),
      selectedAnswer: answers[question.id] ?? '',
      correctAnswer: question.answer,
      explanation: question.type === 'multiple_choice'
        ? `The correct answer is ${question.answer}. Review the underlying concept and compare it with your selected option.`
        : 'A written response was recorded. Compare your approach with the model answer and improve its structure.',
    })),
  };
}

function fallbackReview(topic: string, difficulty: string, questions: any[], answers: Record<string, string>) {
  return {
    rating: 4,
    summary: `Your ${difficulty.toLowerCase()} ${topic.toLowerCase()} mock interview showed strong clarity and understanding. Continue refining your answer structure and examples to make your explanations even more compelling.`,
    strengths: 'You demonstrated a thoughtful and logical approach to the questions.',
    improvements: 'Add more specific examples, focus on impact, and be concise in your responses.',
  };
}

export async function POST(request: NextRequest) {
  const accessToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!accessToken || !appConfig.supabaseUrl || !appConfig.supabaseAnonKey) {
    return NextResponse.json({ error: 'You must be signed in to take a test.' }, { status: 401 });
  }
  const supabase = createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey);
  const { data: userData, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !userData.user) {
    return NextResponse.json({ error: 'Your sign-in session is invalid or expired.' }, { status: 401 });
  }

  const body = await request.json();
  const mode = body?.mode;

  if (!mode) {
    return NextResponse.json({ error: 'Missing mode in request.' }, { status: 400 });
  }

  try {
    if (mode === 'generate_practice') {
      const { exam, topic, difficulty } = body;
      const prompt = `Create four varied study questions for a ${difficulty} ${topic} practice quiz for ${exam}. Match the official syllabus and difficulty of this exam. Include two multiple_choice questions with options and correct answers, one coding-style prompt where relevant, and one reasoning prompt. Return only valid JSON in this exact shape: {"questions":[{"id":1,"type":"multiple_choice","text":"...","options":["..."],"answer":"..."}]}.`;
      const text = await callGemini(prompt).catch(() => JSON.stringify(fallbackPractice(topic, difficulty)));
      let data = null;
      try {
        data = parseJsonResponse(text);
      } catch {
        data = fallbackPractice(topic, difficulty);
      }
      return NextResponse.json(data);
    }

    if (mode === 'generate_interview') {
      const { topic, difficulty } = body;
      const prompt = `Generate a JSON array of three concise interview prompts for a ${difficulty} ${topic} mock interview. Use property names id and prompt and return only JSON.`;
      const text = await callGemini(prompt).catch(() => JSON.stringify(fallbackInterview(topic, difficulty)));
      let data = null;
      try {
        data = parseJsonResponse(text);
      } catch {
        data = fallbackInterview(topic, difficulty);
      }
      return NextResponse.json(data);
    }

    if (mode === 'submit_feedback') {
      const { topic, difficulty, questions, answers } = body;
      const prompt = `A user completed a ${difficulty} ${topic} practice set. Questions and answers follow. Return only valid JSON in this exact shape: {"explanation":"summary","results":[{"id":1,"correct":true,"correctAnswer":"...","explanation":"..."}]}. Include one result for every question, mark multiple-choice answers exactly, and explain each result briefly.`;
      const details = `Questions: ${JSON.stringify(questions)}\nAnswers: ${JSON.stringify(answers)}`;
      const text = await callGemini(prompt + '\n' + details).catch(() => JSON.stringify(fallbackFeedback(questions, answers)));
      let explanation = typeof text === 'string' ? text : '';
      if (explanation.startsWith('{') || explanation.startsWith('[')) {
        try {
          const parsed = parseJsonResponse(text);
          explanation = parsed.explanation ?? JSON.stringify(parsed);
        } catch {
          explanation = text;
        }
      }
      let results = [];
      try {
        const parsed = parseJsonResponse(text);
        explanation = parsed.explanation ?? explanation;
        results = parsed.results ?? [];
      } catch {
        results = fallbackFeedback(questions, answers).results;
      }
      results = normalizeFeedbackResults(results, questions, answers);
      return NextResponse.json({ explanation, results });
    }

    if (mode === 'interview_review') {
      const { topic, difficulty, questions, answers } = body;
      const prompt = `A candidate completed a ${difficulty} ${topic} mock interview. Provide a JSON object with keys rating (1-5), summary, strengths, and improvements. Use the candidate answers and give concise advice. Return only JSON.`;
      const details = `Questions: ${JSON.stringify(questions)}\nAnswers: ${JSON.stringify(answers)}`;
      const text = await callGemini(prompt + '\n' + details).catch(() => JSON.stringify(fallbackReview(topic, difficulty, questions, answers)));
      let data;
      try {
        data = parseJsonResponse(text);
      } catch {
        data = fallbackReview(topic, difficulty, questions, answers);
      }
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Unsupported AI mode.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'AI request failed.' }, { status: 500 });
  }
}
