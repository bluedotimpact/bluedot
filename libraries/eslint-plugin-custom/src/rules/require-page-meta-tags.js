// Head tags that pageMetaTags() writes. Writing them by hand lets a page's link-preview
// tags (og:/twitter:) drift from, or go missing next to, its <title> and description.
// Checked on both `name` and `property`, since pages and scrapers use either.
const HELPER_META = ['description', 'og:title', 'og:description', 'twitter:title', 'twitter:description'];

const MESSAGE = 'Use pageMetaTags({ title, description }) from \'lib/linkPreviewMetaTags\' instead of writing {{tag}} by hand. It writes the page title and description plus the og: and twitter: copies that link previews read.';

const staticAttr = (node, attrName) => {
  const attr = node.attributes.find((a) => a.type === 'JSXAttribute' && a.name.name === attrName);
  if (!attr || !attr.value) return null;
  if (attr.value.type === 'Literal') return attr.value.value;
  const { expression } = attr.value;
  if (attr.value.type === 'JSXExpressionContainer' && expression.type === 'Literal') return expression.value;
  if (attr.value.type === 'JSXExpressionContainer' && expression.type === 'TemplateLiteral' && expression.expressions.length === 0) {
    return expression.quasis[0].value.cooked;
  }

  return null;
};

// <title> inside an <svg> is an accessible label for the icon, not the page title
const isInsideSvg = (node) => {
  let current = node.parent;
  while (current) {
    if (current.type === 'JSXElement' && current.openingElement.name.name === 'svg') return true;
    current = current.parent;
  }

  return false;
};

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require pageMetaTags() for page titles and descriptions so link-preview tags are always set',
      category: 'Best Practices',
    },
    schema: [],
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.type !== 'JSXIdentifier') return;

        if (node.name.name === 'title' && !isInsideSvg(node.parent)) {
          context.report({ node, message: MESSAGE, data: { tag: '<title>' } });
          return;
        }

        if (node.name.name !== 'meta') return;

        for (const attrName of ['name', 'property']) {
          const value = staticAttr(node, attrName);
          if (HELPER_META.includes(value)) {
            context.report({ node, message: MESSAGE, data: { tag: `<meta ${attrName}="${value}">` } });
            return;
          }
        }
      },
    };
  },
};
