import { ROUTES_PATH } from '../constants/routes.js'
import { formatDate, formatStatus } from "../app/format.js"
import Logout from "./Logout.js"

/**
 * Comportement attendu (Bills):
 * - Cette classe pilote l’écran liste des notes de frais.
 * - Initialisation:
 *   - Bouton “Nouvelle note” (data-testid="btn-new-bill"): déclenche la navigation vers ROUTES_PATH.NewBill.
 *   - Icônes œil (data-testid="icon-eye"): affichent le justificatif dans une modale (jQuery) au clic.
 * - handleClickNewBill: navigue vers l’écran NewBill.
 * - handleClickIconEye:
 *   - Récupère l’URL de la facture depuis data-bill-url.
 *   - Calcule une largeur d’image à 50% de la largeur de la modale #modaleFile.
 *   - Insère l’image dans .modal-body et ouvre la modale via $('#modaleFile').modal('show').
 * - getBills:
 *   - Appelle store.bills().list() pour récupérer la collection.
 *   - Formate chaque entrée: date via formatDate (fallback en cas d’erreur), status via formatStatus.
 *   - Retourne le tableau formaté.
 * - Comportement en erreur (niveau container):
 *   - Les erreurs de list() ne sont pas traitées ici; l’UI d’erreur est gérée au niveau du Router/Views.
 */

export default class {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    const buttonNewBill = document.querySelector(`button[data-testid="btn-new-bill"]`)
    if (buttonNewBill) buttonNewBill.addEventListener('click', this.handleClickNewBill)
    const iconEye = document.querySelectorAll(`div[data-testid="icon-eye"]`)
    if (iconEye) iconEye.forEach(icon => {
      icon.addEventListener('click', () => this.handleClickIconEye(icon))
    })
    new Logout({ document, localStorage, onNavigate })
  }

  handleClickNewBill = () => {
    this.onNavigate(ROUTES_PATH['NewBill'])
  }

  handleClickIconEye = (icon) => {
    const billUrl = icon.getAttribute("data-bill-url")
    const imgWidth = Math.floor($('#modaleFile').width() * 0.5)
    $('#modaleFile').find(".modal-body").html(`<div style='text-align: center;' class="bill-proof-container"><img width=${imgWidth} src=${billUrl} alt="Bill" /></div>`)
    $('#modaleFile').modal('show')
  }

  getBills = () => {
    if (this.store) {
      return this.store
      .bills()
      .list()
      .then(snapshot => {
        const bills = snapshot
          .map(doc => {
            try {
              return {
                ...doc,
                date: formatDate(doc.date),
                status: formatStatus(doc.status)
              }
            } catch(e) {
              return {
                ...doc,
                date: doc.date,
                status: formatStatus(doc.status)
              }
            }
          })
        return bills
      })
    }
  }
}
