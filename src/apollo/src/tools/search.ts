/**
 * Apollo Search People Tool
 */

import { z } from 'zod';
import { ApolloClient } from '../apollo/client.js';
import { SearchResult } from '../apollo/types.js';

// Input schema for validation
export const searchPeopleInputSchema = z.object({
  person_titles: z
    .array(z.string())
    .min(1)
    .max(50)
    .describe('Job titles to search for (e.g., ["CEO", "CTO", "VP Sales"])'),
  person_locations: z
    .array(z.string())
    .max(50)
    .optional()
    .describe('Locations to filter by (e.g., ["San Francisco", "New York", "United States"])'),
  q_keywords: z
    .string()
    .max(500)
    .optional()
    .describe('Keywords to search for in person profiles'),
  page: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(1)
    .describe('Page number for pagination (default: 1)'),
  per_page: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(25)
    .describe('Results per page (default: 25, max: 100)'),
});

export type SearchPeopleInput = z.infer<typeof searchPeopleInputSchema>;

// Tool definition for MCP
export const searchPeopleToolDefinition = {
  name: 'apollo_search_people',
  description: `Search for people in Apollo.io's database by job title, location, and keywords.

IMPORTANT: This search endpoint does NOT return email addresses or phone numbers.
To get contact information, use apollo_enrich_person or apollo_search_and_enrich_people.

Returns: Name, title, company info, LinkedIn URL, location, and Apollo person ID (for enrichment).`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      person_titles: {
        type: 'array',
        items: { type: 'string' },
        description: 'Job titles to search for (e.g., ["CEO", "CTO", "VP Sales"])',
      },
      person_locations: {
        type: 'array',
        items: { type: 'string' },
        description: 'Locations to filter by (e.g., ["San Francisco", "New York"])',
      },
      q_keywords: {
        type: 'string',
        description: 'Keywords to search for in person profiles',
      },
      page: {
        type: 'number',
        description: 'Page number for pagination (default: 1)',
      },
      per_page: {
        type: 'number',
        description: 'Results per page (default: 25, max: 100)',
      },
    },
    required: ['person_titles'],
  },
};

/**
 * Execute the search people tool
 */
export async function executeSearchPeople(
  client: ApolloClient,
  input: unknown
): Promise<SearchResult> {
  // Validate input
  const validatedInput = searchPeopleInputSchema.parse(input);

  // Call Apollo API
  const response = await client.searchPeople({
    person_titles: validatedInput.person_titles,
    person_locations: validatedInput.person_locations,
    q_keywords: validatedInput.q_keywords,
    page: validatedInput.page,
    per_page: validatedInput.per_page,
  });

  // Normalize results
  const normalizedPeople = response.people.map(ApolloClient.normalizeSearchPerson);

  return {
    people: normalizedPeople,
    pagination: response.pagination,
  };
}
