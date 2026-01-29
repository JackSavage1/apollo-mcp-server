/**
 * Apollo.io API Client
 */

import {
  ApolloSearchResponse,
  ApolloEnrichmentRequest,
  ApolloEnrichmentResponse,
  NormalizedPerson,
  ApolloPersonSearch,
  ApolloEnrichedPerson,
} from './types.js';

const APOLLO_BASE_URL = 'https://api.apollo.io/api/v1';
const SEARCH_ENDPOINT = `${APOLLO_BASE_URL}/mixed_people/search`;
const ENRICHMENT_ENDPOINT = `${APOLLO_BASE_URL}/people/match`;

export class ApolloClient {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Apollo API key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Search for people using Apollo's People Search API
   * NOTE: This endpoint does NOT return emails or phone numbers
   */
  async searchPeople(params: {
    person_titles?: string[];
    person_locations?: string[];
    q_keywords?: string;
    page?: number;
    per_page?: number;
  }): Promise<ApolloSearchResponse> {
    const body: Record<string, unknown> = {
      page: params.page || 1,
      per_page: Math.min(params.per_page || 25, 100), // Apollo max is 100
    };

    if (params.person_titles && params.person_titles.length > 0) {
      body.person_titles = params.person_titles;
    }

    if (params.person_locations && params.person_locations.length > 0) {
      body.person_locations = params.person_locations;
    }

    if (params.q_keywords) {
      body.q_keywords = params.q_keywords;
    }

    const response = await this.makeRequest(SEARCH_ENDPOINT, body);
    
    return {
      people: response.people || [],
      pagination: {
        page: response.pagination?.page || params.page || 1,
        per_page: response.pagination?.per_page || params.per_page || 25,
        total_entries: response.pagination?.total_entries || 0,
        total_pages: response.pagination?.total_pages || 0,
      },
    };
  }

  /**
   * Enrich a person using Apollo's People Enrichment API
   * Use reveal flags to request emails/phone numbers
   */
  async enrichPerson(params: ApolloEnrichmentRequest): Promise<ApolloEnrichmentResponse> {
    const body: Record<string, unknown> = {};

    // Identifiers (at least one required)
    if (params.email) body.email = params.email;
    if (params.linkedin_url) body.linkedin_url = params.linkedin_url;
    if (params.first_name) body.first_name = params.first_name;
    if (params.last_name) body.last_name = params.last_name;
    if (params.name) body.name = params.name;
    if (params.organization_name) body.organization_name = params.organization_name;
    if (params.domain) body.domain = params.domain;

    // Reveal flags
    if (params.reveal_personal_emails) body.reveal_personal_emails = true;
    if (params.reveal_phone_number) body.reveal_phone_number = true;

    // Waterfall enrichment
    if (params.run_waterfall_email) body.run_waterfall_email = true;
    if (params.run_waterfall_phone) body.run_waterfall_phone = true;
    if (params.webhook_url) body.webhook_url = params.webhook_url;

    const response = await this.makeRequest(ENRICHMENT_ENDPOINT, body);

    return {
      person: response.person || null,
      status: response.status || 'unknown',
      enrichment_request_id: response.enrichment_request_id,
      enrichment_status: response.enrichment_status,
      credits_used: response.credits_used,
    };
  }

  /**
   * Make authenticated request to Apollo API
   */
  private async makeRequest(url: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      // Don't log the API key or full request body
      throw new Error(`Apollo API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<Record<string, unknown>>;
  }

  /**
   * Normalize a person from search results
   */
  static normalizeSearchPerson(person: ApolloPersonSearch): NormalizedPerson {
    return {
      apollo_id: person.id,
      name: person.name,
      first_name: person.first_name,
      last_name: person.last_name,
      title: person.title,
      headline: person.headline,
      linkedin_url: person.linkedin_url,
      email: null, // Search doesn't return emails
      email_status: person.email_status,
      personal_emails: [],
      phone_numbers: [],
      location: {
        city: person.city,
        state: person.state,
        country: person.country,
      },
      company: {
        id: person.organization_id,
        name: person.organization?.name || null,
        domain: person.organization?.primary_domain || null,
        website: person.organization?.website_url || null,
        linkedin_url: person.organization?.linkedin_url || null,
        industry: person.organization?.industry || null,
        employee_count: person.organization?.estimated_num_employees || null,
      },
      social: {
        twitter_url: person.twitter_url,
        github_url: person.github_url,
        facebook_url: person.facebook_url,
      },
    };
  }

  /**
   * Normalize a person from enrichment results
   */
  static normalizeEnrichedPerson(person: ApolloEnrichedPerson): NormalizedPerson {
    const phoneNumbers: string[] = [];
    
    if (person.sanitized_phone) {
      phoneNumbers.push(person.sanitized_phone);
    }
    
    if (person.phone_numbers) {
      for (const phone of person.phone_numbers) {
        if (phone.sanitized_number && !phoneNumbers.includes(phone.sanitized_number)) {
          phoneNumbers.push(phone.sanitized_number);
        }
      }
    }

    return {
      apollo_id: person.id,
      name: person.name,
      first_name: person.first_name,
      last_name: person.last_name,
      title: person.title,
      headline: person.headline,
      linkedin_url: person.linkedin_url,
      email: person.email,
      email_status: person.email_status,
      personal_emails: person.personal_emails || [],
      phone_numbers: phoneNumbers,
      location: {
        city: person.city,
        state: person.state,
        country: person.country,
      },
      company: {
        id: person.organization_id,
        name: person.organization?.name || null,
        domain: person.organization?.primary_domain || null,
        website: person.organization?.website_url || null,
        linkedin_url: person.organization?.linkedin_url || null,
        industry: person.organization?.industry || null,
        employee_count: person.organization?.estimated_num_employees || null,
      },
      social: {
        twitter_url: person.twitter_url,
        github_url: person.github_url,
        facebook_url: person.facebook_url,
      },
    };
  }
}
