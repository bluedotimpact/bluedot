import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import {
  Button, cn, IconButton, P,
} from '@bluedot/ui';
import { ModalHeader } from '@bluedot/ui/src/ModalHeader';
import { Dialog, Modal, ModalOverlay } from 'react-aria-components';
import {
  FaArrowLeft, FaArrowRight, FaExpand, FaMinus, FaPlus,
} from 'react-icons/fa6';

type Alignment = 'left' | 'center' | 'right';
type CourseFigureProps = React.PropsWithChildren<{
  /** Authored display width in CSS pixels; shrinks to the available space. */
  width?: string;
  align?: Alignment;
}>;
type FigureImage = { src: string; alt: string; naturalWidth: number; naturalHeight: number };
type CourseImageRowProps = React.PropsWithChildren<{
  /** Comma- or space-separated authored widths, used as relative column weights. */
  widths?: string;
  gap?: string;
}>;
type CourseCaptionProps = React.PropsWithChildren<{
  align?: Alignment;
  size?: 'body' | 'small';
}>;

const ALIGNMENT = { left: 'mr-auto ml-0', center: 'mx-auto', right: 'ml-auto mr-0' };
const TEXT_ALIGNMENT = { left: 'text-left', center: 'text-center', right: 'text-right' };

export const CourseFigure: React.FC<CourseFigureProps> = ({ width, align = 'left', children }) => {
  const figureRef = useRef<HTMLElement>(null);
  const [images, setImages] = useState<FigureImage[] | null>(null);
  const openViewer = () => {
    const figureImages = Array.from(figureRef.current?.querySelectorAll('img') ?? []).map((image) => ({
      src: image.currentSrc || image.src,
      alt: image.alt || 'Course illustration',
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
    }));
    if (figureImages.length) setImages(figureImages);
  };

  return <>
    <figure
      ref={figureRef}
      className={cn('my-6 max-w-full [&_img]:m-0 [&_img]:block [&_img]:h-auto [&_img]:w-full [&_img]:max-w-full [&>[data-course-caption]]:mb-0', ALIGNMENT[align])}
      // Airtable-authored pixel widths are runtime values, unavailable to Tailwind's scanner.
      style={{ width: positiveNumber(width) }}
    >
      {children}
      <Button variant="ghost" onClick={openViewer} className="mx-auto mt-2">
        <FaExpand aria-hidden="true" /> Enlarge image
      </Button>
    </figure>
    {images && <FigureViewer images={images} onClose={() => setImages(null)} />}
  </>;
};

export const CourseImageRow: React.FC<CourseImageRowProps> = ({ widths, gap = '0', children }) => {
  const images = React.Children.toArray(children).filter((child) => typeof child !== 'string' || child.trim().length > 0);
  const weights = widths?.split(/[\s,]+/).map(positiveNumber) ?? [];
  return (
    // The authored gap and column proportions are runtime values from course content.
    <div className="flex w-full flex-nowrap items-center" style={{ gap: positiveNumber(gap) ?? 0 }}>
      {images.map((child, index) => (
        <div key={React.isValidElement(child) ? child.key ?? index : index} className="min-w-0 shrink basis-0" style={{ flexGrow: weights[index] ?? 1 }}>
          {child}
        </div>
      ))}
    </div>
  );
};

export const CourseCaption: React.FC<CourseCaptionProps> = ({ align = 'left', size = 'body', children }) => (
  <div
    data-course-caption
    className={cn('mt-3 mb-5 text-primary [&_p]:m-0 [&_p]:[font-size:inherit] [&_a]:[font-size:inherit] [&_strong]:[font-size:inherit] [&_em]:[font-size:inherit]', TEXT_ALIGNMENT[align], size === 'small' ? 'text-size-xs' : 'text-size-sm')}
  >
    {children}
  </div>
);

