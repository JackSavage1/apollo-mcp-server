# Apollo MCP Server

A Remote MCP (Model Context Protocol) server that wraps Apollo.io APIs for use with Claude Custom Connectors.

## Overview

This server exposes Apollo.io's People Search and People Enrichment APIs as MCP tools that Claude can call. It handles:

- **People Search**: Find prospects by job title, location, and keywords
- **People Enrichment**: Get email addresses and phone numbers for identified people
- **Combined Search & Enrich**: Convenience tool to search and enrich in one call

### Important Note on Apollo APIs

Apollo's **People Search** endpoint does NOT return email addresses or phone numbers. To get contact information, you must use the **People Enrichment** endpoint with the `reveal_personal_emails` and `reveal_phone_number` flags.

## Quick Start

### Prerequisites

- Node.js 20+
- npm
- Apollo.io API key

### Local Development

1. **Clone and install dependencies:**

```bash
cd apollo-mcp-server
npm install
