import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';
import { catchAsync } from '../utils/catch-async.js';
import { BadRequestError, ServiceUnavailableError } from '../utils/app-error.js';

export const supportChatRouter = Router();

/** OpenRouter model catalog (public, no auth). Cached for 10 minutes. */
interface CachedCatalog {
  fetchedAt: number;
  free: string[];
  grok: string[];
}
let openRouterModelsCache: CachedCatalog | null = null;

async function getOpenRouterFreeModels(): Promise<string[]> {
  if (openRouterModelsCache && Date.now() - openRouterModelsCache.fetchedAt < 10 * 60 * 1000) {
    return openRouterModelsCache.free;
  }
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models');
    if (!res.ok) return openRouterModelsCache?.free || [];
    const json: any = await res.json();
    const models: any[] = json?.data || [];
    const free = models
      .filter((m) => m?.pricing?.prompt === '0' && m?.pricing?.completion === '0')
      .map((m) => String(m.id));
    const grok = models
      .filter((m) => String(m.id).toLowerCase().includes('grok'))
      .map((m) => String(m.id));
    // Free Grok first, then the rest of the free pool.
    free.sort((a, b) => Number(b.toLowerCase().includes('grok')) - Number(a.toLowerCase().includes('grok')));
    openRouterModelsCache = { fetchedAt: Date.now(), free, grok };
    return free;
  } catch {
    return openRouterModelsCache?.free || [];
  }
}


const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Business profile doc injected as grounding context for every request. */
function loadBusinessProfile(): string {
  try {
    return fs.readFileSync(path.join(__dirname, '../data/business-profile.md'), 'utf-8');
  } catch {
    return 'AgentLab sells premium AI account subscriptions delivered in under 30 seconds with a 1-for-1 warranty. Pay via PayPal.';
  }
}

/** Naive per-IP rate limit: 20 messages / 5 minutes. */
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 5 * 60 * 1000;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  return list.length > RATE_LIMIT;
}

/**
 * POST /api/support/chat
 * Customer-support consultation chat backed by a free Grok model via OpenRouter.
 * The business profile document is prepended as the system prompt so the model
 * answers with company-specific, up-to-date context instead of guessing.
 */
supportChatRouter.post(
  '/chat',
  catchAsync(async (req: Request, res: Response) => {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : null;
    if (!messages || messages.length === 0) {
      throw new BadRequestError('messages array is required.');
    }

    // Keep only the last 12 turns and sanitize roles — the client does not
    // get to override the system prompt.
    const history = messages
      .slice(-12)
      .filter((m: any) => m && typeof m.content === 'string' && m.content.trim())
      .map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content).slice(0, 4000),
      }));
    if (history.length === 0) {
      throw new BadRequestError('messages array is empty.');
    }

    if (!env.OPENROUTER_API_KEY) {
      throw new ServiceUnavailableError(
        'The consultation assistant is not configured. Please contact us on Telegram: https://t.me/aipro_support'
      );
    }

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || 'unknown';
    if (isRateLimited(ip)) {
      res.status(429).json({
        success: false,
        message: 'Too many messages. Please wait a few minutes or contact us on Telegram: https://t.me/aipro_support',
      });
      return;
    }

    const systemPrompt = `${loadBusinessProfile()}\n\n---\nYou are the AgentLab customer-support assistant. Ground every answer in the business profile above.`;

    // Dynamic model discovery: pull OpenRouter's public catalog, keep the
    // zero-cost models (prefer Grok), and try them in order until one answers.
    // env.GROK_MODEL (if set) is pinned first; paid Grok models are the last
    // resort so the chat still works when the free pool is exhausted.
    const freeModels = await getOpenRouterFreeModels();
    const paidGrok = (openRouterModelsCache?.grok || []).filter((m) => !m.endsWith(':free'));
    const candidates = [
      ...(env.GROK_MODEL ? [env.GROK_MODEL] : []),
      ...freeModels,
      ...paidGrok,
    ].filter((m, i, arr) => arr.indexOf(m) === i);


    let data: any = null;
    let usedModel = '';
    let lastError = '';
    for (const model of candidates) {
      try {
        const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': env.APP_URL || 'http://localhost:5173',
            'X-Title': 'AgentLab Support Chat',
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'system', content: systemPrompt }, ...history],
            max_tokens: 800,
            temperature: 0.3,
          }),
        });

        if (aiRes.ok) {
          data = await aiRes.json();
          usedModel = model;
          break;
        }

        lastError = `${model} -> ${aiRes.status}: ${(await aiRes.text()).slice(0, 200)}`;
        // 401/402 (auth/credits) will not be fixed by trying another model.
        if (aiRes.status === 401 || aiRes.status === 402) break;
      } catch (err) {
        lastError = `${model} -> ${(err as Error).message}`;
      }
    }

    if (!data) {
      console.error('[SupportChat] OpenRouter failed on all models:', lastError);
      throw new ServiceUnavailableError(
        'The consultation assistant is temporarily unavailable. Please try again or contact us on Telegram: https://t.me/aipro_support'
      );
    }
    const reply: string | undefined = data?.choices?.[0]?.message?.content;
    if (!reply) {
      throw new ServiceUnavailableError('The assistant returned an empty answer. Please try again.');
    }

    res.status(200).json({
      success: true,
      data: { reply, model: data.model || usedModel },
    });
  })
);
