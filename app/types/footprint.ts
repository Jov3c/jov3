export interface PublicFootprintCity {
  id: string;
  slug: string;
  countryCode: string;
  countryName: string;
  cityName: string;
  regionName: string | null;
  memoryCount: number;
  visited: boolean;
  boundaryUrl: string;
}

export interface PublicFootprintMemoryMedia {
  id: string;
  publicUrl: string;
  altText: string | null;
  sortOrder: number;
}

export interface PublicFootprintMemory {
  id: string;
  title: string;
  body: string;
  occurredOn: string | null;
  sortOrder: number;
  media: PublicFootprintMemoryMedia[];
}

export interface PublicFootprintCityDetail extends PublicFootprintCity {
  memories: PublicFootprintMemory[];
}

export interface PublicFootprintCitiesResponse {
  data: PublicFootprintCity[];
}

export interface PublicFootprintCityResponse {
  data: PublicFootprintCityDetail;
}

export interface FootprintBoundaryFeature {
  type: 'Feature';
  geometry: { type: string; coordinates: unknown } | null;
  properties: Record<string, unknown> | null;
}

export interface FootprintBoundary {
  type: 'FeatureCollection';
  features: FootprintBoundaryFeature[];
}

export interface FootprintBoundaryResponse {
  data: FootprintBoundary;
}
