/**
 * Apollo.io API Types
 */

// Person from People Search API
export interface ApolloPersonSearch {
  id: string;
  first_name: string | null;
  last_name: string | null;
  name: string | null;
  title: string | null;
  headline: string | null;
  linkedin_url: string | null;
  email_status: string | null;
  photo_url: string | null;
  twitter_url: string | null;
  github_url: string | null;
  facebook_url: string | null;
  state: string | null;
  city: string | null;
  country: string | null;
  organization_id: string | null;
  organization: ApolloOrganization | null;
  employment_history: ApolloEmployment[] | null;
}

export interface ApolloOrganization {
  id: string;
  name: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  primary_domain: string | null;
  logo_url: string | null;
  industry: string | null;
  estimated_num_employees: number | null;
}

export interface ApolloEmployment {
  id: string;
  title: string | null;
  organization_name: string | null;
  organization_id: string | null;
  current: boolean;
  start_date: string | null;
  end_date: string | null;
}

// People Search API Response
export interface ApolloSearchResponse {
  people: ApolloPersonSearch[];
  pagination: {
    page: number;
    per_page: number;
    total_entries: number;
    total_pages: number;
  };
}

// People Enrichment API Request
export interface ApolloEnrichmentRequest {
  // At least one identifier is required
  email?: string;
  linkedin_url?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  organization_name?: string;
  domain?: string;
  
  // Reveal flags
  reveal_personal_emails?: boolean;
  reveal_phone_number?: boolean;
  
  // Waterfall enrichment (async)
  run_waterfall_email?: boolean;
  run_waterfall_phone?: boolean;
  webhook_url?: string;
}

// Enriched Person from People Enrichment API
export interface ApolloEnrichedPerson {
  id: string;
  first_name: string | null;
  last_name: string | null;
  name: string | null;
  title: string | null;
  headline: string | null;
  linkedin_url: string | null;
  email: string | null;
  email_status: string | null;
  personal_emails: string[] | null;
  phone_numbers: ApolloPhoneNumber[] | null;
  sanitized_phone: string | null;
  organization_id: string | null;
  organization: ApolloOrganization | null;
  photo_url: string | null;
  twitter_url: string | null;
  github_url: string | null;
  facebook_url: string | null;
  state: string | null;
  city: string | null;
  country: string | null;
  employment_history: ApolloEmployment[] | null;
}

export interface ApolloPhoneNumber {
  raw_number: string;
  sanitized_number: string;
  type: string;
  position: number;
  status: string;
}

// People Enrichment API Response
export interface ApolloEnrichmentResponse {
  person: ApolloEnrichedPerson | null;
  status: string;
  // Waterfall-specific fields
  enrichment_request_id?: string;
  enrichment_status?: string;
  credits_used?: number;
}

// Webhook payload for async enrichment results
export interface ApolloWebhookPayload {
  enrichment_request_id: string;
  person: ApolloEnrichedPerson | null;
  status: string;
  credits_used?: number;
  timestamp?: string;
}

// Normalized types for MCP tool responses
export interface NormalizedPerson {
  apollo_id: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  headline: string | null;
  linkedin_url: string | null;
  email: string | null;
  email_status: string | null;
  personal_emails: string[];
  phone_numbers: string[];
  location: {
    city: string | null;
    state: string | null;
    country: string | null;
  };
  company: {
    id: string | null;
    name: string | null;
    domain: string | null;
    website: string | null;
    linkedin_url: string | null;
    industry: string | null;
    employee_count: number | null;
  };
  social: {
    twitter_url: string | null;
    github_url: string | null;
    facebook_url: string | null;
  };
}

export interface SearchResult {
  people: NormalizedPerson[];
  pagination: {
    page: number;
    per_page: number;
    total_entries: number;
    total_pages: number;
  };
}

export interface EnrichmentResult {
  person: NormalizedPerson | null;
  status: string;
  enrichment_request_id?: string;
  enrichment_status?: string;
  is_async: boolean;
  webhook_url?: string;
}

export interface SearchAndEnrichResult {
  search_results: {
    total_found: number;
    page: number;
    per_page: number;
  };
  enriched_people: EnrichmentResult[];
  enrichment_summary: {
    attempted: number;
    successful: number;
    failed: number;
    async_pending: number;
  };
}
