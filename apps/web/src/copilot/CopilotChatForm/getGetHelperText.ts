import type { ComposeMode } from "../composeState"

export const getGetHelperText = (mode: ComposeMode) => {
    switch (mode) {
        case 'chat':
            return "The recommended mode. Can generate queries but with less validation (no security issue)."
        case 'sql':
            return "SQL Draft generates executable SQL queries. Generates better results when running with the exact names of the table/columns."
        case 'prisma':
            return "Prisma Draft generates executable Prisma queries. Generates better results when running with the exact names of the table/columns."
    }
}