// 仅供一中杀的特效调用。检查发生在收到广播的客户端，不依赖房主的资源目录。
export function installMediaGuards(lib, game, ui, _status) {
	if (game.yzs_createEffectMedia) return;
	const timeout = 10000;
	const backgroundRequests = new WeakMap();
	let musicRequest;

	function localURL(path) {
		path = String(path || "");
		if (/^(data:|blob:|db:)/.test(path)) return path;
		// 广播可能传来房主的绝对 assetURL；一中杀资源始终使用本机的根目录。
		const match = path.match(/(?:ext:|extension\/)一中杀\/(.*)$/);
		return match ? lib.assetURL + "extension/一中杀/" + match[1] : path;
	}

	function localSource(node) {
		let prototype = Object.getPrototypeOf(node), descriptor;
		while (prototype && !(descriptor = Object.getOwnPropertyDescriptor(prototype, "src"))) {
			prototype = Object.getPrototypeOf(prototype);
		}
		if (!descriptor?.set) return;
		Object.defineProperty(node, "src", {
			configurable: true,
			get() { return descriptor.get.call(this); },
			set(path) { descriptor.set.call(this, localURL(path)); },
		});
	}

	function resumeMusic() {
		if (lib.config.background_music === "music_off" || !ui.backgroundMusic?.getAttribute("src")) return;
		Promise.resolve(ui.backgroundMusic.play()).catch(() => {});
	}

	// 用真实的解码/加载结果检查，而不是 HEAD：兼容 file://、移动端和 HTTP 资源。
	// 预检不插入页面、不自动播放；缺失、损坏或超时都视为不可用。
	function checkResource(path, type = "img") {
		return new Promise(resolve => {
			const probe = document.createElement(type);
			const readyEvent = type === "img" ? "load" : "canplay";
			let finished = false;
			const finish = ok => {
				if (finished) return;
				finished = true;
				clearTimeout(timer);
				probe.removeEventListener(readyEvent, ready);
				probe.removeEventListener("error", failed);
				if (type !== "img") probe.pause();
				probe.removeAttribute("src");
				if (type !== "img") probe.load();
				resolve(ok);
			};
			const ready = () => finish(type !== "img" || probe.naturalWidth > 0);
			const failed = () => finish(false);
			const timer = setTimeout(failed, timeout);
			probe.addEventListener(readyEvent, ready);
			probe.addEventListener("error", failed);
			probe.preload = "auto";
			probe.autoplay = false;
			probe.src = localURL(path);
		});
	}

	game.yzs_createEffectMedia = function (type) {
		type = type.toLowerCase();
		const node = document.createElement(type);
		localSource(node);
		// 不使用 opacity 隐藏，以免原特效的渐入定时器提前显示未加载的资源。
		node.style.setProperty("visibility", "hidden", "important");
		let finished = false, playing = false;
		let timer = setTimeout(failed, timeout);
		const remove = node.remove.bind(node);
		node.remove = function () {
			finished = true;
			clearTimeout(timer);
			if (type === "video") node.pause();
			remove();
		};
		function failed() {
			if (finished) return;
			// 失败时也执行原有结束清理（例如恢复音乐），但绝不触发技能结算。
			node.style.setProperty("visibility", "hidden", "important");
			node.remove();
			if (type === "video") {
				node.dispatchEvent(new Event("ended"));
				resumeMusic();
			}
		}
		node.addEventListener("error", failed);
		if (type === "img") {
			node.addEventListener("load", () => {
				if (finished) return;
				if (!node.naturalWidth) return failed();
				clearTimeout(timer);
				node.style.removeProperty("visibility");
			});
		} else {
			node.addEventListener("canplay", () => {
				if (finished || playing) return;
				Promise.resolve(node.play()).catch(failed);
			});
			node.addEventListener("playing", () => {
				if (finished) { node.pause(); return; }
				playing = true;
				node.style.removeProperty("visibility");
			});
			node.addEventListener("timeupdate", () => {
				if (finished) return;
				clearTimeout(timer);
				timer = setTimeout(failed, timeout);
			});
			node.addEventListener("ended", () => {
				finished = true;
				clearTimeout(timer);
			});
		}
		return node;
	};

	game.yzs_setBackgroundImage = function (node, path, overlay = false) {
		const request = {};
		const previous = node.style.backgroundImage;
		backgroundRequests.set(node, request);
		if (overlay) node.style.setProperty("visibility", "hidden", "important");
		const paths = (Array.isArray(path) ? path : [path]).map(value => {
			const url = localURL(value);
			return url !== value || URL.canParse(url) ? url : lib.assetURL + url;
		});
		Promise.all(paths.map(url => checkResource(url))).then(results => {
			// 后来的换图/还原操作优先，不能被较慢的旧请求覆盖。
			if (backgroundRequests.get(node) !== request || node.style.backgroundImage !== previous) return;
			const available = paths.filter((url, index) => results[index]);
			if (!available.length) return;
			node.style.backgroundImage = available.map(url => `url(${JSON.stringify(url)})`).join(",");
			if (overlay) node.style.removeProperty("visibility");
		});
		return node;
	};

	game.yzs_playAudio = function (...args) {
		// 保留原生的音量、录像、回调和 HTMLAudioElement 返回值。
		const audio = game.playAudio(...args);
		if (!audio) return audio;
		localSource(audio);
		audio.autoplay = false;
		audio.preload = "auto";
		const onCanPlay = audio.oncanplay, onError = audio.onerror;
		let finished = false;
		const remove = audio.remove.bind(audio);
		const timer = setTimeout(() => audio.onerror(new Event("error")), timeout);
		audio.remove = function () {
			finished = true;
			clearTimeout(timer);
			audio.pause();
			remove();
		};
		audio.oncanplay = function (event) {
			if (finished) return;
			clearTimeout(timer);
			// 原生播放器在 canplay 中才真正播放，保留这个就绪检查。
			onCanPlay?.call(this, event);
		};
		audio.onerror = function (event) {
			if (finished) return;
			audio.remove();
			onError?.call(this, event);
		};
		return audio;
	};

	function removeMusicBackground(request) {
		const background = request?.background;
		if (!background) return;
		request.background = null;
		clearTimeout(request.backgroundTimer);
		background.style.opacity = "0";
		// 闭包只持有旧节点，后来的背景不会被这个淡出计时器删除。
		setTimeout(() => background.remove(), 500);
	}

	game.yzs_setMusicBackground = function (path) {
		const request = musicRequest;
		if (!request || request.cancelled || request.completed) return null;
		removeMusicBackground(request);
		const background = game.yzs_createEffectMedia("img");
		request.background = background;
		background.className = "background";
		background.src = path;
		Object.assign(background.style, {
			position: "fixed", left: "0", top: "0", width: "100%", height: "100%",
			objectFit: "cover", minWidth: "100vw", minHeight: "100vh", opacity: "0",
			pointerEvents: "none", zIndex: "0", transition: "opacity 0.5s ease-out",
		});
		document.body.appendChild(background);
		request.backgroundTimer = setTimeout(() => {
			if (musicRequest === request && !request.cancelled && !request.completed && request.background === background) {
				background.style.opacity = "1";
			}
		}, 50);
		return background;
	};

	game.yzs_playBackgroundMusic = function () {
		const music = _status.tempMusic || lib.config.background_music;
		const previousSource = ui.backgroundMusic.getAttribute("src");
		const request = { music, callbacks: [], readyCallbacks: [], ready: false, started: false, failed: false, completed: false, cancelled: false, source: previousSource };
		musicRequest?.cancel?.();
		musicRequest = request;
		const current = () => musicRequest === request && !request.cancelled;
		const ownsSource = () => ui.backgroundMusic.getAttribute("src") === request.source;
		const deliver = () => {
			// 某个回调开始新曲目后，剩下的旧回调不能再清空新曲目的 tempMusic。
			while (current() && request.callbacks.length) {
				request.callbacks.shift().call(ui.backgroundMusic, request.endEvent);
			}
		};
		const finish = event => {
			if (!current() || request.completed) return;
			request.completed = true;
			request.endEvent = event;
			request.cleanup?.();
			removeMusicBackground(request);
			deliver();
		};
		const ended = event => {
			if (!current() || !ownsSource()) return;
			// 原生 ended 监听器会立刻重播并赋值 src。先处理本请求，避免它抢先切曲。
			// 新曲目开始后才到达的旧 ended 事件，不代表当前音轨已经结束。
			if (!ui.backgroundMusic.ended) { event.stopImmediatePropagation(); return; }
			if (!request.ready || request.callbacks.length) event.stopImmediatePropagation();
			if (request.ready) finish(event);
		};
		const failed = event => {
			if (!current() || request.completed) return;
			request.failed = true;
			finish(event);
			if (current()) {
				if (_status.tempMusic === music) delete _status.tempMusic;
				if (previousSource && ui.backgroundMusic.getAttribute("src") !== previousSource) {
					ui.backgroundMusic.src = previousSource;
				}
				resumeMusic();
			}
		};
		const canplay = event => {
			if (!current() || !request.started || !ownsSource() || ui.backgroundMusic.readyState < 2 || ui.backgroundMusic.currentSrc !== ui.backgroundMusic.src) return;
			request.ready = true;
			while (current() && request.readyCallbacks.length) request.readyCallbacks.shift().call(ui.backgroundMusic, event);
		};
		const error = event => {
			// 预检期间播放器仍是旧曲目；它的 error 不能判定新音乐加载失败。
			if (request.started && ownsSource() && ui.backgroundMusic.error) failed(event);
		};
		const loadstart = () => {
			// 游戏设置或其他扩展直接换曲时，只撤销旧请求，不执行其换曲回调。
			if (current() && !ownsSource()) request.cancel();
		};
		ui.backgroundMusic.addEventListener("ended", ended, true);
		ui.backgroundMusic.addEventListener("canplay", canplay);
		ui.backgroundMusic.addEventListener("error", error);
		ui.backgroundMusic.addEventListener("loadstart", loadstart);
		request.cleanup = () => {
			ui.backgroundMusic.removeEventListener("ended", ended, true);
			ui.backgroundMusic.removeEventListener("canplay", canplay);
			ui.backgroundMusic.removeEventListener("error", error);
			ui.backgroundMusic.removeEventListener("loadstart", loadstart);
		};
		request.cancel = () => {
			request.cancelled = true;
			request.cleanup();
			request.callbacks.length = request.readyCallbacks.length = 0;
			removeMusicBackground(request);
		};
		request.deliver = deliver;
		const start = () => {
			request.started = true;
			game.playBackgroundMusic();
			request.source = ui.backgroundMusic.getAttribute("src");
			if (lib.config.background_music === "music_off" || _status._aozhan) finish(new Event("ended"));
		};
		if (typeof music !== "string" || !music.startsWith("ext:一中杀/") || lib.config.background_music === "music_off" || _status._aozhan) {
			start();
			return;
		}
		checkResource(music, "audio").then(ok => {
			if (!current()) return;
			if ((_status.tempMusic || lib.config.background_music) !== music) return request.cancel();
			if (ok) {
				start();
			} else {
				// 没有后续曲目时保留原音乐，避免缺文件导致背景音乐一直暂停。
				failed(new Event("ended"));
			}
		});
	};

	game.yzs_onBackgroundMusicEnd = function (callback) {
		if (!musicRequest) return ui.backgroundMusic.addEventListener("ended", callback, { once: true });
		const request = musicRequest;
		if (request.cancelled) return;
		request.callbacks.push(callback);
		if (request.completed) Promise.resolve().then(request.deliver);
	};

	game.yzs_seekBackgroundMusic = function (time) {
		const request = musicRequest;
		if (!request || request.failed || request.cancelled || request.completed) return;
		const seek = () => {
			if (musicRequest === request) ui.backgroundMusic.currentTime = time;
		};
		if (request.ready && ui.backgroundMusic.readyState >= 2) seek();
		else request.readyCallbacks.push(seek);
	};
}
