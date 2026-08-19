import { describe, expect, test } from 'vitest';
import { sanitiseCode } from '../../components/CodeRenderer';

describe('sanitiseCode', () => {
  test('strips a trailing export default line', () => {
    expect(sanitiseCode('const Component = () => <div />;\n\nexport default Component;\n\n')).toBe('const Component = () => <div />;');
  });

  test('strips an export default of any identifier, without a semicolon', () => {
    expect(sanitiseCode('const ComponentList = () => <div />;\nconst Component = () => <ComponentList />;\n\nexport default ComponentList')).toBe('const ComponentList = () => <div />;\nconst Component = () => <ComponentList />;');
  });

  test('removes only the export default prefix from a declaration, even indented', () => {
    expect(sanitiseCode('const A = 1;\n  export default function Component() {\n  return <div />;\n}')).toBe('const A = 1;\n  function Component() {\n  return <div />;\n}');
  });

  test('leaves export default alone when not at the start of a line', () => {
    expect(sanitiseCode('const s = "export default Component";\nconst Component = () => <div>{s}</div>;')).toBe('const s = "export default Component";\nconst Component = () => <div>{s}</div>;');
  });

  test('strips markdown code fences', () => {
    expect(sanitiseCode('```jsx\nconst Component = () => <div />;\n\nexport default Component;\n```')).toBe('const Component = () => <div />;');
  });
});
