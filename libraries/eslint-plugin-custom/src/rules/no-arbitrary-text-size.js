// Maps common arbitrary text sizes to their nearest design-system token.
// Mobile values match the token's mobile size; desktop values match the token's md+ size.
const tokenSuggestions = {
  '7px': 'text-size-xxs (12px)',
  '8px': 'text-size-xxs (12px)',
  '9px': 'text-size-xxs (12px)',
  '10px': 'text-size-xxs (12px)',
  '11px': 'text-size-xxs (12px)',
  '12px': 'text-size-xxs',
  '13px': 'text-size-xs (14px)',
  '14px': 'text-size-xs',
  '15px': 'text-size-sm (16px)',
  '16px': 'text-size-sm',
  '17px': 'text-size-md (18px)',
  '18px': 'text-size-md',
  '20px': 'text-size-md (18px) or text-size-lg (24px)',
  '22px': 'text-size-lg (24px)',
  '23px': 'text-size-lg (24px)',
  '24px': 'text-size-lg',
  '26px': 'text-size-lg (24px)',
  '28px': 'text-size-xl (32px)',
  '32px': 'text-size-xl (responsive 32→48)',
  '34px': 'text-size-xl (32px)',
  '36px': 'text-size-2xl (40px) or text-size-xl',
  '40px': 'text-size-2xl (responsive 40→56)',
  '48px': 'text-size-3xl (mobile) or text-size-xl (md+)',
  '56px': 'text-size-2xl (md+) or text-size-4xl (mobile)',
  '64px': 'text-size-3xl (md+)',
  '72px': 'text-size-4xl (md+)',
  '96px': 'text-size-4xl (md+)',
};

// Match `text-[Npx]` or `text-[Nrem]` with optional responsive prefix(es).
// Allows arbitrary modifier prefixes like `min-[1024px]:text-[20px]`.
const arbitraryTextSizeRe = /(?:^|\s)((?:[a-zA-Z0-9._-]+(?:\[[^\]]+\])?:)*text-\[(\d+(?:\.\d+)?(?:px|rem))\])(?=\s|$)/g;

const checkValue = (value, node, context) => {
  if (typeof value !== 'string') return;
  // eslint-disable-next-line no-restricted-syntax
  for (const match of value.matchAll(arbitraryTextSizeRe)) {
    const [, fullClass, size] = match;
    const suggestion = tokenSuggestions[size];
    const message = suggestion
      ? `Avoid arbitrary text size '${fullClass}'. Use design-system token '${suggestion}'. If the size is intentionally off-scale (e.g. bespoke marketing hero), prefix the line with '// eslint-disable-next-line @bluedot/custom/no-arbitrary-text-size'.`
      : `Avoid arbitrary text size '${fullClass}'. Use a 'text-size-*' design-system token, or add an 'eslint-disable-next-line @bluedot/custom/no-arbitrary-text-size' comment if the size is intentionally off-scale.`;
    context.report({ node, message });
  }
};

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow arbitrary text-[Npx] / text-[Nrem] Tailwind utilities; use design-system text-size-* tokens instead.',
      category: 'Best Practices',
    },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name !== 'className') return;
        if (!node.value) return;
        if (node.value.type === 'Literal') {
          checkValue(node.value.value, node, context);
        } else if (node.value.type === 'JSXExpressionContainer') {
          // Walk the expression for any string literals inside (handles clsx/cn calls and template literals).
          // Keep this lightweight — full resolution would require type info.
          const visit = (n) => {
            if (!n || typeof n !== 'object') return;
            if (n.type === 'Literal' && typeof n.value === 'string') {
              checkValue(n.value, node, context);
            } else if (n.type === 'TemplateElement' && n.value && typeof n.value.cooked === 'string') {
              checkValue(n.value.cooked, node, context);
            }
            // eslint-disable-next-line no-restricted-syntax
            for (const key of Object.keys(n)) {
              if (key === 'parent' || key === 'loc' || key === 'range') continue;
              const v = n[key];
              if (Array.isArray(v)) v.forEach(visit);
              else if (v && typeof v === 'object') visit(v);
            }
          };
          visit(node.value.expression);
        }
      },
    };
  },
};
