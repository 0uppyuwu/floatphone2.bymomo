"use client";

import { useEffect, useState } from "react";
import { Check, Globe2, RotateCcw, SlidersHorizontal, UserRound } from "lucide-react";
import { BottomSheet } from "@/components/ui/modal";
import { loadUserIdentities } from "@/lib/settings-storage";
import { loadCharacterWorldGroups } from "@/lib/character-world-storage";
import {
    CHAT_SCOPE_UPDATED_EVENT,
    clearChatScope,
    getChatScopeLabel,
    loadChatScope,
    saveChatScope,
    type ChatScopeState,
} from "@/lib/chat-scope-storage";

export function ChatScopeSwitcher({ onScopeChange }: { onScopeChange?: (scope: ChatScopeState) => void }) {
    const [open, setOpen] = useState(false);
    const [scope, setScope] = useState<ChatScopeState>(() => loadChatScope());

    useEffect(() => {
        const sync = () => setScope(loadChatScope());
        window.addEventListener(CHAT_SCOPE_UPDATED_EVENT, sync);
        window.addEventListener("character-worlds-updated", sync);
        window.addEventListener("user-identities-updated", sync);
        return () => {
            window.removeEventListener(CHAT_SCOPE_UPDATED_EVENT, sync);
            window.removeEventListener("character-worlds-updated", sync);
            window.removeEventListener("user-identities-updated", sync);
        };
    }, []);

    const update = (patch: Partial<ChatScopeState>) => {
        const next = saveChatScope({ ...scope, ...patch });
        setScope(next);
        onScopeChange?.(next);
    };

    const reset = () => {
        const next = clearChatScope();
        setScope(next);
        onScopeChange?.(next);
    };

    const identities = open ? loadUserIdentities() : [];
    const worlds = open ? loadCharacterWorldGroups() : [];
    const isFiltered = Boolean(scope.userIdentityId || scope.worldId);

    return (
        <>
            <button
                type="button"
                className="page-back-btn relative"
                aria-label="切换身份和世界观"
                title={getChatScopeLabel(scope)}
                onClick={() => setOpen(true)}
            >
                <SlidersHorizontal size={21} strokeWidth={1.65} />
                {isFiltered && <span className="absolute right-[5px] top-[5px] h-2 w-2 rounded-full bg-[#ff4d6d] ring-2 ring-[var(--c-page-header-bg,#fff)]" />}
            </button>

            {open && (
                <BottomSheet title="切换身份与世界观" onClose={() => setOpen(false)}>
                    <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pb-4">
                        <div>
                            <div className="mb-2 flex items-center gap-2 px-1 menu-desc">
                                <UserRound size={15} />
                                <span>选择身份</span>
                            </div>
                            <div className="menu-group">
                                <ScopeOption
                                    label="全部身份"
                                    description="显示所有身份绑定的内容"
                                    selected={!scope.userIdentityId}
                                    onClick={() => update({ userIdentityId: null })}
                                />
                                {identities.map(identity => (
                                    <ScopeOption
                                        key={identity.id}
                                        label={identity.name || "未命名身份"}
                                        description={identity.occupation || identity.bio || "用户身份"}
                                        image={identity.avatarUrl}
                                        selected={scope.userIdentityId === identity.id}
                                        onClick={() => update({ userIdentityId: identity.id })}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="mb-2 flex items-center gap-2 px-1 menu-desc">
                                <Globe2 size={15} />
                                <span>选择世界观</span>
                            </div>
                            <div className="menu-group">
                                <ScopeOption
                                    label="全部世界观"
                                    description="显示所有世界中的内容"
                                    selected={!scope.worldId}
                                    onClick={() => update({ worldId: null })}
                                />
                                {worlds.map(world => (
                                    <ScopeOption
                                        key={world.id}
                                        label={world.name || "未命名世界"}
                                        description={`${world.memberIds.length} 位角色${world.description ? ` · ${world.description}` : ""}`}
                                        selected={scope.worldId === world.id}
                                        onClick={() => update({ worldId: world.id })}
                                    />
                                ))}
                            </div>
                        </div>

                        <button type="button" className="ui-btn ui-btn-outline w-full" onClick={reset}>
                            <RotateCcw size={16} />
                            恢复全部
                        </button>
                    </div>
                </BottomSheet>
            )}
        </>
    );
}

function ScopeOption({
    label,
    description,
    image,
    selected,
    onClick,
}: {
    label: string;
    description: string;
    image?: string;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button type="button" className="menu-item w-full text-left" onClick={onClick}>
            {image ? (
                <img src={image} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
            ) : (
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--c-input)] text-[var(--c-icon)]">
                    {label.includes("世界") ? <Globe2 size={17} /> : <UserRound size={17} />}
                </span>
            )}
            <span className="min-w-0 flex-1">
                <span className="menu-label block truncate">{label}</span>
                <span className="menu-desc block truncate">{description}</span>
            </span>
            {selected && <Check size={18} className="shrink-0 text-[var(--c-success)]" />}
        </button>
    );
}
