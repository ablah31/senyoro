# Contexte du projet

Créer une application web de gestion pour une entreprise spécialisée dans le lavage automobile en Guinée.

L’objectif principal est d’avoir une traçabilité complète de l’activité :

* chiffre d’affaires ;
* encaissements ;
* dépenses ;
* coûts de production ;
* charges ;
* salaires ;
* bénéfices ;
* activité des employés ;
* suivi de caisse ;
* statistiques et performances.

L’application est destinée au propriétaire / gérant du centre de lavage.

Les employés ne se connectent pas à l’application. Ils sont uniquement enregistrés afin de suivre les lavages réalisés, leur activité et leurs salaires.

L’application concerne un seul centre de lavage.

La devise principale est le **franc guinéen — GNF**.

---

# Stack technique

Utiliser :

* Next.js avec App Router ;
* TypeScript ;
* Supabase ;
* Supabase Auth ;
* PostgreSQL Supabase ;
* Supabase Storage ;
* Tailwind CSS ;
* shadcn/ui ;
* Recharts pour les graphiques ;
* React Hook Form ;
* Zod pour la validation ;
* date-fns pour les dates ;
* Vercel pour le déploiement.

L’interface doit être conçue en **mobile-first**, car l’application sera principalement utilisée depuis un smartphone.

Elle doit néanmoins être parfaitement utilisable sur tablette et ordinateur.

---

# 1. Authentification

## Fonctionnalités

Créer une authentification sécurisée avec Supabase Auth.

Connexion avec :

* email ;
* mot de passe.

Prévoir :

* connexion ;
* déconnexion ;
* mot de passe oublié ;
* réinitialisation du mot de passe ;
* gestion de session.

Un seul type d’utilisateur existe :

`Admin`

L’admin correspond au propriétaire ou au gérant.

Tous les écrans applicatifs doivent être protégés.

---

# 2. Tableau de bord

Créer un dashboard principal donnant immédiatement une vision de l’activité.

Afficher les KPI suivants :

* chiffre d’affaires ;
* bénéfice estimé ;
* total des dépenses ;
* nombre de véhicules lavés ;
* panier moyen ;
* montant encaissé en espèces ;
* montant encaissé par Mobile Money.

Afficher les chiffres pour :

* aujourd’hui ;
* hier ;
* semaine ;
* mois ;
* trimestre ;
* année ;
* période personnalisée.

Ajouter un sélecteur de période global.

## Comparaison

Comparer automatiquement les performances avec la période précédente.

Exemple :

`CA : 45 000 000 GNF`

`+12,5 % par rapport au mois précédent`

Afficher les variations positives ou négatives.

---

# 3. Graphiques

Utiliser Recharts.

Créer au minimum :

* évolution du chiffre d’affaires ;
* évolution des dépenses ;
* évolution du bénéfice ;
* nombre de lavages ;
* CA par prestation ;
* CA par type de véhicule ;
* dépenses par catégorie ;
* répartition espèces / Mobile Money ;
* CA par employé.

Les graphiques doivent respecter le système de design shadcn/ui.

Ils doivent être lisibles sur mobile.

---

# 4. Gestion des prestations

Créer une page :

`Prestations`

L’admin peut :

* créer ;
* modifier ;
* désactiver ;
* supprimer une prestation si elle n’a jamais été utilisée.

Une prestation possède :

* nom ;
* description facultative ;
* prix de référence ;
* statut actif/inactif ;
* date de création.

Exemples :

* Lavage extérieur ;
* Lavage complet ;
* Lavage intérieur ;
* Nettoyage moteur ;
* Lavage premium.

Les prestations doivent pouvoir être associées à différents types de véhicules.

---

# 5. Types de véhicules

Créer les types par défaut :

* Moto ;
* Berline ;
* SUV / 4x4 ;
* Pickup ;
* Minibus ;
* Camion ;
* Autre.

L’admin doit pouvoir ajouter ou modifier les types de véhicules.

Une prestation peut avoir un prix différent selon le type de véhicule.

Exemple :

Lavage complet :

* Berline : 60 000 GNF ;
* SUV : 80 000 GNF ;
* Pickup : 90 000 GNF.

---

# 6. Enregistrement d’un lavage

Créer un écran rapide :

`Nouveau lavage`

Il doit être particulièrement optimisé pour smartphone.

Informations :

* date ;
* heure ;
* type de véhicule ;
* plaque d’immatriculation ;
* prestation ;
* montant ;
* employé ;
* moyen de paiement ;
* nom du client facultatif ;
* téléphone du client facultatif ;
* note facultative.

