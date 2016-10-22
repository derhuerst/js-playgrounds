'use strict'

const blessed = require('blessed')
const inspect = require('inspect-code')
const util = require('util')



const calculate = (editor) => {
	let markers = []

	try {
		const code = editor.textBuf.getText()
		const results = inspect(code)
		for (let result of results) {
			const p = editor.visiblePos({
				row: result.end.line,
				column: editor.textBuf.lineLengthForRow(result.end.line)
			})
			markers.push({
				top: p.row, left: p.column + 2,
				content: util.inspect(result.values[result.values.length - 1]),
				style: {fg: 'blue'}
			})
		}
	} catch (err) {
		if (err.loc) {
			const p = editor.visiblePos({
				row: err.loc.line - 1,
				column: editor.textBuf.lineLengthForRow(err.loc.line - 1)
			})
			markers.push({
				top: p.row, left: p.column + 2,
				content: err.message,
				style: {fg: 'red', underline: true}
			})
		} else markers.push({
			top: 0, left: 0,
			content: err.message,
			style: {fg: 'white', bg: 'red'}
		})
	}

	// markers may overlap each other
	markers = markers.sort((m1, m2) => m1.top - m2.top)
	for (let i = 0; i < markers.length; i++) {
		const m1 = markers[i - 1]; const m2 = markers[i]
		if (m1 && m1.top === m2.top)
			m2.left = m1.left + m1.content.length + 1
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
		markers = calculate(editor).map((m) => blessed.text(m))

		for (let marker of markers)
			editor.parent.append(marker)

		editor.parent.render()
	})
}

module.exports = onKeypress
