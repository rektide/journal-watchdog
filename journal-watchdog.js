#!/usr/bin/env node
import {on, once} from "node:events"
import Journalctl from "journalctl"
import {isMain} from "is-main"
import notify from "sd-notify"

//const LOG = notify.sendStatus.bind(notify)
//const LOG = console.debug
const LOG = console.log

async function journalWatchdog(opts = {}) {
	const {identifier, filter, unit} = opts;
	// arbitrary order of precedence for what we'll log soon
	const target = unit || identifier || filter;
	// guard: make sure we are watching a specific target in the journal
	if (!target) {
		throw new Error("No journald target specified")
	}

	// alas, doesn't seem to work for ExecStartPost=
	//const interval = notify.watchdogInterval()
	//// guard: make sure the watchdog is enabled
	//if (!interval) {
	//	throw new Error("No systemd WatchdogSec= detected")
	//}

	// log that we are active
	// TODO: systemd structured logging please?
	LOG({status: "starting", target})

	// set some defaults
	const opts2 = {
		// use "now" if neither are specified
		since: opts.lines || opts.since ? opts.since : "now",
		...opts,
	}
	// listen to journal
	const journal = new Journalctl(opts2)

	try {
		// ready up (i guess? necessary/helpful?)
		await once(journal, "event")
		notify.ready()

		// on each journal log
		for await(const _ of on(journal, "event")) {
			// reset watchdog
			// TODO: maybe in some cases debouncing this might reduce some resource consumption?
			// for now this is simple & understandable
			notify.watchdog()
		}
	} finally {
		// try cleaning up journalctl
		try {
			const done = journal.stop()
			// TODO: just checking nothing is returned here, delete
			console.log({done})
		} catch(err) {
			// probably fine?
			LOG({err, msg: "error cleaning up journalctl tailing"})
		}
	}
}

async function main(unit = process.argv[2]) {
	return journalWatchdog({unit})
}

if (isMain(import.meta)) {
	main()
}
