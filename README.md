# @pipeworx/openaire

OpenAIRE MCP — EU-funded research outputs: publications, datasets, software, projects (Horizon Europe, FP7, etc.). No auth.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

- `search_publications(query, funder?, country?, year?, size?, page?)`
- `search_datasets(query, size?, page?)`
- `search_projects(query, funder?, country?, year?, size?, page?)`
- `search_software(query, size?, page?)`
- `get_publication(id)`
- `get_project(id)`

## Data source

`https://api.openaire.eu/graph/v1/` — returns JSON. Public.

Funder codes include: `ec__________::EC` (European Commission), `nih_________::NIH`, `wt__________::WT` (Wellcome Trust), `nsf_________::NSF`.

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "openaire": {
      "url": "https://gateway.pipeworx.io/openaire/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Openaire data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
