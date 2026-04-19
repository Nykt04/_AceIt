import Constants from 'expo-constants';

const extra = () => Constants.expoConfig?.extra || {};

/**
 * OpenRouter (recommended): EXPO_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-...
 * Legacy: same key in EXPO_PUBLIC_OPENAI_API_KEY
 * Optional OpenAI direct: EXPO_PUBLIC_OPENAI_API_KEY=sk-... or sk-proj-... (not sk-or-v1-)
 */
const getApiKey = () => {
  const openrouter =
    process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || extra().openrouterApiKey || '';
  const openaiSlot =
    process.env.EXPO_PUBLIC_OPENAI_API_KEY || extra().openaiApiKey || '';

  if (openrouter) return openrouter;
  if (openaiSlot.startsWith('sk-or-v1-')) return openaiSlot;
  if (openaiSlot && !openaiSlot.startsWith('AIza')) return openaiSlot;
  return '';
};

const buildMessages = (topic, count, types) => {
  const typeList = [];
  if (types.multipleChoice) typeList.push('multiple choice');
  if (types.trueFalse) typeList.push('true or false');
  const typeStr = typeList.join(' and ');
  return [
    {
      role: 'system',
      content: `You are a helpful study assistant. Generate quiz questions in valid JSON only. No markdown, no code blocks, no extra text.
For multiple choice: use format { "type": "multiple_choice", "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0 }
For true/false: use format { "type": "true_false", "question": "...", "correctAnswer": true } or "correctAnswer": false
Return a JSON array of question objects.`,
    },
    {
      role: 'user',
      content: `Generate ${count} ${typeStr} questions about: ${topic}. Return only a JSON array.`,
    },
  ];
};

const parseJsonFromResponse = (text) => {
  const trimmed = text.trim();
  const start = trimmed.indexOf('[');
  const end = trimmed.lastIndexOf(']') + 1;
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end));
  } catch {
    return null;
  }
};

const normalizeQuestions = (questions) =>
  questions.map((q, i) => ({
    id: `ai-${Date.now()}-${i}`,
    type: q.type === 'true_false' ? 'true_false' : 'multiple_choice',
    question: q.question || '',
    options: q.options || [],
    correctIndex: q.correctIndex ?? (q.correctAnswer === true ? 0 : 1),
    correctAnswer: q.correctAnswer,
  }));

const generateWithOpenAICompatible = async (apiKey, topic, count, types) => {
  const isOpenRouter = apiKey.startsWith('sk-or-v1-');
  const apiUrl = isOpenRouter
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  if (isOpenRouter) {
    headers['HTTP-Referer'] = 'https://aceit-app.local';
    headers['X-Title'] = 'AceIt App';
  }

  const model =
    process.env.EXPO_PUBLIC_OPENROUTER_MODEL ||
    extra().openrouterModel ||
    (isOpenRouter ? 'openai/gpt-4o-mini' : 'gpt-4o-mini');

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: buildMessages(topic, count, types),
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    let errorMessage = err || `API error: ${response.status}`;
    try {
      const errorData = JSON.parse(err);
      errorMessage =
        errorData.error?.message ||
        errorData.message ||
        (typeof errorData.error === 'string' ? errorData.error : null) ||
        errorMessage;
    } catch {
      /* keep */
    }

    if (/user not found/i.test(errorMessage)) {
      errorMessage =
        `${errorMessage} — Create a valid key at openrouter.ai/keys and set EXPO_PUBLIC_OPENROUTER_API_KEY (or sk-or-v1- in EXPO_PUBLIC_OPENAI_API_KEY).`;
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No response from AI');

  const questions = parseJsonFromResponse(content);
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('Could not parse questions from AI response');
  }

  return normalizeQuestions(questions);
};

export const generateQuestions = async (
  topic,
  count = 5,
  types = { multipleChoice: true, trueFalse: true }
) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      'No API key set. Add EXPO_PUBLIC_OPENROUTER_API_KEY (sk-or-v1-...) or put the same key in EXPO_PUBLIC_OPENAI_API_KEY.'
    );
  }

  return generateWithOpenAICompatible(apiKey, topic, count, types);
};
