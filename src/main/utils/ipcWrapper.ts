import { ZodSchema, ZodError } from "zod";

/**
 * Interface for standardized IPC responses
 */
export interface IpcResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

/**
 * Wraps an IPC handler to provide consistent error handling and optional Zod validation.
 */
export function wrapIpc<T = any>(
  handler: (...args: any[]) => Promise<any>,
  schema?: ZodSchema
) {
  return async (_event: any, ...args: any[]): Promise<IpcResponse<T>> => {
    try {
      // 1. Validation (if schema is provided)
      if (schema && args.length > 0) {
        const result = schema.safeParse(args[0]);
        if (!result.success) {
          return {
            success: false,
            message: "Error de validación: " + result.error.issues.map(e => e.message).join(", "),
            errors: result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`),
          };
        }
        args[0] = result.data;
      }

      // 2. Execute the handler
      const data = await handler(...args);
      
      if (data && typeof data === 'object' && 'success' in data) {
        return data as IpcResponse<T>;
      }

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error("IPC Error:", error);
      
      // Handle ZodErrors that might happen inside services
      if (error instanceof ZodError) {
        return {
          success: false,
          message: "Error de validación: " + error.issues.map(e => e.message).join(", "),
        };
      }
      
      return {
        success: false,
        message: error.message || "Ocurrió un error inesperado en el sistema",
      };
    }
  };
}
