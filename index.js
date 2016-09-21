'use strict'

const blessed = require('blessed')
const inspect = require('inspect-code')
const stack = require('stack-trace')



const lineBreak = /[\r\n]+/g

const calculate = (code) => {
	const lines = code.split(lineBreak).map((line) => line.length)
	const markers = []

	try {
		const results = inspect(code)
		for (let result of results) {
			const part = code.substring(0, result.to + 1).trim()
			if (!part) continue
			const breaks = part.match(lineBreak)
			const top = breaks ? breaks.length : 0
			markers.push({
				top, left: lines[top] + 2,
				content: result.values[result.values.length - 1] + '',
				style: {fg: 'blue', underline: true}
			})
		}
	} catch (err) {
		if (!err.loc) {
			const f = stack.parse(err)
			if (!f || !f[0]) return []
			err.loc = {line: f[0].lineNumber}
		}
		const top = err.loc.line - 1
		markers.push({
			top, left: lines[top] + 2,
			content: err.message,
			style: {fg: 'red', underline: true}
		})
	}

	return markers
}



let markers = []
let before = ''

const onKeypress = (editor) => () => {
	const code = editor.textBuf.getText()
	if (code === before) return
	before = code

	for (let marker of markers)
		editor.parent.remove(marker)

	process.nextTick(() => {
		markers = calculate(code).map((m) => blessed.text(m))

		for (let marker of markers)
			editor.parent.append(marker)

		editor.parent.render()
	})
}

module.exports = onKeypress
