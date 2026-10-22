import CMS, { type EditorComponentDefinition, type GetAsset } from "@sveltia/cms";

declare global {
	interface Window {
		cmsBoot?: {
			set: (message: string) => void;
			fail: (error: unknown) => void;
			done: () => void;
		};
	}
}

window.cmsBoot?.set("正在初始化 Sveltia CMS……");

const asText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const escapeHtml = (value: unknown): string =>
	String(value ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll('"', "&quot;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");

const decodeHtml = (value: string): string => {
	const textarea = document.createElement("textarea");
	textarea.innerHTML = value;
	return textarea.value;
};

const getAssetUrl = (path: unknown, getAsset: GetAsset): string => {
	const value = asText(path);
	const asset = value ? getAsset(value) : undefined;

	return asset?.url ? String(asset.url) : value;
};

const createPlaceholder = (title: string, detail: string): HTMLElement => {
	const element = document.createElement("div");
	element.style.cssText =
		"padding:16px;border:1px solid #94a3b8;border-radius:10px;background:#f8fafc;color:#0f172a;font:14px/1.5 system-ui,sans-serif";

	const heading = document.createElement("strong");
	heading.textContent = title;
	element.append(heading);

	if (detail) {
		const text = document.createElement("div");
		text.textContent = detail;
		element.append(text);
	}

	return element;
};

const showInitializationError = (error: unknown): void => {
	console.error("Sveltia CMS 初始化失败", error);
	window.cmsBoot?.fail(error);

	const root = document.querySelector<HTMLElement>("#nc-root") ?? document.body;
	root.replaceChildren();
	root.style.cssText =
		"box-sizing:border-box;max-width:800px;margin:10vh auto;padding:24px;border:1px solid #ef4444;border-radius:12px;color:#991b1b;background:#fef2f2;font:16px/1.6 system-ui,sans-serif";

	const heading = document.createElement("h1");
	heading.textContent = "博客管理后台加载失败";
	heading.style.cssText = "margin:0 0 12px;font-size:22px";

	const message = document.createElement("pre");
	message.textContent = error instanceof Error ? error.message : String(error);
	message.style.cssText = "margin:0;white-space:pre-wrap;overflow-wrap:anywhere";

	root.append(heading, message);
};

const normalizeYouTubeId = (value: unknown): string => {
	const input = asText(value);

	if (/^[\w-]{6,20}$/.test(input)) {
		return input;
	}

	try {
		const url = new URL(input);
		const host = url.hostname.replace(/^www\./, "");

		if (host === "youtu.be") {
			return url.pathname.split("/").filter(Boolean)[0] ?? "";
		}

		if (["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)) {
			if (url.pathname === "/watch") {
				return url.searchParams.get("v") ?? "";
			}

			const [, section, id] = url.pathname.split("/");
			if (["embed", "shorts", "live"].includes(section)) {
				return id ?? "";
			}
		}
	} catch {
		return "";
	}

	return "";
};

const localVideo: EditorComponentDefinition = {
	id: "local-video",
	label: "本地视频",
	icon: "video_file",
	mode: "block",
	fields: [
		{
			name: "src",
			label: "视频文件",
			widget: "file",
			accept: ".mp4,.webm,video/mp4,video/webm",
			choose_url: false,
		},
		{
			name: "title",
			label: "视频说明",
			widget: "string",
			required: false,
		},
	],
	pattern: /<video controls preload="metadata" src="([^"]*)" title="([^"]*)"><\/video>/m,
	fromBlock: (match) => ({
		src: decodeHtml(match[1] ?? ""),
		title: decodeHtml(match[2] ?? ""),
	}),
	toBlock: ({ src, title }) =>
		`<video controls preload="metadata" src="${escapeHtml(src)}" title="${escapeHtml(title)}"></video>`,
	toPreview: ({ src, title }, getAsset) => {
		const video = document.createElement("video");
		video.controls = true;
		video.preload = "metadata";
		video.src = getAssetUrl(src, getAsset);
		video.title = asText(title);
		video.style.cssText = "display:block;max-width:100%;max-height:70vh;margin:auto";
		return video;
	},
};

const attachment: EditorComponentDefinition = {
	id: "attachment",
	label: "附件 / PDF",
	icon: "attach_file",
	mode: "dialog",
	summary: "{{label}}",
	fields: [
		{
			name: "file",
			label: "附件",
			widget: "file",
			accept: ".pdf,.zip,.7z,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.epub",
		},
		{
			name: "label",
			label: "链接文字",
			widget: "string",
			default: "下载附件",
		},
	],
	pattern: /<a data-cms-attachment href="([^"]*)" download>([^<]*)<\/a>/,
	fromBlock: (match) => ({
		file: decodeHtml(match[1] ?? ""),
		label: decodeHtml(match[2] ?? ""),
	}),
	toBlock: ({ file, label }) =>
		`<a data-cms-attachment href="${escapeHtml(file)}" download>${escapeHtml(label || "下载附件")}</a>`,
	toPreview: ({ file, label }, getAsset) => {
		const link = document.createElement("a");
		link.href = getAssetUrl(file, getAsset);
		link.textContent = asText(label) || "下载附件";
		link.target = "_blank";
		link.rel = "noopener noreferrer";
		return link;
	},
};

