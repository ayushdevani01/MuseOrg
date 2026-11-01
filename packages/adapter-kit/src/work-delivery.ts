import type { ProjectActionInput, WorkOperation } from "@rakazo/contracts";
import type { AdapterContext } from "./types.js";

export interface WorkConnection {
  provider: string;
  account: string;
  resource: string;
  operations: readonly WorkOperation[];
}

export interface WorkDeliveryReceipt {
  status: "completed" | "pending";
  provider: string;
  operation: WorkOperation;
  account: string;
  resource: string;
  url?: string;
  head?: string;
  mergeSha?: string;
  deploymentSha?: string;
  actualCostCents: number;
  data: Record<string, unknown>;
}

export interface WorkDeliveryContext extends AdapterContext {
  botId: string;
  runId: string;
  intentKey: string;
  allowedPaths: readonly string[];
}

/** Implemented only in trusted adapters/composition roots; no credential crosses this port. */
export interface WorkDeliveryProvider {
  connections(context: AdapterContext): Promise<readonly WorkConnection[]>;
  validate(intent: ProjectActionInput, context: WorkDeliveryContext): Promise<void>;
  execute(intent: ProjectActionInput, context: WorkDeliveryContext): Promise<WorkDeliveryReceipt>;
  reconcile(
    intent: ProjectActionInput,
    context: WorkDeliveryContext,
  ): Promise<WorkDeliveryReceipt | undefined>;
}
