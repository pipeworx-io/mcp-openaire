interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * OpenAIRE MCP — EU research outputs (publications, datasets, software, projects)
 *
 * Graph API v1 — research outputs live under `/researchProducts` with a `type`
 * filter; projects under `/projects`. Single-entity fetch uses the same paths
 * with `?id=…` query (the API is filter-based, not REST-style by-id paths).
 *
 * API docs: https://graph.openaire.eu/docs/apis/graph-api/
 * Auth: none.
 */


const BASE = 'https://api.openaire.eu/graph/v1';

const COMMON_SEARCH_PROPS = {
  query: { type: 'string', description: 'Free-text query (matches title/abstract/keywords)' },
  size: { type: 'number', description: 'Page size, 1-100 (default 20)' },
  page: { type: 'number', description: '1-based page (default 1)' },
} as const;

const tools: McpToolExport['tools'] = [
  {
    name: 'search_publications',
    description: 'Search scholarly publications (articles, preprints, theses, books).',
    inputSchema: {
      type: 'object',
      properties: {
        ...COMMON_SEARCH_PROPS,
        funder: { type: 'string', description: 'Funder short name — e.g. "EC", "NIH", "NSF", "WT"' },
        country: { type: 'string', description: 'Country code — ISO 3166-1 alpha-2' },
        from_year: { type: 'string', description: 'Earliest publication year (YYYY)' },
        to_year: { type: 'string', description: 'Latest publication year (YYYY)' },
        open_access: { type: 'boolean', description: 'Restrict to open-access publications' },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_datasets',
    description: 'Search research datasets.',
    inputSchema: {
      type: 'object',
      properties: {
        ...COMMON_SEARCH_PROPS,
        from_year: { type: 'string' },
        to_year: { type: 'string' },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_software',
    description: 'Search research software registrations.',
    inputSchema: {
      type: 'object',
      properties: { ...COMMON_SEARCH_PROPS },
      required: ['query'],
    },
  },
  {
    name: 'search_projects',
    description: 'Search funded research projects (CORDIS for EC; also NSF, NIH, etc.).',
    inputSchema: {
      type: 'object',
      properties: {
        ...COMMON_SEARCH_PROPS,
        funder: { type: 'string', description: 'Funder short name' },
        country: { type: 'string', description: 'Coordinator country (ISO alpha-2)' },
        from_year: { type: 'string', description: 'Earliest project start year' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_research_product',
    description: 'Fetch a single research product (publication / dataset / software) by OpenAIRE id.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'OpenAIRE id (e.g. "doi_dedup___::abc...")' } },
      required: ['id'],
    },
  },
  {
    name: 'get_project',
    description: 'Fetch a project by OpenAIRE id.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'OpenAIRE id' } },
      required: ['id'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search_publications':
      return searchProducts('publication', args);
    case 'search_datasets':
      return searchProducts('dataset', args);
    case 'search_software':
      return searchProducts('software', args);
    case 'search_projects':
      return searchProjects(args);
    case 'get_research_product':
      return fetchById('researchProducts', reqStr(args, 'id', '"doi_dedup___::abc..."'));
    case 'get_project':
      return fetchById('projects', reqStr(args, 'id', '"corda__h2020::..."'));
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function searchProducts(type: string, args: Record<string, unknown>) {
  const params = new URLSearchParams({
    search: String(args.query),
    type,
    pageSize: String(Math.min(100, Math.max(1, (args.size as number) ?? 20))),
    page: String(Math.max(1, (args.page as number) ?? 1)),
  });
  if (args.funder) params.set('relFundingShortName', String(args.funder));
  if (args.country) params.set('country', String(args.country));
  if (args.from_year) params.set('fromPublicationDate', `${args.from_year}-01-01`);
  if (args.to_year) params.set('toPublicationDate', `${args.to_year}-12-31`);
  if (args.open_access === true) params.set('bestOpenAccessRouteImpl', 'gold');
  return openaireFetch('researchProducts', params, args.query as string);
}

async function searchProjects(args: Record<string, unknown>) {
  const params = new URLSearchParams({
    search: String(args.query),
    pageSize: String(Math.min(100, Math.max(1, (args.size as number) ?? 20))),
    page: String(Math.max(1, (args.page as number) ?? 1)),
  });
  // /projects uses `fundingShortName` (no `rel` prefix) and `relOrganizationCountryCode`
  if (args.funder) params.set('fundingShortName', String(args.funder));
  if (args.country) params.set('relOrganizationCountryCode', String(args.country));
  if (args.from_year) params.set('fromStartDate', `${args.from_year}-01-01`);
  return openaireFetch('projects', params, args.query as string);
}

async function openaireFetch(kind: string, params: URLSearchParams, q: string) {
  const url = `${BASE}/${kind}?${params}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAIRE error: ${res.status} ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { header?: { numFound?: number; pageSize?: number; page?: number }; results?: unknown[] };
  return {
    query: q,
    total: data.header?.numFound ?? null,
    page: data.header?.page ?? null,
    page_size: data.header?.pageSize ?? null,
    count: data.results?.length ?? 0,
    results: data.results ?? [],
  };
}

async function fetchById(kind: string, id: string) {
  const params = new URLSearchParams({ id });
  const url = `${BASE}/${kind}?${params}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAIRE error: ${res.status} ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { results?: unknown[] };
  const first = data.results?.[0];
  if (!first) throw new Error(`OpenAIRE: ${kind} ${id} not found`);
  return first;
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  }
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