Moyens de paiement :

* Espèces ;
* Mobile Money.

La date et l’heure sont automatiquement préremplies.

---

# 7. Plusieurs prestations sur un lavage

Permettre d’ajouter plusieurs prestations à une même transaction.

Exemple :

* Lavage extérieur : 50 000 GNF ;
* intérieur : 30 000 GNF ;
* moteur : 40 000 GNF.

Total :

`120 000 GNF`

Le système calcule automatiquement le montant total.

---

# 8. Modification manuelle du prix

L’admin peut modifier le prix final d’un lavage.

Conserver :

* prix théorique ;
* prix réellement encaissé ;
* différence.

Si le prix final diffère du prix théorique, demander un motif.

Exemples :

* remise commerciale ;
* client régulier ;
* geste commercial ;
* erreur ;
* autre.

Cela permet de conserver une traçabilité des remises.

---

# 9. Historique des lavages

Créer une page :

`Lavages`

Afficher :

* date ;
* heure ;
* plaque ;
* véhicule ;
* prestation ;
* employé ;
* client ;
* moyen de paiement ;
* montant.

Ajouter recherche et filtres :

* date ;
* période ;
* employé ;
* prestation ;
* type de véhicule ;
* moyen de paiement ;
* plaque.

Permettre d’ouvrir le détail d’un lavage.

---

# 10. Clients

Créer automatiquement une fiche client lorsqu’un nom ou un téléphone est renseigné.

Un client possède :

* nom ;
* téléphone ;
* date de création ;
* nombre de visites ;
* chiffre d’affaires généré.

Une fiche client affiche :

* informations générales ;
* véhicules ;
* historique des lavages ;
* total dépensé ;
* dernière visite.

Un client peut avoir plusieurs véhicules.

---

# 11. Véhicules clients

Chaque véhicule peut contenir :

* plaque d’immatriculation ;
* type ;
* marque facultative ;
* modèle facultatif ;
* client.

Lorsqu’une plaque déjà connue est renseignée dans un nouveau lavage, retrouver automatiquement :

* le véhicule ;
* son client.

La fidélité avec récompenses n’est pas nécessaire en V1.

---

# 12. Employés

Créer une page :

`Employés`

L’admin peut :

* ajouter ;
* modifier ;
* désactiver un employé.

Éviter la suppression définitive afin de conserver l’historique.

Informations :

* prénom ;
* nom ;
* téléphone ;
* fonction ;
* salaire mensuel de référence ;
* date d’embauche ;
* statut actif/inactif ;
* adresse facultative ;
* notes facultatives ;
* photo facultative.

Fonctions possibles :

* Laveur ;
* Responsable lavage ;
* Caissier ;
* Gardien ;
* Responsable ;
* Autre.

---

# 13. Plusieurs employés par lavage

Permettre de rattacher un ou plusieurs employés à un même lavage.

Un employé peut donc participer à plusieurs lavages.

Cela doit permettre de calculer :

* nombre de lavages réalisés ;
* nombre de véhicules traités ;
* CA associé aux lavages auxquels il a participé.

Ne pas interpréter ce CA comme une commission.

---

# 14. Performance des employés

Créer une fiche statistique par employé.

Afficher :

* nombre de lavages ;
* nombre de lavages sur la période ;
* CA associé ;
* prestation la plus réalisée ;
* historique des lavages ;
* évolution mensuelle.

Créer également un classement des employés.

Exemple :

1. Mamadou — 74 lavages
2. Alpha — 68 lavages
3. Ibrahima — 51 lavages

---

# 15. Gestion des salaires

Chaque employé possède un salaire mensuel de référence.

Exemple :

`1 500 000 GNF`

Créer une gestion mensuelle des salaires.

Pour chaque mois enregistrer :

* salaire prévu ;
* salaire réellement payé ;
* date du paiement ;
* statut ;
* commentaire.

Statuts :

* À payer ;
* Partiellement payé ;
* Payé.

Le salaire payé peut être différent du salaire de référence.

Exemple :

Salaire prévu :

`1 500 000 GNF`

Salaire versé :

`1 350 000 GNF`

Commentaire :

`Absences durant le mois`

Un salaire versé doit automatiquement être comptabilisé comme une dépense.

---

# 16. Dépenses

Créer une page :

`Dépenses`

Une dépense contient :

* montant ;
* date ;
* catégorie ;
* type ;
* description ;
* fournisseur facultatif ;
* moyen de paiement ;
* justificatif facultatif ;
* personne ayant enregistré la dépense ;
* récurrence éventuelle.

