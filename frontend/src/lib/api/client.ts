import { z } from 'zod';
import {
  eligibilityRequestSchema,
  eligibilityResponseSchema,
  productsResponseSchema,
  rateRequestSchema,
  rateResponseSchema,
  validationRulesSchema,
  type EligibilityRequest,
  type EligibilityResponse,
  type ProductsResponse,
  type RateRequest,
  type RateResponse,
  type ValidationRules,
} from './contracts';

async function request<T>(url: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
  });
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message = json && typeof json === 'object' && 'error' in json && typeof json.error === 'string' ? json.error : 'Request failed';
    throw new Error(message);
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw new Error('Unexpected response');
  return parsed.data;
}

export const fetchProducts = (): Promise<ProductsResponse> => request('/api/loans/products', productsResponseSchema);

export const fetchValidationRules = (): Promise<ValidationRules> => request('/api/loans/validation-rules', validationRulesSchema);

export const postEligibility = (body: EligibilityRequest): Promise<EligibilityResponse> =>
  request('/api/loans/eligibility', eligibilityResponseSchema, { method: 'POST', body: JSON.stringify(eligibilityRequestSchema.parse(body)) });

export const postRate = (body: RateRequest): Promise<RateResponse> =>
  request('/api/loans/calculate-rate', rateResponseSchema, { method: 'POST', body: JSON.stringify(rateRequestSchema.parse(body)) });