const youtube: EditorComponentDefinition = {
	id: "youtube",
	label: "YouTube 视频",
	icon: "smart_display",
	mode: "dialog",
	summary: "YouTube · {{video}}",
	fields: [
		{
			name: "video",
			label: "视频链接或 ID",
			widget: "string",
			hint: "支持 youtube.com、youtu.be 链接或视频 ID。前台使用隐私增强域名。",
		},
	],
	pattern:
		/<iframe\b[^>]*\bsrc=["'](?:https?:)?\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([^"'?&/]+)[^"']*["'][^>]*>[\s\S]*?<\/iframe>/im,
	fromBlock: (match) => ({ video: match[1] ?? "" }),
	toBlock: ({ video }) => {
		const id = normalizeYouTubeId(video);
		return `<iframe width="100%" height="468" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}" title="YouTube 视频播放器" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
	},
	toPreview: ({ video }) =>
		createPlaceholder("YouTube 视频（后台不加载第三方播放器）", normalizeYouTubeId(video)),
};

const bilibili: EditorComponentDefinition = {
	id: "bilibili",
	label: "哔哩哔哩视频",
	icon: "smart_display",
	mode: "dialog",
	summary: "哔哩哔哩 · {{bvid}} · P{{page}}",
	fields: [
		{
			name: "bvid",
			label: "BV 号",
			widget: "string",
			pattern: ["^BV[0-9A-Za-z]+$", "请输入有效的 BV 号"],
		},
		{
			name: "page",
			label: "分 P 页码",
			widget: "number",
			value_type: "int",
			min: 1,
			default: 1,
		},
	],
	pattern:
		/<iframe\b[^>]*\bsrc=["']((?:https?:)?\/\/player\.bilibili\.com\/player\.html\?[^"']*)["'][^>]*>[\s\S]*?<\/iframe>/im,
	fromBlock: (match) => {
		try {
			const source = match[1]?.startsWith("//") ? `https:${match[1]}` : (match[1] ?? "");
			const url = new URL(source);
			return {
				bvid: url.searchParams.get("bvid") ?? "",
				page: Number(url.searchParams.get("p") ?? 1),
			};
		} catch {
			return { bvid: "", page: 1 };
		}
	},
	toBlock: ({ bvid, page }) => {
		const id = /^BV[0-9A-Za-z]+$/.test(asText(bvid)) ? asText(bvid) : "";
		const part = Math.max(1, Number.parseInt(String(page ?? 1), 10) || 1);
		return `<iframe width="100%" height="468" src="https://player.bilibili.com/player.html?bvid=${encodeURIComponent(id)}&p=${part}" title="哔哩哔哩视频播放器" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
	},
	toPreview: ({ bvid, page }) =>
		createPlaceholder("哔哩哔哩视频（后台不加载第三方播放器）", `${asText(bvid)} · P${page || 1}`),
};

try {
	[localVideo, attachment, youtube, bilibili].forEach((component) => {
		CMS.registerEditorComponent(component);
	});

	window.cmsBoot?.set("正在读取博客配置……");
	void CMS.init().then(() => window.cmsBoot?.done()).catch(showInitializationError);
} catch (error) {
	showInitializationError(error);
}
