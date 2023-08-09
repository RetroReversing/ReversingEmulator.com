import { useEffect, useState } from "react";
import { Variable } from "../entities/variable";
import { Cheat } from "../entities/cheat";
import { Settings } from "../entities/settings";
import Core from "../services/core";
import Files from "../services/files";

/**
 * @template T
 * @param {string} lib
 * @param {string} type
 * @param {T} value
 * @param {(key: string, value: string) => Promise<void>} update
 * @param {(value: T) => void} callback
 * @returns {[T, (settings: Settings) => void, (value: T) => void]}
 */
const useStatus = (lib, type, value, update, callback) => {
	const name = `${lib}_junie_${type}`;

	const [state, setState] = useState(/** @type {T} */ (value));

	/**
	 * @param {Settings} settings
	 * @returns {void}
	 */
	const init = (settings) => {
		if (!settings.hasOwnProperty(name))
			settings[name] = value;
		setState(settings[name]);
	}

	useEffect(() => {
		update(name, state);
		if (callback) callback(state);
	}, [state]);

	return [state, init, setState];
}

class CoreInfo {
	/** @type {Core} */
	current;

	/** @type {Variable[]} */
	variables;

	/** @type {Settings} */
	settings;

	/** @type {Cheat[]} */
	cheats;

	/** @type {(system: string, rom: string, canvas: HTMLCanvasElement) => Promise<void>} */
	init;

	/** @type {(key: string, value: string) => Promise<void>} */
	update;
}

/**
 * @template T
 */
class CoreState {
	/** @type {T} */
	value;

	/** @type {(value: T) => void} */
	set;
}

/**
 * @param {string} lib
 * @returns {[
 * 	core: CoreInfo,
 * 	audio: CoreState<boolean>,
 * 	speed: CoreState<number>,
 * 	gamepad: CoreState<boolean>,
 * ]}
 */
export const useCore = (lib) => {
	const [core] = useState(new Core(lib));

	const [variables, setVariables] = useState(/** @type {Variable[]} */ (null));
	const [settings,  setSettings]  = useState(/** @type {Settings}   */ (null));
	const [cheats,    setCheats]    = useState(/** @type {Cheat[]}    */ (null));

	/**
	 * @param {string} key
	 * @param {string} value
	 * @returns {Promise<void>}
	 */
	const update = async (key, value) => {
		if (!settings || !variables)
			return;

		settings[key] = value;

		const variable = variables.find(x => x.key == key);
		if (variable && variable.options[0] == value)
			delete settings[key];

		await Files.Settings.update(settings);

		const updated = variables.reduce((object, variable) => {
			object[variable.key] = settings[variable.key] ?? variable.options[0];
			return object;
		}, {});

		await core.settings(updated);
	}

	const [audio,    initAudio,    setAudio]    = useStatus(lib, 'audio',    true, update, (value) => core.audio(value));
	const [speed,    initSpeed,    setSpeed]    = useStatus(lib, 'speed',    1,    update, (value) => core.speed(value));
	const [gamepad,  initGamepad,  setGamepad]  = useStatus(lib, 'gamepad',  true, update);

	/**
	 * @param {string} system
	 * @param {string} rom
	 * @param {HTMLCanvasElement} canvas
	 * @returns {Promise<void>}
	 */
	const init = async (system, rom, canvas) => {
		const game = rom.replace(/\.[^/.]+$/, '')

		const settings = await Files.Settings.get();
		const cheats = (await Files.Cheats.get()).find(x => x.system == system && x.game == game)?.cheats;

		initAudio(settings);
		initSpeed(settings);
		initGamepad(settings);

		setSettings(settings);
		setCheats(cheats);

		await core.create(system, rom, canvas);
		setVariables(core.variables());
		await core.start(settings, cheats);
	}

	return [
		{ current: core, variables, settings, cheats, init, update },
		{ value: audio,    set: (value) => setAudio(value)    },
		{ value: speed,    set: (value) => setSpeed(value)    },
		{ value: gamepad,  set: (value) => setGamepad(value)  },
	]
}
