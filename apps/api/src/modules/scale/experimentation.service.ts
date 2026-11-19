import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  ExperimentDto,
  ExperimentStatus,
  EvaluateExperimentDto,
} from '@rental-peshawar/shared-types';

@Injectable()
export class ExperimentationService {
  private readonly logger = new Logger(ExperimentationService.name);

  // In-memory registry of active and configured experiments
  private experiments: Map<string, ExperimentDto> = new Map();

  constructor() {
    this.seedDefaultExperiments();
  }

  private seedDefaultExperiments() {
    const defaults: ExperimentDto[] = [
      {
        key: 'exp_search_map_preview_v2',
        name: 'Interactive Map Pin Preview on Property Cards',
        description:
          'Tests embedded mini-map on listing cards vs. photo carousel for Hayatabad searchers',
        status: ExperimentStatus.RUNNING,
        targetRoles: ['TENANT'],
        targetLocalities: ['Hayatabad', 'University Town'],
        percentage: 50,
        variants: [
          { key: 'control', weight: 50 },
          { key: 'mini_map', weight: 50, payload: { showMapThumbnail: true } },
        ],
        killSwitchTriggered: false,
        guardrails: {
          enforceEligibilitySegregation: true,
          enforceGeofence: true,
          enforceModeration: true,
          enforcePiiProtection: true,
        },
        createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        key: 'exp_instant_whatsapp_inquiry',
        name: 'Direct WhatsApp Concierge Action Button',
        description:
          'Tests high-visibility WhatsApp inquiry CTA for mobile tenants in Peshawar Cantonment',
        status: ExperimentStatus.RUNNING,
        targetRoles: ['TENANT'],
        targetLocalities: ['Saddar', 'Gulbahar'],
        percentage: 100,
        variants: [
          { key: 'standard_chat', weight: 0 },
          { key: 'whatsapp_cta', weight: 100, payload: { directWhatsapp: true } },
        ],
        killSwitchTriggered: false,
        guardrails: {
          enforceEligibilitySegregation: true,
          enforceGeofence: true,
          enforceModeration: true,
          enforcePiiProtection: true,
        },
        createdAt: new Date(Date.now() - 3600000 * 120).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      },
      {
        key: 'exp_pesco_bill_badge',
        name: 'PESCO Verified Electricity Meter Trust Badge',
        description: 'Displays verified PESCO feeder reliability badge to increase inquiry trust',
        status: ExperimentStatus.RUNNING,
        targetRoles: ['TENANT', 'LANDLORD'],
        percentage: 50,
        variants: [
          { key: 'control', weight: 50 },
          { key: 'pesco_badge', weight: 50, payload: { showFeederStatus: true } },
        ],
        killSwitchTriggered: false,
        guardrails: {
          enforceEligibilitySegregation: true,
          enforceGeofence: true,
          enforceModeration: true,
          enforcePiiProtection: true,
        },
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
    ];

    for (const exp of defaults) {
      this.experiments.set(exp.key, exp);
    }
  }

  /**
   * Deterministic hash function for consistent bucket assignment.
   */
  private hashUser(userId: string, experimentKey: string): number {
    const combined = `${userId}:${experimentKey}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash) % 100;
  }

  /**
   * Evaluates feature flags for a caller context.
   */
  evaluateFlags(
    context: EvaluateExperimentDto,
  ): Record<string, { variant: string; payload?: any }> {
    const result: Record<string, { variant: string; payload?: any }> = {};
    const userId = context.userId || 'anonymous-guest';

    for (const exp of this.experiments.values()) {
      // If experiment is paused or killed by guardrail, return control
      if (exp.status !== ExperimentStatus.RUNNING || exp.killSwitchTriggered) {
        result[exp.key] = { variant: 'control' };
        continue;
      }

      // Role targeting check
      if (context.role && exp.targetRoles.length > 0 && !exp.targetRoles.includes(context.role)) {
        result[exp.key] = { variant: 'control' };
        continue;
      }

      // Locality targeting check
      if (
        context.locality &&
        exp.targetLocalities &&
        exp.targetLocalities.length > 0 &&
        !exp.targetLocalities.some((l) => l.toLowerCase() === context.locality?.toLowerCase())
      ) {
        result[exp.key] = { variant: 'control' };
        continue;
      }

      // Deterministic bucketing
      const bucket = this.hashUser(userId, exp.key);
      if (bucket >= exp.percentage) {
        result[exp.key] = { variant: 'control' };
        continue;
      }

      // Variant selection
      let accumulated = 0;
      let selectedVariant = exp.variants[0] || { key: 'control', weight: 100, payload: undefined };
      for (const variant of exp.variants) {
        accumulated += variant.weight;
        if (bucket < (exp.percentage * accumulated) / 100) {
          selectedVariant = variant;
          break;
        }
      }

      result[exp.key] = {
        variant: selectedVariant?.key || 'control',
        payload: (selectedVariant as any)?.payload,
      };
    }

    return result;
  }

  /**
   * Returns all registered experiments for Admin dashboard.
   */
  listExperiments(): ExperimentDto[] {
    return Array.from(this.experiments.values());
  }

  /**
   * Toggles an experiment's enabled state.
   */
  toggleExperiment(key: string, enable: boolean): ExperimentDto {
    const exp = this.experiments.get(key);
    if (!exp) {
      throw new BadRequestException(`Experiment with key "${key}" not found.`);
    }

    if (enable && exp.killSwitchTriggered) {
      throw new BadRequestException(
        `Cannot enable experiment "${key}": Emergency kill-switch has been tripped due to safety guardrail breach.`,
      );
    }

    exp.status = enable ? ExperimentStatus.RUNNING : ExperimentStatus.PAUSED;
    exp.updatedAt = new Date().toISOString();
    this.logger.log(`[ExperimentationService] Experiment "${key}" status set to ${exp.status}`);
    return exp;
  }

  /**
   * Emergency Kill-Switch: Instantly trips the circuit breaker on an experiment.
   */
  emergencyKill(key: string, reason: string): ExperimentDto {
    const exp = this.experiments.get(key);
    if (!exp) {
      throw new BadRequestException(`Experiment with key "${key}" not found.`);
    }

    exp.killSwitchTriggered = true;
    exp.status = ExperimentStatus.HALTED_GUARDRAIL;
    exp.updatedAt = new Date().toISOString();

    this.logger.error(
      `[ExperimentationService] EMERGENCY KILL-SWITCH ACTIVATED for experiment "${key}". Reason: ${reason}. All traffic immediately reverted to control.`,
    );

    return exp;
  }

  /**
   * Updates rollout percentage for an experiment.
   */
  updateRollout(key: string, percentage: number): ExperimentDto {
    const exp = this.experiments.get(key);
    if (!exp) {
      throw new BadRequestException(`Experiment with key "${key}" not found.`);
    }

    if (percentage < 0 || percentage > 100) {
      throw new BadRequestException('Rollout percentage must be between 0 and 100.');
    }

    exp.percentage = percentage;
    exp.updatedAt = new Date().toISOString();
    return exp;
  }

  /**
   * Strictly validates experiment parameters against safety guardrails.
   * Throws if any safety invariant is violated.
   */
  validateGuardrailIntegrity(params: {
    altersEligibility?: boolean;
    bypassesGeofence?: boolean;
    bypassesModeration?: boolean;
    exposesPii?: boolean;
  }) {
    if (params.altersEligibility) {
      throw new BadRequestException(
        'GUARDRAIL VIOLATION: Experiments cannot modify or bypass tenant eligibility segregation (students vs. families).',
      );
    }
    if (params.bypassesGeofence) {
      throw new BadRequestException(
        'GUARDRAIL VIOLATION: Experiments cannot bypass municipal Peshawar geofencing boundaries (33.90°N-34.15°N, 71.35°E-71.70°E).',
      );
    }
    if (params.bypassesModeration) {
      throw new BadRequestException(
        'GUARDRAIL VIOLATION: Experiments cannot serve unapproved or suspended listings to the public.',
      );
    }
    if (params.exposesPii) {
      throw new BadRequestException(
        'GUARDRAIL VIOLATION: Experiments cannot expose raw CNIC numbers or unmasked contact data.',
      );
    }
    return true;
  }
}
