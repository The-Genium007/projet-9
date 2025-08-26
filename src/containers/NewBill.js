import { ROUTES_PATH } from '../constants/routes.js'
import Logout from "./Logout.js"

/**
 * Comportement attendu (NewBill):
 * - Cette classe pilote l'écran de création d'une note de frais.
 * - Upload fichier (handleChangeFile):
 *   - N’accepte que les extensions jpg/jpeg/png. Sinon: alert() et reset de l’input.
 *   - En cas de fichier valide, envoie un FormData {file, email} via store.bills().create
 *     avec header noContentType. Récupère et conserve { billId(key), fileUrl, fileName }.
 *   - En cas d’erreur d’upload, log dans console.error (pas d’affichage UI spécifique).
 * - Soumission (handleSubmit):
 *   - Construit l’objet bill à partir des champs du formulaire (status 'pending').
 *   - Appelle updateBill(bill) puis navigue immédiatement vers ROUTES_PATH.Bills.
 *   - Note: la navigation n’attend pas la résolution de update(). Les erreurs d’update
 *     sont uniquement loguées dans la console.
 * - updateBill: envoie store.bills().update({ data: JSON.stringify(bill), selector: billId })
 *   puis renavigue vers Bills; en cas d’échec, console.error.
 * - Pré-requis/contraintes:
 *   - L’input fichier est requis au niveau HTML; l’extension est validée côté JS.
 *   - Si aucun store n’est fourni, updateBill ne fait rien (aucun appel réseau).
 */

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
    formNewBill.addEventListener("submit", this.handleSubmit)
    const file = this.document.querySelector(`input[data-testid="file"]`)
    file.addEventListener("change", this.handleChangeFile)
    this.fileUrl = null
    this.fileName = null
    this.billId = null
    new Logout({ document, localStorage, onNavigate })
  }
  handleChangeFile = e => {
    e.preventDefault()
    const file = this.document.querySelector(`input[data-testid="file"]`).files[0]
    const filePath = e.target.value.split(/\\/g)
    const fileName = filePath[filePath.length-1]
    
    // Vérifier l'extension du fichier
    const allowedExtensions = ['jpg', 'jpeg', 'png']
    const fileExtension = fileName.split('.').pop().toLowerCase()
    
    if (!allowedExtensions.includes(fileExtension)) {
      alert('Seuls les fichiers JPG, JPEG et PNG sont acceptés')
      e.target.value = '' // Réinitialiser l'input
      return
    }
    
    const formData = new FormData()
    const email = JSON.parse(localStorage.getItem("user")).email
    formData.append('file', file)
    formData.append('email', email)

    this.store
      .bills()
      .create({
        data: formData,
        headers: {
          noContentType: true
        }
      })
      .then(({fileUrl, key}) => {
        console.log(fileUrl)
        this.billId = key
        this.fileUrl = fileUrl
        this.fileName = fileName
      }).catch(error => console.error(error))
  }
  handleSubmit = e => {
    e.preventDefault()
    console.log('e.target.querySelector(`input[data-testid="datepicker"]`).value', e.target.querySelector(`input[data-testid="datepicker"]`).value)
    const email = JSON.parse(localStorage.getItem("user")).email
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name:  e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
      date:  e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: 'pending'
    }
    this.updateBill(bill)
    this.onNavigate(ROUTES_PATH['Bills'])
  }

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
      .bills()
      .update({data: JSON.stringify(bill), selector: this.billId})
      .then(() => {
        this.onNavigate(ROUTES_PATH['Bills'])
      })
      .catch(error => console.error(error))
    }
  }
}