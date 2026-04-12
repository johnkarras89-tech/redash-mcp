import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type {
  CreateQueryRequest,
  UpdateQueryRequest,
  CreateVisualizationRequest,
  UpdateVisualizationRequest,
  CreateDashboardRequest,
  UpdateDashboardRequest,
  CreateAlertRequest,
  UpdateAlertRequest,
  CreateAlertSubscriptionRequest,
  CreateWidgetRequest,
  UpdateWidgetRequest,
  CreateQuerySnippetRequest,
  UpdateQuerySnippetRequest,
  RedashClient,
} from "./redashClient.js";

// Lazy-load the redashClient singleton. The RedashClient constructor throws
// if REDASH_URL/REDASH_API_KEY are not set, which breaks Next.js builds
// where env vars aren't available at compile time.
let _client: RedashClient | null = null;
async function getClient(): Promise<RedashClient> {
  if (!_client) {
    const mod = await import("./redashClient.js");
    _client = mod.redashClient;
  }
  return _client;
}

/**
 * Register all Redash MCP tools on the given McpServer instance.
 * Used by both the Vercel HTTP handler and can be used by any McpServer-based transport.
 */
export function registerTools(server: McpServer): void {
  // ----- Query Tools -----

  server.tool(
    "list_queries",
    "List all available queries in Redash",
    {
      page: z.number().optional().describe("Page number (starts at 1)"),
      pageSize: z.number().optional().describe("Number of results per page"),
      q: z.string().optional().describe("Search query"),
    },
    async ({ page, pageSize, q }) => {
      try {
        const queries = await (await getClient()).getQueries(page ?? 1, pageSize ?? 25, q);
        return { content: [{ type: "text" as const, text: JSON.stringify(queries, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error listing queries: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "get_query",
    "Get details of a specific query",
    {
      queryId: z.number().describe("ID of the query to get"),
    },
    async ({ queryId }) => {
      try {
        const query = await (await getClient()).getQuery(queryId);
        return { content: [{ type: "text" as const, text: JSON.stringify(query, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error getting query ${queryId}: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "create_query",
    "Create a new query in Redash",
    {
      name: z.string().describe("Name of the query"),
      data_source_id: z.number().describe("ID of the data source to use"),
      query: z.string().describe("SQL query text"),
      description: z.string().optional().describe("Description of the query"),
      options: z.any().optional().describe("Query options"),
      schedule: z.any().optional().describe("Query schedule"),
      tags: z.array(z.string()).optional().describe("Tags for the query"),
    },
    async (params) => {
      try {
        const queryData: CreateQueryRequest = {
          name: params.name,
          data_source_id: params.data_source_id,
          query: params.query,
          description: params.description || "",
          options: params.options || {},
          schedule: params.schedule || null,
          tags: params.tags || [],
        };
        const result = await (await getClient()).createQuery(queryData);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error creating query: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "update_query",
    "Update an existing query in Redash",
    {
      queryId: z.number().describe("ID of the query to update"),
      name: z.string().optional().describe("New name of the query"),
      data_source_id: z.number().optional().describe("ID of the data source to use"),
      query: z.string().optional().describe("SQL query text"),
      description: z.string().optional().describe("Description of the query"),
      options: z.any().optional().describe("Query options"),
      schedule: z.any().optional().describe("Query schedule"),
      tags: z.array(z.string()).optional().describe("Tags for the query"),
      is_archived: z.boolean().optional().describe("Whether the query is archived"),
      is_draft: z.boolean().optional().describe("Whether the query is a draft"),
    },
    async ({ queryId, ...updateData }) => {
      try {
        const queryData: UpdateQueryRequest = {};
        if (updateData.name !== undefined) queryData.name = updateData.name;
        if (updateData.data_source_id !== undefined) queryData.data_source_id = updateData.data_source_id;
        if (updateData.query !== undefined) queryData.query = updateData.query;
        if (updateData.description !== undefined) queryData.description = updateData.description;
        if (updateData.options !== undefined) queryData.options = updateData.options;
        if (updateData.schedule !== undefined) queryData.schedule = updateData.schedule;
        if (updateData.tags !== undefined) queryData.tags = updateData.tags;
        if (updateData.is_archived !== undefined) queryData.is_archived = updateData.is_archived;
        if (updateData.is_draft !== undefined) queryData.is_draft = updateData.is_draft;

        const result = await (await getClient()).updateQuery(queryId, queryData);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error updating query ${queryId}: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "archive_query",
    "Archive (soft-delete) a query in Redash",
    {
      queryId: z.number().describe("ID of the query to archive"),
    },
    async ({ queryId }) => {
      try {
        const result = await (await getClient()).archiveQuery(queryId);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error archiving query ${queryId}: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "list_data_sources",
    "List all available data sources in Redash",
    {},
    async () => {
      try {
        const dataSources = await (await getClient()).getDataSources();
        return { content: [{ type: "text" as const, text: JSON.stringify(dataSources, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error listing data sources: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "execute_query",
    "Execute a Redash query and return results",
    {
      queryId: z.number().describe("ID of the query to execute"),
      parameters: z.record(z.any()).optional().describe("Parameters to pass to the query (if any)"),
    },
    async ({ queryId, parameters }) => {
      try {
        const result = await (await getClient()).executeQuery(queryId, parameters);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error executing query ${queryId}: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "execute_adhoc_query",
    "Execute an ad-hoc query without saving it to Redash. Creates a temporary query that is automatically deleted after execution.",
    {
      query: z.string().describe("SQL query to execute"),
      dataSourceId: z.number().describe("ID of the data source to query against"),
    },
    async ({ query, dataSourceId }) => {
      try {
        const result = await (await getClient()).executeAdhocQuery(query, dataSourceId);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error executing adhoc query: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "get_query_results_csv",
    "Get query results in CSV format. Returns the last cached results, or optionally refreshes the query first to get the latest data. Note: Does not support parameterized queries.",
    {
      queryId: z.number().describe("ID of the query to get results from"),
      refresh: z.boolean().optional().describe("Whether to refresh the query before fetching results to ensure latest data (default: false)"),
    },
    async ({ queryId, refresh }) => {
      try {
        const csv = await (await getClient()).getQueryResultsAsCsv(queryId, refresh ?? false);
        return { content: [{ type: "text" as const, text: csv }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error getting CSV results for query ${queryId}: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "fork_query",
    "Fork (duplicate) an existing query",
    {
      queryId: z.number().describe("ID of the query to fork"),
    },
    async ({ queryId }) => {
      try {
        const result = await (await getClient()).forkQuery(queryId);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error forking query ${queryId}: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "get_my_queries",
    "Get queries created by the current user",
    {
      page: z.number().optional().describe("Page number (starts at 1)"),
      pageSize: z.number().optional().describe("Number of results per page"),
    },
    async ({ page, pageSize }) => {
      try {
        const result = await (await getClient()).getMyQueries(page ?? 1, pageSize ?? 25);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error fetching my queries: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "get_recent_queries",
    "Get recently accessed queries",
    {
      page: z.number().optional().describe("Page number (starts at 1)"),
      pageSize: z.number().optional().describe("Number of results per page"),
    },
    async ({ page, pageSize }) => {
      try {
        const result = await (await getClient()).getRecentQueries(page ?? 1, pageSize ?? 25);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error fetching recent queries: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "get_query_tags",
    "Get all tags used in queries",
    {},
    async () => {
      try {
        const result = await (await getClient()).getQueryTags();
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error fetching query tags: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "get_favorite_queries",
    "Get queries marked as favorite by the current user",
    {
      page: z.number().optional().describe("Page number (starts at 1)"),
      pageSize: z.number().optional().describe("Number of results per page"),
    },
    async ({ page, pageSize }) => {
      try {
        const result = await (await getClient()).getFavoriteQueries(page ?? 1, pageSize ?? 25);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error fetching favorite queries: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "add_query_favorite",
    "Add a query to favorites",
    {
      queryId: z.number().describe("ID of the query to add to favorites"),
    },
    async ({ queryId }) => {
      try {
        const result = await (await getClient()).addQueryFavorite(queryId);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error adding query ${queryId} to favorites: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "remove_query_favorite",
    "Remove a query from favorites",
    {
      queryId: z.number().describe("ID of the query to remove from favorites"),
    },
    async ({ queryId }) => {
      try {
        const result = await (await getClient()).removeQueryFavorite(queryId);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error removing query ${queryId} from favorites: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  // ----- Dashboard Tools -----

  server.tool(
    "list_dashboards",
    "List all available dashboards in Redash",
    {
      page: z.number().optional().describe("Page number (starts at 1)"),
      pageSize: z.number().optional().describe("Number of results per page"),
    },
    async ({ page, pageSize }) => {
      try {
        const dashboards = await (await getClient()).getDashboards(page ?? 1, pageSize ?? 25);
        return { content: [{ type: "text" as const, text: JSON.stringify(dashboards, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error listing dashboards: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "get_dashboard",
    "Get details of a specific dashboard",
    {
      dashboardId: z.number().describe("ID of the dashboard to get"),
    },
    async ({ dashboardId }) => {
      try {
        const dashboard = await (await getClient()).getDashboard(dashboardId);
        return { content: [{ type: "text" as const, text: JSON.stringify(dashboard, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error getting dashboard ${dashboardId}: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "get_dashboard_by_slug",
    "Get details of a specific dashboard by its slug",
    {
      slug: z.string().describe("Slug of the dashboard to get"),
    },
    async ({ slug }) => {
      try {
        const dashboard = await (await getClient()).getDashboardBySlug(slug);
        return { content: [{ type: "text" as const, text: JSON.stringify(dashboard, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error getting dashboard by slug '${slug}': ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "create_dashboard",
    "Create a new dashboard in Redash",
    {
      name: z.string().describe("Name of the dashboard"),
      tags: z.array(z.string()).optional().describe("Tags for the dashboard"),
    },
    async (params) => {
      try {
        const dashboardData: CreateDashboardRequest = {
          name: params.name,
          tags: params.tags || [],
        };
        const result = await (await getClient()).createDashboard(dashboardData);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error creating dashboard: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "update_dashboard",
    "Update an existing dashboard in Redash",
    {
      dashboardId: z.number().describe("ID of the dashboard to update"),
      name: z.string().optional().describe("New name of the dashboard"),
      tags: z.array(z.string()).optional().describe("Tags for the dashboard"),
      is_archived: z.boolean().optional().describe("Whether the dashboard is archived"),
      is_draft: z.boolean().optional().describe("Whether the dashboard is a draft"),
      dashboard_filters_enabled: z.boolean().optional().describe("Whether dashboard filters are enabled"),
    },
    async ({ dashboardId, ...updateData }) => {
      try {
        const dashboardData: UpdateDashboardRequest = {};
        if (updateData.name !== undefined) dashboardData.name = updateData.name;
        if (updateData.tags !== undefined) dashboardData.tags = updateData.tags;
        if (updateData.is_archived !== undefined) dashboardData.is_archived = updateData.is_archived;
        if (updateData.is_draft !== undefined) dashboardData.is_draft = updateData.is_draft;
        if (updateData.dashboard_filters_enabled !== undefined) dashboardData.dashboard_filters_enabled = updateData.dashboard_filters_enabled;

        const result = await (await getClient()).updateDashboard(dashboardId, dashboardData);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error updating dashboard ${dashboardId}: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "archive_dashboard",
    "Archive (soft-delete) a dashboard in Redash",
    {
      dashboardId: z.number().describe("ID of the dashboard to archive"),
    },
    async ({ dashboardId }) => {
      try {
        const result = await (await getClient()).archiveDashboard(dashboardId);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error archiving dashboard ${dashboardId}: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "fork_dashboard",
    "Fork (duplicate) an existing dashboard",
    {
      dashboardId: z.number().describe("ID of the dashboard to fork"),
    },
    async ({ dashboardId }) => {
      try {
        const result = await (await getClient()).forkDashboard(dashboardId);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error forking dashboard ${dashboardId}: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "get_public_dashboard",
    "Get a public dashboard by its share token",
    {
      token: z.string().describe("Public share token of the dashboard"),
    },
    async ({ token }) => {
      try {
        const result = await (await getClient()).getPublicDashboard(token);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error fetching public dashboard: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "share_dashboard",
    "Share a dashboard and create a public link",
    {
      dashboardId: z.number().describe("ID of the dashboard to share"),
    },
    async ({ dashboardId }) => {
      try {
        const result = await (await getClient()).shareDashboard(dashboardId);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error sharing dashboard ${dashboardId}: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "unshare_dashboard",
    "Unshare a dashboard and revoke its public link",
    {
      dashboardId: z.number().describe("ID of the dashboard to unshare"),
    },
    async ({ dashboardId }) => {
      try {
        const result = await (await getClient()).unshareDashboard(dashboardId);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error unsharing dashboard ${dashboardId}: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "get_my_dashboards",
    "Get dashboards created by the current user",
    {
      page: z.number().optional().describe("Page number (starts at 1)"),
      pageSize: z.number().optional().describe("Number of results per page"),
    },
    async ({ page, pageSize }) => {
      try {
        const result = await (await getClient()).getMyDashboards(page ?? 1, pageSize ?? 25);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error fetching my dashboards: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "get_favorite_dashboards",
    "Get dashboards marked as favorite by the current user",
    {
      page: z.number().optional().describe("Page number (starts at 1)"),
      pageSize: z.number().optional().describe("Number of results per page"),
    },
    async ({ page, pageSize }) => {
      try {
        const result = await (await getClient()).getFavoriteDashboards(page ?? 1, pageSize ?? 25);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error fetching favorite dashboards: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "add_dashboard_favorite",
    "Add a dashboard to favorites",
    {
      dashboardId: z.number().describe("ID of the dashboard to add to favorites"),
    },
    async ({ dashboardId }) => {
      try {
        const result = await (await getClient()).addDashboardFavorite(dashboardId);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error adding dashboard ${dashboardId} to favorites: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "remove_dashboard_favorite",
    "Remove a dashboard from favorites",
    {
      dashboardId: z.number().describe("ID of the dashboard to remove from favorites"),
    },
    async ({ dashboardId }) => {
      try {
        const result = await (await getClient()).removeDashboardFavorite(dashboardId);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error removing dashboard ${dashboardId} from favorites: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "get_dashboard_tags",
    "Get all tags used in dashboards",
    {},
    async () => {
      try {
        const result = await (await getClient()).getDashboardTags();
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error fetching dashboard tags: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  // ----- Visualization Tools -----

  server.tool(
    "get_visualization",
    "Get details of a specific visualization",
    {
      visualizationId: z.number().describe("ID of the visualization to get"),
    },
    async ({ visualizationId }) => {
      try {
        const visualization = await (await getClient()).getVisualization(visualizationId);
        return { content: [{ type: "text" as const, text: JSON.stringify(visualization, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error getting visualization ${visualizationId}: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "create_visualization",
    "Create a new visualization for a query",
    {
      query_id: z.number().describe("ID of the query to create visualization for"),
      type: z.string().describe("Type of visualization"),
      name: z.string().describe("Name of the visualization"),
      description: z.string().optional().describe("Description of the visualization"),
      options: z.any().describe("Visualization-specific configuration"),
    },
    async (params) => {
      try {
        const visualizationData: CreateVisualizationRequest = {
          query_id: params.query_id,
          type: params.type,
          name: params.name,
          description: params.description,
          options: params.options,
        };
        const result = await (await getClient()).createVisualization(visualizationData);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error creating visualization: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "update_visualization",
    "Update an existing visualization",
    {
      visualizationId: z.number().describe("ID of the visualization to update"),
      type: z.string().optional().describe("Type of visualization"),
      name: z.string().optional().describe("Name of the visualization"),
      description: z.string().optional().describe("Description of the visualization"),
      options: z.any().optional().describe("Visualization-specific configuration"),
    },
    async ({ visualizationId, ...updateData }) => {
      try {
        const result = await (await getClient()).updateVisualization(visualizationId, updateData);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error updating visualization ${visualizationId}: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "delete_visualization",
    "Delete a visualization",
    {
      visualizationId: z.number().describe("ID of the visualization to delete"),
    },
    async ({ visualizationId }) => {
      try {
        await (await getClient()).deleteVisualization(visualizationId);
        return { content: [{ type: "text" as const, text: `Visualization ${visualizationId} deleted successfully` }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error deleting visualization ${visualizationId}: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "get_schema",
    "Get schema of a specific data source",
    {
      dataSourceId: z.number().describe("ID of the data source to get schema"),
    },
    async ({ dataSourceId }) => {
      try {
        const schema = await (await getClient()).getSchema(dataSourceId);
        return { content: [{ type: "text" as const, text: JSON.stringify(schema, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error getting data source ${dataSourceId} schema: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  // ----- Alert Tools -----

  server.tool(
    "list_alerts",
    "List all alerts in Redash",
    {},
    async () => {
      try {
        const result = await (await getClient()).getAlerts();
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error listing alerts: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "get_alert",
    "Get details of a specific alert",
    {
      alertId: z.number().describe("ID of the alert to get"),
    },
    async ({ alertId }) => {
      try {
        const result = await (await getClient()).getAlert(alertId);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error getting alert ${alertId}: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "create_alert",
    "Create a new alert in Redash. Alerts notify you when a query result meets a specified condition.",
    {
      name: z.string().describe("Name of the alert"),
      query_id: z.number().describe("ID of the query to monitor"),
      options: z.object({
        column: z.string().describe("Column name to monitor"),
        op: z.string().describe("Comparison operator"),
        value: z.union([z.number(), z.string()]).describe("Threshold value"),
        custom_subject: z.string().optional().describe("Custom email subject"),
        custom_body: z.string().optional().describe("Custom email body"),
      }).describe("Alert options"),
      rearm: z.number().nullable().optional().describe("Seconds to wait before triggering again (null for never)"),
    },
    async (params) => {
      try {
        const alertData: CreateAlertRequest = {
          name: params.name,
          query_id: params.query_id,
          options: params.options,
          rearm: params.rearm,
        };
        const result = await (await getClient()).createAlert(alertData);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error creating alert: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "update_alert",
    "Update an existing alert in Redash",
    {
      alertId: z.number().describe("ID of the alert to update"),
      name: z.string().optional().describe("New name of the alert"),
      query_id: z.number().optional().describe("ID of the query to monitor"),
      options: z.object({
        column: z.string().optional(),
        op: z.string().optional(),
        value: z.union([z.number(), z.string()]).optional(),
        custom_subject: z.string().optional(),
        custom_body: z.string().optional(),
      }).optional().describe("Alert options"),
      rearm: z.number().nullable().optional().describe("Seconds to wait before triggering again"),
    },
    async ({ alertId, ...updateData }) => {
      try {
        const alertData: UpdateAlertRequest = {};
        if (updateData.name !== undefined) alertData.name = updateData.name;
        if (updateData.query_id !== undefined) alertData.query_id = updateData.query_id;
        if (updateData.options !== undefined) alertData.options = updateData.options;
        if (updateData.rearm !== undefined) alertData.rearm = updateData.rearm;

        const result = await (await getClient()).updateAlert(alertId, alertData);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error updating alert ${alertId}: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "delete_alert",
    "Delete an alert from Redash",
    {
      alertId: z.number().describe("ID of the alert to delete"),
    },
    async ({ alertId }) => {
      try {
        const result = await (await getClient()).deleteAlert(alertId);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error deleting alert ${alertId}: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "mute_alert",
    "Mute an alert to temporarily stop notifications",
    {
      alertId: z.number().describe("ID of the alert to mute"),
    },
    async ({ alertId }) => {
      try {
        const result = await (await getClient()).muteAlert(alertId);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error muting alert ${alertId}: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "get_alert_subscriptions",
    "Get all subscriptions for an alert",
    {
      alertId: z.number().describe("ID of the alert"),
    },
    async ({ alertId }) => {
      try {
        const result = await (await getClient()).getAlertSubscriptions(alertId);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error getting alert ${alertId} subscriptions: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "add_alert_subscription",
    "Subscribe to an alert to receive notifications",
    {
      alertId: z.number().describe("ID of the alert to subscribe to"),
      destination_id: z.number().optional().describe("ID of the notification destination (optional, defaults to email)"),
    },
    async ({ alertId, destination_id }) => {
      try {
        const subscriptionData: CreateAlertSubscriptionRequest = {};
        if (destination_id !== undefined) subscriptionData.destination_id = destination_id;

        const result = await (await getClient()).addAlertSubscription(alertId, subscriptionData);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error adding subscription to alert ${alertId}: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "remove_alert_subscription",
    "Unsubscribe from an alert",
    {
      alertId: z.number().describe("ID of the alert"),
      subscriptionId: z.number().describe("ID of the subscription to remove"),
    },
    async ({ alertId, subscriptionId }) => {
      try {
        const result = await (await getClient()).removeAlertSubscription(alertId, subscriptionId);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error removing subscription ${subscriptionId} from alert ${alertId}: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  // ----- Widget Tools -----

  server.tool(
    "list_widgets",
    "List all widgets",
    {},
    async () => {
      try {
        const result = await (await getClient()).getWidgets();
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error listing widgets: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "get_widget",
    "Get details of a specific widget",
    {
      widgetId: z.number().describe("ID of the widget to get"),
    },
    async ({ widgetId }) => {
      try {
        const result = await (await getClient()).getWidget(widgetId);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error getting widget ${widgetId}: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "create_widget",
    "Create a new widget on a dashboard",
    {
      dashboard_id: z.number().describe("ID of the dashboard to add the widget to"),
      visualization_id: z.number().optional().describe("ID of the visualization to display"),
      text: z.string().optional().describe("Text content for text widgets"),
      width: z.number().describe("Width of the widget (1-6)"),
      options: z.any().optional().describe("Widget options"),
    },
    async (params) => {
      try {
        const widgetData: CreateWidgetRequest = {
          dashboard_id: params.dashboard_id,
          visualization_id: params.visualization_id,
          text: params.text,
          width: params.width,
          options: params.options || {},
        };
        const result = await (await getClient()).createWidget(widgetData);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error creating widget: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "update_widget",
    "Update an existing widget",
    {
      widgetId: z.number().describe("ID of the widget to update"),
      visualization_id: z.number().optional().describe("ID of the visualization to display"),
      text: z.string().optional().describe("Text content for text widgets"),
      width: z.number().optional().describe("Width of the widget (1-6)"),
      options: z.any().optional().describe("Widget options"),
    },
    async ({ widgetId, ...updateData }) => {
      try {
        const widgetData: UpdateWidgetRequest = {};
        if (updateData.visualization_id !== undefined) widgetData.visualization_id = updateData.visualization_id;
        if (updateData.text !== undefined) widgetData.text = updateData.text;
        if (updateData.width !== undefined) widgetData.width = updateData.width;
        if (updateData.options !== undefined) widgetData.options = updateData.options;

        const result = await (await getClient()).updateWidget(widgetId, widgetData);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error updating widget ${widgetId}: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "delete_widget",
    "Delete a widget from a dashboard",
    {
      widgetId: z.number().describe("ID of the widget to delete"),
    },
    async ({ widgetId }) => {
      try {
        const result = await (await getClient()).deleteWidget(widgetId);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error deleting widget ${widgetId}: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  // ----- Query Snippet Tools -----

  server.tool(
    "list_query_snippets",
    "List all reusable query snippets",
    {},
    async () => {
      try {
        const result = await (await getClient()).getQuerySnippets();
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error listing query snippets: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "get_query_snippet",
    "Get details of a specific query snippet",
    {
      snippetId: z.number().describe("ID of the snippet to get"),
    },
    async ({ snippetId }) => {
      try {
        const result = await (await getClient()).getQuerySnippet(snippetId);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error getting query snippet ${snippetId}: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "create_query_snippet",
    "Create a new reusable query snippet",
    {
      trigger: z.string().describe("Trigger keyword for the snippet"),
      description: z.string().optional().describe("Description of the snippet"),
      snippet: z.string().describe("The SQL snippet content"),
    },
    async (params) => {
      try {
        const snippetData: CreateQuerySnippetRequest = {
          trigger: params.trigger,
          description: params.description,
          snippet: params.snippet,
        };
        const result = await (await getClient()).createQuerySnippet(snippetData);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error creating query snippet: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "update_query_snippet",
    "Update an existing query snippet",
    {
      snippetId: z.number().describe("ID of the snippet to update"),
      trigger: z.string().optional().describe("Trigger keyword for the snippet"),
      description: z.string().optional().describe("Description of the snippet"),
      snippet: z.string().optional().describe("The SQL snippet content"),
    },
    async ({ snippetId, ...updateData }) => {
      try {
        const snippetData: UpdateQuerySnippetRequest = {};
        if (updateData.trigger !== undefined) snippetData.trigger = updateData.trigger;
        if (updateData.description !== undefined) snippetData.description = updateData.description;
        if (updateData.snippet !== undefined) snippetData.snippet = updateData.snippet;

        const result = await (await getClient()).updateQuerySnippet(snippetId, snippetData);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error updating query snippet ${snippetId}: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.tool(
    "delete_query_snippet",
    "Delete a query snippet",
    {
      snippetId: z.number().describe("ID of the snippet to delete"),
    },
    async ({ snippetId }) => {
      try {
        const result = await (await getClient()).deleteQuerySnippet(snippetId);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error deleting query snippet ${snippetId}: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  // ----- Destination Tools -----

  server.tool(
    "list_destinations",
    "List all alert notification destinations (email, Slack, etc.)",
    {},
    async () => {
      try {
        const result = await (await getClient()).getDestinations();
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Error listing destinations: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );
}
