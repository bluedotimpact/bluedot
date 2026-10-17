// Airtable can return an empty value for any field, so a synced column marked notNull() quietly
// stores '' / false / [] (or the sync warns and drops the value) instead of failing loudly.
// New synced columns should be nullable; existing ones are listed in the `allow` option.
const MESSAGE = 'Synced column {{column}} uses notNull(). Airtable can leave any field empty, so make the column nullable and handle null where it\'s read.';
const STALE_MESSAGE = '{{column}} is in the allow list but no longer uses notNull(). Remove it from the allow list.';

const propertyNamed = (objectExpression, name) => objectExpression.properties.find((p) => p.type === 'Property' && !p.computed && (p.key.name ?? p.key.value) === name);

const callsNotNull = (node) => {
  let current = node;
  while (current) {
    if (current.type === 'CallExpression') {
      if (current.callee.type === 'MemberExpression' && current.callee.property.name === 'notNull') return true;
      current = current.callee.type === 'MemberExpression' ? current.callee.object : null;
    } else if (current.type === 'MemberExpression') {
      current = current.object;
    } else if (current.type === 'TSAsExpression' || current.type === 'TSSatisfiesExpression') {
      current = current.expression;
    } else {
      return false;
    }
  }

  return false;
};

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow notNull() on columns synced from Airtable',
      category: 'Best Practices',
    },
    schema: [{
      type: 'object',
      properties: { allow: { type: 'array', items: { type: 'string' } } },
      additionalProperties: false,
    }],
  },
  create(context) {
    const allowed = new Set(context.options[0]?.allow ?? []);
    const allowedSeen = new Set();
    return {
      CallExpression(node) {
        if (node.callee.type !== 'Identifier' || node.callee.name !== 'pgAirtable') return;
        const [nameArg, config] = node.arguments;
        if (nameArg?.type !== 'Literal' || config?.type !== 'ObjectExpression') return;
        const columns = propertyNamed(config, 'columns');
        if (columns?.value.type !== 'ObjectExpression') return;

        for (const column of columns.value.properties) {
          if (column.type !== 'Property' || column.value.type !== 'ObjectExpression') continue;
          const pgColumn = propertyNamed(column.value, 'pgColumn');
          const columnName = `${nameArg.value}.${column.key.name ?? column.key.value}`;
          if (!pgColumn || !callsNotNull(pgColumn.value)) continue;
          if (allowed.has(columnName)) {
            allowedSeen.add(columnName);
          } else {
            context.report({ node: pgColumn.value, message: MESSAGE, data: { column: columnName } });
          }
        }
      },
      // A stale entry would quietly allow notNull() back on that column, so flag it
      'Program:exit'(node) {
        for (const columnName of allowed) {
          if (!allowedSeen.has(columnName)) {
            context.report({ node, message: STALE_MESSAGE, data: { column: columnName } });
          }
        }
      },
    };
  },
};
