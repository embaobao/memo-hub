import pkg from 'lodash';
const { set, get, cloneDeep } = pkg;
/**
 * Smart variable resolver for flow execution.
 * Replaces {{payload.x}} or {{nodes.id.y}} with values from the state.
 */
export class VariableResolver {
    /**
     * Resolve interpolation in a string or object.
     */
    resolve(input, state) {
        if (!input)
            return input;
        if (typeof input === 'string') {
            return this.resolveString(input, state);
        }
        if (Array.isArray(input)) {
            return input.map(item => this.resolve(item, state));
        }
        if (typeof input === 'object') {
            const result = {};
            for (const [key, value] of Object.entries(input)) {
                result[key] = this.resolve(value, state);
            }
            return result;
        }
        return input;
    }
    resolveString(str, state) {
        // 1. Check for full placeholder e.g. "{{nodes.step1.data}}"
        const fullMatch = str.match(/^\{\{(.+)\}\}$/);
        if (fullMatch) {
            const path = fullMatch[1].trim();
            return this.getValueByPath(path, state);
        }
        // 2. Check for inline placeholders e.g. "Result is {{nodes.step1.id}}"
        return str.replace(/\{\{(.+?)\}\}/g, (_, path) => {
            const val = this.getValueByPath(path.trim(), state);
            return typeof val === 'object' ? JSON.stringify(val) : String(val);
        });
    }
    getValueByPath(path, state) {
        // Handle env:// if not already resolved by config kernel
        if (path.startsWith('env.')) {
            return process.env[path.slice(4)];
        }
        // Standard path lookup in state (payload.x, nodes.step.y)
        return get(state, path);
    }
}
//# sourceMappingURL=resolver.js.map