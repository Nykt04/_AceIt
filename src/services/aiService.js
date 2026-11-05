import Constants from 'expo-constants';
import { logError } from './notificationService';

const extra = () => Constants.expoConfig?.extra || {};

/**
 * OpenRouter (recommended): EXPO_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-...
 * Legacy: same key in EXPO_PUBLIC_OPENAI_API_KEY
 * Optional OpenAI direct: EXPO_PUBLIC_OPENAI_API_KEY=sk-... or sk-proj-... (not sk-or-v1-)
 */
export const getApiKey = () => {
  const openrouter =
    process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || extra().openrouterApiKey || '';
  const openaiSlot =
    process.env.EXPO_PUBLIC_OPENAI_API_KEY || extra().openaiApiKey || '';

  if (openrouter) return openrouter.trim();
  if (openaiSlot.startsWith('sk-or-v1-')) return openaiSlot.trim();
  if (openaiSlot && !openaiSlot.startsWith('AIza')) return openaiSlot.trim();
  return '';
};

// Fallback model list on OpenRouter: tries deepseek-chat first, then gemini-2.0-flash, then llama-3.3
const OPENROUTER_MODELS = [
  process.env.EXPO_PUBLIC_OPENROUTER_MODEL || 'deepseek/deepseek-chat',
  'google/gemini-2.0-flash-001',
  'meta-llama/llama-3.3-70b-instruct:free',
];

/**
 * Resilient JSON parser for LLM responses.
 * Handles markdown code fences, trailing commas, smart quotes,
 * conversational preambles/postscripts, and wrapped objects.
 */
export const parseJsonFromResponse = (text) => {
  if (!text || typeof text !== 'string') return null;
  let cleaned = text.trim();

  // Strip markdown code fences if present (```json ... ``` or ``` ...)
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  // 1. Try direct array parse [ ... ]
  const startArr = cleaned.indexOf('[');
  const endArr = cleaned.lastIndexOf(']');
  if (startArr !== -1 && endArr > startArr) {
    const candidate = cleaned.slice(startArr, endArr + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      try {
        const repaired = candidate
          .replace(/,\s*([\]}])/g, '$1') // remove trailing commas
          .replace(/[\u201C\u201D]/g, '"') // replace smart double quotes
          .replace(/[\u2018\u2019]/g, "'"); // replace smart single quotes
        return JSON.parse(repaired);
      } catch {
        /* continue */
      }
    }
  }

  // 2. Try JSON object parse { ... }
  const startObj = cleaned.indexOf('{');
  const endObj = cleaned.lastIndexOf('}');
  if (startObj !== -1 && endObj > startObj) {
    const candidate = cleaned.slice(startObj, endObj + 1);
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed.questions)) return parsed.questions;
      if (Array.isArray(parsed.items)) return parsed.items;
      if (Array.isArray(parsed.cards)) return parsed.cards;
      if (Array.isArray(parsed.flashcards)) return parsed.flashcards;
      if (Array.isArray(parsed.data)) return parsed.data;
      return parsed; // could be full study deck object { flashcards, questions }
    } catch {
      try {
        const repaired = candidate
          .replace(/,\s*([\]}])/g, '$1')
          .replace(/[\u201C\u201D]/g, '"')
          .replace(/[\u2018\u2019]/g, "'");
        const parsed = JSON.parse(repaired);
        if (Array.isArray(parsed)) return parsed;
        if (Array.isArray(parsed.questions)) return parsed.questions;
        if (Array.isArray(parsed.items)) return parsed.items;
        if (Array.isArray(parsed.cards)) return parsed.cards;
        if (Array.isArray(parsed.flashcards)) return parsed.flashcards;
        return parsed;
      } catch {
        /* fail */
      }
    }
  }

  return null;
};

/**
 * Standardize and sanitize generated questions
 */
