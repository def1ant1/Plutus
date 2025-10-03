import type { Context } from '@opentelemetry/api';
import type { Span, SpanProcessor } from '@opentelemetry/sdk-trace-base';
import type { ObservabilityOptions } from './types';

/**
 * Span processor that stamps globally-required attributes onto every span as it
 * starts. This guarantees multi-tenant context without leaking per-request PII.
 */
export class StandardAttributeSpanProcessor implements SpanProcessor {
  private readonly attributes: Record<string, string>;

  constructor(options: ObservabilityOptions) {
    const derivedAttributes: Record<string, string | undefined> = {
      'tenant.id': options.tenantId,
      'data.residency': options.residency,
      'deployment.environment': options.environment,
      ...options.spanAttributes,
    };

    this.attributes = Object.fromEntries(
      Object.entries(derivedAttributes).filter(([, value]) => Boolean(value)),
    ) as Record<string, string>;
  }

  onStart(span: Span, _parentContext?: Context): void {
    for (const [key, value] of Object.entries(this.attributes)) {
      span.setAttribute(key, value);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onEnd(_span: Span): void {
    // no-op – metadata already stamped during onStart
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }

  forceFlush(): Promise<void> {
    return Promise.resolve();
  }
}
