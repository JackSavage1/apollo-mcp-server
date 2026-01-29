/**
 * Apollo Enrich Person Tool
 */

import { z } from 'zod';
import { ApolloClient } from '../apollo/client.js';
import { EnrichmentResult } from '../apollo/types.js';

// Input schema for validation
export const enrichPersonInputSchema = z
  .object({
    email: z.string().email().optional().describe('Email address to match'),
    linkedin_url: z
      .string()
      .url()
      .optional()
      .describe('LinkedIn profile URL (e.g., https://linkedin.com/in/username)'),
    first_name: z.string().max(100).optional().describe('First name'),
    last_name: z.string().max(100).optional().describe('Last name'),
    name: z.string().max(200).optional().describe('Full name'),
    organization_name: z.string().max(200).optional().describe('Company name'),
    domain: z
      .string()
      .max(200)
      .optional()
      .describe('Company domain (e.g., example.com)'),
    reveal_personal_emails: z
      .boolean()
      .optional()
      .default(false)
      .describe('Request personal email addresses (may consume additional credits)'),
    reveal_phone_number: z
      .boolean()
      .optional()
      .default(false)
      .describe('Request phone numbers (may consume additional credits)'),
    run_waterfall_email: z
      .boolean()
      .optional()
      .describe('Enable async waterfall email enrichment (requires webhook_url)'),
    run_waterfall_phone: z
      .boolean()
      .optional()
      .describe('Enable async waterfall phone enrichment (requires webhook_url)'),
    webhook_url: z
      .string()
      .url()
      .optional()
      .describe('Webhook URL for receiving async enrichment results'),
  })
  .refine(
    (data) => {
      // At least one identifier must be provided
      return (
        data.email ||
        data.linkedin_url ||
        (data.first_name && data.last_name && (data.organization_name || data.domain)) ||
        (data.name && (data.organization_name || data.domain))
      );
    },
    {
      message:
        'At least one identifier required: email, linkedin_url, or (name + company/domain)',
    }
  )
  .refine(
    (data) => {
      // If waterfall is enabled, webhook_url is required
      if (data.run_waterfall_email || data.run_waterfall_phone) {
        return !!data.webhook_url;
      }
      return true;
    },
    {
      message: 'webhook_url is required when run_waterfall_email or run_waterfall_phone is enabled',
    }
  );

export type EnrichPersonInput = z.infer<typeof enrichPersonInputSchema>;

// Tool definition for MCP
export const enrichPersonToolDefinition = {
  name: 'apollo_enrich_person',
  description: `Enrich a person's profile with contact information from Apollo.io.

Use this to get email addresses and phone numbers that are NOT returned by search.

Identification priority (provide at least one):
1. email - Most reliable
2. linkedin_url - Very reliable
3. name + organization_name/domain - Good for known contacts

Set reveal_personal_emails=true to get personal email addresses.
Set reveal_phone_number=true to get phone numbers.

For waterfall enrichment (async): set run_waterfall_email/run_waterfall_phone and provide webhook_url.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      email: {
        type: 'string',
        description: 'Email address to match',
      },
      linkedin_url: {
        type: 'string',
        description: 'LinkedIn profile URL',
      },
      first_name: {
        type: 'string',
        description: 'First name',
      },
      last_name: {
        type: 'string',
        description: 'Last name',
      },
      name: {
        type: 'string',
        description: 'Full name',
      },
      organization_name: {
        type: 'string',
        description: 'Company name',
      },
      domain: {
        type: 'string',
        description: 'Company domain (e.g., example.com)',
      },
      reveal_personal_emails: {
        type: 'boolean',
        description: 'Request personal email addresses (default: false)',
      },
      reveal_phone_number: {
        type: 'boolean',
        description: 'Request phone numbers (default: false)',
      },
      run_waterfall_email: {
        type: 'boolean',
        description: 'Enable async waterfall email enrichment',
      },
      run_waterfall_phone: {
        type: 'boolean',
        description: 'Enable async waterfall phone enrichment',
      },
      webhook_url: {
        type: 'string',
        description: 'Webhook URL for async results (required for waterfall)',
      },
    },
    required: [],
  },
};

/**
 * Execute the enrich person tool
 */
export async function executeEnrichPerson(
  client: ApolloClient,
  input: unknown,
  serverWebhookUrl?: string
): Promise<EnrichmentResult> {
  // Validate input
  const validatedInput = enrichPersonInputSchema.parse(input);

  // Determine if this is async (waterfall) enrichment
  const isAsync = !!(validatedInput.run_waterfall_email || validatedInput.run_waterfall_phone);

  // Use server's webhook URL if waterfall is enabled but no URL provided
  const webhookUrl = validatedInput.webhook_url || (isAsync ? serverWebhookUrl : undefined);

  // Call Apollo API
  const response = await client.enrichPerson({
    email: validatedInput.email,
    linkedin_url: validatedInput.linkedin_url,
    first_name: validatedInput.first_name,
    last_name: validatedInput.last_name,
    name: validatedInput.name,
    organization_name: validatedInput.organization_name,
    domain: validatedInput.domain,
    reveal_personal_emails: validatedInput.reveal_personal_emails,
    reveal_phone_number: validatedInput.reveal_phone_number,
    run_waterfall_email: validatedInput.run_waterfall_email,
    run_waterfall_phone: validatedInput.run_waterfall_phone,
    webhook_url: webhookUrl,
  });

  // Normalize result
  const normalizedPerson = response.person
    ? ApolloClient.normalizeEnrichedPerson(response.person)
    : null;

  return {
    person: normalizedPerson,
    status: response.status,
    enrichment_request_id: response.enrichment_request_id,
    enrichment_status: response.enrichment_status,
    is_async: isAsync,
    webhook_url: isAsync ? webhookUrl : undefined,
  };
}
