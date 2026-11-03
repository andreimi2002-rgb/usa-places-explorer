import { Info } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { ImageAsset } from '../../types';

/** Author · license · Commons link. Used in the credit popover and in captions. */
export function ImageAttribution({ image, className = 'mt-2' }: { image: ImageAsset; className?: string }) {
  return (
    <p className={`relative z-10 text-caption ${className}`}>
      Photo:{' '}
      {image.authorUrl ? (
        <a href={image.authorUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          {image.author}
        </a>
      ) : (
        image.author
      )}
      {' · '}
      {image.licenseUrl ? (
        <a href={image.licenseUrl} target="_blank" rel="noopener noreferrer license" className="underline underline-offset-2">
          {image.license}
        </a>
      ) : (
        image.license
      )}
      {' · '}
      <a href={image.commonsPageUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
        Wikimedia Commons
      </a>
      {image.reviewed === false && ' · Photo not yet reviewed'}
    </p>
  );
}

/**
 * The photo credit as a small "i" button on the image. It opens a short
 * popover with author, license and source, so credits stay available
 * without a text line under every picture.
 */
export function PhotoCredit({ image, className = 'bottom-2 right-2' }: { image: ImageAsset; className?: string }) {
  return (
    <details className={`group/credit absolute z-20 ${className}`}>
      <summary
        aria-label="Photo credit"
        title="Photo credit"
        className="flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-full bg-navy-950/60 text-paper-white backdrop-blur-sm transition-colors hover:bg-navy-950/85 [&::-webkit-details-marker]:hidden"
      >
        <Info aria-hidden="true" className="h-3.5 w-3.5" />
      </summary>
      <div className="absolute bottom-9 right-0 w-64 max-w-[80vw] rounded bg-navy-950/95 p-3 text-paper-white shadow-lifted">
        <ImageAttribution image={image} className="" />
      </div>
    </details>
  );
}

/** A colored, typographic stand-in when a place has no verified photo. */
export function TypeArt({
  label, icon, color, aspect = 'aspect-[4/3]', className = '',
}: { label: string; icon?: ReactNode; color: string; aspect?: string; className?: string }) {
  return (
    <div
      className={`relative flex ${aspect} w-full flex-col justify-end overflow-hidden p-5 ${className}`}
      style={{ backgroundColor: color }}
    >
      <span aria-hidden="true" className="absolute -right-4 -top-4 text-paper-white/15 [&>svg]:h-40 [&>svg]:w-40">
        {icon}
      </span>
      <span className="relative font-serif text-h3 font-semibold leading-tight text-paper-white">{label}</span>
      <span className="relative mt-1 text-caption uppercase tracking-wider text-paper-white/75">No photo yet</span>
    </div>
  );
}

/** Kept for places that need an explicit "photo needed" notice (e.g. galleries). */
export function PhotoPlaceholder({ aspect = 'aspect-[16/9]', className = '' }: { aspect?: string; className?: string }) {
  return (
    <div className={`flex ${aspect} w-full items-center justify-center bg-paper-sunk text-caption uppercase tracking-wider text-ink-subtle ${className}`}>
      No photo yet
    </div>
  );
}

interface Props {
  image: ImageAsset | undefined;
  /** Tailwind aspect class, e.g. "aspect-[16/9]". */
  aspect?: string;
  /** How the credit is shown: an "i" button on the image, a caption line, or not at all. */
  credit?: 'overlay' | 'caption' | 'none';
  /** Show the descriptive caption below the image. */
  showCaption?: boolean;
  className?: string;
  imgClassName?: string;
  loading?: 'lazy' | 'eager';
  /** Shown instead of a placeholder when there is no image. */
  fallback?: ReactNode;
}

/** A Commons image with its credit, or a fallback if missing or broken. */
export function AtlasImage({
  image, aspect = 'aspect-[16/9]', credit = 'overlay', showCaption = false, className = '', imgClassName = '',
  loading = 'lazy', fallback,
}: Props) {
  const [failed, setFailed] = useState(false);

  if (!image || failed) return <>{fallback ?? <PhotoPlaceholder aspect={aspect} className={className} />}</>;

  return (
    <figure className={className}>
      <div className={`relative ${aspect} w-full overflow-hidden bg-paper-sunk`}>
        <img
          src={image.fileUrl}
          alt={image.alt}
          loading={loading}
          decoding="async"
          width={image.width ?? undefined}
          height={image.height ?? undefined}
          onError={() => setFailed(true)}
          className={`h-full w-full object-cover ${imgClassName}`}
        />
        {credit === 'overlay' && <PhotoCredit image={image} />}
      </div>
      {((showCaption && image.caption) || credit === 'caption') && (
        <figcaption className="mt-2 text-ink-muted">
          {showCaption && image.caption && <p className="text-small">{image.caption}</p>}
          {credit === 'caption' && <ImageAttribution image={image} className="mt-1 text-ink-subtle" />}
        </figcaption>
      )}
    </figure>
  );
}
