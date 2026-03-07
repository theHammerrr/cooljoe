import type { ComposeMode } from "../composeState";

export interface ModeOption {
    value: 'chat' | 'sql' | 'prisma';
    label: string;
    dotColor: string;
}

export interface CopilotChatModeSelectProps {
    disabled: boolean;
    mode: ComposeMode;
    onChange: (mode: ComposeMode) => void;
}