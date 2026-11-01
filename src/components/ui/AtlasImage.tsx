import { Camera } from 'lucide-react';
import { useState } from 'react';
import type { ImageAsset } from '../../types';

interface Props {
  image: ImageAsset | undefined;
  /** Tailwind aspect class, e.g. "aspect-[16/9]". */
  aspect?: string;
  /** Show the attribution line under the image. */
  showAttribution?: boolean;
  className?: string;
  loading?: 'lazy' | 'eager';
}

/** Intentional placeholder used whenever no verified image exists. */
export function PhotoPlaceholder({ aspect = 'aspect-[16/9]', className = '' }: { aspect?: string; className?: string }) {
  return (
    <div
      className={`flex ${aspect} w-full flex-col items-center justify-center gap-2 rounded border border-dashed border-line-strong bg-paper-sunk text-ink-subtle ${className}`}
    >
      <Camera aria-hidden="true" className="h-6 w-6" />
      <span className="text-caption font-semibold uppercase tracking-wider">Photo needed</span>
    </div>
  );
}

export function ImageAttribution({ image }: { image: ImageAsset }) {
  return (
    <p className="mt-2 text-caption text-ink-subtle">
      Photo:{' '}
      {image.authorUrl ? (
        <a href={image.authorUrl} target="_blank" rel="noopener noreferrer" className="link">
          {image.author}
        </a>
      ) : (
        image.author
      )}
      {' · '}
      {image.licenseUrl ? (
        <a href={image.licenseUrl} target="_blank" rel="noopener noreferrer license" className="link">
          {image.license}
        </a>
      ) : (
        image.license
      )}
      {' · '}
      <a href={image.commonsPageUrl} target="_blank" rel="noopener noreferrer" className="link">
        Wikimedia Commons
      </a>
    </p>
  );
}

/** A Commons image with attribution, or a placeholder if missing or broken. */
export function AtlasImage({ image, aspect = 'aspect-[16/9]', showAttribution = true, className = '', loading = 'lazy' }: Props) {
  const [failed, setFailed] = useState(false);

  if (!image || failed) return <PhotoPlaceholder aspect={aspect} className={className} />;

  return (
    <figure className={className}>
      <div className={`${aspect} w-full overflow-hidden rounded bg-paper-sunk`}>
        <img
          src={image.fileUrl}
          alt={image.alt}
          loading={loading}
          decoding="async"
          width={image.width ?? undefined}
          height={image.height ?? undefined}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      </div>
      {(image.caption || showAttribution) && (
        <figcaption>
          {image.caption && <p className="mt-2 text-small text-ink-muted">{image.caption}</p>}
          {showAttribution && <ImageAttribution image={image} />}
        </figcaption>
      )}
    </figure>
  );
}
