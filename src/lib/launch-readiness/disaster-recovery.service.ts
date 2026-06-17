import 'server-only';
import type { DisasterRecoverySnapshot } from '@/types/launch-readiness';

export function getDisasterRecoveryChecklist(): DisasterRecoverySnapshot {
  return {
    items: [
      {
        id: 'dr_worker_restart',
        title: 'Render worker restart',
        ownership: 'Platform operations',
        procedure:
          'Restart application instances or recycle the render worker process. Confirm worker heartbeat and queue drain via Operations and Launch Readiness dashboards.',
        verificationSteps: [
          'Worker status shows running',
          'Last poll timestamp updates',
          'Pending jobs resume processing',
        ],
      },
      {
        id: 'dr_cloudinary_outage',
        title: 'Cloudinary outage',
        ownership: 'Platform operations',
        procedure:
          'Pause new render completions from being promoted to customers if uploads fail. Monitor Cloudinary status. Existing signed URLs expire per TTL; do not expose permanent URLs.',
        verificationSteps: [
          'Cloudinary readiness returns pass after recovery',
          'Test signed URL generation',
          'Complete one render job end-to-end',
        ],
      },
      {
        id: 'dr_razorpay_outage',
        title: 'Razorpay outage',
        ownership: 'Billing operations',
        procedure:
          'Disable new checkout attempts messaging if Razorpay is unavailable. Rely on webhook retries after recovery. Use Audit center payment timelines to reconcile delayed fulfillments.',
        verificationSteps: [
          'Razorpay readiness returns pass',
          'Webhook secret configured',
          'Replay or verify a test payment in staging',
        ],
      },
      {
        id: 'dr_database_outage',
        title: 'Database outage',
        ownership: 'Platform operations',
        procedure:
          'Restore database connectivity before accepting production traffic. Verify read/write probes and migration visibility. Do not run ad-hoc migrations during incident response.',
        verificationSteps: [
          'Database connectivity probe passes',
          'Write rollback probe passes',
          'Health endpoint reports healthy database',
        ],
      },
      {
        id: 'dr_recovery_ownership',
        title: 'Recovery ownership',
        ownership: 'Engineering lead + on-call',
        procedure:
          'Assign an incident commander, document timeline in Audit center, and confirm all critical readiness checks before declaring recovery complete.',
        verificationSteps: [
          'Launch Readiness decision returns READY',
          'Verification suites executed in CI or manually',
          'Customer-impacting backlog cleared',
        ],
      },
    ],
  };
}

export const disasterRecoveryService = {
  getDisasterRecoveryChecklist,
};
