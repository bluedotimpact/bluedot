import {
  A,
  Breadcrumbs,
  Callout,
  CardShell,
  Collapsible,
  Section,
  Tag,
} from '@bluedot/ui';
import Head from 'next/head';
import { Fragment } from 'react';
import { MARKDOWN_PROSE_CLASSES } from '../components/courses/MarkdownExtendedRenderer';
import MarketingHero from '../components/MarketingHero';
import {
  AT_A_GLANCE,
  EFFECTIVE_DATE,
  INTRO,
  META_DESCRIPTION,
  ON_THIS_PAGE,
  SECTIONS,
  type ContentBlock,
  type GlanceCard,
} from '../components/contractor-privacy-notice/content';
import { pageMetaTags } from '../lib/linkPreviewMetaTags';
import { ROUTES } from '../lib/routes';

const CURRENT_ROUTE = ROUTES.contractorPrivacyNotice;

// Captures: 1 = bold text, 2 = link text, 3 = link href
const INLINE_MARKDOWN = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;

/*
 * Rendered as TSX with the same prose classes as MarkdownExtendedRenderer, rather than through it:
 * the renderer evaluates MDX after mount, so content would shift under the in-page anchor links,
 * and it escapes the ids, cards and tags this page needs.
 */
const ContractorPrivacyNoticePage = () => {
  return (
    <div>
      <Head>
        {pageMetaTags({ title: `${CURRENT_ROUTE.title} | BlueDot Impact`, description: META_DESCRIPTION })}
      </Head>
      <MarketingHero title={CURRENT_ROUTE.title} subtitle={EFFECTIVE_DATE} />
      <Breadcrumbs route={CURRENT_ROUTE} />
      <Section className="max-w-3xl">
        <div className={MARKDOWN_PROSE_CLASSES}>
          <Blocks blocks={INTRO} />

          <NoticeHeading id={AT_A_GLANCE.id}>{AT_A_GLANCE.title}</NoticeHeading>
          <ul className="not-prose my-6 grid grid-cols-1 gap-4 bd-md:grid-cols-2">
            {AT_A_GLANCE.cards.map((card) => (
              <li key={card.title}>
                <GlanceCardItem card={card} />
              </li>
            ))}
          </ul>

          <NoticeHeading id={ON_THIS_PAGE.id}>{ON_THIS_PAGE.title}</NoticeHeading>
          <ol>
            {ON_THIS_PAGE.links.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.text}</a>
              </li>
            ))}
          </ol>

          {SECTIONS.map((section) => (
            <Fragment key={section.id}>
              <NoticeHeading id={section.id}>{section.title}</NoticeHeading>
              <Blocks blocks={section.blocks} />
              {section.readMore && (
                <Collapsible title={section.readMore.title}>
                  <Blocks blocks={section.readMore.blocks} />
                </Collapsible>
              )}
            </Fragment>
          ))}
        </div>
      </Section>
    </div>
  );
};

ContractorPrivacyNoticePage.pageRendersOwnNav = true;

export default ContractorPrivacyNoticePage;

// The nav is sticky, so anchored headings need room above them
const NoticeHeading = ({ id, children }: { id: string; children: string }) => (
  <h2 id={id} className="scroll-mt-28">{children}</h2>
);

const GlanceCardItem = ({ card }: { card: GlanceCard }) => {
  const isHighlighted = !card.items;
  const Icon = card.icon;

  return (
    <CardShell className={isHighlighted ? 'flex h-full flex-col gap-3 border-info-border bg-info-bg text-info-fg' : 'flex h-full flex-col gap-3'}>
      <h3 className={isHighlighted ? 'bluedot-h4 flex items-center gap-2 text-info-fg' : 'bluedot-h4 flex items-center gap-2'}>
        <Icon aria-hidden="true" className="size-4 shrink-0 text-accent" />
        {card.title}
      </h3>
      {card.items && (
        <ul className="list-disc space-y-1 pl-5 text-size-sm leading-relaxed text-secondary">
          {card.items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      {card.text && (
        <p className="text-size-sm leading-relaxed">
          <InlineText text={card.text} linkStyle="standalone" />
        </p>
      )}
      {card.link && (
        <A href={card.link.href} className="mt-auto pt-2 text-size-sm">{card.link.text}</A>
      )}
    </CardShell>
  );
};

const Blocks = ({ blocks }: { blocks: ContentBlock[] }) => (
  // Blocks never reorder, so the index is a stable key
  <>{blocks.map((block, index) => <Block key={index} block={block} />)}</>
);

const Block = ({ block }: { block: ContentBlock }) => {
  switch (block.type) {
    case 'paragraph':
      return <p><InlineText text={block.text} /></p>;
    case 'list':
      return (
        <ul>
          {block.items.map((item) => <li key={item}><InlineText text={item} /></li>)}
        </ul>
      );
    case 'subheading':
      return <h3>{block.text}</h3>;
    case 'table':
      return (
        // Lets wide tables scroll inside the column instead of widening the page
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                {block.columns.map((column) => <th key={column} scope="col">{column}</th>)}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row[0]}>
                  {/* Prose only styles tbody td, so the row header copies a first-column td's spacing */}
                  <th scope="row" className="ps-0 pe-[0.5714286em] py-[0.5714286em] text-start align-baseline font-normal">
                    <InlineText text={row[0] ?? ''} />
                  </th>
                  {row.slice(1).map((cell, cellIndex) => (
                    // Cells in a row can repeat (e.g. two ticks), so key by column
                    <td key={cellIndex}><InlineText text={cell} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'callout':
      return (
        <Callout tone="info" title={block.title} className="not-prose my-6">
          <p><InlineText text={block.text} linkStyle="standalone" /></p>
        </Callout>
      );
    case 'legalBasis':
      return (
        <div className="not-prose my-4 flex flex-wrap items-center gap-2">
          <span className="text-size-xs text-secondary">Legal basis</span>
          {block.bases.map((basis) => <Tag key={basis} tone="accent">{basis}</Tag>)}
        </div>
      );
    default:
      return null;
  }
};

/**
 * Renders **bold** and [links](url). Prose links are styled by the surrounding prose classes;
 * standalone links sit in not-prose containers, so they use the design system's link styles.
 */
const InlineText = ({ text, linkStyle = 'prose' }: { text: string; linkStyle?: 'prose' | 'standalone' }) => {
  // split() with capture groups yields [plain, bold, linkText, href, plain, bold, ...]
  const parts = text.split(INLINE_MARKDOWN);
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i += 4) {
    const [plain, bold, linkText, href] = parts.slice(i, i + 4);
    if (plain) {
      nodes.push(plain);
    }

    if (bold) {
      nodes.push(<strong key={i}>{bold}</strong>);
    } else if (linkText && href) {
      nodes.push(<InlineLink key={i} href={href} linkStyle={linkStyle}>{linkText}</InlineLink>);
    }
  }

  return <>{nodes}</>;
};

const InlineLink = ({ href, linkStyle, children }: { href: string; linkStyle: 'prose' | 'standalone'; children: string }) => {
  const isExternal = href.startsWith('http://') || href.startsWith('https://');
  const externalProps = isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {};

  if (linkStyle === 'standalone') {
    return <A href={href} {...externalProps}>{children}</A>;
  }

  return <a href={href} {...externalProps}>{children}</a>;
};
