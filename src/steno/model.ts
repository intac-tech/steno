// tslint:disable-next-line
export type PropType <T> = {
    [P: string]: T;
};

export interface StenoRequest {
    query?: PropType<Query>;
    mutation?: PropType<Mutation>;
    variables?: any;
}

export interface PSTemplate {
    name: string;
    variables?: any;
    silent?: boolean;
}

export interface OrderBy {
    asc: boolean;
    columns: string;
}

export interface Mutation {
    priority?: number;
    params?: any;
}

export interface Query {
    orderBy?: OrderBy;
    columns?: string;
    params?: any;
    singleResult?: boolean;
    paginated?: boolean;
    size?: number;
    page?: number;
}

export interface SqlTemplate {
    name: string;
    group: string;
    sql: string;
}

export interface StenoTemplate {
    name: string;
    template: string;
}
