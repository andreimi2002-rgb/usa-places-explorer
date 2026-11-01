import type { ImageAsset } from '../../types';
import { AtlasImage } from './AtlasImage';

/** Grid of credited images. Renders nothing when there are none. */
export function ImageGallery({ images }: { images: ImageAsset[] }) {
  if (images.length === 0) return null;
  return (
    <ul className="grid gap-6 sm:grid-cols-2">
      {images.map((img) => (
        <li key={img.id}>
          <AtlasImage image={img} aspect="aspect-[4/3]" />
        </li>
      ))}
    </ul>
  );
}
