// Common shared types.
export type ID = string;
export type ISODateString = string;
export type Nullable<T> = T | null;
export type Maybe<T> = T | null | undefined;
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
