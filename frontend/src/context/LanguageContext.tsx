import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  type PropsWithChildren,
} from "react";

export type Language = "en" | "fr" | "rw";

type Dictionary = Record<string, string>;

const translations: Record<Language, Dictionary> = {
  /* ═══════════════════════════════════════════════════════
     ENGLISH
  ═══════════════════════════════════════════════════════ */
  en: {
    "lang.english": "English",
    "lang.french": "French",
    "lang.kinyarwanda": "Kinyarwanda",

    "nav.home": "Home",
    "nav.menu": "Menu",
    "nav.reserve": "Reserve",
    "nav.reviews": "Reviews",
    "nav.contact": "Contact",
    "nav.chat": "Chat",
    "nav.changeBranch": "Change Branch",
    "nav.branch": "Branch: {branch}",

    "home.title": "Easy food ordering for {branch}.",
    "home.subtitle":
      "Pick your food, chat with our team, or book a table in a few taps.",
    "home.browseMenu": "Browse Full Menu",
    "home.chat": "Chat With Us",
    "home.reserveTable": "Reserve a Table",

    "home.services.eyebrow": "What we offer",
    "home.services.title": "Made for how you dine",
    "home.services.dineIn.title": "Dine-In",
    "home.services.dineIn.desc":
      "Enjoy our warm atmosphere with attentive table service.",
    "home.services.delivery.title": "Delivery",
    "home.services.delivery.desc":
      "Fresh from our kitchen to your door in under 40 minutes.",
    "home.services.pickup.title": "Pickup",
    "home.services.pickup.desc":
      "Order ahead and skip the wait. Ready when you arrive.",
    "home.services.reservations.title": "Reservations",
    "home.services.reservations.desc":
      "Book your table in seconds for any occasion.",

    "home.stats.guests": "Happy Guests",
    "home.stats.menuItems": "Menu Items",
    "home.stats.rating": "Google Rating",
    "home.stats.prepTime": "Avg Prep Time",

    "home.gallery.eyebrow": "Moments from our kitchen",
    "home.gallery.title": "A taste of the experience",

    "home.testimonials.eyebrow": "Loved by our guests",
    "home.testimonials.title": "What people are saying",
    "home.testimonials.subtitle":
      "Real stories from real guests. Had a great experience? We'd love to hear yours.",
    "home.testimonials.writeReview": "Write a Review",
    "home.testimonials.seeAll": "See all reviews →",
    "home.testimonials.shareExperience": "Share Your Experience",
    "home.testimonials.review1.quote":
      "The food was incredible and the staff made us feel at home. Best dining experience in town.",
    "home.testimonials.review1.role": "Regular guest",
    "home.testimonials.review2.quote":
      "Fast delivery, hot food, and the packaging is beautiful. City Snack never disappoints.",
    "home.testimonials.review2.role": "Delivery customer",
    "home.testimonials.review3.quote":
      "Perfect spot for a family dinner. Warm atmosphere, great menu variety, fair prices.",
    "home.testimonials.review3.role": "Family diner",

    "home.cta.eyebrow": "Reservations open",
    "home.cta.title": "Join us at {branch}",
    "home.cta.subtitle": "Reserve your table and let us take care of the rest.",
    "home.cta.viewMenu": "View Menu",
    "home.hero.scroll": "Scroll",

    "home.popular": "Most Ordered This Evening",
    "home.popularSub": "Popular dishes in {branch} right now.",
    "home.hours": "Open daily: 10:00 AM - 11:00 PM",
    "home.tagline": "Where Flavor Meets Ambiance",
    "home.openNow": "Open Now",
    "home.closedNow": "Closed",
    "home.orderNow": "Order Now",
    "home.viewMenu": "View Menu",
    "home.stat1": "Happy Customers",
    "home.stat2": "Menu Items",
    "home.stat3": "Years of Service",
    "home.stat4": "Daily Orders",
    "home.whyTitle": "Why Choose Us",
    "home.whySub": "Crafted moments, every visit",
    "home.why1Title": "Fresh Ingredients",
    "home.why1Desc": "Sourced daily from local Rwandan farmers",
    "home.why2Title": "Fast Service",
    "home.why2Desc": "From order to table in 20 minutes",
    "home.why3Title": "Warm Ambiance",
    "home.why3Desc": "A cozy space for every occasion",
    "home.why4Title": "Skilled Chefs",
    "home.why4Desc": "Trained hands crafting every plate",
    "home.ctaTitle": "Ready to taste the experience?",
    "home.ctaSub": "Reserve your table or order online today.",

    "menu.description":
      "This is the {branch} menu. Use search and categories to find food quickly.",
    "menu.search": "Search food",
    "menu.all": "All",
    "menu.meals": "Meals",
    "menu.drinks": "Drinks",
    "menu.desserts": "Desserts",

    /* ════ RESERVATIONS SECTION ════ */
    "reservation.title": "Reserve a Table {branch}",
    "reservation.subtitle":
      "Book a table at {branch}. Choose date, time, and guests.",
    "reservation.name": "Full name",
    "reservation.phone": "Phone Number",
    "reservation.guests": "Number of Guests",
    "reservation.submit": "Confirm Reservation",
    "reservation.success":
      "Reservation confirmed at {branch}! We'll be in touch shortly.",
    "reservation.eyebrow": "Book Your Table",

    "reservation.info.heading": "A seat is waiting for you.",
    "reservation.info.subheading":
      "Whether it's a quiet dinner or a lively gathering, we'll have everything ready before you arrive.",
    "reservation.info.openDailyLabel": "OPEN DAILY",
    "reservation.info.openDailyValue": "10:00 AM – 11:00 PM",
    "reservation.info.helpLabel": "NEED HELP?",
    "reservation.info.helpValue": "Call us for large parties (10+)",
    "reservation.info.confirmationLabel": "CONFIRMATION",
    "reservation.info.confirmationValue":
      "You'll receive a confirmation shortly",
    "reservation.info.bookingFor": "Booking for {branch}",

    "reservation.form.heading": "Your details",
    "reservation.form.allRequired": "All fields required",
    "reservation.form.depositNote":
      "A deposit of {amount} may be required for large groups.",
    "reservation.form.policy":
      "By booking, you agree to our reservation policy.",
    "reservation.form.errorFallback": "Failed to submit reservation",
    "reservation.namePlaceholder": "e.g. Sarah Uwimana",
    "reservation.date": "DATE",
    "reservation.time": "TIME",
    "reservation.submitting": "Submitting...",

    /* ════ REVIEWS SECTION ════ */
    "reviews.eyebrow": "GUEST EXPERIENCES",
    "reviews.title": "Moments at {branch}",
    "reviews.subtitle":
      "Real stories from real guests — every review helps us serve you better.",
    "reviews.latestFeedback": "LATEST FEEDBACK",
    "reviews.recentReviews": "Recent Reviews",
    "reviews.writeFirst": "Write First Review",
    "reviews.writeReview": "Write a Review",
    "reviews.empty": "No reviews yet",

    /* ════ CONTACT & CHAT ════ */
    "contact.title": "Contact & Location",
    "contact.subtitle": "Contact {branch} for orders and table booking.",
    "contact.phone": "Phone",
    "contact.email": "Email",
    "contact.address": "Address",
    "contact.whatsapp": "Message on WhatsApp",

    "chat.title": "Chat With Reception",
    "chat.subtitle":
      "Chat with {branch}. Ask about food or table availability.",
    "chat.input": "Type your message",
    "chat.send": "Send",
    "chat.widget": "Chat {city}",
    "chat.modal": "Chat - {city}",
    "chat.reply":
      "Thanks for your message to {branch}. Our team will reply soon.",

    "branch.choose": "Choose Your Branch",
    "branch.sub": "Choose a branch to view its menu, chat, and table booking.",
    "branch.label": "Branch",
    "branch.continue": "Continue with {city}",
    "branch.musanze.subtitle": "Fast pickup and mountain-view dining",
    "branch.huye.subtitle": "Late-night lounge and quick table service",
    "branch.huye": "Huye Branch",
    "branch.musanze": "Musanze Branch",

    "footer.copy":
      "© 2026 City Snack Lounge. Crafted for smooth food ordering.",
    "footer.hours": "Open daily: 10:00 AM - 11:00 PM",

    "food.ready": "Ready in about 20-25 min at {branch}.",
    "food.add": "Add to Order",

    /* ════ CART & PAYMENTS ════ */
    "cart.title": "Your Order",
    "cart.empty": "Your cart is empty",
    "cart.emptyHint": "Add items from the menu to get started.",
    "cart.button": "Cart",
    "cart.items": "{count} items",
    "cart.item": "{count} item",
    "cart.total": "Total",
    "cart.pickup": "Pickup",
    "cart.delivery": "Delivery",
    "cart.name": "Your name",
    "cart.phone": "Phone number",
    "cart.address": "Delivery address",
    "cart.notes": "Notes (optional)",
    "cart.placeOrder": "Place Order",
    "cart.placing": "Placing order...",
    "cart.remove": "Remove",
    "cart.close": "Close",
    "cart.orderPlaced": "Order placed!",
    "cart.orderCode": "Your order code",
    "cart.orderSaved": "Reception has been notified. Save your code to track it.",
    "cart.validationError":
      "Please fill in all fields correctly (name min 2 chars, phone min 7 digits).",
    "cart.failedOrder": "Failed to place order",

    "cart.placeOrderMomo": "Place Order & Pay",
    "cart.payment.title": "Payment method",
    "cart.payment.cash": "Cash",
    "cart.payment.cashHint": "Pay on pickup/delivery",
    "cart.payment.momo": "Mobile Money",
    "cart.payment.momoHint": "Pay now with MoMo",
    "cart.momo.title": "Pay with MTN Mobile Money",
    "cart.momo.subtitle": "Follow these 4 steps on your phone",
    "cart.momo.yourOrderCode": "Your Order Code",
    "cart.momo.saveThisCode": "Save this — you'll need it for pickup",
    "cart.momo.step1": "Tap to dial",
    "cart.momo.step2": "Enter the amount",
    "cart.momo.step3": "Verify our name appears",
    "cart.momo.step4": "Enter your MoMo PIN",
    "cart.momo.shouldShow": "MTN will now show you:",
    "cart.momo.verifyNameHelp":
      "If a DIFFERENT name appears, cancel immediately — don't enter your PIN.",
    "cart.momo.amountHint": "Enter exactly {amount} — no more, no less.",
    "cart.momo.enterPin": "Enter your secret MoMo PIN to confirm",
    "cart.momo.copy": "Copy",
    "cart.momo.tapToDial": "Tap to dial now",
    "cart.momo.waiting":
      "Once you've paid, tap the button below. Reception will match your payment by your name and phone number.",
    "cart.momo.iHavePaid": "I have paid — Notify Reception",
    "cart.momo.receptionWillConfirm":
      "We'll match your payment to: {name} ({phone}). Confirmation in a few minutes.",

    "greeting.morning": "Good morning",
    "greeting.afternoon": "Good afternoon",
    "greeting.evening": "Good evening",
    "common.all": "All",
    "common.close": "Close",
    "common.logout": "Log Out",
    "common.reopen": "Reopen",
    "common.delete": "Delete",
    "common.cancel": "Cancel",
    "common.send": "Send",
    "common.yesDelete": "Yes, delete",
    "common.shown": "shown",
    "common.total": "Total",
    "common.at": "at",
    "common.received": "Received",

    "reception.portal": "Reception Portal",
    "reception.console": "Daily Service Console",
    "reception.receptionist": "Receptionist",
    "reception.customerView": "Customer View",
    "reception.branchLocked": "Locked to your branch",
    "reception.nav.overview": "Overview",
    "reception.nav.chats": "Chat Inbox",
    "reception.nav.reservations": "Reservations",
    "reception.nav.orders": "Orders",
    "reception.nav.deliveries": "Deliveries",
    "reception.section.messages": "Messages",
    "reception.section.bookings": "Bookings",
    "reception.section.kitchen": "Kitchen",
    "reception.section.dispatch": "Dispatch",
    "reception.overview.subtitle":
      "Here's a calm view of everything happening at your branch right now.",
    "reception.overview.openChats": "Open Chat Inbox",
    "reception.overview.viewReservations": "View Reservations",
    "reception.overview.viewOrders": "View Orders",
    "reception.overview.liveSnapshot": "Live Snapshot",
    "reception.stat.messages": "Messages",
    "reception.stat.messagesHint": "New unread conversations",
    "reception.stat.reservations": "Reservations",
    "reception.stat.reservationsHint": "Bookings awaiting confirmation",
    "reception.stat.kitchen": "Kitchen",
    "reception.stat.kitchenHint": "Orders being prepared",
    "reception.stat.dispatch": "Dispatch",
    "reception.stat.dispatchHint": "Deliveries in transit",

    "chat.inbox.title": "Chat Inbox",
    "chat.inbox.subtitle": "Every conversation waiting for your warm reply.",
    "chat.search.placeholder": "Search conversations...",
    "chat.purge": "Purge old closed",
    "chat.conversations": "Conversations",
    "chat.noMessages": "No messages yet",
    "chat.status.new": "New",
    "chat.status.active": "Active",
    "chat.status.closed": "Closed",
    "chat.status.newConv": "New conversation",
    "chat.confirm.deleteTitle": "Delete this conversation?",
    "chat.confirm.deleteBody": "This cannot be undone.",
    "chat.confirm.purge": "Delete all closed conversations older than 7 days?",
    "chat.toast.closed": "Conversation closed",
    "chat.toast.reopened": "Conversation reopened",
    "chat.toast.deleted": "Conversation deleted",
    "chat.toast.purged": "Old closed chats purged",
    "chat.reply.placeholder": "Type your reply...",
    "chat.closedNotice": "This conversation is closed. Reopen it to reply.",
    "chat.selectPrompt": "Select a conversation",
    "chat.selectHint": "Choose a chat from the list to begin.",
    "chat.empty.search": "No matches",
    "chat.empty.none": "No conversations here",
    "chat.empty.searchHint": "Try a different search.",
    "chat.empty.filterHint": "Try another filter.",

    "res.title": "Reservations",
    "res.subtitle":
      "Table bookings from customers will appear here in real time.",
    "res.search.placeholder": "Search name, phone, or date...",
    "res.date": "Reservation date",
    "res.party": "Party size",
    "res.guest": "guest",
    "res.guests": "guests",
    "res.status.pending": "Pending",
    "res.status.confirmed": "Confirmed",
    "res.status.seated": "Seated",
    "res.status.cancelled": "Cancelled",
    "res.action.confirm": "Confirm",
    "res.action.seat": "Mark Seated",
    "res.confirm.delete": "Delete this reservation permanently?",
    "res.toast.pending": "Reservation marked as pending",
    "res.toast.confirmed": "Reservation confirmed",
    "res.toast.seated": "Guest marked as seated",
    "res.toast.cancelled": "Reservation cancelled",
    "res.toast.deleted": "Reservation deleted",
    "res.empty.search": "No matching reservations",
    "res.empty.none": "No reservations here",
    "res.empty.searchHint": "Try a different search.",
    "res.empty.noneHint": "New table bookings will appear here in real time.",

    "order.title": "Orders",
    "order.subtitle": "Update order progress for kitchen and dispatch.",
    "order.type.delivery": "Delivery",
    "order.type.pickup": "Pickup",
    "order.status.new": "New",
    "order.status.preparing": "Preparing",
    "order.status.ready": "Ready",
    "order.status.outForDelivery": "Out for Delivery",
    "order.status.delivered": "Delivered",
    "order.status.cancelled": "Cancelled",
    "order.status.awaitingPayment": "Awaiting Payment",
    "order.action.moveTo": "Move to",
    "order.action.print": "Print",
    "order.action.printDelivery": "Print delivery info",
    "order.confirm.cancel": "Cancel order {code}?",
    "order.confirm.delete": "Delete order {code}?",
    "order.toast.cancelled": "Order cancelled",
    "order.toast.deleted": "Order deleted",
    "order.empty.none": "No orders here",
    "order.empty.hint": "New orders will appear here in real time.",

    "delivery.title": "Deliveries",
    "delivery.subtitle": "Orders currently on their way to customers.",
    "delivery.onTheWay": "On The Way",
    "delivery.markDelivered": "Mark as Delivered",
    "delivery.toast.delivered": "delivered",
    "delivery.empty.none": "No active deliveries",
    "delivery.empty.hint":
      "Orders marked \"out for delivery\" will appear here.",
  },

  /* ═══════════════════════════════════════════════════════
     FRENCH
  ═══════════════════════════════════════════════════════ */
  fr: {
    "lang.english": "Anglais",
    "lang.french": "Français",
    "lang.kinyarwanda": "Kinyarwanda",

    "nav.home": "Accueil",
    "nav.menu": "Menu",
    "nav.reserve": "Réserver",
    "nav.reviews": "Avis",
    "nav.contact": "Contact",
    "nav.chat": "Chat",
    "nav.changeBranch": "Changer de branche",
    "nav.branch": "Branche : {branch}",

    "home.title": "Commandez facilement à {branch}.",
    "home.subtitle":
      "Choisissez vos plats, discutez avec notre équipe ou réservez une table en quelques clics.",
    "home.browseMenu": "Voir le Menu Complet",
    "home.chat": "Discutez Avec Nous",
    "home.reserveTable": "Réserver une Table",

    "home.services.eyebrow": "Ce que nous offrons",
    "home.services.title": "Pensé pour votre façon de dîner",
    "home.services.dineIn.title": "Sur Place",
    "home.services.dineIn.desc":
      "Profitez de notre ambiance chaleureuse avec un service attentif.",
    "home.services.delivery.title": "Livraison",
    "home.services.delivery.desc":
      "De notre cuisine à votre porte en moins de 40 minutes.",
    "home.services.pickup.title": "À Emporter",
    "home.services.pickup.desc":
      "Commandez à l'avance et évitez l'attente. Prêt à votre arrivée.",
    "home.services.reservations.title": "Réservations",
    "home.services.reservations.desc":
      "Réservez votre table en quelques secondes pour toute occasion.",

    "home.stats.guests": "Clients Satisfaits",
    "home.stats.menuItems": "Plats au Menu",
    "home.stats.rating": "Note Google",
    "home.stats.prepTime": "Temps Moyen",

    "home.gallery.eyebrow": "Moments de notre cuisine",
    "home.gallery.title": "Un avant-goût de l'expérience",

    "home.testimonials.eyebrow": "Adoré par nos clients",
    "home.testimonials.title": "Ce que disent nos clients",
    "home.testimonials.subtitle":
      "De vraies histoires de vrais clients. Vous avez vécu une belle expérience ? Partagez-la avec nous.",
    "home.testimonials.writeReview": "Écrire un Avis",
    "home.testimonials.seeAll": "Voir tous les avis →",
    "home.testimonials.shareExperience": "Partagez Votre Expérience",
    "home.testimonials.review1.quote":
      "La nourriture était incroyable et le personnel nous a fait sentir comme chez nous. La meilleure expérience culinaire en ville.",
    "home.testimonials.review1.role": "Client régulier",
    "home.testimonials.review2.quote":
      "Livraison rapide, plats chauds et emballage soigné. City Snack ne déçoit jamais.",
    "home.testimonials.review2.role": "Client livraison",
    "home.testimonials.review3.quote":
      "Endroit parfait pour un dîner en famille. Ambiance chaleureuse, grand choix de plats, prix raisonnables.",
    "home.testimonials.review3.role": "Dîner en famille",

    "home.cta.eyebrow": "Réservations ouvertes",
    "home.cta.title": "Rejoignez-nous à {branch}",
    "home.cta.subtitle":
      "Réservez votre table et laissez-nous nous occuper du reste.",
    "home.cta.viewMenu": "Voir le Menu",
    "home.hero.scroll": "Défiler",

    "home.popular": "Les Plus Commandés Ce Soir",
    "home.popularSub": "Plats populaires à {branch} en ce moment.",
    "home.hours": "Ouvert tous les jours : 10h00 - 23h00",
    "home.tagline": "Là Où la Saveur Rencontre l'Ambiance",
    "home.openNow": "Ouvert",
    "home.closedNow": "Fermé",
    "home.orderNow": "Commander",
    "home.viewMenu": "Voir le Menu",
    "home.stat1": "Clients Satisfaits",
    "home.stat2": "Plats au Menu",
    "home.stat3": "Années de Service",
    "home.stat4": "Commandes Quotidiennes",
    "home.whyTitle": "Pourquoi Nous Choisir",
    "home.whySub": "Des moments soignés, à chaque visite",
    "home.why1Title": "Ingrédients Frais",
    "home.why1Desc": "Approvisionnés quotidiennement auprès des agriculteurs rwandais",
    "home.why2Title": "Service Rapide",
    "home.why2Desc": "De la commande à la table en 20 minutes",
    "home.why3Title": "Ambiance Chaleureuse",
    "home.why3Desc": "Un espace convivial pour chaque occasion",
    "home.why4Title": "Chefs Qualifiés",
    "home.why4Desc": "Des mains expertes pour chaque assiette",
    "home.ctaTitle": "Prêt à goûter l'expérience ?",
    "home.ctaSub": "Réservez votre table ou commandez en ligne aujourd'hui.",

    "menu.description":
      "Voici le menu de {branch}. Utilisez la recherche et les catégories pour trouver rapidement.",
    "menu.search": "Rechercher un plat",
    "menu.all": "Tout",
    "menu.meals": "Repas",
    "menu.drinks": "Boissons",
    "menu.desserts": "Desserts",

    /* ════ RESERVATIONS SECTION ════ */
    "reservation.title": "Réserver une Table {branch}",
    "reservation.subtitle":
      "Réservez une table à {branch}. Choisissez la date, l'heure et le nombre de personnes.",
    "reservation.name": "Nom complet",
    "reservation.phone": "Numéro de téléphone",
    "reservation.guests": "Nombre de personnes",
    "reservation.submit": "Confirmer la Réservation",
    "reservation.success":
      "Votre réservation pour {branch} a été reçue. Nous vous contacterons bientôt.",
    "reservation.eyebrow": "Réservez Votre Table",

    "reservation.info.heading": "Une place vous attend.",
    "reservation.info.subheading":
      "Que ce soit un dîner tranquille ou une soirée animée, tout sera prêt avant votre arrivée.",
    "reservation.info.openDailyLabel": "OUVERT TOUS LES JOURS",
    "reservation.info.openDailyValue": "10h00 – 23h00",
    "reservation.info.helpLabel": "BESOIN D'AIDE ?",
    "reservation.info.helpValue": "Appelez-nous pour les grands groupes (10+)",
    "reservation.info.confirmationLabel": "CONFIRMATION",
    "reservation.info.confirmationValue":
      "Vous recevrez une confirmation sous peu",
    "reservation.info.bookingFor": "Réservation pour {branch}",

    "reservation.form.heading": "Vos coordonnées",
    "reservation.form.allRequired": "Tous les champs sont obligatoires",
    "reservation.form.depositNote":
      "Un acompte de {amount} peut être demandé pour les grands groupes.",
    "reservation.form.policy":
      "En réservant, vous acceptez notre politique de réservation.",
    "reservation.form.errorFallback": "Échec de la soumission de la réservation",
    "reservation.namePlaceholder": "ex. Sarah Uwimana",
    "reservation.date": "DATE",
    "reservation.time": "HEURE",
    "reservation.submitting": "Envoi en cours...",

    /* ════ REVIEWS SECTION ════ */
    "reviews.eyebrow": "EXPÉRIENCES DES CLIENTS",
    "reviews.title": "Moments à {branch}",
    "reviews.subtitle":
      "De vraies histoires de vrais clients — chaque avis nous aide à mieux vous servir.",
    "reviews.latestFeedback": "DERNIERS AVIS",
    "reviews.recentReviews": "Avis Récents",
    "reviews.writeFirst": "Écrire le Premier Avis",
    "reviews.writeReview": "Écrire un Avis",
    "reviews.empty": "Aucun avis pour le moment",

    /* ════ CONTACT & CHAT ════ */
    "contact.title": "Contact & Localisation",
    "contact.subtitle":
      "Contactez {branch} pour vos commandes et réservations.",
    "contact.phone": "Téléphone",
    "contact.email": "E-mail",
    "contact.address": "Adresse",
    "contact.whatsapp": "Message sur WhatsApp",

    "chat.title": "Chat Avec la Réception",
    "chat.subtitle":
      "Discutez avec {branch}. Renseignez-vous sur les plats ou la disponibilité des tables.",
    "chat.input": "Tapez votre message",
    "chat.send": "Envoyer",
    "chat.widget": "Chat {city}",
    "chat.modal": "Chat - {city}",
    "chat.reply":
      "Merci pour votre message à {branch}. Notre équipe vous répondra bientôt.",

    "branch.choose": "Choisissez Votre Branche",
    "branch.sub":
      "Choisissez une branche pour voir son menu, discuter et réserver.",
    "branch.label": "Branche",
    "branch.continue": "Continuer avec {city}",
    "branch.musanze.subtitle":
      "Retrait rapide et repas avec vue sur les montagnes",
    "branch.huye.subtitle":
      "Salon nocturne et service de table rapide",
    "branch.huye": "Branche de Huye",
    "branch.musanze": "Branche de Musanze",

    "footer.copy":
      "© 2026 City Snack Lounge. Conçu pour une commande fluide.",
    "footer.hours": "Ouvert tous les jours : 10h00 - 23h00",

    "food.ready": "Prêt en 20-25 min environ à {branch}.",
    "food.add": "Ajouter à la Commande",

    /* ════ CART & PAYMENTS ════ */
    "cart.title": "Votre Commande",
    "cart.empty": "Votre panier est vide",
    "cart.emptyHint": "Ajoutez des articles du menu pour commencer.",
    "cart.button": "Panier",
    "cart.items": "{count} articles",
    "cart.item": "{count} article",
    "cart.total": "Total",
    "cart.pickup": "À emporter",
    "cart.delivery": "Livraison",
    "cart.name": "Votre nom",
    "cart.phone": "Numéro de téléphone",
    "cart.address": "Adresse de livraison",
    "cart.notes": "Notes (facultatif)",
    "cart.placeOrder": "Passer la Commande",
    "cart.placing": "Envoi de la commande...",
    "cart.remove": "Retirer",
    "cart.close": "Fermer",
    "cart.orderPlaced": "Commande passée !",
    "cart.orderCode": "Votre code de commande",
    "cart.orderSaved":
      "La réception a été notifiée. Conservez votre code pour le suivi.",
    "cart.validationError":
      "Veuillez remplir correctement tous les champs (nom min 2 caractères, téléphone min 7 chiffres).",
    "cart.failedOrder": "Échec de la commande",

    "cart.placeOrderMomo": "Commander & Payer",
    "cart.payment.title": "Méthode de paiement",
    "cart.payment.cash": "Espèces",
    "cart.payment.cashHint": "Payez à la livraison",
    "cart.payment.momo": "Mobile Money",
    "cart.payment.momoHint": "Payez maintenant",
    "cart.momo.title": "Payer avec MTN Mobile Money",
    "cart.momo.subtitle": "Suivez ces 4 étapes sur votre téléphone",
    "cart.momo.yourOrderCode": "Votre Code de Commande",
    "cart.momo.saveThisCode":
      "Gardez-le — vous en aurez besoin pour le retrait",
    "cart.momo.step1": "Appuyer pour composer",
    "cart.momo.step2": "Entrez le montant",
    "cart.momo.step3": "Vérifiez notre nom",
    "cart.momo.step4": "Entrez votre PIN MoMo",
    "cart.momo.shouldShow": "MTN va maintenant afficher :",
    "cart.momo.verifyNameHelp":
      "Si un nom DIFFÉRENT apparaît, annulez immédiatement — n'entrez pas votre PIN.",
    "cart.momo.amountHint": "Entrez exactement {amount} — ni plus, ni moins.",
    "cart.momo.enterPin": "Entrez votre PIN MoMo secret pour confirmer",
    "cart.momo.copy": "Copier",
    "cart.momo.tapToDial": "Appuyer pour composer",
    "cart.momo.waiting":
      "Une fois payé, appuyez sur le bouton. La réception vérifiera votre paiement par votre nom et téléphone.",
    "cart.momo.iHavePaid": "J'ai payé — Notifier la Réception",
    "cart.momo.receptionWillConfirm":
      "Nous vérifierons votre paiement pour : {name} ({phone}). Confirmation sous peu.",

    "greeting.morning": "Bonjour",
    "greeting.afternoon": "Bon après-midi",
    "greeting.evening": "Bonsoir",
    "common.all": "Tout",
    "common.close": "Fermer",
    "common.logout": "Déconnexion",
    "common.reopen": "Rouvrir",
    "common.delete": "Supprimer",
    "common.cancel": "Annuler",
    "common.send": "Envoyer",
    "common.yesDelete": "Oui, supprimer",
    "common.shown": "affichés",
    "common.total": "Total",
    "common.at": "à",
    "common.received": "Reçu le",

    "reception.portal": "Portail Réception",
    "reception.console": "Console de Service Quotidien",
    "reception.receptionist": "Réceptionniste",
    "reception.customerView": "Vue Client",
    "reception.branchLocked": "Verrouillé sur votre branche",
    "reception.nav.overview": "Aperçu",
    "reception.nav.chats": "Boîte de Chat",
    "reception.nav.reservations": "Réservations",
    "reception.nav.orders": "Commandes",
    "reception.nav.deliveries": "Livraisons",
    "reception.section.messages": "Messages",
    "reception.section.bookings": "Réservations",
    "reception.section.kitchen": "Cuisine",
    "reception.section.dispatch": "Expédition",
    "reception.overview.subtitle":
      "Voici un aperçu calme de tout ce qui se passe dans votre branche.",
    "reception.overview.openChats": "Ouvrir la Boîte de Chat",
    "reception.overview.viewReservations": "Voir les Réservations",
    "reception.overview.viewOrders": "Voir les Commandes",
    "reception.overview.liveSnapshot": "Aperçu en Direct",
    "reception.stat.messages": "Messages",
    "reception.stat.messagesHint": "Nouvelles conversations non lues",
    "reception.stat.reservations": "Réservations",
    "reception.stat.reservationsHint": "Réservations en attente de confirmation",
    "reception.stat.kitchen": "Cuisine",
    "reception.stat.kitchenHint": "Commandes en préparation",
    "reception.stat.dispatch": "Expédition",
    "reception.stat.dispatchHint": "Livraisons en cours",

    "chat.inbox.title": "Boîte de Chat",
    "chat.inbox.subtitle":
      "Chaque conversation en attente de votre réponse chaleureuse.",
    "chat.search.placeholder": "Rechercher des conversations...",
    "chat.purge": "Purger les anciens fermés",
    "chat.conversations": "Conversations",
    "chat.noMessages": "Aucun message pour le moment",
    "chat.status.new": "Nouveau",
    "chat.status.active": "Actif",
    "chat.status.closed": "Fermé",
    "chat.status.newConv": "Nouvelle conversation",
    "chat.confirm.deleteTitle": "Supprimer cette conversation ?",
    "chat.confirm.deleteBody": "Cette action est irréversible.",
    "chat.confirm.purge":
      "Supprimer toutes les conversations fermées de plus de 7 jours ?",
    "chat.toast.closed": "Conversation fermée",
    "chat.toast.reopened": "Conversation rouverte",
    "chat.toast.deleted": "Conversation supprimée",
    "chat.toast.purged": "Anciens chats fermés purgés",
    "chat.reply.placeholder": "Tapez votre réponse...",
    "chat.closedNotice":
      "Cette conversation est fermée. Rouvrez-la pour répondre.",
    "chat.selectPrompt": "Sélectionnez une conversation",
    "chat.selectHint": "Choisissez un chat dans la liste pour commencer.",
    "chat.empty.search": "Aucun résultat",
    "chat.empty.none": "Aucune conversation ici",
    "chat.empty.searchHint": "Essayez une autre recherche.",
    "chat.empty.filterHint": "Essayez un autre filtre.",

    "res.title": "Réservations",
    "res.subtitle":
      "Les réservations de tables apparaîtront ici en temps réel.",
    "res.search.placeholder": "Rechercher nom, téléphone ou date...",
    "res.date": "Date de réservation",
    "res.party": "Taille du groupe",
    "res.guest": "invité",
    "res.guests": "invités",
    "res.status.pending": "En attente",
    "res.status.confirmed": "Confirmée",
    "res.status.seated": "Installé",
    "res.status.cancelled": "Annulée",
    "res.action.confirm": "Confirmer",
    "res.action.seat": "Marquer Installé",
    "res.confirm.delete": "Supprimer définitivement cette réservation ?",
    "res.toast.pending": "Réservation marquée en attente",
    "res.toast.confirmed": "Réservation confirmée",
    "res.toast.seated": "Client marqué comme installé",
    "res.toast.cancelled": "Réservation annulée",
    "res.toast.deleted": "Réservation supprimée",
    "res.empty.search": "Aucune réservation correspondante",
    "res.empty.none": "Aucune réservation ici",
    "res.empty.searchHint": "Essayez une autre recherche.",
    "res.empty.noneHint":
      "Les nouvelles réservations apparaîtront ici en temps réel.",

    "order.title": "Commandes",
    "order.subtitle":
      "Mettez à jour la progression des commandes pour la cuisine et l'expédition.",
    "order.type.delivery": "Livraison",
    "order.type.pickup": "À emporter",
    "order.status.new": "Nouveau",
    "order.status.preparing": "En préparation",
    "order.status.ready": "Prêt",
    "order.status.outForDelivery": "En cours de livraison",
    "order.status.delivered": "Livré",
    "order.status.cancelled": "Annulé",
    "order.status.awaitingPayment": "En attente de paiement",
    "order.action.moveTo": "Déplacer vers",
    "order.action.print": "Imprimer",
    "order.action.printDelivery": "Imprimer les infos de livraison",
    "order.confirm.cancel": "Annuler la commande {code} ?",
    "order.confirm.delete": "Supprimer la commande {code} ?",
    "order.toast.cancelled": "Commande annulée",
    "order.toast.deleted": "Commande supprimée",
    "order.empty.none": "Aucune commande ici",
    "order.empty.hint":
      "Les nouvelles commandes apparaîtront ici en temps réel.",

    "delivery.title": "Livraisons",
    "delivery.subtitle": "Commandes actuellement en route vers les clients.",
    "delivery.onTheWay": "En Route",
    "delivery.markDelivered": "Marquer comme Livré",
    "delivery.toast.delivered": "livré",
    "delivery.empty.none": "Aucune livraison active",
    "delivery.empty.hint":
      "Les commandes marquées « en cours de livraison » apparaîtront ici.",
  },

  /* ═══════════════════════════════════════════════════════
     KINYARWANDA
  ═══════════════════════════════════════════════════════ */
  rw: {
    "lang.english": "Icyongereza",
    "lang.french": "Igifaransa",
    "lang.kinyarwanda": "Ikinyarwanda",

    "nav.home": "Ahabanza",
    "nav.menu": "Ibikubiyemo",
    "nav.reserve": "Bookinga",
    "nav.reviews": "Ibitekerezo",
    "nav.contact": "Uko Watubona",
    "nav.chat": "Ganira",
    "nav.changeBranch": "Hindura ishami",
    "nav.branch": "Ishami: {branch}",

    "home.title": "Gutumiza ibiryo biroroshye kuri {branch}.",
    "home.subtitle":
      "Hitamo ibiryo byawe, ganira n'itsinda ryacu, cyangwa bookinga ameza mu masegonda make.",
    "home.browseMenu": "Reba Menu Yose",
    "home.chat": "Ganira Natwe",
    "home.reserveTable": "Bookinga Ameza",

    "home.services.eyebrow": "Ibyo dutanga",
    "home.services.title": "Biteguwe uko urya",
    "home.services.dineIn.title": "Kurya Aho",
    "home.services.dineIn.desc":
      "Ishimire ikirere cyiza ndetse na service nziza kandi zinoze.",
    "home.services.delivery.title": "Kubigezwaho",
    "home.services.delivery.desc":
      "Biva mu gikoni cyacu bikagera ku muryango wawe mu minota itarenze 40.",
    "home.services.pickup.title": "Kuza Kubifata",
    "home.services.pickup.desc":
      "Tumiza mbere wirinde gutegereza.Uze usanga biteguye.",
    "home.services.reservations.title": "Booking",
    "home.services.reservations.desc":
      "Bookinga ameza yawe mu masegonda make ku mpamvu iyo ari yo yose.",

    "home.stats.guests": "Abashyitsi Bashimye",
    "home.stats.menuItems": "Ibiryo ku Menu",
    "home.stats.rating": "Amanota ya Google",
    "home.stats.prepTime": "Igihe Gisanzwe",

    "home.gallery.eyebrow": "Amashusho yo mu gikoni cyacu",
    "home.gallery.title": "Uburyohe bw'icyitegererezo",

    "home.testimonials.eyebrow": "Bikundwa n'abashyitsi bacu",
    "home.testimonials.title": "Ibyo abantu bavuga",
    "home.testimonials.subtitle":
      "Inkuru z'ukuri z'abashyitsi nyabo. Wagize uburambe bwiza? Twishimiye kumva ubwawe.",
    "home.testimonials.writeReview": "Andika Igitekerezo",
    "home.testimonials.seeAll": "Reba ibitekerezo byose →",
    "home.testimonials.shareExperience": "Sangira Uburambe Bwawe",
    "home.testimonials.review1.quote":
      "Ibiryo byari bitangaje kandi abakozi badutumye twumva turi mu rugo. Uburambe bwiza bwo kurya mu mujyi.",
    "home.testimonials.review1.role": "Umushyitsi uhoraho",
    "home.testimonials.review2.quote":
      "Kubigezwaho byihuse, ibiryo bishyushye, n'ibipfunyika ni byiza. City Snack ntigusha abakiriya.",
    "home.testimonials.review2.role": "Umukiriya wo kubigezwaho",
    "home.testimonials.review3.quote":
      "Ahantu heza ho gusangira n'umuryango. Ikirere cyiza, menu nini, n'ibiciro byiza.",
    "home.testimonials.review3.role": "Umuryango usangira",

    "home.cta.eyebrow": "Booking zirafunguye",
    "home.cta.title": "Injira natwe kuri {branch}",
    "home.cta.subtitle":
      "Bookinga ameza yawe kandi tuzite ku bindi byose.",
    "home.cta.viewMenu": "Reba Menu",
    "home.hero.scroll": "Manura",

    "home.popular": "Ibitumizwa Cyane Uyu Mugoroba",
    "home.popularSub": "Ibiryo bikunzwe kuri {branch} ubu.",
    "home.hours": "Dufungura buri munsi: 10:00 - 23:00",
    "home.tagline": "Aho Uburyohe Buhurira n'Ikirere",
    "home.openNow": "Turafunguye",
    "home.closedNow": "Twarafunze",
    "home.orderNow": "Tumiza Ubu",
    "home.viewMenu": "Reba Menu",
    "home.stat1": "Abakiriya Bashimye",
    "home.stat2": "Ibiryo ku Menu",
    "home.stat3": "Imyaka y'Ubunararibonye",
    "home.stat4": "Amatumizo ya Buri Munsi",
    "home.whyTitle": "Kuki Wahitamo Twe",
    "home.whySub": "Ibihe byateguwe neza, buri gusura",
    "home.why1Title": "Ibikoresho Bishya",
    "home.why1Desc": "Biva ku bahinzi b'Abanyarwanda buri munsi",
    "home.why2Title": "Serivisi Yihuse",
    "home.why2Desc": "Kuva ku itumizo kugeza ku meza mu minota 20",
    "home.why3Title": "Ikirere Gishyushye",
    "home.why3Desc": "Ahantu heza ho kwishimira ku mpamvu iyo ari yo yose",
    "home.why4Title": "Abateka B'inzobere",
    "home.why4Desc": "Amaboko y'abahanga ategura buri sahani",
    "home.ctaTitle": "Witeguye kumva uburambe?",
    "home.ctaSub": "Bookinga ameza yawe cyangwa utumize kuri interineti uyu munsi.",

    "menu.description":
      "Iyi ni menu ya {branch}. Koresha gushakisha n'ibyiciro kugira ngo ubone ibiryo byihuse.",
    "menu.search": "Shakisha ibiryo",
    "menu.all": "Byose",
    "menu.meals": "Amafunguro",
    "menu.drinks": "Ibinyobwa",
    "menu.desserts": "Udufunguro",

    /* ════ RESERVATIONS SECTION ════ */
    "reservation.title": "Bookinga Ameza {branch}",
    "reservation.subtitle":
      "Bookinga ameza kuri {branch}. Hitamo itariki, isaha n'umubare w'abashyitsi.",
    "reservation.name": "Amazina yombi",
    "reservation.phone": "Nimero ya telefoni",
    "reservation.guests": "Umubare w'abashyitsi",
    "reservation.submit": "Emeza Booking",
    "reservation.success":
      "Booking yawe kuri {branch} yakiriwe. Turakuvugisha vuba.",
    "reservation.eyebrow": "Bookinga Ameza Yawe",

    "reservation.info.heading": "Intebe iragutegereje.",
    "reservation.info.subheading":
      "Yaba ari ifunguro rya bucece cyangwa ibirori, tuzaba twiteguye mbere y'uko uhagera.",
    "reservation.info.openDailyLabel": "DUKORA BURI MUNSI",
    "reservation.info.openDailyValue": "10:00 – 23:00",
    "reservation.info.helpLabel": "UKENEYE UBUFASHA?",
    "reservation.info.helpValue": "Duhamagare ku matsinda manini (10+)",
    "reservation.info.confirmationLabel": "KWEMEZA",
    "reservation.info.confirmationValue": "Urabona igisubizo vuba",
    "reservation.info.bookingFor": "Booking ya {branch}",

    "reservation.form.heading": "Amakuru yawe",
    "reservation.form.allRequired": "Ibisabwa byose birakenewe",
    "reservation.form.depositNote":
      "Inyongera ya {amount} ishobora gusabwa ku matsinda manini.",
    "reservation.form.policy":
      "Mu kubookinga, wemeye amabwiriza yacu ya booking.",
    "reservation.form.errorFallback": "Kohereza booking ntibyakunze",
    "reservation.namePlaceholder": "urugero: Sarah Uwimana",
    "reservation.date": "ITARIKI",
    "reservation.time": "ISAHA",
    "reservation.submitting": "Kohereza...",

    /* ════ REVIEWS SECTION ════ */
    "reviews.eyebrow": "UBURAMBE BW'ABASHYITSI",
    "reviews.title": "Ibihe kuri {branch}",
    "reviews.subtitle":
      "Inkuru z'ukuri z'abashyitsi nyabo — buri gitekerezo kidufasha kugukorera neza.",
    "reviews.latestFeedback": "IBITEKEREZO BIHERUKA",
    "reviews.recentReviews": "Ibitekerezo Bya Hafi",
    "reviews.writeFirst": "Andika Igitekerezo Cya Mbere",
    "reviews.writeReview": "Andika Igitekerezo",
    "reviews.empty": "Nta bitekerezo biraboneka",

    /* ════ CONTACT & CHAT ════ */
    "contact.title": "Uko Watubona & Aho Tubarizwa",
    "contact.subtitle":
      "Vugana na {branch} kuri delivery ndetse na booking y'ameza.",
    "contact.phone": "Telefoni",
    "contact.email": "Imeri",
    "contact.address": "Aderesi",
    "contact.whatsapp": "Ohereza ubutumwa kuri WhatsApp",

    "chat.title": "Ganira n'Uwakira",
    "chat.subtitle":
      "Ganira na {branch}. Baza ku biryo cyangwa ameza aboneka.",
    "chat.input": "Andika ubutumwa bwawe",
    "chat.send": "Ohereza",
    "chat.widget": "Ganira {city}",
    "chat.modal": "Ganira - {city}",
    "chat.reply":
      "Urakoze ku butumwa bwawe kuri {branch}. Itsinda ryacu rizagusubiza vuba.",

    "branch.choose": "Hitamo Ishami Ryawe",
    "branch.sub":
      "Hitamo ishami kugira ngo urebe menu, uganire, kandi ubookinge ameza.",
    "branch.label": "Ishami",
    "branch.continue": "Komeza na {city}",
    "branch.musanze.subtitle":
      "Gufata byihuse no kurya ureba imisozi",
    "branch.huye.subtitle":
      "Salon y'ijoro na serivisi y'ameza yihuse",
    "branch.huye": "Ishami rya Huye",
    "branch.musanze": "Ishami rya Musanze",

    "footer.copy":
      "© 2026 City Snack Lounge. Yateguwe ku gutumiza ibiryo byoroshye.",
    "footer.hours": "Dufungura buri munsi: 10:00 - 23:00",

    "food.ready": "Biteguye mu minota 20-25 kuri {branch}.",
    "food.add": "Ongeraho ku Itumizo",

    /* ════ CART & PAYMENTS ════ */
    "cart.title": "Itumizo Ryawe",
    "cart.empty": "Agatebo kawe karimo ubusa",
    "cart.emptyHint": "Shyiramo ibintu bivuye kuri menu utangire.",
    "cart.button": "Agatebo",
    "cart.items": "Ibintu {count}",
    "cart.item": "Ikintu {count}",
    "cart.total": "Igiteranyo",
    "cart.pickup": "Kuza kubifata",
    "cart.delivery": "Kubigezwaho",
    "cart.name": "Amazina yawe",
    "cart.phone": "Nimero ya telefoni",
    "cart.address": "Aderesi yo kubigezwaho",
    "cart.notes": "Ibisobanuro (bidateganyijwe)",
    "cart.placeOrder": "Ohereza Itumizo",
    "cart.placing": "Kohereza itumizo...",
    "cart.remove": "Kuraho",
    "cart.close": "Funga",
    "cart.orderPlaced": "Itumizo ryoherejwe!",
    "cart.orderCode": "Kode y'itumizo ryawe",
    "cart.orderSaved":
      "Reception yamenyeshejwe. Bika kode kugira ngo ukurikirane itumizo ryawe.",
    "cart.validationError":
      "Uzuza neza ibisabwa byose (amazina byibura inyuguti 2, telefoni byibura imibare 7).",
    "cart.failedOrder": "Itumizo ntiryagenze neza",

    "cart.placeOrderMomo": "Ohereza & Wishyure",
    "cart.payment.title": "Uburyo bwo kwishyura",
    "cart.payment.cash": "Amafaranga",
    "cart.payment.cashHint": "Wishyure ubufataho",
    "cart.payment.momo": "Mobile Money",
    "cart.payment.momoHint": "Wishyure ubu ukoresheje MoMo",
    "cart.momo.title": "Ishyura ukoresheje MTN Mobile Money",
    "cart.momo.subtitle": "Kurikiza izi ntambwe 4 kuri telefoni yawe",
    "cart.momo.yourOrderCode": "Kode y'Itumizo Ryawe",
    "cart.momo.saveThisCode":
      "Ibike — uzayikenera kugirango ufate itumizo",
    "cart.momo.step1": "Kanda uhamagare",
    "cart.momo.step2": "Andika amafaranga",
    "cart.momo.step3": "Reba niba izina ryacu rigaragara",
    "cart.momo.step4": "Andika PIN yawe ya MoMo",
    "cart.momo.shouldShow": "MTN igiye kwerekana:",
    "cart.momo.verifyNameHelp":
      "Niba HARI IRINDI zina rigaragaye, hagarika ako kanya — ntukande PIN yawe.",
    "cart.momo.amountHint":
      "Andika {amount} nk'uko yanditse — ntusimbuze.",
    "cart.momo.enterPin":
      "Andika PIN yawe y'ibanga ya MoMo kugirango wemeze",
    "cart.momo.copy": "Kopera",
    "cart.momo.tapToDial": "Kanda uhamagare ubu",
    "cart.momo.waiting":
      "Nurangiza kwishyura, kanda buto. Uwakira azahuza ubwishyu bwawe n'izina na numero yawe.",
    "cart.momo.iHavePaid": "Namaze kwishyura — Menyesha Reception",
    "cart.momo.receptionWillConfirm":
      "Tuzahuza ubwishyu bwawe na: {name} ({phone}). Kwemezwa mu minota mike.",

    "greeting.morning": "Mwaramutse",
    "greeting.afternoon": "Mwiriwe",
    "greeting.evening": "Mwiriwe neza",
    "common.all": "Byose",
    "common.close": "Funga",
    "common.logout": "Sohoka",
    "common.reopen": "Fungura ubwa kabiri",
    "common.delete": "Siba",
    "common.cancel": "Komeza ubyihorere",
    "common.send": "Ohereza",
    "common.yesDelete": "Yego, siba",
    "common.shown": "byerekanwe",
    "common.total": "Igiteranyo",
    "common.at": "saa",
    "common.received": "Byakiriwe",

    "reception.portal": "Urubuga rwa Reception",
    "reception.console": "Console ya Serivisi ya Buri Munsi",
    "reception.receptionist": "Uwakira",
    "reception.customerView": "Icyerekezo cy'Umukiriya",
    "reception.branchLocked": "Ifunze ku ishami ryawe",
    "reception.nav.overview": "Incamake",
    "reception.nav.chats": "Ubutumwa",
    "reception.nav.reservations": "Booking",
    "reception.nav.orders": "Amatumizo",
    "reception.nav.deliveries": "Ibigezwaho",
    "reception.section.messages": "Ubutumwa",
    "reception.section.bookings": "Booking",
    "reception.section.kitchen": "Igikoni",
    "reception.section.dispatch": "Kohereza",
    "reception.overview.subtitle":
      "Dore incamake y'ibibera ku ishami ryawe ubu.",
    "reception.overview.openChats": "Fungura Ubutumwa",
    "reception.overview.viewReservations": "Reba Booking",
    "reception.overview.viewOrders": "Reba Amatumizo",
    "reception.overview.liveSnapshot": "Ifoto y'Ako Kanya",
    "reception.stat.messages": "Ubutumwa",
    "reception.stat.messagesHint": "Ibiganiro bishya bitarasomwa",
    "reception.stat.reservations": "Booking",
    "reception.stat.reservationsHint": "Booking zitegereje kwemezwa",
    "reception.stat.kitchen": "Igikoni",
    "reception.stat.kitchenHint": "Amatumizo ari gutegurwa",
    "reception.stat.dispatch": "Kohereza",
    "reception.stat.dispatchHint": "Ibigezwaho biri mu nzira",

    "chat.inbox.title": "Ubutumwa Bwinjira",
    "chat.inbox.subtitle":
      "Buri kiganiro gitegereje igisubizo cyawe cyiza.",
    "chat.search.placeholder": "Shakisha ibiganiro...",
    "chat.purge": "Siba ibyafunzwe kera",
    "chat.conversations": "Ibiganiro",
    "chat.noMessages": "Nta butumwa buraboneka",
    "chat.status.new": "Gishya",
    "chat.status.active": "Gikora",
    "chat.status.closed": "Cyafunzwe",
    "chat.status.newConv": "Ikiganiro gishya",
    "chat.confirm.deleteTitle": "Siba iki kiganiro?",
    "chat.confirm.deleteBody": "Ibi ntibishobora gusubirwamo.",
    "chat.confirm.purge":
      "Siba ibiganiro byose byafunzwe birenze iminsi 7?",
    "chat.toast.closed": "Ikiganiro cyafunzwe",
    "chat.toast.reopened": "Ikiganiro cyafunguwe",
    "chat.toast.deleted": "Ikiganiro cyasibwe",
    "chat.toast.purged": "Ibiganiro bya kera byasibwe",
    "chat.reply.placeholder": "Andika igisubizo cyawe...",
    "chat.closedNotice":
      "Iki kiganiro cyafunzwe. Fungura kugira ngo usubize.",
    "chat.selectPrompt": "Hitamo ikiganiro",
    "chat.selectHint": "Hitamo chat mu rutonde utangire.",
    "chat.empty.search": "Nta bisubizo",
    "chat.empty.none": "Nta biganiro hano",
    "chat.empty.searchHint": "Gerageza gushakisha ukundi.",
    "chat.empty.filterHint": "Gerageza akayunguruzo kandi.",

    "res.title": "Booking",
    "res.subtitle":
      "Booking z'ameza z'abakiriya zizagaragara hano ako kanya.",
    "res.search.placeholder": "Shakisha izina, telefoni, cyangwa itariki...",
    "res.date": "Itariki ya booking",
    "res.party": "Umubare w'abantu",
    "res.guest": "umushyitsi",
    "res.guests": "abashyitsi",
    "res.status.pending": "Itegereje",
    "res.status.confirmed": "Yemejwe",
    "res.status.seated": "Yicaye",
    "res.status.cancelled": "Yasibwe",
    "res.action.confirm": "Emeza",
    "res.action.seat": "Shyira Yicaye",
    "res.confirm.delete": "Siba iyi booking burundu?",
    "res.toast.pending": "Booking yashyizwe mu itegerezo",
    "res.toast.confirmed": "Booking yemejwe",
    "res.toast.seated": "Umushyitsi yashyizwe yicaye",
    "res.toast.cancelled": "Booking yasibwe",
    "res.toast.deleted": "Booking yasibwe",
    "res.empty.search": "Nta booking ihuye",
    "res.empty.none": "Nta booking hano",
    "res.empty.searchHint": "Gerageza gushakisha ukundi.",
    "res.empty.noneHint":
      "Booking nshya z'ameza zizagaragara hano ako kanya.",

    "order.title": "Amatumizo",
    "order.subtitle":
      "Hindura aho itumizo rigeze ku gikoni no kohereza.",
    "order.type.delivery": "Kubigezwaho",
    "order.type.pickup": "Kuza kubifata",
    "order.status.new": "Gishya",
    "order.status.preparing": "Biri gutegurwa",
    "order.status.ready": "Byamaze gutegurwa",
    "order.status.outForDelivery": "Biri mu nzira",
    "order.status.delivered": "Byagejejwe",
    "order.status.cancelled": "Byasibwe",
    "order.status.awaitingPayment": "Bitegereje kwishyurwa",
    "order.action.moveTo": "Imurira kuri",
    "order.action.print": "Capa",
    "order.action.printDelivery": "Capa amakuru yo kugezwaho",
    "order.confirm.cancel": "Siba itumizo {code}?",
    "order.confirm.delete": "Siba itumizo {code}?",
    "order.toast.cancelled": "Itumizo ryasibwe",
    "order.toast.deleted": "Itumizo ryasibwe",
    "order.empty.none": "Nta matumizo hano",
    "order.empty.hint":
      "Amatumizo mashya azagaragara hano ako kanya.",

    "delivery.title": "Ibigezwaho",
    "delivery.subtitle": "Amatumizo ari mu nzira agana ku bakiriya.",
    "delivery.onTheWay": "Mu Nzira",
    "delivery.markDelivered": "Shyira Byagejejwe",
    "delivery.toast.delivered": "byagejejwe",
    "delivery.empty.none": "Nta bintu biri kugezwaho",
    "delivery.empty.hint":
      "Amatumizo yashyizwe « mu nzira » azagaragara hano.",
  },
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, vars?: Record<string, string>) => string;
};