Moyens de paiement :

* Espèces ;
* Mobile Money.

---

# 17. Catégories de dépenses

Créer par défaut :

* Produits de lavage ;
* Eau ;
* Électricité ;
* Loyer ;
* Salaires ;
* Matériel ;
* Entretien ;
* Réparation ;
* Transport ;
* Marketing ;
* Taxes ;
* Autre.

L’admin peut faire du CRUD sur les catégories.

---

# 18. Charges fixes et variables

Chaque dépense appartient à l’un des types suivants :

`FIXE`

ou

`VARIABLE`

Exemples de charges fixes :

* loyer ;
* salaire ;
* abonnement.

Exemples variables :

* savon ;
* réparation ;
* achat matériel ;
* transport.

Permettre d’analyser séparément :

* charges fixes ;
* charges variables.

---

# 19. Dépenses récurrentes

Créer un système de dépenses récurrentes.

Exemple :

Loyer :

`5 000 000 GNF / mois`

Une dépense récurrente possède :

* catégorie ;
* montant par défaut ;
* fréquence ;
* date de début ;
* date de prochaine échéance ;
* statut.

Pour éviter de générer de fausses charges automatiquement, ne pas comptabiliser immédiatement la dépense.

Créer plutôt une échéance :

`Loyer août — à confirmer`

L’admin confirme ensuite le paiement.

Cela permet de gérer les variations et les retards.

---

# 20. Justificatifs

Permettre de joindre une photo ou un document à une dépense.

Utiliser Supabase Storage.

Exemples :

* facture ;
* reçu ;
* photo d’achat.

Accepter principalement :

* JPEG ;
* PNG ;
* PDF.

---

# 21. Caisse journalière

Créer une page :

`Caisse`

Chaque journée possède une caisse.

Lors de l’ouverture, l’admin peut renseigner :

`Fond de caisse initial`

Ce champ est facultatif.

---

# 22. Caisse espèces

Calculer automatiquement :

Fond initial

*

encaissements espèces

*

dépenses espèces

=

caisse théorique.

Exemple :

Fond :

`300 000`

Encaissements :

`2 500 000`

Dépenses :

`200 000`

Théorique :

`2 600 000 GNF`

---

# 23. Mobile Money

Suivre Mobile Money séparément.

Afficher :

* solde théorique de début facultatif ;
* encaissements ;
* dépenses ;
* solde théorique final.

Ne jamais mélanger la caisse physique et Mobile Money.

---

# 24. Clôture de caisse

La clôture est facultative.

L’admin peut renseigner :

* espèces réellement présentes ;
* solde Mobile Money réel ;
* commentaire.

Calculer automatiquement les écarts.

Exemple :

Théorique :

`3 250 000 GNF`

Réel :

`3 200 000 GNF`

Écart :

`-50 000 GNF`

Une journée non clôturée ne bloque pas la journée suivante.

Afficher simplement :

`Caisse non clôturée`

---

# 25. Dépenses liées à la caisse

Lorsqu’une dépense est enregistrée :

* une dépense en espèces réduit automatiquement la caisse espèces ;
* une dépense Mobile Money réduit le solde Mobile Money.

L’impact doit être calculé automatiquement.

---

# 26. Calcul du chiffre d’affaires

Le chiffre d’affaires correspond uniquement aux lavages réellement enregistrés.

Formule :

`CA = somme des montants réellement encaissés`

Utiliser le montant final après éventuelle remise.

---

# 27. Calcul des charges

Charges :

* achats ;
* salaires réellement versés ;
* loyer ;
* eau ;
* électricité ;
* matériel ;
* autres dépenses validées.

Les dépenses récurrentes non confirmées ne doivent pas être comptabilisées.

---

# 28. Calcul du bénéfice

Formule simplifiée V1 :

`Bénéfice = chiffre d'affaires - dépenses`

Afficher clairement qu’il s’agit d’un résultat de gestion interne et non d’un résultat comptable certifié.

---

# 29. Objectifs

Permettre de définir des objectifs mensuels :

* objectif de CA ;
* objectif de nombre de lavages.

Exemple :

Objectif CA :

`100 000 000 GNF`

Réalisé :

`72 000 000 GNF`

Progression :

`72 %`

Afficher une barre de progression.

---

# 30. Rapport journalier

Créer un rapport journalier contenant :

* nombre de véhicules ;
* CA ;
* espèces encaissées ;
* Mobile Money ;
* dépenses ;
* bénéfice estimé ;
* caisse ;
* employés actifs ;
* prestations réalisées.

