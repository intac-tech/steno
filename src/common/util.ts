function jsonToString(val) {

    const toJsonString = () => {
        const toObj = {
            val,
            toString: function() {
                return JSON.stringify(this.val)
            }
        }
        return toObj;
    };

    if(Array.isArray(val)) {
        return toJsonString();
    }

    if(typeof(val) === 'object') {
        Object.values(val)
            .map(o => jsonToString(o) );
        return val;
    } 
        
    return toJsonString();
}

export function interpolate(str: string, params: any) {
    const names = Object.keys(params);
    const vals = Object.values(params)
                        .map(o => jsonToString(o));
    
    return new Function(...names, `return \`${str}\`;`)(...vals);
}