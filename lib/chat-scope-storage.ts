import { getCharacterWorldGroupId, loadCharacterWorldGroups } from "./character-world-storage";
import { kvGet, kvSet, registerKvMigration } from "./kv-db";
import { loadBindingConfig, loadUserIdentities, resolveBinding, resolveUserIdentity } from "./settings-storage";
import type { UserIdentity } from "@/components/settings/user-identity";

const CHAT_SCOPE_KEY = "ai_phone_chat_scope_v1";
export const CHAT_SCOPE_UPDATED_EVENT = "chat-scope-updated";

registerKvMigration(CHAT_SCOPE_KEY);

export type ChatScopeState = {
    userIdentityId: string | null;
    worldId: string | null;
};

export const DEFAULT_CHAT_SCOPE: ChatScopeState = {
    userIdentityId: null,
    worldId: null,
};

function normalizeScope(value: Partial<ChatScopeState> | null | undefined): ChatScopeState {
    const identities = loadUserIdentities();
    const worlds = loadCharacterWorldGroups();
    const userIdentityId = typeof value?.userIdentityId === "string"
        && identities.some(identity => identity.id === value.userIdentityId)
        ? value.userIdentityId
        : null;
    const worldId = typeof value?.worldId === "string"
        && worlds.some(world => world.id === value.worldId)
        ? value.worldId
        : null;
    return { userIdentityId, worldId };
}

export function loadChatScope(): ChatScopeState {
    if (typeof window === "undefined") return DEFAULT_CHAT_SCOPE;
    try {
        const raw = kvGet(CHAT_SCOPE_KEY);
        return normalizeScope(raw ? JSON.parse(raw) as Partial<ChatScopeState> : null);
    } catch {
        return DEFAULT_CHAT_SCOPE;
    }
}

export function saveChatScope(scope: ChatScopeState): ChatScopeState {
    const normalized = normalizeScope(scope);
    if (typeof window !== "undefined") {
        kvSet(CHAT_SCOPE_KEY, JSON.stringify(normalized));
        window.dispatchEvent(new CustomEvent(CHAT_SCOPE_UPDATED_EVENT, { detail: normalized }));
    }
    return normalized;
}

export function clearChatScope(): ChatScopeState {
    return saveChatScope(DEFAULT_CHAT_SCOPE);
}

export function resolveChatScopeUserIdentity(characterId?: string, appId = "chat"): UserIdentity | null {
    const selectedId = loadChatScope().userIdentityId;
    if (selectedId) {
        return loadUserIdentities().find(identity => identity.id === selectedId) || null;
    }
    return resolveUserIdentity(characterId, appId);
}

export function resolveBoundUserIdentityId(characterId?: string, appId = "chat"): string | null {
    const identities = loadUserIdentities();
    if (identities.length === 0) return null;
    const resolved = resolveBinding(loadBindingConfig(), characterId, appId);
    return resolved.userIdentityId && identities.some(identity => identity.id === resolved.userIdentityId)
        ? resolved.userIdentityId
        : identities[0].id;
}

export function characterMatchesChatScope(characterId: string, scope = loadChatScope()): boolean {
    if (!characterId) return false;
    if (scope.userIdentityId && resolveBoundUserIdentityId(characterId, "chat") !== scope.userIdentityId) {
        return false;
    }
    if (scope.worldId && getCharacterWorldGroupId(characterId) !== scope.worldId) {
        return false;
    }
    return true;
}

export function groupMatchesChatScope(participantIds: string[] | undefined, scope = loadChatScope()): boolean {
    const ids = (participantIds || []).filter(Boolean);
    if (scope.userIdentityId && resolveBoundUserIdentityId(undefined, "group_chat") !== scope.userIdentityId) {
        return false;
    }
    if (scope.worldId) {
        if (ids.length === 0) return false;
        return ids.every(characterId => getCharacterWorldGroupId(characterId) === scope.worldId);
    }
    return true;
}

export function getChatScopeLabel(scope = loadChatScope()): string {
    const identityName = scope.userIdentityId
        ? loadUserIdentities().find(identity => identity.id === scope.userIdentityId)?.name
        : "全部身份";
    const worldName = scope.worldId
        ? loadCharacterWorldGroups().find(world => world.id === scope.worldId)?.name
        : "全部世界观";
    return `${identityName || "身份"} · ${worldName || "世界观"}`;
}
