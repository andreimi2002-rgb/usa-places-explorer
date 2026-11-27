declare module "shapefile" {
  import type { FeatureCollection } from "geojson";
  export function read(
    shp: ArrayBuffer | Uint8Array | string,
    dbf?: ArrayBuffer | Uint8Array | string,
    options?: { encoding?: string },
  ): Promise<FeatureCollection>;
}
