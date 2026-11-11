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

	game.yzs_playBackgroundMusic = function () {
		const music = _status.tempMusic || lib.config.background_music;
		const previousSource = ui.backgroundMusic.getAttribute("src");
		const request = { music, callbacks: [], readyCallbacks: [], ready: false, failed: false };
		musicRequest?.cleanup?.();
		musicRequest = request;
		const finish = event => {
			if (musicRequest !== request) return;
			request.cleanup?.();
			for (const callback of request.callbacks.splice(0)) callback.call(ui.backgroundMusic, event);
		};
		const ended = event => { if (request.ready) finish(event); };
		const failed = event => {
			if (musicRequest !== request || request.failed) return;
			request.failed = true;
			finish(event);
			if (musicRequest === request) {
				if (_status.tempMusic === music) delete _status.tempMusic;
				if (previousSource && ui.backgroundMusic.getAttribute("src") !== previousSource) {
					ui.backgroundMusic.src = previousSource;
				}
				resumeMusic();
			}
		};
		const canplay = event => {
			if (musicRequest !== request || !request.ready) return;
			for (const callback of request.readyCallbacks.splice(0)) callback.call(ui.backgroundMusic, event);
		};
		ui.backgroundMusic.addEventListener("ended", ended);
		ui.backgroundMusic.addEventListener("canplay", canplay);
		ui.backgroundMusic.addEventListener("error", failed);
		request.cleanup = () => {
			ui.backgroundMusic.removeEventListener("ended", ended);
			ui.backgroundMusic.removeEventListener("canplay", canplay);
			ui.backgroundMusic.removeEventListener("error", failed);
		};
		request.finish = finish;
		if (typeof music !== "string" || !music.startsWith("ext:一中杀/") || lib.config.background_music === "music_off" || _status._aozhan) {
			request.ready = true;
			return game.playBackgroundMusic();
		}
		checkResource(music, "audio").then(ok => {
			if (musicRequest !== request || (_status.tempMusic || lib.config.background_music) !== music) return;
			if (ok) {
				request.ready = true;
				game.playBackgroundMusic();
			} else {
				// 没有后续曲目时保留原音乐，避免缺文件导致背景音乐一直暂停。
				failed(new Event("ended"));
			}
		});
	};

	game.yzs_onBackgroundMusicEnd = function (callback) {
		if (!musicRequest) return ui.backgroundMusic.addEventListener("ended", callback, { once: true });
		const request = musicRequest;
		request.callbacks.push(callback);
		if (request.failed) Promise.resolve().then(() => request.finish(new Event("ended")));
	};

	game.yzs_seekBackgroundMusic = function (time) {
		const request = musicRequest;
		if (!request || request.failed) return;
		const seek = () => {
			if (musicRequest === request) ui.backgroundMusic.currentTime = time;
		};
		if (request.ready && ui.backgroundMusic.readyState >= 2) seek();
		else request.readyCallbacks.push(seek);
	};
}
