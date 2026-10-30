import { z } from "zod";
import { requireOwner } from "@/server/auth";
import { runGraphQL } from "@/server/graphql/schema";
import { json, readJson, route } from "@/server/http";

const bodySchema = z.object({
  query: z.string().min(1).max(4000),
  variables: z.record(z.unknown()).optional(),
});

export const POST = route(async (request: Request) => {
  await requireOwner();
  const { query, variables } = bodySchema.parse(await readJson(request));
  return json(await runGraphQL(query, variables));
});
