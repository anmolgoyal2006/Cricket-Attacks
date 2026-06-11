export function parsePagination(query: Record<string, any>): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function parseSort(query: Record<string, any>, defaultSort: string = '-createdAt'): string {
  return query.sort || defaultSort;
}

export function paginationResponse(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}
