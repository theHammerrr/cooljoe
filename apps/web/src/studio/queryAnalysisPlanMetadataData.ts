import { PLAN_METADATA_SCAN_AND_JOIN } from './queryAnalysisPlanMetadataDataScans';
import { PLAN_METADATA_TRANSFORMS } from './queryAnalysisPlanMetadataDataTransforms';

export const PLAN_METADATA_BY_TYPE = {
    ...PLAN_METADATA_SCAN_AND_JOIN,
    ...PLAN_METADATA_TRANSFORMS
};
