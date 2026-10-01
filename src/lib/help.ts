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
  detail: "Ouvrez Nouveau lavage : type de véhicule, prestations, employés, paiement.",
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

export function getHelpSteps(): HelpStep[] {
  return [WASH_STEP, EXPENSE_STEP, DASHBOARD_STEP];
}

export function getHelpTopics(): HelpTopic[] {
  return [
    {
      id: "start",
      question: "Par où commencer ?",
      points: [
        "Créez d'abord les prestations et leurs prix, sur la même page.",
        "Ajoutez les employés.",
        "Ensuite, enregistrez le premier lavage.",
      ],
      href: "/services",
      action: "Prestations",
    },
    {
      id: "prices",
      question: "Comment changer un prix ou un type de véhicule ?",
      points: [
        "Ouvrez Prestations.",
        "Le tarif global s'applique à tous les types de véhicule.",
        "Touchez le montant, changez-le, puis touchez ailleurs. C'est enregistré.",
        "Ouvrez Prix différents selon le type seulement si un véhicule coûte plus cher.",
        "Pour un nouveau type, écrivez-le en haut puis Ajouter.",
      ],
      href: "/services",
      action: "Prestations",
    },
    {
      id: "wash",
      question: "Comment enregistrer un lavage ?",
      points: [
        "Ouvrez Nouveau lavage.",
        "Indiquez le type de véhicule, les prestations, les employés et le paiement (Espèces ou Mobile Money).",
        "Si vous saisissez le nom ou le téléphone, le client se crée tout seul.",
      ],
      href: "/washes/new",
      action: "Nouveau lavage",
    },
    {
      id: "expense",
      question: "Comment noter une dépense ?",
      points: [
        "Ouvrez Dépenses, puis Nouvelle dépense.",
        "Indiquez le montant, le paiement, la catégorie et une courte description.",
        "Pour corriger, touchez la dépense dans la liste.",
        "Pour un loyer, ouvrez Récurrentes. Pour un salaire, ouvrez Salaires.",
      ],
      href: "/expenses",
      action: "Dépenses",
    },
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
      id: "whatsapp",
      question: "Comment envoyer un message WhatsApp à tous les clients ?",
      points: [
        "Ouvrez Clients, puis Message WhatsApp.",
        "Écrivez le message une fois. {nom} est remplacé par le nom du client.",
        "Touchez Envoyer : WhatsApp s'ouvre avec le message prêt. Envoyez-le, puis revenez pour le client suivant.",
        "Les clients déjà contactés restent cochés, même si vous fermez la page.",
      ],
      href: "/customers/whatsapp",
      action: "Message WhatsApp",
    },
    {
      id: "search",
      question: "Comment retrouver un client ou un lavage ?",
      points: [
        "Utilisez la barre de recherche en haut de l'écran.",
        "Tapez le nom, le téléphone ou l'employé.",
        "Sur ordinateur, Ctrl+K (ou Cmd+K) ouvre aussi la recherche.",
      ],
    },
  ];
}
