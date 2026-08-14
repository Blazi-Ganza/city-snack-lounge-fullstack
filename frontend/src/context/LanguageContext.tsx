import {
  createContext,
  useContext,
  useMemo,
  useState,
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

    "reservation.title": "Reserve a Table",
    "reservation.subtitle":
      "Book a table at {branch}. Choose date, time, and guests.",
    "reservation.name": "Full name",
    "reservation.phone": "Phone Number",
    "reservation.guests": "Number of Guests",
    "reservation.submit": "Confirm Reservation",
    "reservation.success":
      "Reservation confirmed at {branch}! We'll be in touch shortly.",
    "reservation.eyebrow": "Book Your Table",

    "reviews.title": "Customer Reviews",
    "reviews.subtitle": "What customers say about {branch}.",

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

    "footer.copy":
      "© 2026 City Snack Lounge. Crafted for smooth food ordering.",
    "footer.hours": "Open daily: 10:00 AM - 11:00 PM",

    "food.ready": "Ready in about 20-25 min at {branch}.",
    "food.add": "Add to Order",

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

    /* 🆕 MoMo payment — REAL MTN Rwanda flow
       Order: Tap to dial → Enter amount → Verify NAME → Enter PIN */
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

    /* Reception (English kept identical — reception is always EN) */
    "branch.huye": "Huye Branch",
    "branch.musanze": "Musanze Branch",
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

    "reservation.info.heading": "A seat is waiting for you.",
    "reservation.info.subheading":
      "Whether it's a quiet dinner or a lively gathering, we'll have everything ready before you arrive.",
    "reservation.info.openDailyLabel": "Open Daily",
    "reservation.info.openDailyValue": "10:00 AM – 11:00 PM",
    "reservation.info.helpLabel": "Need help?",
    "reservation.info.helpValue": "Call us for large parties (10+)",
    "reservation.info.confirmationLabel": "Confirmation",
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
    "reservation.date": "Date",
    "reservation.time": "Time",
    "reservation.submitting": "Submitting...",
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
    "nav.branch": "Branche: {branch}",

    "cart.title": "Votre commande",
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
    "cart.placeOrder": "Passer la commande",
    "cart.placing": "Envoi de la commande...",
    "cart.remove": "Retirer",
    "cart.close": "Fermer",
    "cart.orderPlaced": "Commande passée !",
    "cart.orderCode": "Votre code de commande",
    "cart.orderSaved":
      "La réception a été notifiée. Conservez votre code pour suivre votre commande.",
    "cart.validationError":
      "Veuillez remplir correctement tous les champs (nom min 2 caractères, téléphone min 7 chiffres).",
    "cart.failedOrder": "Échec de la commande",

    /* 🆕 MoMo payment (FR) — REAL MTN flow
       Order: Tap to dial → Enter amount → Verify NAME → Enter PIN */
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
      "Gardez-le — vous en aurez besoin pour retirer votre commande",
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
      "Une fois payé, appuyez sur le bouton. La réception fera correspondre votre paiement avec votre nom et téléphone.",
    "cart.momo.iHavePaid": "J'ai payé — Notifier la Réception",
    "cart.momo.receptionWillConfirm":
      "Nous ferons correspondre votre paiement à : {name} ({phone}). Confirmation sous peu.",

    "branch.huye": "Branche de Huye",
    "branch.musanze": "Branche de Musanze",
    "greeting.morning": "Bon matin",
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

    "order.status.new": "Nouveau",
    "order.status.preparing": "Préparation",
    "order.status.ready": "Prêt",
    "order.status.outForDelivery": "En cours de livraison",
    "order.status.delivered": "Livrée",
    "order.status.cancelled": "Annulée",
    "order.status.awaitingPayment": "En attente de paiement",

    "reservation.title": "Réserver une table",
    "reservation.subtitle":
      "Réservez une table à {branch}. Choisissez la date, l'heure et le nombre de personnes.",
    "reservation.name": "Nom complet",
    "reservation.phone": "Numéro de téléphone",
    "reservation.guests": "Nombre de personnes",
    "reservation.submit": "Confirmer la Réservation",
    "reservation.success":
      "Votre réservation pour {branch} a été reçue. Nous vous contacterons bientôt.",
    "reservation.eyebrow": "Réservez Votre Table",
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

    "cart.title": "Ihitamo Ryawe",
    "cart.empty": "Agatebo cyawe kirimo ubusa",
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
    "cart.placeOrder": "Ohereza itumizwa",
    "cart.placing": "Kohereza itumizwa...",
    "cart.remove": "Kuraho",
    "cart.close": "Funga",
    "cart.orderPlaced": "Itumizwa ryoherejwe!",
    "cart.orderCode": "Kode y'itumizwa ryawe",
    "cart.orderSaved":
      "Reception yamenyeshejwe. Bika kode kugira ngo ukurikirane itumizwa ryawe.",
    "cart.validationError":
      "Uzuza neza ibisabwa byose (amazina byibura inyuguti 2, telefoni byibura imibare 7).",
    "cart.failedOrder": "Itumizwa ntiryagenze neza",

    /* 🆕 MoMo payment (RW) — REAL MTN flow
       Order: Tap to dial → Enter amount → Verify NAME → Enter PIN */
    "cart.placeOrderMomo": "Ohereza & Wishyure",
    "cart.payment.title": "Uburyo bwo kwishyura",
    "cart.payment.cash": "Amafaranga",
    "cart.payment.cashHint": "Wishyure ubufataho",
    "cart.payment.momo": "Mobile Money",
    "cart.payment.momoHint": "Wishyure ubu ukoresheje MoMo",
    "cart.momo.title": "Ishyura ukoresheje MTN Mobile Money",
    "cart.momo.subtitle": "Kurikiza izi ntambwe 4 kuri telefoni yawe",
    "cart.momo.yourOrderCode": "Kode y'itumizwa ryawe",
    "cart.momo.saveThisCode": "Ibike — uzayikenera kugirango ufate itumizwa",
    "cart.momo.step1": "Kanda uhamagare",
    "cart.momo.step2": "Andika amafaranga",
    "cart.momo.step3": "Reba niba izina ryacu rigaragara",
    "cart.momo.step4": "Andika PIN yawe ya MoMo",
    "cart.momo.shouldShow": "MTN igiye kwerekana:",
    "cart.momo.verifyNameHelp":
      "Niba HARI IRINDI zina rigaragaye, hagarika ako kanya — ntukande PIN yawe.",
    "cart.momo.amountHint": "Andika {amount} nk'uko yanditse — ntusimbuze.",
    "cart.momo.enterPin": "Andika PIN yawe y'ibanga ya MoMo kugirango wemeze",
    "cart.momo.copy": "Kopera",
    "cart.momo.tapToDial": "Kanda uhamagare ubu",
    "cart.momo.waiting":
      "Nurangiza kwishyura, kanda buto. Uwakira azahuza ubwishyu bwawe n'izina na numero yawe.",
    "cart.momo.iHavePaid": "Namaze kwishyura — Menyesha Reception",
    "cart.momo.receptionWillConfirm":
      "Tuzahuza ubwishyu bwawe na: {name} ({phone}). Kwemezwa mu minota mike.",

    "branch.huye": "Ishami rya Huye",
    "branch.musanze": "Ishami rya Musanze",
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

    "order.status.new": "Gushya",
    "order.status.preparing": "Biri gutegurwa",
    "order.status.ready": "Byamaze gutegurwa",
    "order.status.outForDelivery": "Biri mu nzira",
    "order.status.delivered": "Byagejejwe",
    "order.status.cancelled": "Byasibwe",
    "order.status.awaitingPayment": "Bitegereje kwishyurwa",

    "reservation.title": "Booking Ameza",
    "reservation.subtitle":
      "Booking ameza kuri {branch}. Hitamo itariki, isaha n'umubare w'abashyitsi.",
    "reservation.name": "Amazina",
    "reservation.phone": "Nimero ya telefoni",
    "reservation.guests": "Umubare w'abashyitsi",
    "reservation.submit": "Ohereza kubika",
    "reservation.success":
      "Ku booking ameza byawe kuri {branch} byakiriwe. Turakuvugisha vuba.",
    "reservation.eyebrow": "Booking Ameza Yawe",
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