/**
 * Smart variable resolver for flow execution.
 * Replaces {{payload.x}} or {{nodes.id.y}} with values from the state.
 */
export declare class VariableResolver {
    /**
     * Resolve interpolation in a string or object.
     */
    resolve(input: any, state: Record<string, any>): any;
    private resolveString;
    private getValueByPath;
}
//# sourceMappingURL=resolver.d.ts.map