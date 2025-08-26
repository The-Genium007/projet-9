/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";


import mockStore from "../__mocks__/store"
jest.mock("../app/Store.js", () => mockStore)

import router from "../app/Router.js";
import Bills from "../containers/Bills.js"

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList.contains('active-icon')).toBe(true)
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
  describe("When I click on the new bill button", () => {
    test("Then it should navigate to NewBill page", () => {
      const onNavigate = jest.fn()
      const store = {}
      const localStorage = {}

      const bills = new Bills({ document, onNavigate, store, localStorage })

      bills.handleClickNewBill()

      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill'])
    })
  })
  describe("When I click on the eye icon", () => {
    test("Then it should display the bill image in the modal and show the modal", () => {
      // Préparation du DOM simulé
      document.body.innerHTML = `
        <div id="modaleFile" style="width: 400px;">
          <div class="modal-body"></div>
        </div>
      `
      // Mock jQuery
      const modalShowMock = jest.fn()
      let htmlContent = ""
      global.$ = jest.fn(selector => {
        if (selector === '#modaleFile') {
          return {
            width: () => 400,
            find: () => ({
              html: (val) => { htmlContent = val }
            }),
            modal: modalShowMock
          }
        }
        // Ajout d'un mock pour .modal() si jamais utilisé sur d'autres sélecteurs
        return {
          modal: modalShowMock,
          click: jest.fn()
        }
      })

      const onNavigate = jest.fn()
      const store = {}
      const localStorage = {}
      const bills = new Bills({ document, onNavigate, store, localStorage })

      // Mock de l'icône avec data-bill-url
      const icon = {
        getAttribute: jest.fn().mockImplementation(attr => {
          if (attr === "data-bill-url") return "https://test.com/facture.png"
        })
      }

      bills.handleClickIconEye(icon)

      expect(modalShowMock).toHaveBeenCalledWith('show')
      expect(htmlContent).toContain('<img')
      expect(htmlContent).toContain('src=https://test.com/facture.png')
    })
  })
  describe("getBills", () => {
    test("should return formated bills from store", async () => {
      // Utilise les vraies fonctions de formatage pour coller au comportement réel
      // (ne pas mocker formatDate et formatStatus ici)
      // Mock de snapshot
      const snapshot = [
        { id: 1, date: "2020-01-01", status: "pending" },
        { id: 2, date: "2020-02-02", status: "accepted" }
      ]

      // Mock de store
      const store = {
        bills: () => ({
          list: () => Promise.resolve(snapshot)
        })
      }

      const billsInstance = new Bills({ document, onNavigate: jest.fn(), store, localStorage: {} })

      const result = await billsInstance.getBills()
      expect(result).toEqual([
        { id: 1, date: "1 Jan. 20", status: "En attente" },
        { id: 2, date: "2 Fév. 20", status: "Accepté" }
      ])
    })
    })
  })

  // test d'intégration GET
  describe("Given I am a user connected as Employee", () => {
    describe("When I navigate to Bills", () => {
      test("fetches bills from mock API GET", async () => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'a@a' }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
        window.onNavigate(ROUTES_PATH.Bills)
        await waitFor(() => screen.getByText("Mes notes de frais"))
        expect(screen.getByText("Mes notes de frais")).toBeTruthy()
        // Vérifie qu'au moins une ligne de note de frais est affichée
        const tbody = screen.getByTestId("tbody")
        expect(tbody.children.length).toBeGreaterThan(0)
      })
      test("fetches bills from an API and fails with 404 message error", async () => {
  const billsStoreInstance404 = mockStore.bills();
  jest.spyOn(billsStoreInstance404, "list").mockImplementationOnce(() => Promise.reject(new Error("Erreur 404")))
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'a@a' }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick)
    expect(screen.getByText("Erreur")).toBeTruthy()
    expect(screen.getByTestId("error-message").textContent).toMatch(/Erreur 404/)
      })
      test("fetches bills from an API and fails with 500 message error", async () => {
  const billsStoreInstance500 = mockStore.bills();
  jest.spyOn(billsStoreInstance500, "list").mockImplementationOnce(() => Promise.reject(new Error("Erreur 500")))
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'a@a' }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick)
    expect(screen.getByText("Erreur")).toBeTruthy()
    expect(screen.getByTestId("error-message").textContent).toMatch(/Erreur 500/)
      })
    })
  })