export const normalizeQuestions = (questions) => {
  if (!Array.isArray(questions)) return [];

  return questions
    .filter((q) => q && (q.question || q.prompt || q.text))
    .map((q, i) => {
      const rawQuestion = String(q.question || q.prompt || q.text || '').trim();
      const isTF =
        q.type === 'true_false' ||
        (Array.isArray(q.options) &&
          q.options.length === 2 &&
          (q.options[0]?.toLowerCase() === 'true' || q.options[1]?.toLowerCase() === 'true'));

      let options = [];
      let correctIdx = 0;

      if (isTF) {
        options = ['True', 'False'];
        if (typeof q.correctAnswer === 'boolean') {
          correctIdx = q.correctAnswer ? 0 : 1;
        } else if (typeof q.correctIndex === 'number') {
          correctIdx = q.correctIndex === 0 ? 0 : 1;
        } else if (typeof q.correctAnswer === 'string') {
          correctIdx = q.correctAnswer.toLowerCase() === 'true' ? 0 : 1;
        }
      } else {
        options = Array.isArray(q.options) && q.options.length >= 2
          ? q.options.map((opt) => String(opt).trim())
          : ['Option A', 'Option B', 'Option C', 'Option D'];

        correctIdx = typeof q.correctIndex === 'number'
          ? Math.max(0, Math.min(options.length - 1, q.correctIndex))
          : 0;
      }

      return {
        id: `ai-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        type: isTF ? 'true_false' : 'multiple_choice',
        question: rawQuestion,
        options,
        correctIndex: correctIdx,
        correctAnswer: isTF ? correctIdx === 0 : undefined,
        explanation: q.explanation || 'Based on core subject principles.',
      };
    });
};

/**
 * Standardize and sanitize generated flashcards
 */
export const normalizeFlashcards = (cards) => {
  if (!Array.isArray(cards)) return [];

  return cards
    .filter((c) => c && (c.term || c.front || c.concept || c.key))
    .map((c, i) => ({
      id: `fc-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      term: String(c.term || c.front || c.concept || c.key || 'Term').trim(),
      definition: String(c.definition || c.back || c.meaning || c.explanation || 'Definition').trim(),
    }));
};

const calculateMaxTokens = (count) => {
  const baseTokens = count * 120;
  const buffer = 600;
  return Math.min(Math.max(baseTokens + buffer, 2000), 4000);
};

/**
 * Shared executor for OpenRouter and OpenAI API requests
 */
const executeAiRequest = async (apiKey, messages, maxTokens = 2500, temperature = 0.4) => {
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
    headers['X-Title'] = 'AceIt Study Buddy';
  }

  const payload = {
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (isOpenRouter) {
    payload.models = OPENROUTER_MODELS;
  } else {
    payload.model = 'gpt-4o-mini';
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    let errorMessage = `AI error: HTTP ${response.status}`;
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
        'Invalid API key. Check your OpenRouter key (sk-or-v1-...) in Settings.';
    } else if (response.status === 429) {
      errorMessage = 'Rate limit reached. Please wait a few seconds and try again.';
    } else if (response.status === 500) {
      errorMessage = 'AI service temporarily busy. Please retry in a moment.';
    }

    const error = new Error(errorMessage);
    logError('executeAiRequest', error, { status: response.status });
    throw error;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response received from AI model.');
  }

  return content;
};

/**
 * Generate Quiz Questions from Topic
 */
export const generateQuestions = async (
  topic,
  count = 5,
  types = { multipleChoice: true, trueFalse: true },
  difficulty = 'intermediate'
) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      'No API key configured. Please set EXPO_PUBLIC_OPENROUTER_API_KEY in .env.'
    );
  }

  const typeList = [];
  if (types.multipleChoice) typeList.push('multiple choice');
  if (types.trueFalse) typeList.push('true or false');
  const typeStr = typeList.length > 0 ? typeList.join(' and ') : 'multiple choice';

  const messages = [
    {
      role: 'system',
      content: `You are an expert exam author. Create high-quality, academic quiz questions formatted as a strict JSON array.
Format specifications:
For multiple choice:
{
  "type": "multiple_choice",
  "question": "Clear, direct question prompt",
  "options": ["A", "B", "C", "D"],
  "correctIndex": 0,
  "explanation": "Clear reason why this answer is correct."
}
For true/false:
{
  "type": "true_false",
  "question": "Clear factual statement",
  "correctAnswer": true,
  "explanation": "Clear justification."
}
Difficulty level: ${difficulty}.
Return ONLY a valid JSON array of question objects. No markdown formatting, no comments, no extra text.`,
    },
    {
      role: 'user',
      content: `Generate ${count} ${typeStr} questions on the topic: "${topic}". Ensure questions test deep comprehension, not trivial trivia. Provide explanations for every question. Return valid JSON only.`,
    },
  ];

  const maxTokens = calculateMaxTokens(count);
  const rawText = await executeAiRequest(apiKey, messages, maxTokens);
  const parsed = parseJsonFromResponse(rawText);

  if (!parsed) {
    throw new Error('Could not parse quiz questions from AI response. Please try again.');
  }

  const rawList = Array.isArray(parsed) ? parsed : (parsed.questions || []);
  const normalized = normalizeQuestions(rawList);

  if (normalized.length === 0) {
    throw new Error('No valid questions could be extracted. Please try a different topic.');
  }

  // Gracefully slice if LLM generated extra questions; do not crash if it produced count or count-1
  return normalized.slice(0, count);
};

