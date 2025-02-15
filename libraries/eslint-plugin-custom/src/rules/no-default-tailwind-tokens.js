const defaultTokens = {
  // Text sizes
  'text-xs': 'text-size-xs',
  'text-sm': 'text-size-s',
  'text-base': 'text-size-m',
  'text-lg': 'text-size-l',
  'text-xl': 'text-size-xl',
  'text-2xl': 'text-size-2xl',
  'text-3xl': 'text-size-3xl',

  // Border radius
  'rounded-sm': 'rounded-radius-sm',
  rounded: 'rounded-radius-base',
  'rounded-md': 'rounded-radius-md',
  'rounded-lg': 'rounded-radius-lg',
  'rounded-xl': 'rounded-radius-xl',
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
