"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, ChevronRight, Globe2, RotateCcw, SlidersHorizontal, UserRound } from "lucide-react";
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
    const [expanded, setExpanded] = useState<"identity" | "world" | null>(null);
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
        setExpanded(null);
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
                onClick={() => {
                    setExpanded(null);
                    setOpen(true);
                }}
            >
                <SlidersHorizontal size={21} strokeWidth={1.65} />
                {isFiltered && <span className="absolute right-[5px] top-[5px] h-2 w-2 rounded-full bg-[#ff4d6d] ring-2 ring-[var(--c-page-header-bg,#fff)]" />}
            </button>

            {open && (
                <BottomSheet title="筛选主页内容" onClose={() => setOpen(false)}>
                    <div className="flex max-h-[58vh] flex-col overflow-y-auto pb-3">
                        <div className="menu-group overflow-hidden">
                            <ScopeMenuRow
                                icon={<UserRound size={18} />}
                                label="选择身份"
                                value={scope.userIdentityId
                                    ? identities.find(item => item.id === scope.userIdentityId)?.name || "已选择身份"
                                    : "全部身份"}
                                expanded={expanded === "identity"}
                                onClick={() => setExpanded(current => current === "identity" ? null : "identity")}
                            />
                            {expanded === "identity" && (
                                <div className="border-t border-[var(--c-border)] bg-[var(--c-page-body-bg)] px-2 py-1">
                                <ScopeOption
                                    label="全部身份"
                                    description="显示所有身份绑定的内容"
                                    selected={!scope.userIdentityId}
                                    onClick={() => {
                                        update({ userIdentityId: null });
                                        setExpanded(null);
                                    }}
                                />
                                {identities.map(identity => (
                                    <ScopeOption
                                        key={identity.id}
                                        label={identity.name || "未命名身份"}
                                        description={identity.occupation || identity.bio || "用户身份"}
                                        image={identity.avatarUrl}
                                        selected={scope.userIdentityId === identity.id}
                                        onClick={() => {
                                            update({ userIdentityId: identity.id });
                                            setExpanded(null);
                                        }}
                                    />
                                ))}
                                </div>
                            )}

                            <ScopeMenuRow
                                icon={<Globe2 size={18} />}
                                label="选择世界观"
                                value={scope.worldId
                                    ? worlds.find(item => item.id === scope.worldId)?.name || "已选择世界观"
                                    : "全部世界观"}
                                expanded={expanded === "world"}
                                onClick={() => setExpanded(current => current === "world" ? null : "world")}
                            />
                            {expanded === "world" && (
                                <div className="border-t border-[var(--c-border)] bg-[var(--c-page-body-bg)] px-2 py-1">
                                <ScopeOption
                                    label="全部世界观"
                                    description="显示所有世界中的内容"
                                    selected={!scope.worldId}
                                    onClick={() => {
                                        update({ worldId: null });
                                        setExpanded(null);
                                    }}
                                />
                                {worlds.map(world => (
                                    <ScopeOption
                                        key={world.id}
                                        label={world.name || "未命名世界"}
                                        description={`${world.memberIds.length} 位角色${world.description ? ` · ${world.description}` : ""}`}
                                        selected={scope.worldId === world.id}
                                        onClick={() => {
                                            update({ worldId: world.id });
                                            setExpanded(null);
                                        }}
                                    />
                                ))}
                                </div>
                            )}

                            <button type="button" className="menu-item w-full text-left" onClick={reset}>
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--c-input)] text-[var(--c-icon)]">
                                    <RotateCcw size={17} />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="menu-label block">恢复全部</span>
                                    <span className="menu-desc block truncate">清除身份和世界观筛选</span>
                                </span>
                            </button>
                        </div>
                    </div>
                </BottomSheet>
            )}
        </>
    );
}

function ScopeMenuRow({
    icon,
    label,
    value,
    expanded,
    onClick,
}: {
    icon: ReactNode;
    label: string;
    value: string;
    expanded: boolean;
    onClick: () => void;
}) {
    return (
        <button type="button" className="menu-item w-full text-left" onClick={onClick} aria-expanded={expanded}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--c-input)] text-[var(--c-icon)]">
                {icon}
            </span>
            <span className="min-w-0 flex-1">
                <span className="menu-label block">{label}</span>
                <span className="menu-desc block truncate">当前：{value}</span>
            </span>
            <ChevronRight
                size={18}
                className={`shrink-0 text-[var(--c-icon)] transition-transform ${expanded ? "rotate-90" : ""}`}
            />
        </button>
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