/**
 * Generate Quiz Questions from Study Material Text (PDF/Doc/Notes)
 */
export const generateQuestionsFromText = async (textContent, count = 5) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      'No API key configured. Please set EXPO_PUBLIC_OPENROUTER_API_KEY in .env.'
    );
  }

  if (!textContent || textContent.trim().length === 0) {
    throw new Error('Please provide study material text.');
  }

  const trimmedText = textContent.slice(0, 14000); // Guard against context blowout

  const messages = [
    {
      role: 'system',
      content: `You are an expert educator. Extract key concepts from the source material and produce rigorous quiz questions.
Output must be a strict JSON array of question objects.
- Multiple choice format: { "type": "multiple_choice", "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "..." }
- True/False format: { "type": "true_false", "question": "...", "correctAnswer": true, "explanation": "..." }
Return ONLY the JSON array.`,
    },
    {
      role: 'user',
      content: `Source Study Material:\n\"\"\"\n${trimmedText}\n\"\"\"\n\nGenerate ${count} questions based directly on facts and principles in the study material above. Include informative explanations citing the material. Return a JSON array only.`,
    },
  ];

  const maxTokens = calculateMaxTokens(count);
  const rawText = await executeAiRequest(apiKey, messages, maxTokens);
  const parsed = parseJsonFromResponse(rawText);

  if (!parsed) {
    throw new Error('Could not parse questions from the provided document. Please try again with shorter text.');
  }

  const rawList = Array.isArray(parsed) ? parsed : (parsed.questions || []);
  const normalized = normalizeQuestions(rawList);

  if (normalized.length === 0) {
    throw new Error('No questions could be extracted from this text. Ensure your document contains substantive study material.');
  }

  return normalized.slice(0, count);
};

/**
 * Generate Flashcards (Concept & Definition pairs) from Topic or Text
 */
export const generateFlashcards = async (topicOrText, count = 8, isDocument = false) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No API key configured. Please set EXPO_PUBLIC_OPENROUTER_API_KEY in .env.');
  }

  const trimmed = String(topicOrText || '').slice(0, 14000);
  if (!trimmed.trim()) {
    throw new Error('Please provide a topic or study text to generate flashcards.');
  }

  const messages = [
    {
      role: 'system',
      content: `You are a cognitive study expert. Create high-yield flashcard decks with concise, memorable terms and definitions.
Format as a strict JSON array:
[
  { "term": "Concept, Term, or Principle", "definition": "Clear, concise definition or formula (1-2 sentences max)" }
]
Focus on foundational definitions, key mechanisms, and core facts. Return ONLY the JSON array.`,
    },
    {
      role: 'user',
      content: isDocument
        ? `Extract ${count} essential flashcard terms and definitions from this material:\n\"\"\"\n${trimmed}\n\"\"\"\nReturn JSON only.`
        : `Generate ${count} essential flashcards for studying "${trimmed}". Return JSON only.`,
    },
  ];

  const maxTokens = calculateMaxTokens(count);
  const rawText = await executeAiRequest(apiKey, messages, maxTokens);
  const parsed = parseJsonFromResponse(rawText);

  if (!parsed) {
    throw new Error('Could not parse flashcards from AI response.');
  }

  const rawList = Array.isArray(parsed) ? parsed : (parsed.flashcards || parsed.cards || parsed.terms || []);
  const normalized = normalizeFlashcards(rawList);

  if (normalized.length === 0) {
    throw new Error('No flashcards could be generated. Please try again.');
  }

  return normalized.slice(0, count);
};

