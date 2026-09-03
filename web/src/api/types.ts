export type Week = {
  start: string
  from: string
  to: string
  working_days: number
}

export type Hours = {
  allocated_hours: number
  capacity_hours: number
}

export type Person = {
  id: number
  name: string
  weekly_hours: number
  weeks: Hours[]
}

export type Capacity = {
  weeks: Week[]
  people: Person[]
}

export type DateRange = {
  from: string
  to: string
}
