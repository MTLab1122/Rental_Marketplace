import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

interface CircuitStats {
  state: CircuitState;
  failures: number;
  lastFailureTime?: number;
  successCountInHalfOpen: number;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuits: Map<string, CircuitStats> = new Map();

  private readonly failureThreshold = 5;
  private readonly resetTimeoutMs = 15000; // 15 seconds

  /**
   * Executes an external operation protected by a Circuit Breaker.
   */
  async execute<T>(serviceName: string, action: () => Promise<T>): Promise<T> {
    const stats = this.getCircuit(serviceName);

    if (stats.state === CircuitState.OPEN) {
      if (Date.now() - (stats.lastFailureTime || 0) > this.resetTimeoutMs) {
        stats.state = CircuitState.HALF_OPEN;
        stats.successCountInHalfOpen = 0;
        this.logger.log(
          `[CircuitBreaker] ${serviceName} transitioned to HALF_OPEN. Testing provider health...`,
        );
      } else {
        throw new ServiceUnavailableException(
          `Circuit breaker for ${serviceName} is OPEN. External service is degraded; request aborted to protect system resources.`,
        );
      }
    }

    try {
      const result = await action();
      this.handleSuccess(serviceName, stats);
      return result;
    } catch (err) {
      this.handleFailure(serviceName, stats);
      throw err;
    }
  }

  private handleSuccess(serviceName: string, stats: CircuitStats) {
    if (stats.state === CircuitState.HALF_OPEN) {
      stats.successCountInHalfOpen += 1;
      if (stats.successCountInHalfOpen >= 2) {
        stats.state = CircuitState.CLOSED;
        stats.failures = 0;
        this.logger.log(`[CircuitBreaker] ${serviceName} recovered. State set to CLOSED.`);
      }
    } else if (stats.state === CircuitState.CLOSED) {
      stats.failures = 0;
    }
  }

  private handleFailure(serviceName: string, stats: CircuitStats) {
    stats.failures += 1;
    stats.lastFailureTime = Date.now();

    if (stats.state === CircuitState.CLOSED && stats.failures >= this.failureThreshold) {
      stats.state = CircuitState.OPEN;
      this.logger.error(
        `[CircuitBreaker] ${serviceName} reached ${stats.failures} failures. Circuit OPENED for ${this.resetTimeoutMs / 1000}s.`,
      );
    } else if (stats.state === CircuitState.HALF_OPEN) {
      stats.state = CircuitState.OPEN;
      this.logger.warn(
        `[CircuitBreaker] ${serviceName} trial failed in HALF_OPEN. Re-opening circuit.`,
      );
    }
  }

  getCircuitState(serviceName: string): CircuitState {
    return this.getCircuit(serviceName).state;
  }

  private getCircuit(serviceName: string): CircuitStats {
    let stats = this.circuits.get(serviceName);
    if (!stats) {
      stats = {
        state: CircuitState.CLOSED,
        failures: 0,
        successCountInHalfOpen: 0,
      };
      this.circuits.set(serviceName, stats);
    }
    return stats;
  }
}
