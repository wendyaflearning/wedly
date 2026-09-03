/**
 * Les trois statuts qu'un couple voit sur une demande de mise en relation
 * (WED-186, miroir du `CoupleLeadStatus` backend).
 *
 * Ce sont les seules valeurs que l'API renvoie : le cycle de vie complet du lead
 * côté prestataire reste derrière, et l'écran n'a jamais à en connaître d'autres.
 */
export type CoupleLeadStatus = 'EN_ATTENTE' | 'DEBLOQUEE' | 'REFUSEE'
