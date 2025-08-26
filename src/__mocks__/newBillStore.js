// Mocks dédiés aux interactions NewBill (create/update)
// Usage: import { makeNewBillStore } from "../__mocks__/newBillStore.js"

export const resolveCreate = ({ fileUrl = "https://test.com/image.png", key = "1234" } = {}) =>
  Promise.resolve({ fileUrl, key })

export const resolveUpdate = (data = {}) => Promise.resolve(data)

export const reject404 = () => Promise.reject(new Error("Erreur 404"))
export const reject500 = () => Promise.reject(new Error("Erreur 500"))

export function makeNewBillStore({ createImpl, updateImpl } = {}) {
  const create = createImpl || resolveCreate
  const update = updateImpl || resolveUpdate
  return {
    bills: () => ({
      create,
      update
    })
  }
}
