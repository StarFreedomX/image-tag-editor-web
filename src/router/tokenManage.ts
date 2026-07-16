import { Router, type Request, type Response } from "express";
import fs from "fs";
import { autoTokensPath, config } from "@/app";

export const tokenManageRouter: Router = Router();

interface AutoTokenUser {
	token: string;
	username: string;
	platform: string;
	groups: Record<string, string>;
}

interface AutoTokensData {
	roles: { owner: string; admin: string[] };
	users: Record<string, AutoTokenUser>;
}

function loadData(): AutoTokensData | null {
	try {
		if (fs.existsSync(autoTokensPath)) {
			const raw = JSON.parse(fs.readFileSync(autoTokensPath, "utf8"));
			if (!raw.roles) return null; // 旧格式？拒绝
			return raw;
		}
	} catch {}
	return null;
}

function findUserByToken(data: AutoTokensData, token: string): [string, AutoTokenUser, string] | null {
	for (const [qqId, entry] of Object.entries(data.users)) {
		if (entry.token === token) {
			const role = data.roles.owner === qqId ? "owner" : data.roles.admin.includes(qqId) ? "admin" : "user";
			return [qqId, entry, role];
		}
	}
	return null;
}

// POST: 校验 token 是否存在（登录页用）
tokenManageRouter.post("/verify", (req, res) => {
	const { token } = req.body ?? {};
	if (!token || !token.startsWith("sfx_")) {
		return res.json({ valid: false, error: "Token 格式无效" });
	}
	const data = loadData();
	const found = data ? findUserByToken(data, token) : null;
	return res.json(found ? { valid: true } : { valid: false, error: "Token 不存在或已失效" });
});

// GET: 管理页面
tokenManageRouter.get("/", (req, res) => {
	const rawToken = req.cookies?.starfx_token || '';
	const token = typeof rawToken === 'string' && rawToken.startsWith('sfx_') ? rawToken : '';

	const data = loadData();
	const found = token && data ? findUserByToken(data, token) : null;

	if (!found) {
		return res.render("tokenManage", { error: null, entry: null, groups: null, token: "" });
	}

	const [, user, role] = found;
	const groupsList = Object.entries(user.groups).map(([gid, name]) => ({
		gid, name, folder: gid.replace(/:/g, "_"),
	}));

	return res.render("tokenManage", {
		error: null,
		entry: { token: user.token, username: user.username, platform: user.platform, role },
		groups: groupsList,
		token: user.token,
	});
});

// POST: 添加群
tokenManageRouter.post("/add-group", async (req: Request, res: Response) => {
	const { token, groupId } = req.body ?? {};
	if (!token || !groupId) {
		return res.json({ success: false, message: "缺少参数" });
	}

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 10_000);

		const resp = await fetch(`${config.botApiUrl}/starfx/api/record/add-group`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-secret": config.botApiSecret,
			},
			body: JSON.stringify({ token: String(token), groupId: String(groupId) }),
			signal: controller.signal,
		});
		clearTimeout(timeout);

		const data = await resp.json();
		return res.json(data);
	} catch (err: any) {
		if (err?.name === "AbortError") {
			return res.json({ success: false, message: "Bot 服务超时" });
		}
		return res.json({ success: false, message: "无法连接 Bot 服务" });
	}
});

// POST: 撤销 token
tokenManageRouter.post("/revoke", async (req: Request, res: Response) => {
	const { token } = req.body ?? {};
	if (!token) {
		return res.json({ success: false, message: "缺少 Token" });
	}

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 10_000);

		const resp = await fetch(`${config.botApiUrl}/starfx/api/record/revoke-token`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-secret": config.botApiSecret,
			},
			body: JSON.stringify({ token: String(token) }),
			signal: controller.signal,
		});
		clearTimeout(timeout);

		const data = await resp.json();
		return res.json(data);
	} catch (err: any) {
		if (err?.name === "AbortError") {
			return res.json({ success: false, message: "Bot 服务超时" });
		}
		return res.json({ success: false, message: "无法连接 Bot 服务" });
	}
});
