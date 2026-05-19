import Constants from 'expo-constants';
import { logError } from './notificationService';

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
For multiple choice: use format { "type": "multiple_choice", "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "Why this is correct..." }
For true/false: use format { "type": "true_false", "question": "...", "correctAnswer": true, "explanation": "Why this is correct..." } or "correctAnswer": false
IMPORTANT: Include "explanation" field for every question that explains why the correct answer is right.
Return a JSON array of question objects.`,
    },
    {
      role: 'user',
      content: `Generate ${count} ${typeStr} questions about: ${topic}. Include clear explanations for why each correct answer is right. Return only a JSON array.`,
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
    explanation: q.explanation || 'No explanation provided',
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
    (isOpenRouter ? 'deepseek/deepseek-chat' : 'deepseek/deepseek-chat');

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

const buildMessagesFromText = (textContent, count) => {
  return [
    {
      role: 'system',
      content: `You are a helpful study assistant. Generate quiz questions based on provided text in valid JSON only. No markdown, no code blocks, no extra text.
For multiple choice: use format { "type": "multiple_choice", "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "Why this is correct..." }
For true/false: use format { "type": "true_false", "question": "...", "correctAnswer": true, "explanation": "Why this is correct..." } or "correctAnswer": false
Create questions that test understanding of the key concepts in the text.
IMPORTANT: Include "explanation" field for every question that explains why the correct answer is right based on the provided text.
Return a JSON array of question objects.`,
    },
    {
      role: 'user',
      content: `Here is the study material:\n\n${textContent}\n\nGenerate ${count} questions (mix of multiple choice and true/false) based on this text. Focus on important concepts and facts mentioned. Include detailed explanations for each question explaining why the correct answer is right. Return only a JSON array.`,
    },
  ];
};

const generateWithTextContent = async (apiKey, textContent, count) => {
  try {
    console.log(`[AIService] Generating ${count} questions from text (${textContent.length} chars)`);

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
      (isOpenRouter ? 'deepseek/deepseek-chat' : 'deepseek/deepseek-chat');

    console.log(`[AIService] Using model: ${model}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: buildMessagesFromText(textContent, count),
        temperature: 0.7,
        max_tokens: 3000,
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

      if (/user not found/i.test(errorMessage) || response.status === 401) {
        errorMessage =
          'Invalid API key. Create a valid key at openrouter.ai/keys and set EXPO_PUBLIC_OPENROUTER_API_KEY.';
      } else if (response.status === 429) {
        errorMessage = 'Rate limited. Please wait a moment and try again.';
      } else if (response.status === 500) {
        errorMessage = 'AI service is temporarily unavailable. Please try again later.';
      }

      const error = new Error(errorMessage);
      logError('generateWithTextContent', error, { status: response.status, textLength: textContent.length });
      throw error;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      const error = new Error('No response from AI service');
      logError('generateWithTextContent', error, { responseData: data });
      throw error;
    }

    const questions = parseJsonFromResponse(content);
    
    if (!Array.isArray(questions) || questions.length === 0) {
      const error = new Error(`Generated ${questions?.length || 0} questions, but expected ${count}`);
      logError('generateWithTextContent', error, { generatedCount: questions?.length });
      throw error;
    }

    console.log(`[AIService] Successfully generated ${questions.length} questions`);
    return normalizeQuestions(questions);
  } catch (error) {
    logError('generateWithTextContent', error, { count, textLength: textContent?.length });
    throw error;
  }
};

export const generateQuestionsFromText = async (
  textContent,
  count = 5
) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      'No API key set. Add EXPO_PUBLIC_OPENROUTER_API_KEY (sk-or-v1-...) or put the same key in EXPO_PUBLIC_OPENAI_API_KEY.'
    );
  }

  if (!textContent || textContent.trim().length === 0) {
    throw new Error('Please provide study material text');
  }

  return generateWithTextContent(apiKey, textContent, count);
};
