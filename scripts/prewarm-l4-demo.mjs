import { ModelRouter } from '../frontend/src/lib/ai-gateway/ModelRouter.js';

async function main() {
  console.log('=== L4 DEMO RECORDING PRE-WARM ===');
  const router = new ModelRouter();
  const preflight = await router.preflightHealthCheck({ timeoutPerModelMs: 6000 });

  console.log('PREFLIGHT_RUN: PASS');
  console.log('DEMO_L4_READY:', preflight.demoL4Ready ? 'YES' : 'NO');
  console.log('HEALTHY_MODELS_COUNT:', preflight.healthyModels.length);
  console.log('HEALTHY_MODELS:', preflight.healthyModels.join(', ') || 'NONE');
  console.log('UNHEALTHY_MODELS:', preflight.unhealthyModels.map((m) => `${m.model} (${m.status || m.reason})`).join(', ') || 'NONE');
  console.log('PREFERRED_RECORDING_MODEL:', preflight.preferredModel || 'NONE');
  console.log('BACKUP_MODELS:', preflight.backupOrder.join(', ') || 'NONE');

  console.log('\nModel Health Snapshot:');
  console.table(preflight.modelHealthSnapshot);
}

main().catch(console.error);
