// Mocks dédiés aux interactions Bills (list)
// Usage: import { makeBillsStore } from "../__mocks__/billsStore.js"

export const sampleSnapshot = [
  { id: 1, date: "2020-01-01", status: "pending" },
  { id: 2, date: "2020-02-02", status: "accepted" }
]

export const resolveList = () => Promise.resolve(sampleSnapshot)
export const reject404 = () => Promise.reject(new Error("Erreur 404"))
export const reject500 = () => Promise.reject(new Error("Erreur 500"))

export function makeBillsStore({ listImpl } = {}) {
  const list = listImpl || resolveList
  return {
    bills: () => ({ list })
  }
}
