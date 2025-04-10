import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  InsertImage,
  InsertThematicBreak,
  thematicBreakPlugin,
  MDXEditor,
  MDXEditorMethods,
  UndoRedo,
  headingsPlugin,
  imagePlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  // TODO: enable this after https://github.com/mdx-editor/editor/issues/746 fixed
  //   InsertCodeBlock,
  //   codeBlockPlugin,
  //   sandpackPlugin,
  //   SandpackEditor,
  toolbarPlugin,
  GenericJsxEditor,
  usePublisher,
  insertJsx$,
  Button,
  jsxPlugin,
  JsxComponentDescriptor,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { useRef } from 'react';

const jsxComponentDescriptors: JsxComponentDescriptor[] = [
  {
    name: 'Embed',
    kind: 'flow', // 'text' for inline, 'flow' for block
    // the source field is used to construct the import statement at the top of the markdown document.
    // it won't be actually sourced.
    source: './Embed',
    // Used to construct the property popover of the generic editor
    props: [
      { name: 'url', type: 'string' },
    ],
    // whether the component has children or not
    hasChildren: false,
    Editor: GenericJsxEditor,
  },
];

// a toolbar button that will insert a JSX element into the editor.
const InsertEmbed = () => {
  const insertJsx = usePublisher(insertJsx$);
  return (
    <Button
      onClick={() => insertJsx({
        name: 'Embed',
        kind: 'flow',
        props: { url: 'https://example.com' },
      })}
    >
      Embed
    </Button>
  );
};

interface MarkdownExtendedEditorProps {
  children?: string;
}

const MarkdownExtendedEditor: React.FC<MarkdownExtendedEditorProps> = ({ children = '' }) => {
  const ref = useRef<MDXEditorMethods>(null);

  return (
    <MDXEditor
      ref={ref}
      markdown={children}
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        // TODO: enable this after https://github.com/mdx-editor/editor/issues/746 fixed
        // codeBlockPlugin({
        //   codeBlockEditorDescriptors: [{ priority: -10, match: () => true, Editor: SandpackEditor }],
        // }),
        // sandpackPlugin(),
        imagePlugin(),
        thematicBreakPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        markdownShortcutPlugin(),
        jsxPlugin({
          jsxComponentDescriptors,
        }),
        toolbarPlugin({
          toolbarClassName: 'my-classname',
          // eslint-disable-next-line react/no-unstable-nested-components
          toolbarContents: () => (
            <>
              <BlockTypeSelect />
              <BoldItalicUnderlineToggles />
              <CodeToggle />
              {/* TODO: enable this after https://github.com/mdx-editor/editor/issues/746 fixed */}
              {/* <InsertCodeBlock /> */}
              <CreateLink />
              <InsertImage />
              <InsertThematicBreak />
              <InsertEmbed />
              <UndoRedo />
            </>
          ),
        }),
      ]}
    />
  );
};

export default MarkdownExtendedEditor;
