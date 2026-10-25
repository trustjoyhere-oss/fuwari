import type { EditorComponentDefinition, GetAsset } from "@sveltia/cms";

const asText = (value: unknown): string =>
	typeof value === "string" ? value.trim() : "";

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

const createPlaceholder = (
	title: string,
	detail: string,
	className = "cms-component-preview",
): HTMLElement => {
	const element = document.createElement("div");
	element.className = className;

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

		if (
			["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)
		) {
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
	pattern:
		/<video controls preload="metadata" src="([^"]*)" title="([^"]*)"><\/video>/m,
	fromBlock: (match) => ({
		src: decodeHtml(match[1] ?? ""),
		title: decodeHtml(match[2] ?? ""),
	}),
	toBlock: ({ src, title }) =>
		`<video controls preload="metadata" src="${escapeHtml(src)}" title="${escapeHtml(title)}"></video>`,
	toPreview: ({ src, title }, getAsset) => {
		const video = document.createElement("video");
		video.className = "cms-local-video";
		video.controls = true;
		video.preload = "metadata";
		video.src = getAssetUrl(src, getAsset);
		video.title = asText(title);
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
		createPlaceholder(
			"YouTube 视频（后台不加载第三方播放器）",
			normalizeYouTubeId(video),
		),
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
			const source = match[1]?.startsWith("//")
				? `https:${match[1]}`
				: (match[1] ?? "");
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
		createPlaceholder(
			"哔哩哔哩视频（后台不加载第三方播放器）",
			`${asText(bvid)} · P${page || 1}`,
		),
};

const admonitionLabels: Record<string, string> = {
	note: "备注",
	tip: "提示",
	important: "重要",
	warning: "警告",
	caution: "注意",
};

const admonition: EditorComponentDefinition = {
	id: "admonition",
	label: "提示块",
	icon: "select_check_box",
	mode: "block",
	summary: "{{type}} · {{body}}",
	fields: [
		{
			name: "type",
			label: "类型",
			widget: "select",
			default: "note",
			options: [
				{ label: "备注", value: "note" },
				{ label: "提示", value: "tip" },
				{ label: "重要", value: "important" },
				{ label: "警告", value: "warning" },
				{ label: "注意", value: "caution" },
			],
		},
		{
			name: "body",
			label: "内容",
			widget: "text",
			hint: "支持 Markdown 文本。",
		},
	],
	pattern: /:::(note|tip|important|warning|caution)\s*\r?\n([\s\S]*?)\r?\n:::/m,
	fromBlock: (match) => ({
		type: match[1] ?? "note",
		body: match[2]?.trim() ?? "",
	}),
	toBlock: ({ type, body }) => {
		const kind = Object.hasOwn(admonitionLabels, asText(type))
			? asText(type)
			: "note";
		return `:::${kind}\n${String(body ?? "").trim()}\n:::`;
	},
	toPreview: ({ type, body }) => {
		const kind = Object.hasOwn(admonitionLabels, asText(type))
			? asText(type)
			: "note";
		const element = createPlaceholder(
			admonitionLabels[kind] ?? admonitionLabels.note,
			String(body ?? "").trim(),
			"cms-admonition",
		);
		element.dataset.kind = kind;
		return element;
	},
};

const githubCard: EditorComponentDefinition = {
	id: "github-card",
	label: "GitHub 仓库卡片",
	icon: "code",
	mode: "block",
	summary: "GitHub · {{repo}}",
	fields: [
		{
			name: "repo",
			label: "仓库",
			widget: "string",
			pattern: ["^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$", "请填写 owner/repository"],
			hint: "例如：saicaca/fuwari",
		},
	],
	pattern: /::github\{repo=["']([^"']+)["']\}/,
	fromBlock: (match) => ({ repo: match[1] ?? "" }),
	toBlock: ({ repo }) => `::github{repo="${asText(repo)}"}`,
	toPreview: ({ repo }) =>
		createPlaceholder(
			"GitHub 仓库卡片（前台加载仓库信息）",
			asText(repo),
			"cms-github-card",
		),
};

export const editorComponents: EditorComponentDefinition[] = [
	localVideo,
	attachment,
	youtube,
	bilibili,
	admonition,
	githubCard,
];
