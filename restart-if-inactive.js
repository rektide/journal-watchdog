#!/usr/bin/env node
import {setInterval} from "node:timers/promises"
import {isMain} from "is-main"
import Journalctl from "journalctl"

const DEFAULT_INTERVAL = 400
const DEFAULT_TIMEOUT = 1000

async function* quiets(journalctl, {interval = DEFAULT_INTERVAL, timeout = DEFAULT_TIMEOUT, signal} = {}) {
	let elapsed = 0
	const resetElapsed = () => elapsed = 0

	try {
		// reset elapsed on new event
		journalctl.on("event", resetElapsed)

		// tick at each interval
		for await (const _ of setInterval(interval, {signal})) {
			// add tick
			elapsed += interval

			// check if too long has elapsed
			// note that resetElapsed might have occured just before interval:
			// interval should always be >2 timeout
			// use a different approach if you need finer resolution
			if (elapsed > timeout) {
				yield elapsed
			}
		}
	} finally {
		journalctl.removeListener("event", resetElapsed)
	}
}

async function watchService(opts = {}) {
	if (!opts.unit) {
		throw new Error("No unit to restart specified")
	}

	// listen to journal
	const journalctl = new Journalctl(opts)
	// find when journal goes quiet for too long
	for await (const timeout of quiets(journalctl, opts)) {
		// restart service
		console.log(`watchdog failed for ${opts.unit}`)
	}
}

function main(unit = process.argv[2]) {
	watchService({unit})
}

if (isMain(import.meta)) {
	main()
}
