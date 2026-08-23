export interface HelpStep {
  title: string;
  detail: string;
  href: string;
  action: string;
}

export interface HelpTopic {
  id: string;
  question: string;
  points: string[];
  href?: string;
  action?: string;
}

const WASH_STEP: HelpStep = {
  title: "Un véhicule arrive",
  detail: "Ouvrez Nouveau lavage : plaque, type de véhicule, prestations, employés, paiement.",
  href: "/washes/new",
  action: "Nouveau lavage",
};

const EXPENSE_STEP: HelpStep = {
  title: "De l'argent sort",
  detail: "Notez chaque dépense. Sinon le bénéfice du jour sera faux.",
  href: "/expenses",
  action: "Dépenses",
};

const DASHBOARD_STEP: HelpStep = {
  title: "Vous voulez le bilan",
  detail: "Le tableau de bord montre les voitures, l'argent encaissé et le bénéfice estimé.",
  href: "/dashboard",
  action: "Tableau de bord",
};

const CASH_STEP: HelpStep = {
  title: "En fin de journée",
  detail: "Comptez les Espèces et le Mobile Money, puis comparez avec le théorique. La clôture n'est pas obligatoire.",
  href: "/cash",
  action: "Caisse",
};

export function getHelpSteps(cashEnabled: boolean): HelpStep[] {
  if (cashEnabled) {
    return [WASH_STEP, EXPENSE_STEP, DASHBOARD_STEP, CASH_STEP];
  }
  return [WASH_STEP, EXPENSE_STEP, DASHBOARD_STEP];
}

export function getHelpTopics(cashEnabled: boolean): HelpTopic[] {
  const topics: HelpTopic[] = [
    {
      id: "start",
      question: "Par où commencer ?",
      points: [
        "Créez d'abord les prestations et leurs prix, sur la même page.",
        "Ajoutez les employés.",
        "Ensuite, enregistrez le premier lavage.",
        cashEnabled
          ? "Le suivi de caisse se règle dans Paramètres, à Système de caisse."
          : "Si vous voulez compter le tiroir, activez Système de caisse dans Paramètres.",
      ],
      href: "/services",
      action: "Prestations",
    },
    {
      id: "prices",
      question: "Comment changer un prix ou un type de véhicule ?",
      points: [
        "Ouvrez Prestations.",
        "Touchez le montant, changez-le, puis touchez ailleurs. C'est enregistré.",
        "Pour renommer un type, touchez son nom en haut de la page.",
        "Pour en ajouter un, écrivez-le puis Ajouter. Les tarifs se recopient, vous n'avez qu'à les ajuster.",
      ],
      href: "/services",
      action: "Prestations",
    },
    {
      id: "wash",
      question: "Comment enregistrer un lavage ?",
      points: [
        "Ouvrez Nouveau lavage.",
        "Indiquez la plaque, le type de véhicule, les prestations, les employés et le paiement (Espèces ou Mobile Money).",
        "Si vous saisissez le nom ou le téléphone, le client se crée tout seul.",
      ],
      href: "/washes/new",
      action: "Nouveau lavage",
    },
    {
      id: "expense",
      question: "Comment noter une dépense ?",
      points: [
        "Ouvrez Dépenses. Indiquez le montant, la date et la catégorie.",
        "Choisissez Espèces ou Mobile Money, comme le paiement réel.",
        "Pour un loyer, ouvrez Récurrentes.",
        "Pour un salaire, ouvrez Salaires. Ne le notez pas aussi dans Dépenses.",
      ],
      href: "/expenses",
      action: "Dépenses",
    },
  ];

  if (cashEnabled) {
    topics.push({
      id: "cash",
      question: "À quoi sert la caisse ?",
      points: [
        "Elle compare ce que vous devriez avoir et ce que vous comptez vraiment.",
        "Les Espèces et le Mobile Money sont suivis séparément.",
        "Vous pouvez l'éteindre dans Paramètres, à Système de caisse.",
      ],
      href: "/cash",
      action: "Ouvrir la caisse",
    });
  }

  topics.push(
    {
      id: "mistake",
      question: "J'ai fait une erreur. Que faire ?",
      points: [
        "N'effacez rien.",
        "Ouvrez le lavage, puis Annuler le lavage, et indiquez un motif.",
        "Le lavage reste visible, marqué Annulé.",
      ],
      href: "/washes",
      action: "Voir les lavages",
    },
    {
      id: "search",
      question: "Comment retrouver une plaque ou un client ?",
      points: [
        "Utilisez la barre de recherche en haut de l'écran.",
        "Tapez la plaque, le nom, le téléphone ou l'employé.",
        "Sur ordinateur, Ctrl+K (ou Cmd+K) ouvre aussi la recherche.",
      ],
    },
  );

  return topics;
}
