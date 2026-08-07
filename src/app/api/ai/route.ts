export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface ResponseContent {
  type?: string;
  text?: string;
}

interface ResponseOutput {
  type?: string;
  content?: ResponseContent[];
}

interface OpenAIResponse {
  output?: ResponseOutput[];
  error?: { message?: string };
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { ok: false, error: 'AI chat is not configured. Add OPENAI_API_KEY to the server environment.' },
      { status: 503 },
    );
  }

  let body: { messages?: ChatMessage[]; category?: string; scenario?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const messages = (body.messages ?? [])
    .filter(
      (message): message is ChatMessage =>
        (message.role === 'user' || message.role === 'assistant') &&
        typeof message.text === 'string' &&
        message.text.trim().length > 0,
    )
    .slice(-20);

  if (!messages.length) {
    return Response.json({ ok: false, error: 'A message is required.' }, { status: 400 });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-5.6-luna',
        store: false,
        instructions: [
          'You are a helpful, concise AI assistant inside a research interface.',
          'Answer the user’s actual question, whatever the topic may be.',
          'The product-ad context below is optional context only. Use it when relevant and ignore it otherwise.',
          `Product category: ${body.category ?? 'unknown'}.`,
          `Ad scenario: ${body.scenario ?? 'not provided'}.`,
        ].join('\n'),
        input: messages.map((message) => ({
          role: message.role,
          content: message.text,
        })),
        reasoning: { effort: 'none' },
        max_output_tokens: 700,
      }),
      signal: AbortSignal.timeout(30_000),
      cache: 'no-store',
    });

    const data = (await response.json()) as OpenAIResponse;
    if (!response.ok) {
      return Response.json(
        { ok: false, error: data.error?.message ?? `AI service returned ${response.status}.` },
        { status: 502 },
      );
    }

    const text = (data.output ?? [])
      .flatMap((item) => item.content ?? [])
      .filter((content) => content.type === 'output_text' && content.text)
      .map((content) => content.text)
      .join('\n')
      .trim();

    if (!text) {
      return Response.json({ ok: false, error: 'The AI returned an empty response.' }, { status: 502 });
    }

    return Response.json({ ok: true, text });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'AI request failed.' },
      { status: 502 },
    );
  }
}
