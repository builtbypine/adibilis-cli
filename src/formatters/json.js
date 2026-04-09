export function formatScanJson(scan, { fixes = null, ignoreRules = [] } = {}) {
  const violations = (scan.violations || []).filter((v) => !ignoreRules.includes(v.id));

  const result = {
    url: scan.url || scan.site?.url || null,
    status: scan.status,
    passRate: scan.passRate ?? null,
    violations: {
      total: violations.length,
      critical: scan.critical || 0,
      serious: scan.serious || 0,
      moderate: scan.moderate || 0,
      minor: scan.minor || 0,
    },
    rules: violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description || v.help || null,
      count: v.nodes?.length || 0,
      helpUrl: v.helpUrl || null,
    })),
  };

  if (fixes) {
    result.fixes = {
      totalPatches: fixes.patches?.totalPatches || 0,
      patches: (fixes.patches?.patches || []).map((p) => ({
        ruleId: p.ruleId || p.id,
        fixCount: p.fixes?.length || 0,
      })),
    };
  }

  return JSON.stringify(result, null, 2);
}
