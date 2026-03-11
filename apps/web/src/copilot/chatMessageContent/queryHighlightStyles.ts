export function classNameForSqlToken(value: string) {
    if (value.startsWith('"')) {
        return 'text-sky-300';
    }

    if (value.startsWith("'")) {
        return 'text-amber-300';
    }

    if (/^\d/.test(value)) {
        return 'text-fuchsia-300';
    }

    return 'text-emerald-200 font-semibold';
}

export function classNameForPrismaToken(value: string) {
    if (value === 'prisma') {
        return 'text-violet-300 font-semibold';
    }

    if (value === 'findMany' || value === 'findFirst' || value === 'findUnique') {
        return 'text-cyan-300 font-semibold';
    }

    if (value.startsWith('"') || value.startsWith("'")) {
        return 'text-amber-300';
    }

    if (/^\d/.test(value)) {
        return 'text-fuchsia-300';
    }

    return 'text-sky-200 font-semibold';
}
