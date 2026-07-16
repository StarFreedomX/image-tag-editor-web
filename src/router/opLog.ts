import fs from "fs";
import path from "path";
import { logDir } from "@/app";

function today() {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function timestamp() {
	const d = new Date();
	return `${today()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

export function writeAction(msg: string) {
	const file = path.join(logDir, `record-${today()}.log`);
	const line = `[${timestamp()}] ${msg}\n`;
	fs.appendFileSync(file, line, "utf8");
	console.log(`[oplog] ${line.trim()}`);
}

export function readLogs(days: number = 7): { logs: string; total: number; pages: number } {
	const files = fs.existsSync(logDir)
		? fs.readdirSync(logDir)
				.filter((f) => f.startsWith("record-") && f.endsWith(".log"))
				.sort()
				.reverse()
				.slice(0, days)
		: [];
	const allLines: string[] = [];
	for (const f of files.reverse()) {
		const content = fs.readFileSync(path.join(logDir, f), "utf8");
		allLines.push(...content.trim().split("\n").filter(Boolean));
	}
	allLines.reverse(); // 最新在前
	const chunkSize = 50;
	return { logs: JSON.stringify(allLines), total: allLines.length, pages: Math.ceil(allLines.length / chunkSize) };
}