const FigureViewer = ({ images, onClose }: { images: FigureImage[]; onClose: () => void }) => {
  const dialogRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: images[0]!.naturalWidth, height: images[0]!.naturalHeight });
  const image = images[index]!;

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return undefined;
    const measure = () => {
      const bounds = element.getBoundingClientRect();
      // client dimensions round up at fractional sizes, which can introduce a scrollbar in fit mode.
      setViewport({
        width: Math.floor(Math.min(bounds.width, element.clientWidth)),
        height: Math.floor(Math.min(bounds.height, element.clientHeight)),
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const fitWidth = naturalSize.width > 0 && naturalSize.height > 0
    ? Math.floor(Math.min(naturalSize.width, viewport.width, viewport.height * naturalSize.width / naturalSize.height))
    : 0;
  const resetZoom = useCallback(() => {
    setZoom(1);
    viewportRef.current?.scrollTo(0, 0);
  }, []);

  const changeImage = useCallback((nextIndex: number) => {
    const next = images[nextIndex];
    if (!next) return;
    setIndex(nextIndex);
    setNaturalSize({ width: next.naturalWidth, height: next.naturalHeight });
    resetZoom();
  }, [images, resetZoom]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (images.length > 1 && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        event.preventDefault();
        changeImage(index + (event.key === 'ArrowLeft' ? -1 : 1));
      }
    };

    // React Aria's Dialog intentionally filters keyboard props; listen on its DOM node.
    dialog?.addEventListener('keydown', handleKeyDown);
    return () => dialog?.removeEventListener('keydown', handleKeyDown);
  }, [changeImage, images.length, index]);

  // Shared Modal fixes its body width and scrolling. This viewer instead gives
  // the image its own bounded pan area, using the same react-aria focus/dismissal primitives.
  return (
    <ModalOverlay isOpen isDismissable onOpenChange={(open) => {
      if (!open) onClose();
    }} className="fixed inset-0 z-60 flex items-center justify-center bg-scrim p-4 backdrop-blur-xs">
      <Modal className="h-full w-full max-w-6xl">
        <Dialog
          ref={dialogRef}
          className="not-prose flex h-full min-h-0 flex-col rounded-overlay bg-raised text-primary shadow-xl outline-none"
          aria-label="Enlarged course image"
        >
          <ModalHeader title="Enlarged course image" isDismissable onClose={onClose} className="shrink-0 px-5 py-4" />
          <div className="flex shrink-0 flex-wrap items-center gap-3 px-5 py-3">
            <IconButton aria-label="Zoom out" disabled={zoom <= 0.25} onClick={() => setZoom((value) => Math.max(0.25, value / 1.5))}><FaMinus aria-hidden="true" /></IconButton>
            <IconButton aria-label="Zoom in" disabled={zoom >= 8} onClick={() => setZoom((value) => Math.min(8, value * 1.5))}><FaPlus aria-hidden="true" /></IconButton>
            <Button variant="ghost" onClick={resetZoom}>Fit image</Button>
            {images.length > 1 && <>
              <IconButton aria-label="Previous image" disabled={index === 0} onClick={() => changeImage(index - 1)}><FaArrowLeft aria-hidden="true" /></IconButton>
              <IconButton aria-label="Next image" disabled={index === images.length - 1} onClick={() => changeImage(index + 1)}><FaArrowRight aria-hidden="true" /></IconButton>
            </>}
            <div role="status" aria-atomic="true"><P className="text-size-xs text-secondary">Image {index + 1} of {images.length}</P></div>
          </div>
          <div ref={viewportRef} role="region" tabIndex={0} aria-label="Image area; scroll to explore" className="min-h-0 flex-1 overflow-auto overscroll-contain bg-raised focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus">
            <img
              key={image.src}
              src={image.src}
              alt={image.alt}
              className="mx-auto block h-auto max-w-none"
              // Fit uses both measured viewport axes; zoom may intentionally exceed them for panning.
              style={{ width: fitWidth * zoom }}
              onLoad={({ currentTarget }) => setNaturalSize({ width: currentTarget.naturalWidth, height: currentTarget.naturalHeight })}
            />
          </div>
          <P className="shrink-0 border-t border-subtle px-5 py-3 text-size-xs text-secondary">Scroll or swipe to explore the image.{images.length > 1 && ' Use arrow keys to change images.'}</P>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
};

function positiveNumber(value?: string): number | undefined {
  if (!value || !/^\d+(?:\.\d+)?$/.test(value)) return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}
