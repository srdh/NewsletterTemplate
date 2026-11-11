/*
 * French wording for the fixed parts of the emails (see lib/emailText.ts).
 * The key is the English text in the email templates.
 */
export const EMAIL_FR: Record<string, string> = {
  // All templates
  '© {year} Microsoft Corporation. All rights reserved.': '© {year} Microsoft Corporation. Tous droits réservés.',
  'Microsoft Corporation · One Microsoft Way · Redmond, WA 98052': 'Microsoft Corporation · One Microsoft Way · Redmond, WA 98052, États-Unis',
  'Register now!': 'Inscrivez-vous !',
  'Register now': 'Inscrivez-vous',

  // Regional Template (event invite)
  'Event image': 'Visuel de l’événement',
  'Event overview': 'Présentation de l’événement',
  'Best regards,': 'Cordialement,',

  // Partner Skilling Update Template
  'Upcoming Virtual Skilling': 'Prochaines formations virtuelles',
  'On-Demand Skilling': 'Formations à la demande',
  'Partner Skilling Update': 'Actualités Partner Skilling',
  'Call to Action': 'Appel à l’action',
  'Contents': 'Sommaire',
  'In the Spotlight. Upcoming events you can take': 'À la une. Les prochains événements auxquels participer',
  'Upcoming events · Virtual Skilling': 'Événements à venir · Formations virtuelles',
  'Event': 'Événement',
  'Focus': 'Thème',
  'Date and time': 'Date et heure',
  'Learning journey': 'Parcours de formation',
  'Link': 'Lien',
  'Let us know if you prefer that we send you these communications. To learn how to manage your contact preferences, see our privacy statement.':
    'Faites-nous savoir si vous préférez que nous vous envoyions ces communications. Pour savoir comment gérer vos préférences de contact, consultez notre déclaration de confidentialité.',

  // Weekly Project Snapshot
  "This week's new requests": 'Nouvelles demandes de la semaine',
  'Work in progress': 'En cours',
  'August completed projects': 'Projets terminés en août',
  'Owner': 'Responsable',
  'Initiative': 'Initiative',
  'Request date': 'Date de la demande',
  'Target due date': 'Échéance cible',
  'Current status': 'Statut actuel',
  'Project quote': 'Devis du projet',
  'Project approval': 'Approbation du projet',
  'Budget tracking': 'Suivi budgétaire',
  'Planned delivery': 'Livraison prévue',
  'Delivered date': 'Date de livraison',
  'Notes on scope changes': 'Remarques sur les changements de périmètre',
  'Final price': 'Prix final',
  'Weekly project snapshot | {date}': 'Aperçu hebdomadaire des projets | {date}',
  'Weekly call outs': 'Points de la semaine',
  'Working with Delightful': 'Travailler avec Delightful',
  'Marketing request form': 'Formulaire de demande marketing',

  // Custom, Custom 2 and Hackathons (event card)
  'Date': 'Date',
  'Time': 'Heure',
  'Where': 'Lieu',

  // Default text of new blocks
  'Session': 'Session',
  'Audience': 'Public',
  'Thanks,': 'Merci,',
  'Your name': 'Votre nom',
  'Partner Skilling': 'Partner Skilling',
  'Section heading': 'Titre de section',
  'Label': 'Libellé',
  'Details': 'Détails',
  'Email': 'E-mail',
  'Team name': 'Nom de l’équipe',
  'Column title': 'Titre de colonne',
  'Learn more': 'En savoir plus',
  '[Name]': '[Nom]',
  '[Role]': '[Fonction]',

  // New emails: default text (data/seed.ts, lib/newsletter.ts)
  'Untitled campaign': 'Campagne sans titre',
  'Hi all,': 'Bonjour à tous,',
  'Hi team,': 'Bonjour à toute l’équipe,',
  'New newsletter': 'Nouvelle newsletter',
  'Partner Skilling Newsletter': 'Newsletter Partner Skilling',
  'New event invite': 'Nouvelle invitation',
  'Build What’s Next with Partner Skilling': 'Préparez l’avenir avec Partner Skilling',
  'REGION- MONTH YEAR': 'RÉGION - MOIS ANNÉE',
  'ACTION: Invite your partners to this event': 'ACTION\u00a0: invitez vos partenaires à cet événement',
  'Asia Partner Skilling Strategy Lead': 'Responsable stratégie Partner Skilling Asie',
  'New monthly update': 'Nouvelles actualités mensuelles',
  'AI Workforce': 'Compétences IA',
  'New weekly snapshot': 'Nouvel aperçu hebdomadaire',
  'Weekly project snapshot': 'Aperçu hebdomadaire des projets',
  '<p>Hi all,</p><p>Start writing your newsletter here. Use the toolbar for <strong>bold</strong>, headings, lists, colours, and links.</p>':
    '<p>Bonjour à tous,</p><p>Commencez à rédiger votre newsletter ici. Utilisez la barre d’outils pour le <strong>gras</strong>, les titres, les listes, les couleurs et les liens.</p>',
  '<p>Questions? Reply to this email and the Partner Skilling team will get back to you.</p>':
    '<p>Des questions\u00a0? Répondez à cet e-mail et l’équipe Partner Skilling reviendra vers vous.</p>',
  'Privacy Statement': 'Déclaration de confidentialité',
  '© {year} Microsoft Corporation. All rights reserved.\nMicrosoft Corporation, One Microsoft Way, Redmond, WA 98052 USA':
    '© {year} Microsoft Corporation. Tous droits réservés.\nMicrosoft Corporation, One Microsoft Way, Redmond, WA 98052, États-Unis',
}
