# mcp-openaire

OpenAIRE MCP — EU research outputs (publications, datasets, software, projects)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 250+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `search_publications` | Search scholarly publications (articles, preprints, theses, books). |
| `search_datasets` | Search research datasets. |
| `search_software` | Search research software registrations. |
| `search_projects` | Search funded research projects (CORDIS for EC; also NSF, NIH, etc.). |
| `get_research_product` | Fetch a single research product (publication / dataset / software) by OpenAIRE id. |
| `get_project` | Fetch a project by OpenAIRE id. |

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

Or connect to the full Pipeworx gateway for access to all 250+ data sources:

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

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
