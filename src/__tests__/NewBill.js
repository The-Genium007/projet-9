/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { makeNewBillStore, resolveCreate, reject404, reject500 } from "../__mocks__/newBillStore.js"

// Mock du localStorage
const mockLocalStorage = {
  getItem: jest.fn(() => JSON.stringify({ email: "test@test.com" }))
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then the form should be displayed", () => {
      // Affiche la page
      document.body.innerHTML = NewBillUI()
      
      // Vérifie que le formulaire est visible
      const form = screen.getByTestId("form-new-bill")
      expect(form).toBeTruthy()
    })

    test("Then I can't upload a PDF file", () => {
      // Affiche la page
      document.body.innerHTML = NewBillUI()
      
      // Mock alert
      window.alert = jest.fn()
      
      // Crée une instance NewBill
      const newBill = new NewBill({ 
        document, 
        onNavigate: jest.fn(), 
        store: null, 
        localStorage: mockLocalStorage 
      })
      
      // Simule l'upload d'un PDF
      const fileInput = screen.getByTestId("file")
      const file = new File(["test"], "test.pdf", { type: "application/pdf" })
      Object.defineProperty(fileInput, "files", { value: [file] })
      
      // Déclenche le changement
      fireEvent.change(fileInput)
      
      // Vérifie l'alerte
      expect(window.alert).toHaveBeenCalled()
    })

    test("Then I can submit the form", () => {
      // Affiche la page
      document.body.innerHTML = NewBillUI()
      
      // Mock de la navigation
      const onNavigate = jest.fn()
      
      // Crée une instance NewBill
      const newBill = new NewBill({ 
        document, 
        onNavigate, 
        store: null, 
        localStorage: mockLocalStorage 
      })
      
      // Mock updateBill pour éviter les erreurs
      newBill.updateBill = jest.fn()
      
      // Remplit le formulaire
      screen.getByTestId("expense-type").value = "Transports"
      screen.getByTestId("expense-name").value = "Train"
      screen.getByTestId("amount").value = "100"
      screen.getByTestId("datepicker").value = "2023-01-01"
      screen.getByTestId("vat").value = "20"
      screen.getByTestId("pct").value = "20"
      screen.getByTestId("commentary").value = "Voyage d'affaires"
      
      // Soumet le formulaire
      const form = screen.getByTestId("form-new-bill")
      fireEvent.submit(form)
      
      // Vérifie que updateBill est appelé
      expect(newBill.updateBill).toHaveBeenCalled()
    })

    test("Then I can upload a PNG file", async () => {
      // Affiche la page
      document.body.innerHTML = NewBillUI()
      
      // Mock du store (centralisé) pour simuler l'upload
      const createdSpy = jest.fn(resolveCreate)
      const mockStore = makeNewBillStore({ createImpl: createdSpy })
      
      // Crée une instance NewBill
      const newBill = new NewBill({ 
        document, 
        onNavigate: jest.fn(), 
        store: mockStore, 
        localStorage: mockLocalStorage 
      })
      
      // Simule l'upload d'un PNG
      const file = new File(["image"], "test.png", { type: "image/png" })
      const event = {
        preventDefault: jest.fn(),
        target: {
          value: "C:\\fakepath\\test.png",
          files: [file]
        }
      }
      
  // Appelle directement handleChangeFile
      await newBill.handleChangeFile(event)
      
      // Vérifie que le store a été appelé
  expect(createdSpy).toHaveBeenCalled()
    })

    // Test d'intégration POST
    test("should POST new bill to API and redirect to Bills page", async () => {
      document.body.innerHTML = NewBillUI()
      const onNavigate = jest.fn()
      // Store centralisé (create/update résolvent par défaut)
      const createSpy = jest.fn(resolveCreate)
      const mockStore = makeNewBillStore({ createImpl: createSpy })
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: mockLocalStorage })

      // Remplir le formulaire
      screen.getByTestId("expense-type").value = "Transports"
      screen.getByTestId("expense-name").value = "Train Paris Lyon"
      screen.getByTestId("amount").value = "120"
      screen.getByTestId("datepicker").value = "2025-08-08"
      screen.getByTestId("vat").value = "20"
      screen.getByTestId("pct").value = "10"
      screen.getByTestId("commentary").value = "Déplacement pro"
      const fileInput = screen.getByTestId("file")
      const file = new File(["image"], "test.png", { type: "image/png" })
      Object.defineProperty(fileInput, "files", { value: [file] })

      // Simule l'upload du fichier
      await newBill.handleChangeFile({
        preventDefault: jest.fn(),
        target: { value: "C:\\fakepath\\test.png", files: [file] }
      })

      // Soumet le formulaire
      const form = screen.getByTestId("form-new-bill")
      fireEvent.submit(form)

  // Vérifie que le POST a été appelé
  expect(createSpy).toHaveBeenCalled()
      // Vérifie que la navigation vers Bills est déclenchée
      expect(onNavigate).toHaveBeenCalled()
    })

    test("should log 404 error when POST (update) fails", async () => {
      document.body.innerHTML = NewBillUI()
      const onNavigate = jest.fn()
      const updateMock = jest.fn(reject404)
      const mockStore = makeNewBillStore({ updateImpl: updateMock })
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: mockLocalStorage })

      // Remplir les champs requis
      screen.getByTestId("expense-type").value = "Transports"
      screen.getByTestId("expense-name").value = "Train"
      screen.getByTestId("amount").value = "100"
      screen.getByTestId("datepicker").value = "2025-08-08"
      screen.getByTestId("vat").value = "20"
      screen.getByTestId("pct").value = "10"
      screen.getByTestId("commentary").value = "Déplacement pro"

      // Optionnel: simuler des valeurs de fichier déjà définies
      newBill.fileUrl = "https://test.com/image.png"
      newBill.fileName = "test.png"
      newBill.billId = "1234"

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {})

      const form = screen.getByTestId("form-new-bill")
      // Soumettre le formulaire (déclenche updateBill -> update rejeté)
      // handleSubmit appelle aussi onNavigate immédiatement, donc on ne teste pas l'absence de navigation
      fireEvent.submit(form)

      // Attendre la tick microtask pour laisser la promesse rejetée s'exécuter
      await new Promise(process.nextTick)

  expect(updateMock).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()
      // Vérifie le message de l'erreur
      const firstCall = consoleErrorSpy.mock.calls[0] || []
      const err = firstCall[0]
      expect(err && err.message ? err.message : String(err)).toMatch(/404/)

      consoleErrorSpy.mockRestore()
    })

    test("should log 500 error when POST (update) fails", async () => {
      document.body.innerHTML = NewBillUI()
      const onNavigate = jest.fn()
      const updateMock = jest.fn(reject500)
      const mockStore = makeNewBillStore({ updateImpl: updateMock })
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: mockLocalStorage })

      // Remplir les champs requis
      screen.getByTestId("expense-type").value = "Transports"
      screen.getByTestId("expense-name").value = "Train"
      screen.getByTestId("amount").value = "100"
      screen.getByTestId("datepicker").value = "2025-08-08"
      screen.getByTestId("vat").value = "20"
      screen.getByTestId("pct").value = "10"
      screen.getByTestId("commentary").value = "Déplacement pro"

      newBill.fileUrl = "https://test.com/image.png"
      newBill.fileName = "test.png"
      newBill.billId = "1234"

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {})

      const form = screen.getByTestId("form-new-bill")
      fireEvent.submit(form)

      await new Promise(process.nextTick)

      expect(updateMock).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()
      const firstCall = consoleErrorSpy.mock.calls[0] || []
      const err = firstCall[0]
      expect(err && err.message ? err.message : String(err)).toMatch(/500/)

      consoleErrorSpy.mockRestore()
    })
    })
  })