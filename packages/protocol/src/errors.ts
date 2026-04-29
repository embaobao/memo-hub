/**
 * Integration Hub Error Types
 *
 * 定义 Integration Hub 相关的错误类型和错误码
 */

/**
 * Integration Hub 错误码
 */
export enum IntegrationErrorCode {
  // 事件验证错误
  INVALID_EVENT = "INVALID_EVENT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  INVALID_FIELD_VALUE = "INVALID_FIELD_VALUE",
  UNSUPPORTED_KIND = "UNSUPPORTED_KIND",

  // CAS 错误
  CAS_WRITE_FAILED = "CAS_WRITE_FAILED",
  CAS_READ_FAILED = "CAS_READ_FAILED",

  // 投影错误
  PROJECTION_FAILED = "PROJECTION_FAILED",
  INVALID_PROJECTION = "INVALID_PROJECTION",

  // 路由错误
  ROUTING_FAILED = "ROUTING_FAILED",
  TRACK_NOT_FOUND = "TRACK_NOT_FOUND",

  // 系统错误
  INTERNAL_ERROR = "INTERNAL_ERROR",
  TIMEOUT = "TIMEOUT"
}

/**
 * Integration Hub 错误类
 */
export class IntegrationHubError extends Error {
  public readonly code: IntegrationErrorCode;
  public readonly details?: unknown;

  constructor(message: string, code: IntegrationErrorCode, details?: unknown) {
    super(message);
    this.name = "IntegrationHubError";
    this.code = code;
    this.details = details;

    // 保持正确的原型链
    Object.setPrototypeOf(this, IntegrationHubError.prototype);

    // 捕获堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, IntegrationHubError);
    }
  }

  /**
   * 创建"无效事件"错误
   */
  static invalidEvent(errors: string[]): IntegrationHubError {
    return new IntegrationHubError(
      `Invalid event: ${errors.join("; ")}`,
      IntegrationErrorCode.INVALID_EVENT,
      { errors }
    );
  }

  /**
   * 创建"缺少必需字段"错误
   */
  static missingField(field: string): IntegrationHubError {
    return new IntegrationHubError(
      `Missing required field: ${field}`,
      IntegrationErrorCode.MISSING_REQUIRED_FIELD,
      { field }
    );
  }

  /**
   * 创建"无效字段值"错误
   */
  static invalidFieldValue(field: string, value: unknown, expected: string): IntegrationHubError {
    return new IntegrationHubError(
      `Invalid value for field '${field}': ${JSON.stringify(value)}. Expected: ${expected}`,
      IntegrationErrorCode.INVALID_FIELD_VALUE,
      { field, value, expected }
    );
  }

  /**
   * 创建"不支持的事件类型"错误
   */
  static unsupportedKind(kind: string, supported: string[]): IntegrationHubError {
    return new IntegrationHubError(
      `Unsupported event kind: ${kind}. Supported kinds: ${supported.join(", ")}`,
      IntegrationErrorCode.UNSUPPORTED_KIND,
      { kind, supported }
    );
  }

  /**
   * 创建"CAS 写入失败"错误
   */
  static casWriteFailed(error: Error): IntegrationHubError {
    return new IntegrationHubError(
      `Failed to write to CAS: ${error.message}`,
      IntegrationErrorCode.CAS_WRITE_FAILED,
      { originalError: error.message, stack: error.stack }
    );
  }

  /**
   * 创建"投影失败"错误
   */
  static projectionFailed(kind: string, reason: string): IntegrationHubError {
    return new IntegrationHubError(
      `Failed to project event of kind '${kind}': ${reason}`,
      IntegrationErrorCode.PROJECTION_FAILED,
      { kind, reason }
    );
  }

  /**
   * 创建"路由失败"错误
   */
  static routingFailed(reason: string): IntegrationHubError {
    return new IntegrationHubError(
      `Failed to route event: ${reason}`,
      IntegrationErrorCode.ROUTING_FAILED,
      { reason }
    );
  }

  /**
   * 创建"内部错误"错误
   */
  static internal(error: Error): IntegrationHubError {
    return new IntegrationHubError(
      `Internal error: ${error.message}`,
      IntegrationErrorCode.INTERNAL_ERROR,
      { originalError: error.message, stack: error.stack }
    );
  }

  /**
   * 转换为 JSON
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      stack: this.stack
    };
  }
}

/**
 * 验证错误
 */
export class ValidationError extends IntegrationHubError {
  public readonly validationErrors: string[];

  constructor(errors: string[]) {
    super(
      `Validation failed: ${errors.join("; ")}`,
      IntegrationErrorCode.INVALID_EVENT,
      { errors }
    );
    this.name = "ValidationError";
    this.validationErrors = errors;
  }
}

/**
 * 类型守卫：检查是否为 IntegrationHubError
 */
export function isIntegrationHubError(error: unknown): error is IntegrationHubError {
  return error instanceof IntegrationHubError;
}

/**
 * 错误格式化工具
 */
export class ErrorFormatter {
  /**
   * 格式化错误为用户友好的消息
   */
  static format(error: IntegrationHubError): string {
    let message = `[${error.code}] ${error.message}`;

    if (error.details) {
      if (typeof error.details === "string") {
        message += `\nDetails: ${error.details}`;
      } else if (typeof error.details === "object") {
        message += `\nDetails: ${JSON.stringify(error.details, null, 2)}`;
      }
    }

    return message;
  }

  /**
   * 格式化错误为 JSON（用于日志）
   */
  static formatJSON(error: IntegrationHubError): string {
    return JSON.stringify(error.toJSON(), null, 2);
  }
}
