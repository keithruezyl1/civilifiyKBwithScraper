import OpenAI from 'openai';

let openai = null;

// Initialize OpenAI only if API key is available
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function embedText(input) {
  if (!openai) {
    throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
  }
  
  const text = Array.isArray(input) ? input.join('\n\n') : String(input || '');
  const resp = await openai.embeddings.create({
    model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    input: text,
  });
  return resp.data[0].embedding;
}



