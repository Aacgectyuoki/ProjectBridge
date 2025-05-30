import { vi } from 'vitest';

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-api-key';

// Mock console methods to reduce noise in tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

// Mock OpenAI and LangChain
vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn().mockImplementation(() => ({
    invoke: vi.fn().mockResolvedValue({
      content: JSON.stringify({
        technical: [
          { name: 'Machine Learning', confidence: 0.9 },
          { name: 'Deep Learning', confidence: 0.8 }
        ],
        soft: [
          { name: 'Team Leadership', confidence: 0.9 },
          { name: 'Communication', confidence: 0.9 },
          { name: 'Problem Solving', confidence: 0.9 }
        ],
        tools: [
          { name: 'Docker', confidence: 0.9 },
          { name: 'Kubernetes', confidence: 0.9 },
          { name: 'Jenkins', confidence: 0.8 }
        ],
        frameworks: [
          { name: 'React', confidence: 0.9 },
          { name: 'Node.js', confidence: 0.9 },
          { name: 'Express', confidence: 0.9 },
          { name: 'Django', confidence: 0.9 }
        ],
        languages: [
          { name: 'JavaScript', confidence: 0.9 },
          { name: 'TypeScript', confidence: 0.9 },
          { name: 'Python', confidence: 0.9 },
          { name: 'Java', confidence: 0.9 }
        ],
        databases: [
          { name: 'PostgreSQL', confidence: 0.9 },
          { name: 'MongoDB', confidence: 0.9 },
          { name: 'Redis', confidence: 0.9 }
        ],
        methodologies: [],
        platforms: [
          { name: 'AWS', confidence: 0.9 }
        ],
        other: []
      })
    })
  }))
})); 