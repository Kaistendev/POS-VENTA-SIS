import { ZodSchema, ZodError } from "zod";
import {
  DomainError,
  NotFoundError,
  ValidationError,
  ConflictError,
  BusinessRuleError,
} from "../../shared/errors.js";

export interface IpcResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  code?: string;
}

function formatError(error: Error): IpcResponse<never> {
  if (error instanceof ZodError) {
    return {
      success: false,
      message: "Error de validación: " + error.issues.map(e => e.message).join(", "),
      errors: error.issues.map((e) => `${e.path.join(".")}: ${e.message}`),
      code: "VALIDATION",
    };
  }

  if (error instanceof DomainError) {
    return {
      success: false,
      message: error.message,
      code: error.code,
      errors: error instanceof ValidationError ? error.errors : undefined,
    };
  }

  console.error("Unhandled IPC Error:", error);
  return {
    success: false,
    message: error.message || "Ocurrió un error inesperado en el sistema",
    code: "INTERNAL",
  };
}

export function wrapIpc<T = unknown>(
  handler: (...args: any[]) => Promise<any>,
  schema?: ZodSchema
) {
  return async (_event: any, ...args: any[]): Promise<IpcResponse<T>> => {
    try {
      if (schema && args.length > 0) {
        const result = schema.safeParse(args[0]);
        if (!result.success) {
          return {
            success: false,
            message: "Error de validación: " + result.error.issues.map(e => e.message).join(", "),
            errors: result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`),
            code: "VALIDATION",
          };
        }
        args[0] = result.data;
      }

      const data = await handler(...args);

      if (data && typeof data === 'object' && 'success' in data) {
        return data as IpcResponse<T>;
      }

      return { success: true, data };
    } catch (error: any) {
      return formatError(error);
    }
  };
}

export function handleIpcError(error: unknown): IpcResponse<never> {
  return formatError(error instanceof Error ? error : new Error(String(error)));
}
