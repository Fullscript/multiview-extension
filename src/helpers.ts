// Digs through an object and sets the value at the end of the path while creating intermediate keys
// Example digSet({a: 1}, ['b', 'c'], 2) => {a: 1, b: {c: 2}}
export function digSet(obj: any, keys: string[], value: any): any {
    let key = keys.shift() || ''
    if (keys.length == 0) {
        obj[key] = value
    } else {
        let nextObj = obj[key] || {}
        obj[key] = nextObj
        digSet(nextObj, keys, value)
    }
}