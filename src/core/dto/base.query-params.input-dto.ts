import { Type } from 'class-transformer';

export class BaseQueryParams {
  @Type(() => Number)
  pageNumber: number = 1;
  @Type(() => Number)
  pageSize: number = 10;
  sortDirection: SortDirection = SortDirection.Desc;

  calculateSkip() {
    return (this.pageNumber - 1) * this.pageSize;
  }
}

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export function sortDirectionToNumber(direction: string): 1 | -1 {
  const normalized =
    direction.toLowerCase() === 'asc' ? SortDirection.Asc : SortDirection.Desc;

  return normalized === SortDirection.Asc ? 1 : -1;
}
