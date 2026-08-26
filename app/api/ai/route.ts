import { NextRequest, NextResponse } from 'next/server';
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

function fallbackPractice(topic: string, difficulty: string) {
  return {
    questions: [
      {
        id: 1,
        type: 'multiple_choice',
        text: `Which algorithm is best suited for searching a sorted list in ${topic}?`,
        options: ['Linear search', 'Binary search', 'Bubble sort', 'Depth-first search'],
        answer: 'Binary search',
      },
      {
        id: 2,
        type: 'multiple_choice',
        text: `What is an important concept to know when approaching ${topic} interview questions?`,
        options: ['Writing SQL queries', 'Understanding time complexity', 'Designing marketing campaigns', 'Art history knowledge'],
        answer: 'Understanding time complexity',
      },
      {
        id: 3,
        type: 'coding',
        text: `Describe how you would implement a small ${topic} feature or component that demonstrates your problem-solving skills.`,
        answer: 'Describe your design, data flow, and validation approach clearly.',
      },
      {
        id: 4,
        type: 'verbal',
        text: `Explain how you'd prepare for a ${difficulty} ${topic} challenge in an interview.`,
        answer: 'Share your study strategy, practice exercises, and confidence-building plan.',
      },
    ],
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
      const prompt = `A user completed a ${difficulty} ${topic} practice set. Questions and answers follow. Provide a clear feedback summary that describes which multiple-choice questions were correct, plus advice on how they can improve coding and verbal responses. Return only the feedback text.`;
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
      return NextResponse.json({ explanation });
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
