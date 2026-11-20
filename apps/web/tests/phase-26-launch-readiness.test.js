import test from 'node:test';
import assert from 'node:assert/strict';

test('Launch Readiness: Error budget consumption policy defines deterministic release gates', () => {
  const getReleaseGateStatus = (budgetConsumedPercent) => {
    if (budgetConsumedPercent <= 50) return 'NOMINAL';
    if (budgetConsumedPercent <= 80) return 'WARNING';
    if (budgetConsumedPercent <= 100) return 'RESTRICTED';
    return 'FREEZE';
  };

  assert.equal(getReleaseGateStatus(25), 'NOMINAL');
  assert.equal(getReleaseGateStatus(65), 'WARNING');
  assert.equal(getReleaseGateStatus(92), 'RESTRICTED');
  assert.equal(getReleaseGateStatus(105), 'FREEZE');
});

test('Launch Readiness: Single-incident 20% error budget rule triggers mandatory postmortem', () => {
  const requiresExecutivePostmortem = (singleIncidentBudgetConsumption) => {
    return singleIncidentBudgetConsumption > 20;
  };

  assert.equal(requiresExecutivePostmortem(15), false);
  assert.equal(requiresExecutivePostmortem(20), false);
  assert.equal(requiresExecutivePostmortem(21), true);
  assert.equal(requiresExecutivePostmortem(45), true);
});

test('Launch Readiness: Rollback criteria triggers on critical error rate or data compromise', () => {
  const shouldTriggerRollback = ({
    errorRatePercent,
    dataCompromiseDetected,
    replicationLagSeconds,
  }) => {
    if (errorRatePercent > 1.0) return true;
    if (dataCompromiseDetected) return true;
    if (replicationLagSeconds > 60) return true;
    return false;
  };

  // Normal healthy operation
  assert.equal(
    shouldTriggerRollback({
      errorRatePercent: 0.05,
      dataCompromiseDetected: false,
      replicationLagSeconds: 2,
    }),
    false,
  );

  // Error rate breach
  assert.equal(
    shouldTriggerRollback({
      errorRatePercent: 1.25,
      dataCompromiseDetected: false,
      replicationLagSeconds: 2,
    }),
    true,
  );

  // Data compromise incident
  assert.equal(
    shouldTriggerRollback({
      errorRatePercent: 0.1,
      dataCompromiseDetected: true,
      replicationLagSeconds: 2,
    }),
    true,
  );

  // Replication lag breach
  assert.equal(
    shouldTriggerRollback({
      errorRatePercent: 0.1,
      dataCompromiseDetected: false,
      replicationLagSeconds: 75,
    }),
    true,
  );
});

test('Operating Cadence: Interval schedules strictly map to operational stakeholder responsibilities', () => {
  const cadenceSchedules = {
    DAILY: { durationMin: 30, primaryOwner: 'ON_CALL_SRE', focus: 'CRITICAL_ALERTS_AND_TRIAGE' },
    WEEKLY: { durationMin: 60, primaryOwner: 'TECH_LEAD_AND_PO', focus: 'WOR_SLO_TECH_DEBT' },
    MONTHLY: {
      durationMin: 90,
      primaryOwner: 'DEPARTMENT_HEADS',
      focus: 'DR_RESTORE_DRILL_CAPACITY',
    },
    QUARTERLY: {
      durationMin: 240,
      primaryOwner: 'EXECUTIVE_LEADERSHIP',
      focus: 'QBR_STRATEGY_SCALE',
    },
  };

  assert.equal(cadenceSchedules.DAILY.focus, 'CRITICAL_ALERTS_AND_TRIAGE');
  assert.equal(cadenceSchedules.WEEKLY.focus, 'WOR_SLO_TECH_DEBT');
  assert.equal(cadenceSchedules.MONTHLY.focus, 'DR_RESTORE_DRILL_CAPACITY');
  assert.equal(cadenceSchedules.QUARTERLY.focus, 'QBR_STRATEGY_SCALE');
});