---

# 31. Rapports périodiques

Créer des rapports :

* quotidien ;
* hebdomadaire ;
* mensuel ;
* trimestriel ;
* annuel ;
* personnalisé.

Filtres :

* dates ;
* prestation ;
* employé ;
* type de véhicule ;
* moyen de paiement ;
* catégorie de dépense.

---

# 32. Export

Permettre d’exporter les rapports.

Priorité V1 :

* CSV ;
* Excel.

Prévoir PDF ultérieurement si nécessaire.

Exports possibles :

* lavages ;
* chiffre d’affaires ;
* dépenses ;
* salaires ;
* employés ;
* rapport financier.

---

# 33. Recherche globale

Ajouter une recherche permettant de retrouver rapidement :

* plaque d’immatriculation ;
* client ;
* téléphone ;
* employé ;
* transaction.

---

# 34. Journal d’activité

Créer un système d’audit.

Enregistrer les opérations sensibles :

* création d’un lavage ;
* modification d’un lavage ;
* annulation ;
* modification d’un montant ;
* création d’une dépense ;
* suppression logique ;
* paiement d’un salaire ;
* clôture de caisse.

Conserver :

* action ;
* date ;
* ancienne valeur ;
* nouvelle valeur ;
* utilisateur.

Même avec un seul admin, cela améliore fortement la traçabilité.

---

# 35. Suppression et annulation

Éviter autant que possible les suppressions définitives.

Pour les opérations financières utiliser :

* actif ;
* annulé.

Une transaction annulée reste visible dans l’historique mais n’est plus comptée dans les statistiques financières.

Demander un motif d’annulation.

---

# 36. Format monétaire

Tous les montants doivent être enregistrés numériquement en base.

Affichage :

`1 250 000 GNF`

Éviter les décimales pour les montants GNF dans l’interface.

Créer une fonction globale de formatage.

---

# 37. Dates et fuseau horaire

Utiliser le fuseau horaire de la Guinée :

`Africa/Conakry`

Les données doivent être stockées de manière fiable en UTC en base puis affichées en heure locale.

---

# 38. Navigation

Navigation principale :

* Dashboard ;
* Nouveau lavage ;
* Lavages ;
* Caisse ;
* Dépenses ;
* Employés ;
* Salaires ;
* Clients ;
* Prestations ;
* Rapports ;
* Paramètres.

Sur mobile, utiliser une navigation compacte.

Les fonctionnalités les plus accessibles doivent être :

1. Nouveau lavage ;
2. Dashboard ;
3. Caisse ;
4. Dépenses.

---

# 39. UX du formulaire de lavage

Le formulaire de lavage doit pouvoir être rempli en quelques secondes.

Utiliser :

* grands boutons ;
* sélections rapides ;
* valeurs par défaut ;
* clavier numérique pour les montants ;
* auto-complétion plaque/client ;
* validation visuelle claire.

Après validation afficher :

`Lavage enregistré avec succès`

Puis proposer :

* Nouveau lavage ;
* Voir la transaction.

---

# 40. Base de données Supabase

Prévoir au minimum les tables :

`profiles`

`employees`

`employee_roles`

`services`

`vehicle_types`

`service_prices`

`customers`

`vehicles`

`washes`

`wash_services`

`wash_employees`

`expense_categories`

`expenses`

`recurring_expenses`

`salary_payments`

`cash_sessions`

`financial_goals`

`attachments`

`audit_logs`

---

# 41. Relations principales

Un client :

`1 → N véhicules`

Un véhicule :

`1 → N lavages`

Un lavage :

`N → N prestations`

Un lavage :

`N → N employés`

Une catégorie :

`1 → N dépenses`

Un employé :

`1 → N paiements de salaire`

---

# 42. Supabase RLS

Activer Row Level Security sur toutes les tables sensibles.

Seul l’utilisateur authentifié doit pouvoir accéder aux données de l’entreprise.

Même si l’application n’a qu’une seule entreprise en V1, prévoir un champ :

`organization_id`

sur les principales tables.

Cela permettra ultérieurement de transformer la solution en application multi-entreprises sans réécrire toute l’architecture.

---

# 43. Organisation

Créer une table :

`organizations`

Contenant :

* id ;
* nom ;
* téléphone ;
* adresse ;
* devise ;
* pays ;
* timezone ;
* logo ;
* created_at.

Valeurs par défaut :

* pays : Guinée ;
* devise : GNF ;
* timezone : Africa/Conakry.

