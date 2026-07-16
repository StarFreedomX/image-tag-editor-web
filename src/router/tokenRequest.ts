import { Router, type Request, type Response } from "express";
import { config } from "@/app";

export const tokenRequestRouter: Router = Router();

// GET: 渲染验证页面
tokenRequestRouter.get("/", (_req: Request, res: Response) => {
	res.render("tokenRequest", { error: null });
});

// POST: 接受 qqId，调用 Bot API 获取验证码
tokenRequestRouter.post("/", async (req: Request, res: Response) => {
	const { qqId, mode } = req.body ?? {};
	if (!qqId) {
		return res.json({ error: "请输入 QQ 号" });
	}

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 10_000);

		const resp = await fetch(`${config.botApiUrl}/starfx/api/record/verify-request`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-secret": config.botApiSecret,
			},
			body: JSON.stringify({ qqId: String(qqId), mode: mode || "login" }),
			signal: controller.signal,
		});
		clearTimeout(timeout);

		const data = await resp.json();
		if (!resp.ok) {
			return res.status(resp.status).json(data);
		}
		return res.json(data);
	} catch (err: any) {
		if (err?.name === "AbortError") {
			return res.status(504).json({ error: "Bot 服务超时" });
		}
		return res.status(502).json({ error: "无法连接 Bot 服务" });
	}
});

// POST: 轮询查询 token（用完整 10 位码）
tokenRequestRouter.post("/check", async (req: Request, res: Response) => {
	const { fullCode } = req.body ?? {};
	if (!fullCode) {
		return res.json({ verified: false, token: null });
	}

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 10_000);

		const resp = await fetch(`${config.botApiUrl}/starfx/api/record/check-verify`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-secret": config.botApiSecret,
			},
			body: JSON.stringify({ fullCode: String(fullCode) }),
			signal: controller.signal,
		});
		clearTimeout(timeout);

		const data = await resp.json();
		return res.json(data);
	} catch (err: any) {
		if (err?.name === "AbortError") {
			return res.json({ verified: false, token: null });
		}
		return res.json({ verified: false, token: null });
	}
});