const STORAGE_KEY = "city-snack-language";
const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<Language>(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached === "fr" || cached === "rw" || cached === "en"
      ? (cached as Language)
      : "en";
  });

  // Keep <html lang="..."> attribute updated for SEO and browser accessibility
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => {
    return {
      language,
      setLanguage: (nextLanguage) => {
        localStorage.setItem(STORAGE_KEY, nextLanguage);
        setLanguageState(nextLanguage);
      },
      t: (key, vars) => {
        const template =
          translations[language]?.[key] ?? translations.en?.[key] ?? key;

        if (!vars) return template;

        return Object.entries(vars).reduce((text, [name, valuePart]) => {
          return text.replace(new RegExp(`\\{${name}\\}`, "g"), valuePart);
        }, template);
      },
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}

/* ═══════════════════════════════════════════════════════
   Reception is ALWAYS English — regardless of the
   customer language setting. Use this in reception pages
   instead of useLanguage().
═══════════════════════════════════════════════════════ */
export function useReceptionLanguage() {
  return {
    language: "en" as Language,
    setLanguage: () => {
      /* no-op — reception is locked to English */
    },
    t: (key: string, vars?: Record<string, string>) => {
      const template = translations.en?.[key] ?? key;
      if (!vars) return template;
      return Object.entries(vars).reduce((text, [name, valuePart]) => {
        return text.replace(new RegExp(`\\{${name}\\}`, "g"), valuePart);
      }, template);
    },
  };
}