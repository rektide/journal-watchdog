#!/usr/bin/env node
import {setTimeout} from "node:timers/promises"
import {isMain} from "is-main"

function dice(x, a, integerize = false) {
	let sum = 0
	while (a) {
		sum += Math.floor(Math.random() * x) + 1
		--a
	}
	return sum
}

async function delay(x = 6, a = 1, c = 1000) {
	while (true) {
		const ms = dice(x, a) * c
		console.log({ms})
		await setTimeout(ms)
	}
}

async function main(x = process.argv[2], a = process.argv[3]) {
	console.log({random: "starting"})
	return delay(x, a)
}

if (isMain(import.meta)) {
	main()
}
