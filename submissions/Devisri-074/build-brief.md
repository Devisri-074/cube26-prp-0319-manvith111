# Build Brief — Prep Manager

## Problem
Warehouse operators need reliable, traceable checks that packaging and labelling requirements are satisfied before inbound shipment.

## Intended user
Prep-center operator or supervisor reviewing a prepared unit.

## Proposed workflow
1. Capture or upload unit photographs and work-order context.
2. Validate image quality and required metadata.
3. Extract visual observations using a replaceable perception provider.
4. Apply deterministic, versioned compliance rules to those observations.
5. Return `PASS`, `FAIL`, or `UNCERTAIN` per check; model failure must not silently become PASS.
6. Save the image reference, observations, rule version, verdicts, timestamps, and audit information.
7. Allow a reviewer to record an override with a reason while preserving the original verdict.

## Non-goals for the first milestone
- Claiming certification or guaranteed compliance.
- Inventing authoritative requirements or fee amounts from sample data.
- Claiming model accuracy before running a documented evaluation.
- Modifying the shared team repository as part of this local workspace.

## Milestones
1. Define the evidence schema and rule interfaces.
2. Implement a headless single-unit inspection flow.
3. Add tests for each rule and uncertainty/failure handling.
4. Add tenant-scoped persistence and evidence integrity checks.
5. Build the dashboard only after the headless flow works.
6. Evaluate on a held-out dataset with independently labelled examples.
