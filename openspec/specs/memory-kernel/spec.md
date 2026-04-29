# memory-kernel Specification

## Purpose
The memory-kernel capability acts as the central engine of MemoHub, managing track registration and routing Text2Mem instructions to the appropriate providers.
## Requirements
### Requirement: Implement MemoryKernel class
The system SHALL implement a `MemoryKernel` class that serves as the central dispatch bus for all memory operations.

#### Scenario: Initialize kernel
- **WHEN** MemoryKernel is constructed with config, embedder, casStorage, and vectorStorage
- **THEN** the kernel is ready to register tracks and dispatch instructions

### Requirement: Register track providers dynamically
The system SHALL provide a `registerTrack(provider: ITrackProvider)` method that registers a track provider by its unique id.

#### Scenario: Register a track
- **WHEN** registerTrack is called with a track provider having id="track-insight"
- **THEN** the track is registered and instructions with trackId="track-insight" can be dispatched to it

#### Scenario: Reject duplicate track registration
- **WHEN** registerTrack is called with a track id that is already registered
- **THEN** an error SHALL be thrown indicating the track is already registered

#### Scenario: Initialize track on registration
- **WHEN** registerTrack is called with a new track provider
- **THEN** the provider's `initialize(kernel)` method is called before registration completes

### Requirement: Unregister track providers
The system SHALL provide an `unregisterTrack(trackId: string)` method that removes a track provider.

#### Scenario: Unregister a track
- **WHEN** unregisterTrack is called with a valid track id
- **THEN** subsequent dispatches to that track id SHALL fail

### Requirement: Dispatch instructions to tracks
The system SHALL keep `MemoryKernel.dispatch()` as the execution boundary, while allowing higher-level planners to work with canonical memory objects and query views.

#### Scenario: Dispatch legacy instruction
- **WHEN** existing code dispatches a Text2MemInstruction
- **THEN** MemoryKernel routes it through the current execution path

#### Scenario: Execute canonical memory object via adapter
- **WHEN** a planner needs to execute a canonical memory object through existing internals
- **THEN** it converts the object to one or more dispatch instructions and preserves canonical metadata

### Requirement: Expose kernel capabilities to tracks
The system SHALL implement an `IKernel` interface passed to tracks during initialization, providing access to: `getEmbedder()`, `getCAS()`, `getVectorStorage()`, `getConfig()`, `dispatch()`.

#### Scenario: Track accesses embedder through kernel
- **WHEN** a track provider calls kernel.getEmbedder() during initialization
- **THEN** the shared IEmbedder instance is returned

#### Scenario: Track dispatches sub-instruction
- **WHEN** a track provider calls kernel.dispatch() with a sub-instruction
- **THEN** the sub-instruction is routed through the same dispatch mechanism

### Requirement: Event emission on dispatch
The system SHALL emit events before and after each instruction dispatch, allowing subscribers to observe all memory operations.

#### Scenario: Emit pre-dispatch event
- **WHEN** dispatch is called
- **THEN** a "pre-dispatch" event is emitted with the instruction before execution

#### Scenario: Emit post-dispatch event
- **WHEN** an instruction completes (success or failure)
- **THEN** a "post-dispatch" event is emitted with the instruction and result

### Requirement: Query Planner Boundary
The system SHALL introduce a query planning boundary above dispatch for layered recall.

#### Scenario: Layered query
- **WHEN** a caller requests a context view
- **THEN** the query planner resolves self, project, and global recall scopes before dispatching retrieval operations

### Requirement: Context View Assembly
The system SHALL assemble query results into named context views.

#### Scenario: Assemble coding context
- **WHEN** coding context is requested
- **THEN** the system returns a structured view with layer attribution, source metadata, and conflicts or gaps

