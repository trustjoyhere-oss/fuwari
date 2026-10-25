(() => {
	const container = document.querySelector("#cms-boot-status");
	const messageElement = document.querySelector("#cms-boot-message");
	const detailElement = document.querySelector("#cms-boot-detail");
	const actions = document.querySelector("#cms-boot-actions");
	const retryButton = document.querySelector("[data-cms-retry]");
	let finished = false;

	const slowTimer = window.setTimeout(() => {
		if (finished || !container) return;
		container.dataset.cmsState = "slow";
		if (detailElement) {
			detailElement.textContent =
				"首次加载可能需要一点时间；如果网络中断，可以重新加载页面。";
		}
	}, 12000);

	const set = (message) => {
		if (messageElement) messageElement.textContent = message;
	};

	const fail = (error) => {
		const message =
			error instanceof Error ? error.message : String(error || "未知错误");
		window.clearTimeout(slowTimer);
		set("博客管理后台加载失败");
		if (detailElement) detailElement.textContent = message;
		if (container) {
			container.dataset.cmsState = "error";
			container.setAttribute("role", "alert");
		}
		if (actions) actions.hidden = false;
	};

	const done = () => {
		finished = true;
		window.clearTimeout(slowTimer);
		container?.remove();
	};

	retryButton?.addEventListener("click", () => window.location.reload());

	window.addEventListener("offline", () => {
		if (finished) return;
		set("当前设备已离线");
		if (detailElement)
			detailElement.textContent = "恢复网络连接后，点击“重新加载”继续。";
		if (actions) actions.hidden = false;
	});

	window.cmsBoot = {
		set,
		fail,
		done,
	};

	window.addEventListener("error", (event) =>
		fail(event.error || event.message),
	);
	window.addEventListener("unhandledrejection", (event) => fail(event.reason));
})();
