export type Category = "Meals" | "Drinks" | "Desserts";

export type BranchId = "musanze" | "huye";

export type Branch = {
  id: BranchId;
  name: string;
  city: string;
  subtitle: string;
  address: string;
  phone: string;
  email: string;
  mapEmbedUrl: string;
};

export type FoodItem = {
  id: number;
  name: string;
  category: Category;
  description: string;
  price: number;
  image: string;
  featured?: boolean;
};

export type Review = {
  id: number;
  name: string;
  rating: number;
  date: string;
  comment: string;
};

export const branches: Branch[] = [
  {
    id: "musanze",
    name: "Musanze Branch",
    city: "Musanze",
    subtitle: "Fast pickup and mountain-view dining",
    address: "KN 12 Ave, Muhoza, Musanze",
    phone: "+250 788 120 310",
    email: "musanze@citysnack.rw",
    mapEmbedUrl:
      "https://www.openstreetmap.org/export/embed.html?bbox=29.6200%2C-1.5150%2C29.6550%2C-1.4750&layer=mapnik",
  },
  {
    id: "huye",
    name: "Huye Branch",
    city: "Huye",
    subtitle: "Late-night lounge and quick table service",
    address: "NR 6 Road, Tumba, Huye",
    phone: "+250 788 120 410",
    email: "huye@citysnack.rw",
    mapEmbedUrl:
      "https://www.openstreetmap.org/export/embed.html?bbox=29.7260%2C-2.6200%2C29.7700%2C-2.5650&layer=mapnik",
  },
];

export const branchMenuItems: Record<BranchId, FoodItem[]> = {
  musanze: [
    {
      id: 1,
      name: "Volcano Grill Chicken",
      category: "Meals",
      description: "Fire-grilled chicken with herb butter and sweet plantain.",
      price: 16.9,
      image:
        "https://images.unsplash.com/photo-1604909052743-94e838986d24?auto=format&fit=crop&w=1200&q=80",
      featured: true,
    },
    {
      id: 2,
      name: "Musanze Beef Burger",
      category: "Meals",
      description: "Double beef, cheddar, caramelized onions, and signature sauce.",
      price: 14.8,
      image:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
      featured: true,
    },
    {
      id: 3,
      name: "Garden Pesto Pasta",
      category: "Meals",
      description: "Fresh basil pesto pasta with mushrooms and shaved parmesan.",
      price: 13.7,
      image:
        "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 4,
      name: "Iced Citrus Brew",
      category: "Drinks",
      description: "Cold brew coffee with orange zest and creamy foam.",
      price: 5.9,
      image:
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 5,
      name: "Passion Mint Cooler",
      category: "Drinks",
      description: "Passion fruit, mint, and sparkling lime over crushed ice.",
      price: 6.5,
      image:
        "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80",
      featured: true,
    },
    {
      id: 6,
      name: "Molten Chocolate Cake",
      category: "Desserts",
      description: "Warm dark chocolate center with vanilla bean cream.",
      price: 8.2,
      image:
        "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&w=1200&q=80",
    },
  ],
  huye: [
    {
      id: 101,
      name: "Huye Pepper Steak",
      category: "Meals",
      description: "Sliced steak, roasted potatoes, and black pepper glaze.",
      price: 17.4,
      image:
        "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
      featured: true,
    },
    {
      id: 102,
      name: "Smoked Turkey Club",
      category: "Meals",
      description: "Toasted brioche, turkey, crisp greens, and aioli.",
      price: 13.9,
      image:
        "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80",
      featured: true,
    },
    {
      id: 103,
      name: "Creamy Mushroom Linguine",
      category: "Meals",
      description: "Slow-cooked mushroom sauce with parmesan and cracked pepper.",
      price: 14.6,
      image:
        "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 104,
      name: "Vanilla Iced Latte",
      category: "Drinks",
      description: "Smooth espresso, vanilla cream, and chilled milk.",
      price: 5.4,
      image:
        "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 105,
      name: "Sunset Lemon Fizz",
      category: "Drinks",
      description: "Fresh lemon, hibiscus, and sparkling water.",
      price: 6.1,
      image:
        "https://images.unsplash.com/photo-1551024709-8f23befc6cf7?auto=format&fit=crop&w=1200&q=80",
      featured: true,
    },
    {
      id: 106,
      name: "Berry Cheesecake",
      category: "Desserts",
      description: "Creamy baked cheesecake with berry compote.",
      price: 7.95,
      image:
        "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=1200&q=80",
    },
  ],
};

export const branchReviews: Record<BranchId, Review[]> = {
  musanze: [
    {
      id: 1,
      name: "Aline M.",
      rating: 5,
      date: "March 2026",
      comment: "Musanze service is super quick and the grilled chicken is perfect every time.",
    },
    {
      id: 2,
      name: "Kevin R.",
      rating: 4,
      date: "February 2026",
      comment: "Smooth reservation flow and friendly reception chat response.",
    },
  ],
  huye: [
    {
      id: 3,
      name: "Diane T.",
      rating: 5,
      date: "March 2026",
      comment: "Huye branch has a calm lounge vibe and excellent desserts.",
    },
    {
      id: 4,
      name: "Samuel N.",
      rating: 5,
      date: "January 2026",
      comment: "Very easy ordering and the pepper steak was outstanding.",
    },
  ],
};

export type ChatMessageSeed = {
  id: number;
  from: "customer" | "staff";
  text: string;
  time: string;
};

export function getBranchName(branch: BranchId) {
  return branches.find((item) => item.id === branch)?.name ?? "Selected Branch";
}

export function getBranchData(branch: BranchId) {
  return branches.find((item) => item.id === branch) ?? branches[0];
}
