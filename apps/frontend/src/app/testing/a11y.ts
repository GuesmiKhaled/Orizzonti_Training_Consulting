import axe from 'axe-core';

/**
 * Runs axe-core on a rendered element and returns readable violation lines
 * (empty when the element passes).
 *
 * `region` is off because it asks whether *content sits inside landmarks*, which
 * is meaningless for a component rendered on its own; it is checked with the
 * whole layout instead.
 */
export async function a11yViolations(
  element: Element,
  options: axe.RunOptions = {},
): Promise<string[]> {
  const results = await axe.run(element, {
    resultTypes: ['violations'],
    rules: { region: { enabled: false } },
    ...options,
  });
  return results.violations.map((violation) => {
    const where = violation.nodes
      .slice(0, 3)
      .map((node) => node.target.join(' '))
      .join(' | ');
    return `${violation.id} (${violation.impact}): ${violation.help} -> ${where}`;
  });
}
