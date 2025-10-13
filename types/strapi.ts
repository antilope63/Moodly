export type StrapiID = number;

export type StrapiTimestamp = string;

export interface StrapiErrorPayload {
  status: number;
  name: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface StrapiCollectionItem<T> {
  id: StrapiID;
  attributes: T;
}

export interface StrapiCollectionResponse<T> {
  data: Array<StrapiCollectionItem<T>>;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiSingleResponse<T> {
  data: StrapiCollectionItem<T> | null;
  meta?: Record<string, unknown>;
}
