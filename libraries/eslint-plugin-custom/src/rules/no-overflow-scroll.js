// Map of overflow-scroll tokens to their overflow-auto equivalents
const overflowScrollTokens = {
  'overflow-scroll': 'overflow-auto',
  'overflow-y-scroll': 'overflow-y-auto',
  'overflow-x-scroll': 'overflow-x-auto',
};

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Discourage usage of overflow-scroll in favor of overflow-auto',
      category: 'Best Practices',
    },
    fixable: 'code',
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name !== 'className') return;

        if (node.value.type !== 'Literal') return;

        const classNames = node.value.value.split(' ');

        classNames.forEach((className) => {
          // Check if the className ends with any of the overflow-scroll tokens
          const matchingToken = Object.keys(overflowScrollTokens).find((token) => className === token || className.endsWith(`-${token}`) || className.endsWith(`:${token}`));

          if (matchingToken) {
            const replacement = overflowScrollTokens[matchingToken];
            // Create the replacement by replacing just the matching part at the end
            const newClassName = className.replace(matchingToken, replacement);

            context.report({
              node,
              message: `Use '${replacement}' instead of '${matchingToken}'. The 'auto' value only shows scrollbars when needed, while 'scroll' always shows them even when content fits the container.`,
              fix(fixer) {
                const newClassNames = classNames.map((cn) => {
                  if (cn === className) {
                    return newClassName;
                  }
                  return cn;
                }).join(' ');
                return fixer.replaceText(node.value, `"${newClassNames}"`);
              },
            });
          }
        });
      },
    };
  },
};