---

# 44. Paramètres

Créer une page paramètres permettant de modifier :

* nom du centre ;
* logo ;
* adresse ;
* téléphone ;
* fond de caisse par défaut ;
* devise ;
* types de véhicules ;
* catégories ;
* prestations.

---

# 45. Design

Le design doit être :

* moderne ;
* simple ;
* professionnel ;
* très lisible ;
* adapté à un usage quotidien ;
* mobile-first.

Éviter une interface ressemblant à un logiciel comptable complexe.

L’utilisateur doit comprendre son activité en quelques secondes.

Utiliser largement :

* Card ;
* Badge ;
* Tabs ;
* Sheet ;
* Drawer ;
* Dialog ;
* DataTable ;
* DropdownMenu ;
* Select ;
* Command ;
* Calendar ;
* DatePicker ;
* Skeleton ;
* Toast.

---

# 46. Responsive

Mobile :

priorité aux actions rapides.

Desktop :

dashboard plus dense avec plusieurs cartes et graphiques visibles simultanément.

Les tableaux doivent devenir des cartes ou listes compactes sur petit écran lorsque nécessaire.

---

# 47. États applicatifs

Gérer proprement :

* loading ;
* empty state ;
* erreur ;
* succès ;
* données absentes.

Exemple :

`Aucun lavage enregistré aujourd’hui.`

Ajouter un bouton :

`Enregistrer le premier lavage`

---

# 48. Performance

Utiliser :

* Server Components lorsque pertinent ;
* Server Actions ou API routes selon le besoin ;
* pagination ;
* indexes PostgreSQL ;
* requêtes Supabase optimisées.

Ne pas charger l’intégralité de l’historique pour générer un tableau.

---

# 49. Sécurité

Ne jamais exposer la Supabase Service Role Key dans le frontend.

Utiliser les variables d’environnement.

Valider toutes les données avec Zod.

Vérifier les autorisations côté serveur et via RLS.

Limiter les uploads.

Échapper et valider toutes les entrées utilisateur.

---

# 50. Données de démonstration

Créer un seed de données fictives adaptées à la Guinée.

Exemples de clients :

* Mamadou Diallo ;
* Alpha Condé ;
* Ibrahima Camara ;
* Fatoumata Bah.

Créer :

* employés fictifs ;
* prestations ;
* transactions ;
* dépenses ;
* salaires.

Utiliser des montants réalistes en GNF pour que le dashboard soit immédiatement exploitable lors du développement.

---

# 51. Priorités de développement

## P0 — Fondations

* Next.js ;
* Supabase ;
* Auth ;
* organisation ;
* layout ;
* navigation ;
* RLS ;
* design system.

## P1 — Activité principale

* prestations ;
* véhicules ;
* employés ;
* nouveau lavage ;
* historique des lavages ;
* caisse.

## P2 — Gestion financière

* dépenses ;
* catégories ;
* dépenses récurrentes ;
* salaires ;
* calcul CA ;
* calcul charges ;
* bénéfices.

## P3 — Pilotage

* dashboard ;
* graphiques ;
* comparaisons ;
* objectifs ;
* performances employés.

## P4 — Gestion avancée

* clients ;
* véhicules clients ;
* rapports ;
* exports ;
* pièces jointes ;
* audit logs.

---

# 52. Objectif UX principal

L’administrateur doit pouvoir ouvrir l’application sur son téléphone et comprendre immédiatement :

* combien de voitures ont été lavées aujourd’hui ;
* combien d’argent a été encaissé ;
* combien a été encaissé en espèces ;
* combien a été encaissé en Mobile Money ;
* combien a été dépensé ;
* combien l’entreprise a approximativement gagné ;
* combien devrait contenir la caisse.

La saisie d’un nouveau lavage doit idéalement demander moins de 30 secondes.

---

# 53. MVP

Le MVP est considéré comme fonctionnel lorsque l’administrateur peut :

1. se connecter ;
2. créer ses prestations ;
3. créer ses employés ;
4. enregistrer un lavage ;
5. enregistrer une dépense ;
6. suivre espèces et Mobile Money ;
7. clôturer éventuellement sa caisse ;
8. enregistrer les salaires ;
9. consulter son chiffre d’affaires ;
10. consulter ses charges ;
11. connaître son bénéfice ;
12. filtrer les données par période ;
13. consulter les performances des employés ;
14. consulter les graphiques de son activité.

L’objectif est de créer un véritable outil de pilotage quotidien du centre de lavage, et non un simple formulaire de saisie.
