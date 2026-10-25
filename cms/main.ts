import CMS from "@sveltia/cms";
import { editorComponents } from "./editor-components";

declare global {
	interface Window {
		cmsBoot?: {
			set: (message: string) => void;
			fail: (error: unknown) => void;
			done: () => void;
		};
	}
}

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
	message.style.cssText =
		"margin:0;white-space:pre-wrap;overflow-wrap:anywhere";

	root.append(heading, message);
};

try {
	window.cmsBoot?.set("正在注册 Fuwari 编辑组件……");
	editorComponents.forEach((component) => {
		CMS.registerEditorComponent(component);
	});

	// This local stylesheet only affects the posts preview iframe.
	CMS.registerPreviewStyle("/admin/preview.css", { collection: "posts" });

	window.cmsBoot?.set("正在连接 GitHub 内容仓库……");
	void CMS.init()
		.then(() => window.cmsBoot?.done())
		.catch(showInitializationError);
} catch (error) {
	showInitializationError(error);
}
