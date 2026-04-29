[**Documentation**](../../README.md)

***

# @memohub/protocol

## Enumerations

- [EventConfidence](enumerations/EventConfidence.md)
- [EventKind](enumerations/EventKind.md)
- [EventSource](enumerations/EventSource.md)
- [InstructionState](enumerations/InstructionState.md)
- [IntegrationErrorCode](enumerations/IntegrationErrorCode.md)
- [MemoErrorCode](enumerations/MemoErrorCode.md)
- [MemoOp](enumerations/MemoOp.md)

## Classes

- [ErrorFormatter](classes/ErrorFormatter.md)
- [IntegrationHubError](classes/IntegrationHubError.md)
- [ValidationError](classes/ValidationError.md)

## Interfaces

- [ActorDescriptor](interfaces/ActorDescriptor.md)
- [ApiCapabilityPayload](interfaces/ApiCapabilityPayload.md)
- [BusinessContextPayload](interfaces/BusinessContextPayload.md)
- [CanonicalMemoryEvent](interfaces/CanonicalMemoryEvent.md)
- [ClaimRef](interfaces/ClaimRef.md)
- [ClarificationItem](interfaces/ClarificationItem.md)
- [ContentBlock](interfaces/ContentBlock.md)
- [DomainPolicy](interfaces/DomainPolicy.md)
- [DomainRef](interfaces/DomainRef.md)
- [EmbeddingRef](interfaces/EmbeddingRef.md)
- [EventValidationRule](interfaces/EventValidationRule.md)
- [HabitPayload](interfaces/HabitPayload.md)
- [ICAS](interfaces/ICAS.md)
- [ICompleter](interfaces/ICompleter.md)
- [IEmbedder](interfaces/IEmbedder.md)
- [ITool](interfaces/ITool.md)
- [IToolManifest](interfaces/IToolManifest.md)
- [IVectorStorage](interfaces/IVectorStorage.md)
- [LinkRef](interfaces/LinkRef.md)
- [MemoHubEvent](interfaces/MemoHubEvent.md)
- [MemoryArtifact](interfaces/MemoryArtifact.md)
- [MemoryEventPayload](interfaces/MemoryEventPayload.md)
- [MemoryObject](interfaces/MemoryObject.md)
- [Provenance](interfaces/Provenance.md)
- [RepoAnalysisPayload](interfaces/RepoAnalysisPayload.md)
- [ScopeRef](interfaces/ScopeRef.md)
- [SessionStatePayload](interfaces/SessionStatePayload.md)
- [SourceDescriptor](interfaces/SourceDescriptor.md)
- [SubjectDescriptor](interfaces/SubjectDescriptor.md)
- [TextEntityExtractorOptions](interfaces/TextEntityExtractorOptions.md)

## Type Aliases

- [ArtifactKind](type-aliases/ArtifactKind.md)
- [ClarificationStatus](type-aliases/ClarificationStatus.md)
- [EventPayload](type-aliases/EventPayload.md)
- [GovernanceState](type-aliases/GovernanceState.md)
- [MemoryKind](type-aliases/MemoryKind.md)
- [MemoryState](type-aliases/MemoryState.md)
- [MemoryVisibility](type-aliases/MemoryVisibility.md)
- [ReviewState](type-aliases/ReviewState.md)

## Variables

- [ActorDescriptorSchema](variables/ActorDescriptorSchema.md)
- [CanonicalMemoryEventSchema](variables/CanonicalMemoryEventSchema.md)
- [ClaimRefSchema](variables/ClaimRefSchema.md)
- [ClarificationItemSchema](variables/ClarificationItemSchema.md)
- [ContentBlockSchema](variables/ContentBlockSchema.md)
- [DEFAULT\_DOMAIN\_POLICIES](variables/DEFAULT_DOMAIN_POLICIES.md)
- [DEFAULT\_TEXT\_ENTITY\_EXTRACTOR\_OPTIONS](variables/DEFAULT_TEXT_ENTITY_EXTRACTOR_OPTIONS.md)
- [DomainPolicySchema](variables/DomainPolicySchema.md)
- [DomainRefSchema](variables/DomainRefSchema.md)
- [EmbeddingRefSchema](variables/EmbeddingRefSchema.md)
- [EVENT\_VALIDATION\_RULES](variables/EVENT_VALIDATION_RULES.md)
- [GOVERNANCE\_STATES](variables/GOVERNANCE_STATES.md)
- [LinkRefSchema](variables/LinkRefSchema.md)
- [MemoOpSchema](variables/MemoOpSchema.md)
- [MemoryArtifactSchema](variables/MemoryArtifactSchema.md)
- [MemoryObjectSchema](variables/MemoryObjectSchema.md)
- [ProvenanceSchema](variables/ProvenanceSchema.md)
- [ScopeRefSchema](variables/ScopeRefSchema.md)
- [SourceDescriptorSchema](variables/SourceDescriptorSchema.md)
- [SubjectDescriptorSchema](variables/SubjectDescriptorSchema.md)

## Functions

- [createClarificationItem](functions/createClarificationItem.md)
- [createMemoryArtifact](functions/createMemoryArtifact.md)
- [extractEntitiesFromText](functions/extractEntitiesFromText.md)
- [getDomainPolicy](functions/getDomainPolicy.md)
- [isDefaultVisibleMemory](functions/isDefaultVisibleMemory.md)
- [isIntegrationHubError](functions/isIntegrationHubError.md)
- [resolveClarificationItem](functions/resolveClarificationItem.md)
- [validateCanonicalMemoryEvent](functions/validateCanonicalMemoryEvent.md)
- [validateInstruction](functions/validateInstruction.md)
- [validateMemoHubEventBasic](functions/validateMemoHubEventBasic.md)
- [validateMemoryObject](functions/validateMemoryObject.md)
