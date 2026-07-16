import { Request, Response, NextFunction } from 'express';
import fs from "fs";
import { autoTokensPath } from './app'

export const authorizeMiddleware = (req: Request, res: Response, next: NextFunction)=> {
    const rawCookie = req.cookies?.starfx_token;
    const cookieToken = (typeof rawCookie === 'string' && rawCookie.startsWith('sfx_')) ? rawCookie : '';
    const token = req.body?.token || cookieToken;

    if (!tokenAuthorized(req.body?.folder || req.params.folder, token)) {
        return res.status(403).json({ error: '无效或缺失的 token' });
    }

    next();
};

export function tokenAuthorized(folder: string, token: any): boolean {
    const data = loadData();
    if (!data) return false;
    const qqId = findQqIdByToken(data, token);
    if (!qqId) return false;
    const role = getRole(data, qqId);
    if (role === "admin" || role === "owner") return true;
    const normalizedFolder = folder.replace(/_/g, ':');
    return !!data.users[qqId]?.groups?.[normalizedFolder];
}

export function getUserRole(token: string): string {
    const data = loadData();
    if (!data) return "user";
    const qqId = findQqIdByToken(data, token);
    return qqId ? getRole(data, qqId) : "user";
}

export function getUserLabel(token: string): string {
    const data = loadData();
    if (!data) return token.substring(0, 8) + '…';
    const qqId = findQqIdByToken(data, token);
    if (!qqId) return token.substring(0, 8) + '…';
    const entry = data.users[qqId];
    return entry ? `${entry.username}(${qqId})` : token.substring(0, 8) + '…';
}

function loadData(): any {
    try {
        if (fs.existsSync(autoTokensPath)) {
            return JSON.parse(fs.readFileSync(autoTokensPath, "utf8"));
        }
    } catch {}
    return null;
}

function findQqIdByToken(data: any, token: string): string | null {
    for (const [qqId, e] of Object.entries(data.users)) {
        if ((e as any).token === token) return qqId;
    }
    return null;
}

function getRole(data: any, qqId: string): string {
    if (data.roles.owner === qqId) return "owner";
    if ((data.roles.admin || []).includes(qqId)) return "admin";
    return "user";
}
