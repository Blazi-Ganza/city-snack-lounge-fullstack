import { getDb } from "./mongo";

export async function seedDatabase() {
  const db = getDb();

  // ---------- Branches ----------
  const branchesCollection = db.collection("branches");
  if ((await branchesCollection.countDocuments()) === 0) {
    await branchesCollection.insertMany([
      {
        id: "musanze",
        name: "Musanze Branch",
        city: "Musanze",
        subtitle: "Fast pickup and mountain-view dining",
        address: "KN 12 Ave, Muhoza, Musanze",
        phone: "+250 788 120 310",
        email: "musanze@citysnack.rw",
        createdAt: new Date(),
      },
      {
        id: "huye",
        name: "Huye Branch",
        city: "Huye",
        subtitle: "Late-night lounge and quick table service",
        address: "NR 6 Road, Tumba, Huye",
        phone: "+250 788 120 410",
        email: "huye@citysnack.rw",
        createdAt: new Date(),
      },
    ]);
    await branchesCollection.createIndex({ id: 1 }, { unique: true });
  }

  // ---------- Menu ----------
  const menuCollection = db.collection("menu_items");
  if ((await menuCollection.countDocuments()) === 0) {
    await menuCollection.insertMany([
      {
        branchId: "musanze",
        name: "Volcano Grill Chicken",
        category: "Meals",
        description: "Fire-grilled chicken with herb butter and sweet plantain.",
        price: 16.9,
        image:
          "https://images.unsplash.com/photo-1604909052743-94e838986d24?auto=format&fit=crop&w=1200&q=80",
        featured: true,
      },
      {
        branchId: "musanze",
        name: "Passion Mint Cooler",
        category: "Drinks",
        description: "Passion fruit, mint, and sparkling lime over crushed ice.",
        price: 6.5,
        image:
          "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80",
        featured: true,
      },
      {
        branchId: "huye",
        name: "Huye Pepper Steak",
        category: "Meals",
        description: "Sliced steak, roasted potatoes, and black pepper glaze.",
        price: 17.4,
        image:
          "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
        featured: true,
      },
      {
        branchId: "huye",
        name: "Sunset Lemon Fizz",
        category: "Drinks",
        description: "Fresh lemon, hibiscus, and sparkling water.",
        price: 6.1,
        image:
          "https://images.unsplash.com/photo-1551024709-8f23befc6cf7?auto=format&fit=crop&w=1200&q=80",
        featured: true,
      },
    ]);
    await menuCollection.createIndex({ branchId: 1, category: 1 });
  }

  // ---------- Reviews ----------
  const reviewsCollection = db.collection("reviews");
  if ((await reviewsCollection.countDocuments()) === 0) {
    await reviewsCollection.insertMany([
      {
        branchId: "musanze",
        name: "Aline M.",
        rating: 5,
        date: "March 2026",
        comment: "Musanze service is super quick and the grilled chicken is perfect every time.",
      },
      {
        branchId: "huye",
        name: "Diane T.",
        rating: 5,
        date: "March 2026",
        comment: "Huye branch has a calm lounge vibe and excellent desserts.",
      },
    ]);
    await reviewsCollection.createIndex({ branchId: 1 });
  }

  // ---------- Chats (new schema with customerId + messages array) ----------
  const chatsCollection = db.collection("chats");
  if ((await chatsCollection.countDocuments()) === 0) {
    const now = new Date();
    await chatsCollection.insertMany([
      {
        branchId: "musanze",
        customerId: "seed_cust_alice",
        customerName: "Alice M.",
        status: "new",
        messages: [
          { from: "customer", text: "Do you still have vegan pasta?", createdAt: now },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        branchId: "huye",
        customerId: "seed_cust_samuel",
        customerName: "Samuel K.",
        status: "new",
        messages: [
          { from: "customer", text: "Can I change delivery address?", createdAt: now },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ]);
  }

  // ---------- Orders ----------
  const ordersCollection = db.collection("orders");
  if ((await ordersCollection.countDocuments()) === 0) {
    await ordersCollection.insertMany([
      {
        branchId: "musanze",
        customer: "Kevin R.",
        items: "2x Volcano Grill Chicken, 1x Passion Mint Cooler",
        amount: 40.3,
        status: "new",
        createdAt: new Date(),
      },
      {
        branchId: "huye",
        customer: "Belise A.",
        items: "1x Huye Pepper Steak, 1x Sunset Lemon Fizz",
        amount: 23.5,
        status: "preparing",
        createdAt: new Date(),
      },
    ]);
    await ordersCollection.createIndex({ branchId: 1, status: 1 });
  }

  // ---------- Deliveries ----------
  const deliveriesCollection = db.collection("deliveries");
  if ((await deliveriesCollection.countDocuments()) === 0) {
    await deliveriesCollection.insertMany([
      {
        branchId: "musanze",
        rider: "Eric",
        orderRef: "MZ-001",
        area: "Muhoza",
        eta: "12 min",
        status: "assigned",
        createdAt: new Date(),
      },
      {
        branchId: "huye",
        rider: "Merveille",
        orderRef: "HY-001",
        area: "Tumba",
        eta: "8 min",
        status: "on_the_way",
        createdAt: new Date(),
      },
    ]);
    await deliveriesCollection.createIndex({ branchId: 1, status: 1 });
  }
}
