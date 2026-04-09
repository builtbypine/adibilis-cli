import chalk from 'chalk';

const SEVERITY_STYLES = {
  critical: { badge: chalk.bgRed.white.bold(' CRITICAL '), color: chalk.red },
  serious: { badge: chalk.bgYellow.black.bold(' SERIOUS  '), color: chalk.yellow },
  moderate: { badge: chalk.bgHex('#FFA500').black.bold(' MODERATE '), color: chalk.hex('#FFA500') },
  minor: { badge: chalk.gray.bold(' MINOR    '), color: chalk.gray },
};

const SEVERITY_ORDER = ['critical', 'serious', 'moderate', 'minor'];
const SEPARATOR = chalk.dim('\u2501'.repeat(39));

export function formatHeader() {
  return [
    '',
    `  ${chalk.bold.cyan('\uD83D\uDD0D Adibilis Accessibility Scanner')} ${chalk.dim('v1.0.0')}`,
    '',
  ].join('\n');
}

export function formatScanning(url) {
  return `  Scanning ${chalk.underline(url)}...`;
}

export function formatScanComplete(scan) {
  const passRate = scan.passRate != null ? scan.passRate : 0;
  const totalViolations =
    (scan.critical || 0) + (scan.serious || 0) + (scan.moderate || 0) + (scan.minor || 0);

  const passColor = passRate >= 90 ? chalk.green : passRate >= 70 ? chalk.yellow : chalk.red;

  const lines = [
    '',
    `  ${SEPARATOR}`,
    '',
    `  Pass Rate: ${passColor.bold(`${passRate}%`)}    Violations: ${chalk.bold(totalViolations)}`,
    '',
    `  ${chalk.red('\u25A0')} Critical: ${scan.critical || 0}   ${chalk.yellow('\u25A0')} Serious: ${scan.serious || 0}`,
    `  ${chalk.hex('#FFA500')('\u25A0')} Moderate: ${scan.moderate || 0}  ${chalk.gray('\u25A0')} Minor: ${scan.minor || 0}`,
    '',
    `  ${SEPARATOR}`,
  ];

  return lines.join('\n');
}

export function formatViolations(violations, { ignoreRules = [] } = {}) {
  if (!violations || violations.length === 0) {
    return '\n  ' + chalk.green('\u2714 No violations found!') + '\n';
  }

  const filtered = violations.filter((v) => !ignoreRules.includes(v.id));
  if (filtered.length === 0) {
    return '\n  ' + chalk.green('\u2714 All violations are in your ignore list.') + '\n';
  }

  const sorted = [...filtered].sort((a, b) => {
    const aIdx = SEVERITY_ORDER.indexOf(a.impact || 'minor');
    const bIdx = SEVERITY_ORDER.indexOf(b.impact || 'minor');
    if (aIdx !== bIdx) return aIdx - bIdx;
    return (b.nodes?.length || 0) - (a.nodes?.length || 0);
  });

  const lines = ['', '  TOP ISSUES:', ''];

  const shown = sorted.slice(0, 10);
  for (const v of shown) {
    const sev = SEVERITY_STYLES[v.impact || 'minor'] || SEVERITY_STYLES.minor;
    const icon = v.impact === 'critical' || v.impact === 'serious' ? '\u274C' : '\u26A0';
    const count = v.nodes?.length || 0;

    lines.push(`  ${icon} ${sev.badge} ${chalk.bold(v.id)} (${count})`);
    lines.push(`     ${v.description || v.help || ''}`);

    if (v.helpUrl) {
      lines.push(`     ${chalk.dim(v.helpUrl)}`);
    }

    const tags = v.tags || [];
    const wcagTag = tags.find((t) => t.startsWith('wcag'));
    if (wcagTag) {
      lines.push(`     WCAG ${wcagTag.replace('wcag', '').replace(/(\d)(\d)(\d)/, '$1.$2.$3')}`);
    }

    lines.push('');
  }

  if (sorted.length > 10) {
    lines.push(`  ${chalk.dim(`... and ${sorted.length - 10} more issues`)}`);
    lines.push('');
  }

  return lines.join('\n');
}

export function formatFixSuggestion(url, fixCount) {
  if (!fixCount) return '';

  const lines = [
    `  ${SEPARATOR}`,
    '',
    `  ${fixCount} auto-fix patches available. Run:`,
    `    ${chalk.cyan(`adibilis scan ${url} --fix`)}`,
    '',
  ];

  return lines.join('\n');
}

export function formatFixes(fixes) {
  if (!fixes?.patches?.patches?.length) {
    return '\n  ' + chalk.dim('No auto-fix patches available.') + '\n';
  }

  const lines = ['', `  ${SEPARATOR}`, '', '  AUTO-FIX PATCHES:', ''];

  for (const patch of fixes.patches.patches) {
    lines.push(`  ${chalk.bold(patch.ruleId || patch.id || 'unknown')}`);

    if (patch.fixes) {
      for (const fix of patch.fixes.slice(0, 3)) {
        if (fix.selector) {
          lines.push(`    ${chalk.dim('Selector:')} ${fix.selector}`);
        }
        if (fix.suggestion) {
          lines.push(`    ${chalk.dim('Fix:')} ${fix.suggestion}`);
        }
        lines.push('');
      }

      if (patch.fixes.length > 3) {
        lines.push(`    ${chalk.dim(`... and ${patch.fixes.length - 3} more fixes`)}`);
        lines.push('');
      }
    }
  }

  if (fixes.patches.limitedByPlan) {
    lines.push(
      `  ${chalk.yellow('Showing')} ${fixes.patches.totalPatches} of ${fixes.patches.totalPatchesBeforeLimit} patches.`,
    );
    lines.push(`  ${chalk.yellow('Upgrade your plan for full remediation patches.')}`);
    lines.push('');
  }

  return lines.join('\n');
}

export function formatReportHint(url) {
  return [
    '',
    '  Full report:',
    `    ${chalk.cyan(`adibilis scan ${url} --report`)}`,
    '',
  ].join('\n');
}

export function formatError(message) {
  return `\n  ${chalk.red('\u2718')} ${message}\n`;
}
