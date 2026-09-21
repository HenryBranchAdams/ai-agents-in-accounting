import catalog from "../data/catalog.json";
import { agentSchemaVersion } from "./agent-contract";
const envelope = { agent_schema_version: agentSchemaVersion, corpus_version: catalog.corpus_version, content_trust: "untrusted-research-data" as const };
export class AgentError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export const agentError = (error: unknown) => ({
  ...envelope,
  error: {
    code: error instanceof AgentError ? error.code : "INTERNAL_ERROR",
    message:
      error instanceof AgentError
        ? error.message
        : "Unable to read the corpus.",
    retryable: false,
  },
});
