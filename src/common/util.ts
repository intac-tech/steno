export const VARIABLE_PATTERN = /^\$\{([^\)]+)\}/;

export function resolveProperty(path: string, context: any) {
    if(path.match(VARIABLE_PATTERN)) {
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