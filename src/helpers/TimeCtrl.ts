import { format, subDays, subMonths } from "date-fns"

const zeroDateTime = (date: Date, to: "start" | "end") => {
  if (to === "start") date.setHours(0, 0, 0, 0)
  else if (to === "end") date.setHours(23, 59, 59, 999)
  return date
}

export const generateMonthRange = (date: Date) => {
	const start = zeroDateTime(new Date(date), "start")
	const end = zeroDateTime(new Date(date), "end")

	start.setDate(1)
	end.setMonth(end.getMonth() + 1, 0)
	return { start, end }
}

export const generateWeekRange = (date: Date) => {
	const start = subDays(zeroDateTime(new Date(date), "start"), 6)
	const end = zeroDateTime(new Date(date), "end")
	return { start, end }
}

export const generateDayRange3Steps = (date: Date) => {
	const start = subDays(zeroDateTime(new Date(date), "start"), 2)
	const end = zeroDateTime(new Date(date), "end")
	return { start, end }
}

export const generateDayRange = (date: Date) => {
	const start = zeroDateTime(new Date(date), "start")
	const end = zeroDateTime(new Date(date), "end")
	return { start, end }
}

export const getMonthLetters = (date: Date) => {
	return format(date, 'MMM')
}

export const getDayLetters = (date: Date) => {
	return format(date, 'EEE')
}

export const getDayLetterNumbers = (date: Date) => {
	return format(date, 'dd')
}

export const getLastMonth = (date: Date, by = 0) => {
	const newDate = subMonths(date, by)
	return newDate
}

export const getLastDays = (date: Date, by = 0) => {
	const newDate = subDays(date, by)
	return newDate
}

export const getLastDays3Steps = (date: Date, by = 0) => {
	const newDate = subDays(date, by * 3)
	return newDate
}

export const getLastWeek = (date: Date, by = 0) => {
	const newDate = subDays(date, by * 7)
	return newDate
}