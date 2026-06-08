const config = require('../config.json');

/**
 * Calcule la répartition d'un payout.
 *
 * Le % (prixPct) est une RÉDUCTION sur la VM — 15% signifie que l'acheteur
 * paie VM × (1 - 0.15) = 85% de la VM.
 *
 * @param {number} vm       Valeur marchande estimée
 * @param {number} rep      Coût de réparation
 * @param {number} remisePct  % de réduction (ex: 15 → acheteur paie 85% de la VM)
 * @returns {object}        Tous les montants détaillés
 */
function calcPayout(vm, rep, remisePct) {
  const fraisGuildePct = config.payoutFraisGuilde ?? 5;
  const prixFinal      = Math.round(vm * (1 - remisePct / 100)- rep);
  const fraisGuilde    = Math.round(prixFinal * fraisGuildePct / 100);
  const netJoueurs     = prixFinal - fraisGuilde;

  return {
    vm,
    rep,
    remisePct,
    prixFinal,
    fraisGuildePct,
    fraisGuilde,
    netJoueurs,
  };
}

module.exports = { calcPayout };