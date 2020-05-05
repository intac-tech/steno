export const VARIABLE_PATTERN = /^\$\{([^\)]+)\}/;
export const HEADER_PATTERN = /^\&\{([^\)]+)\}/;
export const JWT_TOKEN = /^\#\{([^\)]+)\}/;

export function resolveHeader(path: string, context: any) {
    return resolveContext(HEADER_PATTERN, path, context); 
}

export function resolveJWTVariable(path: string, context: any) {
    return resolveContext(JWT_TOKEN, path, context); 
}

export function resolveProperty(path: string, context: any) {
    return resolveContext(VARIABLE_PATTERN, path, context);
}

function resolveContext(pattern: RegExp, path: string, context: any) {
    if(path.match(pattern)) {
        const props = path.trim().substring(2, path.length -1).split('.');
        let currentContext = context;
        let value = undefined;
        for(const prop of props) {
            currentContext = value || context;
            value = currentContext[prop];
        }
        return value || path;
    }
    return path;
}