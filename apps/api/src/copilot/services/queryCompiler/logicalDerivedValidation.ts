import { DraftTargetMode } from '../../controllers/draftQuery/buildDraftContext';
import { DraftDiagnostic } from '../../controllers/draftQuery/diagnostics';
import { LogicalQueryPlan } from './logicalPlanTypes';

export function validateDerivedOperations(plan: LogicalQueryPlan, preferredMode: DraftTargetMode): DraftDiagnostic[] {
    if (!plan.derived?.length) return [];

    const diagnostics: DraftDiagnostic[] = [];

    for (const operation of plan.derived) {
        if (preferredMode === 'prisma') {
            diagnostics.push({
                code: 'UNSUPPORTED_DERIVED_OPERATION',
                message: `Derived operation "${operation.kind}" is not supported by the Prisma renderer yet.`
            });

            continue;
        }

        if (operation.kind === 'time_bucket') {
            const time = plan.time;
            const timeDimension = time?.dimension;

            if (!time || !timeDimension || timeDimension.table !== operation.source.table || timeDimension.column !== operation.source.column || time.grain !== operation.grain) {
                diagnostics.push({
                    code: 'MISSING_TIME_BUCKET',
                    message: 'Time bucket derived operation must match the logical time dimension and grain.'
                });
            }

            continue;
        }

        if (operation.kind === 'distinct_count') {
            continue;
        }

        diagnostics.push({
            code: 'UNSUPPORTED_DERIVED_OPERATION',
            message: `Derived operation "${operation.kind}" is modeled in the logical IR but does not have a safe compiler implementation yet.`
        });
    }

    return diagnostics;
}
