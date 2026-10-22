(() => {
	const status = document.querySelector("#cms-boot-status");

	const set = (message) => {
		if (status) status.textContent = message;
	};

	const fail = (error) => {
		const message = error instanceof Error ? error.message : String(error || "未知错误");
		set(`博客管理后台加载失败：${message}`);
		if (status) {
			status.setAttribute("role", "alert");
			status.style.borderColor = "#ef4444";
			status.style.color = "#991b1b";
			status.style.background = "#fef2f2";
		}
	};

	window.cmsBoot = {
		set,
		fail,
		done: () => status?.remove(),
	};

	window.addEventListener("error", (event) => fail(event.error || event.message));
	window.addEventListener("unhandledrejection", (event) => fail(event.reason));
})();
