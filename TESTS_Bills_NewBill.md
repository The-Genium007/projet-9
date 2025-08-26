# Présentation technique des tests: Bills et NewBill

Ce document décrit la couverture de tests et les comportements vérifiés pour les modules Bills (liste des notes de frais) et NewBill (création d’une note de frais) dans l’application front.

## Contexte test

- Stack: Jest + @testing-library/dom (environnement jsdom)
- Config: `package.json` -> script `npm test` lance Jest avec couverture et en mode silencieux
- Mocks clés: `localStorage`, `Store` (pour Bills via `__mocks__/store` dans certains tests)

---

## NewBill: tests existants (`src/__tests__/NewBill.js`)

Objectif: valider le flux de création d’une note de frais, les contraintes d’upload, et les erreurs côté POST (update) nouvellement ajoutées.

Couvertures principales:

- Affichage du formulaire
  - Vérifie la présence du formulaire `data-testid="form-new-bill"` après rendu de `NewBillUI`.
- Validation de l’upload fichier
  - Refus d’un PDF: déclenche une alerte (`window.alert`) et réinitialise l’input.
  - Acceptation d’une image PNG: appelle `store.bills().create` et stocke `fileUrl`, `key`.
- Soumission du formulaire
  - Appel de `updateBill` lors du submit lorsque le store n’est pas nécessaire (mock de la méthode pour éviter I/O).
- Intégration POST réussi
  - Avec store mocké (`create` puis `update` résolvent), la soumission entraîne l’appel du POST et une navigation vers la page Bills (`onNavigate`).
- Gestion d’erreurs POST (update) 404 et 500
  - Deux tests ajoutés simulent un rejet de `store.bills().update` avec `Erreur 404` et `Erreur 500`.
  - On espionne `console.error` pour s’assurer que l’erreur est bien loggée.
  - Note: par conception, `handleSubmit` appelle `onNavigate` immédiatement puis `updateBill`; l’UX d’erreur n’est pas affichée à l’écran, on vérifie donc les logs d’erreur.

Points techniques importants:

- `handleChangeFile` vérifie l’extension (`jpg/jpeg/png`), construit un `FormData` et appelle `store.bills().create` avec `noContentType`.
- `handleSubmit` construit l’objet `bill` et appelle `updateBill` qui fait `store.bills().update({ data, selector: billId })`.
- Les tests d’erreur portent sur `update` (POST final) et non sur `create` (upload). Des tests d’erreur sur `create` peuvent être ajoutés de façon similaire si souhaité.

---

## Bills: tests existants (`src/__tests__/Bills.js`)

Objectif: valider l’affichage/formatage, les interactions (nouvelle note, aperçu justificatif) et la robustesse lors du chargement (GET) incluant erreurs 404/500.

Couvertures principales:

- Icône active dans la barre verticale
  - Vérifie que l’icône “fenêtre” est surlignée (`active-icon`) sur la page Bills.
- Ordre des dates
  - Confirme que les notes de frais sont triées de la plus récente à la plus ancienne en comparant l’ordre rendu aux dates triées en anti-chronologique.
- Navigation vers NewBill
  - `handleClickNewBill` appelle `onNavigate(ROUTES_PATH.NewBill)`.
- Affichage du justificatif (modal)
  - `handleClickIconEye` insère l’image dans la modale et déclenche `$('#modaleFile').modal('show')`.
- getBills: formatage des données
  - Avec un store mocké, `getBills` renvoie les entrées avec `date` formatée (`formatDate`) et `status` traduit (`formatStatus`).

Intégration GET et erreurs:

- Succès GET
  - Sur navigation `ROUTES_PATH.Bills`, le titre “Mes notes de frais” s’affiche et le tableau contient au moins une ligne.
- Échec GET 404 et 500
  - En espionnant `mockStore.bills().list` pour rejeter, l’UI affiche un état d’erreur et un message contenant “Erreur 404” ou “Erreur 500” (`data-testid="error-message"`).

Points techniques importants:

- `getBills` mappe le snapshot et tente `formatDate`; en cas d’exception sur la date, elle est laissée brute et `status` reste formaté.
- Les interactions utilisent jQuery pour la modale; les tests mockent `$` avec les méthodes nécessaires (`width`, `find().html`, `modal`).

---

## Idées d’améliorations de tests

- NewBill
  - Couvrir les erreurs sur `store.bills().create` (upload) 404/500, et vérifier les logs d’erreurs.
  - Introduire un feedback utilisateur (UI) sur échec `create`/`update`, puis tester l’affichage du message.
- Bills
  - Ajouter un test sur un doc avec date invalide pour couvrir la branche de fallback dans `getBills` (sans `formatDate`).
  - Tests d’accessibilité (focus modal, roles ARIA) sur l’ouverture de justificatif.

---

## Résumé

- Bills: GET happy path et erreurs 404/500 couverts; interactions (nouvelle note, modale) et formatage testés.
- NewBill: flux de soumission OK, validation fichier, upload PNG OK; POST (update) en erreur 404/500 désormais couvert via logs.
- La couverture peut encore être renforcée côté NewBill pour l’upload en erreur et côté UI pour des messages d’erreur visibles.
