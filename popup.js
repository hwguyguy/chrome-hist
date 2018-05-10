const HISTORY_SEARCH_MAX_RESULTS = 50000

class DateMonth {
	constructor(year, month) {
		if (year && month) {
			this.year = year
			this.month = month
		} else {
			const now = new Date
			this.year = now.getFullYear()
			this.month = now.getMonth() + 1
		}
	}

	getPaddedMonth() {
		return this.month.toString().padStart(2, 0)
	}

	increase() {
		if (this.month == 12) {
			this.month = 1
			++this.year
		} else {
			++this.month
		}
	}

	decrease() {
		if (this.month == 1) {
			this.month = 12
			--this.year
		} else {
			--this.month
		}
	}
}

async function getMonthHistoriesCount(dateMonth, fromBeginning = false) {
	const startTime = fromBeginning ? 0 : Date.parse(`${dateMonth.year}-${dateMonth.getPaddedMonth()}-01T00:00:00.000`)
	dateMonth.increase()
	const endTime = Date.parse(`${dateMonth.year}-${dateMonth.getPaddedMonth()}-01T00:00:00.000`) - 1
	dateMonth.decrease()
	return new Promise(resolve => {
		chrome.history.search(
			{
				text: '',
				startTime,
				endTime,
				maxResults: HISTORY_SEARCH_MAX_RESULTS,
			},
			historyItems => {
				resolve(historyItems.length)
			}
		)
	})
}

async function removeMonthHistories(dateMonth, fromBeginning = false) {
	const startTime = fromBeginning ? 0 : Date.parse(`${dateMonth.year}-${dateMonth.getPaddedMonth()}-01T00:00:00.000`)
	dateMonth.increase()
	const endTime = Date.parse(`${dateMonth.year}-${dateMonth.getPaddedMonth()}-01T00:00:00.000`) - 1
	dateMonth.decrease()
	return new Promise(resolve => {
		chrome.history.deleteRange(
			{
				startTime,
				endTime,
			},
			() => {
				resolve()
			}
		)
	})
}

function createOptionElement(dateMonth, historiesCount, suffix = '') {
	const option = document.createElement('option')
	option.text = dateMonth.year + '-' + dateMonth.getPaddedMonth() + ' (' + (historiesCount >= HISTORY_SEARCH_MAX_RESULTS ? '>= ' + HISTORY_SEARCH_MAX_RESULTS : historiesCount) + ')'
	option.value = dateMonth.year + '-' + dateMonth.getPaddedMonth() + suffix
	return option
}

async function generate() {
	const dateMonth = new DateMonth
	const select = document.getElementById('hist')
	select.innerHTML = ''
	let range = 12
	while (range--) {
		const count = await getMonthHistoriesCount(dateMonth)
		select.appendChild(createOptionElement(dateMonth, count))
		dateMonth.decrease()
	}
	const count = await getMonthHistoriesCount(dateMonth, true)
	select.appendChild(createOptionElement(dateMonth, count, '-b'))
}

function getSelected(select) {
	const values = []
	for (const option of select.options) {
		if (option.selected) {
			values.push(option.value)
		}
	}
	return values
}

async function pressKeys(e) {
	if (e.keyCode == 46) {
		const selected = getSelected(document.getElementById('hist'))
		for (const value of selected) {
			const [year, month, fromBeginning] = value.split('-')
			const dateMonth = new DateMonth(parseInt(year, 10), parseInt(month, 10))
			await removeMonthHistories(dateMonth, fromBeginning)
		}
		generate()
	}
}

document.addEventListener('DOMContentLoaded', function () {
	generate()
	document.getElementById('hist').addEventListener('keyup', pressKeys)
})
