"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePagination = parsePagination;
exports.parseSort = parseSort;
exports.paginationResponse = paginationResponse;
function parsePagination(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}
function parseSort(query, defaultSort = '-createdAt') {
    return query.sort || defaultSort;
}
function paginationResponse(total, page, limit) {
    return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
    };
}
//# sourceMappingURL=helpers.js.map