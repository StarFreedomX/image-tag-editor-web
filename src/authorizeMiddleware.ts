import { Request, Response, NextFunction } from 'express';
import { config } from './app'

export const authorizeMiddleware = (req: Request, res: Response, next: NextFunction)=> {

    let token = req.body?.token || req.query.token;

    if (!tokenAuthorized(req.body?.folder || req.params.folder, token)) {
        console.log('403');
        console.log(req.body)
        console.log(req.query)
        return res.status(403).json({ error: '无效或缺失的 token' });
    }

    next();
}

export function tokenAuthorized(folder: string, token: any){
    const isAdmin = config?.tokens?.admin?.[token];
    if (isAdmin) return isAdmin;
    const expectedTokens = config?.tokens?.[folder];
    return expectedTokens?.[token];
}