export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: PaginationMeta;
}
export declare function formatPaginatedResponse<T>(data: T[], pagination: PaginationMeta): PaginatedResponse<T>;
//# sourceMappingURL=responseFormatter.d.ts.map