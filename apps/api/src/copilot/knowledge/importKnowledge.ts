import path from 'path';
import { importKnowledgeFromDirectory } from '../services/knowledge/knowledgeImportService';

async function main() {
    const targetDir = path.resolve(process.cwd(), process.argv[2] || '../../knowledge');
    const result = await importKnowledgeFromDirectory(targetDir);

    console.log(JSON.stringify({
        directory: targetDir,
        imported: result.imported,
        updated: result.updated,
        skipped: result.skipped,
        files: result.files.map((file) => path.relative(targetDir, file)),
        errors: result.errors
    }, null, 2));
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
});
