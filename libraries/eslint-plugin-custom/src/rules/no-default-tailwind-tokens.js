const defaultTokens = {
  // Text sizes
  'text-xs': 'text-size-xs',
  'text-sm': 'text-size-sm',
  'text-base': 'text-size-md',
  'text-lg': 'text-size-lg',
  'text-xl': 'text-size-xl',
};

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce usage of design system tokens instead of default Tailwind classes',
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
          if (defaultTokens[className]) {
            context.report({
              node,
              message: `Use design system token '${defaultTokens[className]}' instead of Tailwind default '${className}'`,
              fix(fixer) {
                const newClassNames = classNames.map((cn) => defaultTokens[cn] || cn).join(' ');
                return fixer.replaceText(node.value, `"${newClassNames}"`);
              },
            });
          }
        });
      },
    };
  },
};
