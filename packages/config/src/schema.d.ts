import { z } from 'zod';
export declare const ProviderSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    url: z.ZodOptional<z.ZodString>;
    apiKey: z.ZodOptional<z.ZodString>;
    config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    type: z.ZodString;
    url: z.ZodOptional<z.ZodString>;
    apiKey: z.ZodOptional<z.ZodString>;
    config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    type: z.ZodString;
    url: z.ZodOptional<z.ZodString>;
    apiKey: z.ZodOptional<z.ZodString>;
    config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const AgentSchema: z.ZodObject<{
    provider: z.ZodString;
    model: z.ZodString;
    dimensions: z.ZodOptional<z.ZodNumber>;
    temperature: z.ZodOptional<z.ZodNumber>;
    system: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    provider: z.ZodString;
    model: z.ZodString;
    dimensions: z.ZodOptional<z.ZodNumber>;
    temperature: z.ZodOptional<z.ZodNumber>;
    system: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    provider: z.ZodString;
    model: z.ZodString;
    dimensions: z.ZodOptional<z.ZodNumber>;
    temperature: z.ZodOptional<z.ZodNumber>;
    system: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export declare const ToolManifestSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<["builtin", "extension"]>>;
    package: z.ZodOptional<z.ZodString>;
    module: z.ZodOptional<z.ZodString>;
    config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    exposed: z.ZodDefault<z.ZodBoolean>;
    optional: z.ZodDefault<z.ZodBoolean>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<["builtin", "extension"]>>;
    package: z.ZodOptional<z.ZodString>;
    module: z.ZodOptional<z.ZodString>;
    config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    exposed: z.ZodDefault<z.ZodBoolean>;
    optional: z.ZodDefault<z.ZodBoolean>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<["builtin", "extension"]>>;
    package: z.ZodOptional<z.ZodString>;
    module: z.ZodOptional<z.ZodString>;
    config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    exposed: z.ZodDefault<z.ZodBoolean>;
    optional: z.ZodDefault<z.ZodBoolean>;
}, z.ZodTypeAny, "passthrough">>;
export declare const FlowStepSchema: z.ZodObject<{
    step: z.ZodString;
    tool: z.ZodString;
    input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
    agent: z.ZodOptional<z.ZodString>;
    timeout: z.ZodOptional<z.ZodNumber>;
    on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
        action: z.ZodEnum<["retry", "abort", "fallback"]>;
        limit: z.ZodOptional<z.ZodNumber>;
        fallback_tool: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        action: "retry" | "abort" | "fallback";
        limit?: number | undefined;
        fallback_tool?: string | undefined;
    }, {
        action: "retry" | "abort" | "fallback";
        limit?: number | undefined;
        fallback_tool?: string | undefined;
    }>]>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    step: z.ZodString;
    tool: z.ZodString;
    input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
    agent: z.ZodOptional<z.ZodString>;
    timeout: z.ZodOptional<z.ZodNumber>;
    on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
        action: z.ZodEnum<["retry", "abort", "fallback"]>;
        limit: z.ZodOptional<z.ZodNumber>;
        fallback_tool: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        action: "retry" | "abort" | "fallback";
        limit?: number | undefined;
        fallback_tool?: string | undefined;
    }, {
        action: "retry" | "abort" | "fallback";
        limit?: number | undefined;
        fallback_tool?: string | undefined;
    }>]>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    step: z.ZodString;
    tool: z.ZodString;
    input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
    agent: z.ZodOptional<z.ZodString>;
    timeout: z.ZodOptional<z.ZodNumber>;
    on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
        action: z.ZodEnum<["retry", "abort", "fallback"]>;
        limit: z.ZodOptional<z.ZodNumber>;
        fallback_tool: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        action: "retry" | "abort" | "fallback";
        limit?: number | undefined;
        fallback_tool?: string | undefined;
    }, {
        action: "retry" | "abort" | "fallback";
        limit?: number | undefined;
        fallback_tool?: string | undefined;
    }>]>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const TrackSchema: z.ZodObject<{
    id: z.ZodString;
    flows: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodObject<{
        step: z.ZodString;
        tool: z.ZodString;
        input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
        agent: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
            action: z.ZodEnum<["retry", "abort", "fallback"]>;
            limit: z.ZodOptional<z.ZodNumber>;
            fallback_tool: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }>]>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        step: z.ZodString;
        tool: z.ZodString;
        input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
        agent: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
            action: z.ZodEnum<["retry", "abort", "fallback"]>;
            limit: z.ZodOptional<z.ZodNumber>;
            fallback_tool: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }>]>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        step: z.ZodString;
        tool: z.ZodString;
        input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
        agent: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
            action: z.ZodEnum<["retry", "abort", "fallback"]>;
            limit: z.ZodOptional<z.ZodNumber>;
            fallback_tool: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }>]>>;
    }, z.ZodTypeAny, "passthrough">>, "many">>>;
    flow: z.ZodOptional<z.ZodArray<z.ZodObject<{
        step: z.ZodString;
        tool: z.ZodString;
        input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
        agent: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
            action: z.ZodEnum<["retry", "abort", "fallback"]>;
            limit: z.ZodOptional<z.ZodNumber>;
            fallback_tool: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }>]>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        step: z.ZodString;
        tool: z.ZodString;
        input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
        agent: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
            action: z.ZodEnum<["retry", "abort", "fallback"]>;
            limit: z.ZodOptional<z.ZodNumber>;
            fallback_tool: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }>]>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        step: z.ZodString;
        tool: z.ZodString;
        input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
        agent: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
            action: z.ZodEnum<["retry", "abort", "fallback"]>;
            limit: z.ZodOptional<z.ZodNumber>;
            fallback_tool: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }>]>>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    flows: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodObject<{
        step: z.ZodString;
        tool: z.ZodString;
        input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
        agent: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
            action: z.ZodEnum<["retry", "abort", "fallback"]>;
            limit: z.ZodOptional<z.ZodNumber>;
            fallback_tool: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }>]>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        step: z.ZodString;
        tool: z.ZodString;
        input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
        agent: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
            action: z.ZodEnum<["retry", "abort", "fallback"]>;
            limit: z.ZodOptional<z.ZodNumber>;
            fallback_tool: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }>]>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        step: z.ZodString;
        tool: z.ZodString;
        input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
        agent: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
            action: z.ZodEnum<["retry", "abort", "fallback"]>;
            limit: z.ZodOptional<z.ZodNumber>;
            fallback_tool: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }>]>>;
    }, z.ZodTypeAny, "passthrough">>, "many">>>;
    flow: z.ZodOptional<z.ZodArray<z.ZodObject<{
        step: z.ZodString;
        tool: z.ZodString;
        input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
        agent: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
            action: z.ZodEnum<["retry", "abort", "fallback"]>;
            limit: z.ZodOptional<z.ZodNumber>;
            fallback_tool: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }>]>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        step: z.ZodString;
        tool: z.ZodString;
        input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
        agent: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
            action: z.ZodEnum<["retry", "abort", "fallback"]>;
            limit: z.ZodOptional<z.ZodNumber>;
            fallback_tool: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }>]>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        step: z.ZodString;
        tool: z.ZodString;
        input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
        agent: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
            action: z.ZodEnum<["retry", "abort", "fallback"]>;
            limit: z.ZodOptional<z.ZodNumber>;
            fallback_tool: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }>]>>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    flows: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodObject<{
        step: z.ZodString;
        tool: z.ZodString;
        input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
        agent: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
            action: z.ZodEnum<["retry", "abort", "fallback"]>;
            limit: z.ZodOptional<z.ZodNumber>;
            fallback_tool: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }>]>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        step: z.ZodString;
        tool: z.ZodString;
        input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
        agent: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
            action: z.ZodEnum<["retry", "abort", "fallback"]>;
            limit: z.ZodOptional<z.ZodNumber>;
            fallback_tool: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }>]>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        step: z.ZodString;
        tool: z.ZodString;
        input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
        agent: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
            action: z.ZodEnum<["retry", "abort", "fallback"]>;
            limit: z.ZodOptional<z.ZodNumber>;
            fallback_tool: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }>]>>;
    }, z.ZodTypeAny, "passthrough">>, "many">>>;
    flow: z.ZodOptional<z.ZodArray<z.ZodObject<{
        step: z.ZodString;
        tool: z.ZodString;
        input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
        agent: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
            action: z.ZodEnum<["retry", "abort", "fallback"]>;
            limit: z.ZodOptional<z.ZodNumber>;
            fallback_tool: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }>]>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        step: z.ZodString;
        tool: z.ZodString;
        input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
        agent: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
            action: z.ZodEnum<["retry", "abort", "fallback"]>;
            limit: z.ZodOptional<z.ZodNumber>;
            fallback_tool: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }>]>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        step: z.ZodString;
        tool: z.ZodString;
        input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
        agent: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
            action: z.ZodEnum<["retry", "abort", "fallback"]>;
            limit: z.ZodOptional<z.ZodNumber>;
            fallback_tool: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }>]>>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
}, z.ZodTypeAny, "passthrough">>;
export declare const DispatcherSchema: z.ZodObject<{
    flow: z.ZodOptional<z.ZodArray<z.ZodObject<{
        step: z.ZodString;
        tool: z.ZodString;
        input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
        agent: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
            action: z.ZodEnum<["retry", "abort", "fallback"]>;
            limit: z.ZodOptional<z.ZodNumber>;
            fallback_tool: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }>]>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        step: z.ZodString;
        tool: z.ZodString;
        input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
        agent: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
            action: z.ZodEnum<["retry", "abort", "fallback"]>;
            limit: z.ZodOptional<z.ZodNumber>;
            fallback_tool: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }>]>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        step: z.ZodString;
        tool: z.ZodString;
        input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
        agent: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
            action: z.ZodEnum<["retry", "abort", "fallback"]>;
            limit: z.ZodOptional<z.ZodNumber>;
            fallback_tool: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }>]>>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    fallback: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    flow: z.ZodOptional<z.ZodArray<z.ZodObject<{
        step: z.ZodString;
        tool: z.ZodString;
        input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
        agent: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
            action: z.ZodEnum<["retry", "abort", "fallback"]>;
            limit: z.ZodOptional<z.ZodNumber>;
            fallback_tool: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }>]>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        step: z.ZodString;
        tool: z.ZodString;
        input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
        agent: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
            action: z.ZodEnum<["retry", "abort", "fallback"]>;
            limit: z.ZodOptional<z.ZodNumber>;
            fallback_tool: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }>]>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        step: z.ZodString;
        tool: z.ZodString;
        input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
        agent: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
            action: z.ZodEnum<["retry", "abort", "fallback"]>;
            limit: z.ZodOptional<z.ZodNumber>;
            fallback_tool: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }>]>>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    fallback: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    flow: z.ZodOptional<z.ZodArray<z.ZodObject<{
        step: z.ZodString;
        tool: z.ZodString;
        input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
        agent: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
            action: z.ZodEnum<["retry", "abort", "fallback"]>;
            limit: z.ZodOptional<z.ZodNumber>;
            fallback_tool: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }>]>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        step: z.ZodString;
        tool: z.ZodString;
        input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
        agent: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
            action: z.ZodEnum<["retry", "abort", "fallback"]>;
            limit: z.ZodOptional<z.ZodNumber>;
            fallback_tool: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }>]>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        step: z.ZodString;
        tool: z.ZodString;
        input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
        agent: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
            action: z.ZodEnum<["retry", "abort", "fallback"]>;
            limit: z.ZodOptional<z.ZodNumber>;
            fallback_tool: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }, {
            action: "retry" | "abort" | "fallback";
            limit?: number | undefined;
            fallback_tool?: string | undefined;
        }>]>>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    fallback: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export declare const MemoHubConfigSchema: z.ZodObject<{
    $schema: z.ZodOptional<z.ZodString>;
    version: z.ZodOptional<z.ZodString>;
    system: z.ZodDefault<z.ZodObject<{
        trace_enabled: z.ZodDefault<z.ZodBoolean>;
        log_level: z.ZodDefault<z.ZodEnum<["debug", "info", "warn", "error"]>>;
        root: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        root: string;
        trace_enabled: boolean;
        log_level: "error" | "warn" | "info" | "debug";
    }, {
        root?: string | undefined;
        trace_enabled?: boolean | undefined;
        log_level?: "error" | "warn" | "info" | "debug" | undefined;
    }>>;
    ai: z.ZodDefault<z.ZodObject<{
        providers: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            type: z.ZodString;
            url: z.ZodOptional<z.ZodString>;
            apiKey: z.ZodOptional<z.ZodString>;
            config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            type: z.ZodString;
            url: z.ZodOptional<z.ZodString>;
            apiKey: z.ZodOptional<z.ZodString>;
            config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            type: z.ZodString;
            url: z.ZodOptional<z.ZodString>;
            apiKey: z.ZodOptional<z.ZodString>;
            config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        agents: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodObject<{
            provider: z.ZodString;
            model: z.ZodString;
            dimensions: z.ZodOptional<z.ZodNumber>;
            temperature: z.ZodOptional<z.ZodNumber>;
            system: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            provider: z.ZodString;
            model: z.ZodString;
            dimensions: z.ZodOptional<z.ZodNumber>;
            temperature: z.ZodOptional<z.ZodNumber>;
            system: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            provider: z.ZodString;
            model: z.ZodString;
            dimensions: z.ZodOptional<z.ZodNumber>;
            temperature: z.ZodOptional<z.ZodNumber>;
            system: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>>>;
    }, "strip", z.ZodTypeAny, {
        providers: z.objectOutputType<{
            id: z.ZodString;
            type: z.ZodString;
            url: z.ZodOptional<z.ZodString>;
            apiKey: z.ZodOptional<z.ZodString>;
            config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, z.ZodTypeAny, "passthrough">[];
        agents: Record<string, z.objectOutputType<{
            provider: z.ZodString;
            model: z.ZodString;
            dimensions: z.ZodOptional<z.ZodNumber>;
            temperature: z.ZodOptional<z.ZodNumber>;
            system: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>;
    }, {
        providers?: z.objectInputType<{
            id: z.ZodString;
            type: z.ZodString;
            url: z.ZodOptional<z.ZodString>;
            apiKey: z.ZodOptional<z.ZodString>;
            config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, z.ZodTypeAny, "passthrough">[] | undefined;
        agents?: Record<string, z.objectInputType<{
            provider: z.ZodString;
            model: z.ZodString;
            dimensions: z.ZodOptional<z.ZodNumber>;
            temperature: z.ZodOptional<z.ZodNumber>;
            system: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">> | undefined;
    }>>;
    dispatcher: z.ZodDefault<z.ZodObject<{
        flow: z.ZodOptional<z.ZodArray<z.ZodObject<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        fallback: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        flow: z.ZodOptional<z.ZodArray<z.ZodObject<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        fallback: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        flow: z.ZodOptional<z.ZodArray<z.ZodObject<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        fallback: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>>;
    tools: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodDefault<z.ZodEnum<["builtin", "extension"]>>;
        package: z.ZodOptional<z.ZodString>;
        module: z.ZodOptional<z.ZodString>;
        config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        exposed: z.ZodDefault<z.ZodBoolean>;
        optional: z.ZodDefault<z.ZodBoolean>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        type: z.ZodDefault<z.ZodEnum<["builtin", "extension"]>>;
        package: z.ZodOptional<z.ZodString>;
        module: z.ZodOptional<z.ZodString>;
        config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        exposed: z.ZodDefault<z.ZodBoolean>;
        optional: z.ZodDefault<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        type: z.ZodDefault<z.ZodEnum<["builtin", "extension"]>>;
        package: z.ZodOptional<z.ZodString>;
        module: z.ZodOptional<z.ZodString>;
        config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        exposed: z.ZodDefault<z.ZodBoolean>;
        optional: z.ZodDefault<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    tracks: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        flows: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodObject<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">>, "many">>>;
        flow: z.ZodOptional<z.ZodArray<z.ZodObject<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        flows: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodObject<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">>, "many">>>;
        flow: z.ZodOptional<z.ZodArray<z.ZodObject<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        flows: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodObject<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">>, "many">>>;
        flow: z.ZodOptional<z.ZodArray<z.ZodObject<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
}, "strip", z.ZodTypeAny, {
    system: {
        root: string;
        trace_enabled: boolean;
        log_level: "error" | "warn" | "info" | "debug";
    };
    ai: {
        providers: z.objectOutputType<{
            id: z.ZodString;
            type: z.ZodString;
            url: z.ZodOptional<z.ZodString>;
            apiKey: z.ZodOptional<z.ZodString>;
            config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, z.ZodTypeAny, "passthrough">[];
        agents: Record<string, z.objectOutputType<{
            provider: z.ZodString;
            model: z.ZodString;
            dimensions: z.ZodOptional<z.ZodNumber>;
            temperature: z.ZodOptional<z.ZodNumber>;
            system: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>;
    };
    dispatcher: {
        fallback: string;
        flow?: z.objectOutputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">[] | undefined;
    } & {
        [k: string]: unknown;
    };
    tools: z.objectOutputType<{
        id: z.ZodString;
        type: z.ZodDefault<z.ZodEnum<["builtin", "extension"]>>;
        package: z.ZodOptional<z.ZodString>;
        module: z.ZodOptional<z.ZodString>;
        config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        exposed: z.ZodDefault<z.ZodBoolean>;
        optional: z.ZodDefault<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">[];
    tracks: z.objectOutputType<{
        id: z.ZodString;
        flows: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodObject<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">>, "many">>>;
        flow: z.ZodOptional<z.ZodArray<z.ZodObject<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, z.ZodTypeAny, "passthrough">[];
    version?: string | undefined;
    $schema?: string | undefined;
}, {
    version?: string | undefined;
    system?: {
        root?: string | undefined;
        trace_enabled?: boolean | undefined;
        log_level?: "error" | "warn" | "info" | "debug" | undefined;
    } | undefined;
    $schema?: string | undefined;
    ai?: {
        providers?: z.objectInputType<{
            id: z.ZodString;
            type: z.ZodString;
            url: z.ZodOptional<z.ZodString>;
            apiKey: z.ZodOptional<z.ZodString>;
            config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, z.ZodTypeAny, "passthrough">[] | undefined;
        agents?: Record<string, z.objectInputType<{
            provider: z.ZodString;
            model: z.ZodString;
            dimensions: z.ZodOptional<z.ZodNumber>;
            temperature: z.ZodOptional<z.ZodNumber>;
            system: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">> | undefined;
    } | undefined;
    dispatcher?: z.objectInputType<{
        flow: z.ZodOptional<z.ZodArray<z.ZodObject<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        fallback: z.ZodString;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    tools?: z.objectInputType<{
        id: z.ZodString;
        type: z.ZodDefault<z.ZodEnum<["builtin", "extension"]>>;
        package: z.ZodOptional<z.ZodString>;
        module: z.ZodOptional<z.ZodString>;
        config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        exposed: z.ZodDefault<z.ZodBoolean>;
        optional: z.ZodDefault<z.ZodBoolean>;
    }, z.ZodTypeAny, "passthrough">[] | undefined;
    tracks?: z.objectInputType<{
        id: z.ZodString;
        flows: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodObject<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">>, "many">>>;
        flow: z.ZodOptional<z.ZodArray<z.ZodObject<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            step: z.ZodString;
            tool: z.ZodString;
            input: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>;
            agent: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            on_fail: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<"skip">, z.ZodObject<{
                action: z.ZodEnum<["retry", "abort", "fallback"]>;
                limit: z.ZodOptional<z.ZodNumber>;
                fallback_tool: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }, {
                action: "retry" | "abort" | "fallback";
                limit?: number | undefined;
                fallback_tool?: string | undefined;
            }>]>>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
    }, z.ZodTypeAny, "passthrough">[] | undefined;
}>;
export type MemoHubConfig = z.infer<typeof MemoHubConfigSchema>;
export type ProviderConfig = z.infer<typeof ProviderSchema>;
export type AgentConfig = z.infer<typeof AgentSchema>;
export type ToolManifestConfig = z.infer<typeof ToolManifestSchema>;
export type FlowStepConfig = z.infer<typeof FlowStepSchema>;
export type TrackConfig = z.infer<typeof TrackSchema>;
export type DispatcherConfig = z.infer<typeof DispatcherSchema>;
//# sourceMappingURL=schema.d.ts.map