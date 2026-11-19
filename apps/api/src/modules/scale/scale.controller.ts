import { Controller, Get, Post, Patch, Body, Param, Query, Req } from '@nestjs/common';
import { ReliabilityService } from './reliability.service';
import { ExperimentationService } from './experimentation.service';
import { SubmitFeedbackDto } from '@rental-peshawar/shared-types';

@Controller()
export class ScaleController {
  constructor(
    private readonly reliabilityService: ReliabilityService,
    private readonly experimentationService: ExperimentationService,
  ) {}

  /**
   * Returns all 11 SLOs and calculated error budget summary.
   */
  @Get('reliability/slos')
  getReliabilitySlos() {
    return this.reliabilityService.getReliabilityOverview();
  }

  /**
   * Checks current feature release freeze status.
   */
  @Get('reliability/feature-freeze')
  getFeatureFreezeStatus() {
    return this.reliabilityService.isFeatureFreezeActive();
  }

  /**
   * Simulates error budget consumption for chaos/staging tests.
   */
  @Post('reliability/error-budget/simulate')
  simulateErrorBudget(@Body() body: { consumptionPercent: number | null }) {
    return this.reliabilityService.simulateErrorBudget(body.consumptionPercent);
  }

  /**
   * Submits user feedback (CSAT / bug / feature request) from Web or Mobile.
   */
  @Post('feedback')
  submitFeedback(@Body() body: SubmitFeedbackDto, @Req() req: any) {
    const userId = req.user?.id || req.body?.userId;
    return this.reliabilityService.recordFeedback(body, userId);
  }

  /**
   * Returns customer feedback overview, CSAT score, and NPS distribution.
   */
  @Get('feedback')
  getFeedbackSummary() {
    return this.reliabilityService.getFeedbackSummary();
  }

  /**
   * Evaluates active feature flags and experiments for the client context.
   */
  @Get('experiments/flags')
  evaluateFlags(
    @Query('userId') userId?: string,
    @Query('role') role?: any,
    @Query('locality') locality?: string,
    @Query('platform') platform?: any,
  ) {
    return this.experimentationService.evaluateFlags({
      userId,
      role,
      locality,
      platform,
    });
  }

  /**
   * Lists all experiments with guardrail settings for Admin portal.
   */
  @Get('experiments')
  listExperiments() {
    return this.experimentationService.listExperiments();
  }

  /**
   * Toggles an experiment enabled or paused.
   */
  @Patch('experiments/:key/toggle')
  toggleExperiment(@Param('key') key: string, @Body('enabled') enabled: boolean) {
    return this.experimentationService.toggleExperiment(key, enabled);
  }

  /**
   * Emergency Kill-Switch: Instantly trips the circuit breaker on an experiment.
   */
  @Post('experiments/:key/kill')
  emergencyKillExperiment(@Param('key') key: string, @Body('reason') reason: string) {
    return this.experimentationService.emergencyKill(
      key,
      reason || 'Emergency kill triggered by Administrator',
    );
  }

  /**
   * Updates experiment rollout percentage (0-100%).
   */
  @Patch('experiments/:key/rollout')
  updateRollout(@Param('key') key: string, @Body('percentage') percentage: number) {
    return this.experimentationService.updateRollout(key, percentage);
  }
}