/**
 * Generate a Complete Dual Study Deck: Flashcards AND Quiz Questions simultaneously!
 * Gives students both vocabulary mastery and test preparation in one call.
 */
export const generateStudyDeck = async (
  topicOrText,
  { questionCount = 5, flashcardCount = 6, isDocument = false, difficulty = 'intermediate' } = {}
) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No API key configured. Please set EXPO_PUBLIC_OPENROUTER_API_KEY in .env.');
  }

  const trimmed = String(topicOrText || '').slice(0, 14000);
  if (!trimmed.trim()) {
    throw new Error('Please provide a topic or document to generate your study deck.');
  }

  const messages = [
    {
      role: 'system',
      content: `You are an elite academic tutor. Generate a complete study deck containing BOTH flashcards and quiz questions in a single JSON object.
JSON structure:
{
  "title": "Short descriptive deck title",
  "flashcards": [
    { "term": "Short concept name", "definition": "Precise, memorable explanation" }
  ],
  "questions": [
    {
      "type": "multiple_choice",
      "question": "Question prompt",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Why this option is correct"
    },
    {
      "type": "true_false",
      "question": "Statement",
      "correctAnswer": true,
      "explanation": "Why this statement is true"
    }
  ]
}
Difficulty: ${difficulty}. Return ONLY valid JSON.`,
    },
    {
      role: 'user',
      content: isDocument
        ? `Generate a study deck with ${flashcardCount} flashcards and ${questionCount} quiz questions based on this study material:\n\"\"\"\n${trimmed}\n\"\"\"\nReturn JSON only.`
        : `Generate a comprehensive study deck with ${flashcardCount} flashcards and ${questionCount} quiz questions about "${trimmed}". Return JSON only.`,
    },
  ];

  const totalItems = questionCount + flashcardCount;
  const maxTokens = calculateMaxTokens(totalItems);
  const rawText = await executeAiRequest(apiKey, messages, maxTokens);
  const parsed = parseJsonFromResponse(rawText);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Failed to generate full study deck. Please try again.');
  }

  const rawCards = Array.isArray(parsed) ? [] : (parsed.flashcards || parsed.cards || parsed.terms || []);
  const rawQuestions = Array.isArray(parsed) ? parsed : (parsed.questions || []);

  const flashcards = normalizeFlashcards(rawCards);
  const questions = normalizeQuestions(rawQuestions);

  // If flashcards were empty but questions exist, create flashcard terms from question key points
  if (flashcards.length === 0 && questions.length > 0) {
    questions.forEach((q, i) => {
      flashcards.push({
        id: `fc-fallback-${i}`,
        term: q.type === 'true_false' ? `Fact #${i + 1}` : (q.options[q.correctIndex] || `Concept #${i + 1}`),
        definition: q.explanation || q.question,
      });
    });
  }

  return {
    title: parsed.title || (isDocument ? 'Document Study Deck' : trimmed),
    flashcards: flashcards.slice(0, flashcardCount),
    questions: questions.slice(0, questionCount),
  };
};

/**
 * Convert flashcard terms into quiz questions
 */
export const generateQuestionsFromTerms = async (terms, count = 5) => {
  if (!Array.isArray(terms) || terms.length === 0) {
    throw new Error('No terms provided to convert');
  }

  const formattedTerms = terms
    .filter((t) => t.term && t.definition)
    .map((t) => `Term: "${t.term}" - Definition: "${t.definition}"`)
    .join('\n');

  if (!formattedTerms) {
    throw new Error('No valid terms found to convert');
  }

  return generateQuestionsFromText(formattedTerms, Math.min(count, terms.length * 2));
};

/**
 * Generate a quick AI explanation or breakdown for a concept
 */
export const getAiExplanation = async (conceptOrQuestion) => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const messages = [
      {
        role: 'system',
        content: 'You are an encouraging study tutor. Provide a 2-3 sentence intuitive explanation or memory mnemonic for the concept.',
      },
      {
        role: 'user',
        content: `Explain this clearly and simply: "${conceptOrQuestion}"`,
      },
    ];

    return await executeAiRequest(apiKey, messages, 300, 0.6);
  } catch {
    return null;
  }
};
