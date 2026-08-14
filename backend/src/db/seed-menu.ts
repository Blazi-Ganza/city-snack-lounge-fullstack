import { connectMongo } from "./mongo";
import { bulkCreateMenuItems, clearMenuForBranch, ensureMenuIndexes } from "./menu.repo";

/* ═══════════════════════════════════════════════════════
   Menu data — copied from frontend/src/data/menuData.ts
═══════════════════════════════════════════════════════ */

const items: Array<[string, number, string, "Meals" | "Drinks" | "Desserts", string, boolean?]> = [
  // ── TEA ──
  ["Black Tea", 2000, "Tea", "Drinks", "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=800&q=80"],
  ["Green Tea", 2000, "Tea", "Drinks", "https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=80"],
  ["African Tea", 3000, "Tea", "Drinks", "https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?auto=format&fit=crop&w=800&q=80", true],
  ["Spiced Tea", 4000, "Tea", "Drinks", "https://images.unsplash.com/photo-1563911892437-1feda0179e1b?auto=format&fit=crop&w=800&q=80"],
  ["Lemon Tea", 3000, "Tea", "Drinks", "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80"],
  ["English Tea", 4000, "Tea", "Drinks", "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=800&q=80"],
  ["Ginger Tea", 3000, "Tea", "Drinks", "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80"],
  ["Mint Tea", 2500, "Tea", "Drinks", "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&w=800&q=80"],
  ["Hot Milk", 2000, "Tea", "Drinks", "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80"],
  ["Hot Chocolate", 4000, "Tea", "Drinks", "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=800&q=80", true],

  // ── COFFEE ──
  ["Espresso Single", 1500, "Coffee", "Drinks", "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?auto=format&fit=crop&w=800&q=80"],
  ["Double Espresso", 2000, "Coffee", "Drinks", "https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?auto=format&fit=crop&w=800&q=80"],
  ["Café Latte", 3000, "Coffee", "Drinks", "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=800&q=80", true],
  ["Café Macchiato", 2500, "Coffee", "Drinks", "https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=800&q=80"],
  ["Cortado", 3000, "Coffee", "Drinks", "https://images.unsplash.com/photo-1611564494260-6f21b80af7ea?auto=format&fit=crop&w=800&q=80"],
  ["Café Mocha", 4000, "Coffee", "Drinks", "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=800&q=80"],
  ["Cappuccino", 3000, "Coffee", "Drinks", "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=80", true],
  ["Americano", 2500, "Coffee", "Drinks", "https://images.unsplash.com/photo-1551030173-122aabc4489c?auto=format&fit=crop&w=800&q=80"],
  ["Flat White", 3000, "Coffee", "Drinks", "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=800&q=80"],
  ["Black Coffee", 2500, "Coffee", "Drinks", "https://images.unsplash.com/photo-1559496417-e7f25cb247f3?auto=format&fit=crop&w=800&q=80"],
  ["African Coffee", 4000, "Coffee", "Drinks", "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80", true],
  ["Affogato", 3500, "Coffee", "Drinks", "https://images.unsplash.com/photo-1530373239216-42518e6b4063?auto=format&fit=crop&w=800&q=80"],

  // ── SMOOTHIES ──
  ["Mango Smoothie", 5000, "Smoothies", "Drinks", "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=800&q=80", true],
  ["Banana Smoothie", 5000, "Smoothies", "Drinks", "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80"],
  ["Avocado Smoothie", 5000, "Smoothies", "Drinks", "https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?auto=format&fit=crop&w=800&q=80"],
  ["Banana & Strawberry Smoothie", 6000, "Smoothies", "Drinks", "https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=800&q=80"],
  ["Mango & Banana Smoothie", 6000, "Smoothies", "Drinks", "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=800&q=80"],
  ["Banana & Avocado Smoothie", 6000, "Smoothies", "Drinks", "https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=800&q=80"],
  ["City Snack Smoothie", 6500, "Smoothies", "Drinks", "https://images.unsplash.com/photo-1502741224143-90386d7f8c82?auto=format&fit=crop&w=800&q=80", true],

  // ── MILKSHAKES ──
  ["Vanilla Milkshake", 6000, "Milkshakes", "Drinks", "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80"],
  ["Chocolate Milkshake", 6000, "Milkshakes", "Drinks", "https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=800&q=80", true],
  ["Strawberry Milkshake", 6000, "Milkshakes", "Drinks", "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=800&q=80"],
  ["Caramel Milkshake", 6000, "Milkshakes", "Drinks", "https://images.unsplash.com/photo-1568901839119-631418a3910d?auto=format&fit=crop&w=800&q=80"],
  ["Mixed Milkshake", 7000, "Milkshakes", "Drinks", "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80"],
  ["City Snack Milkshake", 6500, "Milkshakes", "Drinks", "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=800&q=80", true],

  // ── LEMONADES ──
  ["Plain Lemonade", 3500, "Lemonades", "Drinks", "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=800&q=80"],
  ["Passion Lemonade", 4000, "Lemonades", "Drinks", "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80"],
  ["Pineapple Lemonade", 4000, "Lemonades", "Drinks", "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=800&q=80"],
  ["Pink Lemonade", 4000, "Lemonades", "Drinks", "https://images.unsplash.com/photo-1560508180-03f285f67ded?auto=format&fit=crop&w=800&q=80"],
  ["Mango Lemonade", 4000, "Lemonades", "Drinks", "https://images.unsplash.com/photo-1587015566802-17e754e8e82d?auto=format&fit=crop&w=800&q=80"],
  ["Passion Ginger Lemonade", 5000, "Lemonades", "Drinks", "https://images.unsplash.com/photo-1607446045710-d5a8b2b3a3ef?auto=format&fit=crop&w=800&q=80"],
  ["Strawberry Lemonade", 4000, "Lemonades", "Drinks", "https://images.unsplash.com/photo-1497534446932-c925d1a7ac7b?auto=format&fit=crop&w=800&q=80"],

  // ── FRESH JUICES ──
  ["Single Fruit Juice", 4000, "Fresh Juices", "Drinks", "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=800&q=80"],
  ["Mocktail", 5000, "Fresh Juices", "Drinks", "https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=800&q=80", true],

  // ── DETOX ──
  ["Cup Spinach", 5500, "Detox Drinks", "Drinks", "https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=800&q=80"],
  ["Green Detox", 6000, "Detox Drinks", "Drinks", "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=800&q=80"],
  ["Carrot Ginger Detox", 5500, "Detox Drinks", "Drinks", "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=800&q=80"],
  ["Tropical Detox", 5500, "Detox Drinks", "Drinks", "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=800&q=80"],

  // ── SALADS ──
  ["Green Salad", 7000, "Salads", "Meals", "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80"],
  ["Chicken Caesar Salad", 8000, "Salads", "Meals", "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=800&q=80", true],
  ["Tuna Salad", 8000, "Salads", "Meals", "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80"],
  ["Kachumbari Salad", 4000, "Salads", "Meals", "https://images.unsplash.com/photo-1607532941433-304659e8198a?auto=format&fit=crop&w=800&q=80"],
  ["Garden Salad", 7000, "Salads", "Meals", "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=800&q=80"],
  ["City Snack Chief Salad", 10000, "Salads", "Meals", "https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=800&q=80", true],

  // ── SOUPS ──
  ["Vegetable Soup", 5000, "Soups", "Meals", "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80"],
  ["Mushroom Soup", 7000, "Soups", "Meals", "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=800&q=80"],
  ["Pumpkin Soup", 5000, "Soups", "Meals", "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=800&q=80"],
  ["Chicken Soup", 8000, "Soups", "Meals", "https://images.unsplash.com/photo-1603105037880-880cd4f4f8a4?auto=format&fit=crop&w=800&q=80", true],
  ["Fish Soup", 8000, "Soups", "Meals", "https://images.unsplash.com/photo-1594756202469-9ff9799b2e4e?auto=format&fit=crop&w=800&q=80"],
  ["Ginger Carrot Soup", 6000, "Soups", "Meals", "https://images.unsplash.com/photo-1613844237701-8f3664fc2eff?auto=format&fit=crop&w=800&q=80"],
  ["City Snack Soup", 8000, "Soups", "Meals", "https://images.unsplash.com/photo-1604152135912-04a022e23696?auto=format&fit=crop&w=800&q=80", true],

  // ── BEEF ──
  ["Beef Steak", 10000, "Beef Dishes", "Meals", "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=800&q=80", true],
  ["Beef Curry", 8000, "Beef Dishes", "Meals", "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80"],
  ["Beef Stroganoff", 9000, "Beef Dishes", "Meals", "https://images.unsplash.com/photo-1504973960431-1c1c6ef1f7e8?auto=format&fit=crop&w=800&q=80"],
  ["Beef Stew", 8000, "Beef Dishes", "Meals", "https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=800&q=80"],
  ["Boiled Beef", 6000, "Beef Dishes", "Meals", "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=800&q=80"],
  ["Agatogo Beef", 7000, "Beef Dishes", "Meals", "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80"],
  ["Beef Carbonade", 10000, "Beef Dishes", "Meals", "https://images.unsplash.com/photo-1606728035253-49e8a23146de?auto=format&fit=crop&w=800&q=80"],
  ["Beef Stir Fry", 10000, "Beef Dishes", "Meals", "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=800&q=80", true],
  ["Beef Cordon Bleu", 10000, "Beef Dishes", "Meals", "https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=800&q=80"],
  ["Beef Broccoli", 10000, "Beef Dishes", "Meals", "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=800&q=80"],
  ["Beef Fries Loaded", 10000, "Beef Dishes", "Meals", "https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80"],
  ["Beef Tacos", 5000, "Beef Dishes", "Meals", "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80"],

  // ── CHICKEN ──
  ["Chicken Stew", 9000, "Chicken Dishes", "Meals", "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=800&q=80"],
  ["Chicken Curry", 10000, "Chicken Dishes", "Meals", "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80"],
  ["Boiled Chicken", 7000, "Chicken Dishes", "Meals", "https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=800&q=80"],
  ["Agatogo Chicken", 8000, "Chicken Dishes", "Meals", "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80"],
  ["Chicken Leg", 8000, "Chicken Dishes", "Meals", "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80"],
  ["Chicken Stroganoff", 10000, "Chicken Dishes", "Meals", "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80"],
  ["Chicken Biryani", 8000, "Chicken Dishes", "Meals", "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80", true],
  ["Chicken Broccoli", 10000, "Chicken Dishes", "Meals", "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=800&q=80"],
  ["Chicken Cordon Bleu", 12000, "Chicken Dishes", "Meals", "https://images.unsplash.com/photo-1604909052743-94e838986d24?auto=format&fit=crop&w=800&q=80", true],
  ["Chicken Breast", 10000, "Chicken Dishes", "Meals", "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80"],
  ["Chicken Fries Loaded", 12000, "Chicken Dishes", "Meals", "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80"],
  ["Chicken Stir Fry", 12000, "Chicken Dishes", "Meals", "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=800&q=80"],
  ["Chicken Tacos", 6000, "Chicken Dishes", "Meals", "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80"],
  ["Chicken Wings", 7000, "Chicken Dishes", "Meals", "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80", true],
  ["Chicken Rollpop", 8000, "Chicken Dishes", "Meals", "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80"],

  // ── FISH ──
  ["Fish Stew", 9000, "Fish Dishes", "Meals", "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&w=800&q=80"],
  ["Boiled Fish", 8000, "Fish Dishes", "Meals", "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80"],
  ["Fish Curry", 8000, "Fish Dishes", "Meals", "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80"],
  ["Tilapia Fish Fillet", 10000, "Fish Dishes", "Meals", "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?auto=format&fit=crop&w=800&q=80", true],
  ["Captain Fish Fillet", 8000, "Fish Dishes", "Meals", "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&w=800&q=80"],
  ["Fish Fries Loaded", 10000, "Fish Dishes", "Meals", "https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80"],
  ["Stir Fried Fish", 10000, "Fish Dishes", "Meals", "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=800&q=80"],
  ["Fish Tacos", 6000, "Fish Dishes", "Meals", "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80"],
  ["Fish Finger", 6000, "Fish Dishes", "Meals", "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80"],

  // ── PORK ──
  ["Pork Chops", 10000, "Pork Dishes", "Meals", "https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=800&q=80"],
  ["Pork Ribs", 8000, "Pork Dishes", "Meals", "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80"],
  ["By Portion", 10000, "Pork Dishes", "Meals", "https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=800&q=80"],

  // ── PASTA ──
  ["Spaghetti Bolognese", 8000, "Pasta", "Meals", "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=80", true],
  ["Spaghetti Carbonara", 8000, "Pasta", "Meals", "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80"],
  ["Spaghetti Pomodoro", 5000, "Pasta", "Meals", "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=800&q=80"],
  ["Lasagna Al Forno", 8000, "Pasta", "Meals", "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=800&q=80", true],
  ["Pasta Gamberi", 10000, "Pasta", "Meals", "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=800&q=80"],
  ["Spaghetti Tagliatelle", 8000, "Pasta", "Meals", "https://images.unsplash.com/photo-1556761223-4c4282c73f77?auto=format&fit=crop&w=800&q=80"],
  ["Penne Arrabiata", 7000, "Pasta", "Meals", "https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?auto=format&fit=crop&w=800&q=80"],
  ["City Snack Pasta Veg", 8000, "Pasta", "Meals", "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=80"],

  // ── PIZZA ──
  ["Pizza Margherita", 6000, "Pizza", "Meals", "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80"],
  ["Hawaiian Pizza", 8000, "Pizza", "Meals", "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80"],
  ["Veg Pizza", 7000, "Pizza", "Meals", "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=800&q=80"],
  ["Chicken Pizza", 10000, "Pizza", "Meals", "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80", true],
  ["Beef Pizza", 9000, "Pizza", "Meals", "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80"],
  ["Pizza Bolognese", 9000, "Pizza", "Meals", "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80"],
  ["Ham Salami Pizza", 10000, "Pizza", "Meals", "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80"],
  ["Four Season Pizza", 12000, "Pizza", "Meals", "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=800&q=80", true],
  ["Tuna Salami Pizza", 10000, "Pizza", "Meals", "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80"],
  ["Mushroom Pizza", 9000, "Pizza", "Meals", "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=800&q=80"],
  ["City Snack Pizza", 15000, "Pizza", "Meals", "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80", true],

  // ── BURGERS ──
  ["Vegetable Burger", 5000, "Burgers", "Meals", "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?auto=format&fit=crop&w=800&q=80"],
  ["Cheese Burger", 8000, "Burgers", "Meals", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80"],
  ["Hamburger", 7000, "Burgers", "Meals", "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80"],
  ["Beef Cheese Burger", 8000, "Burgers", "Meals", "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=800&q=80"],
  ["Chicken Cheese Burger", 10000, "Burgers", "Meals", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80"],
  ["Double Cheese Burger", 10000, "Burgers", "Meals", "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=800&q=80", true],
  ["City Snack Burger", 10000, "Burgers", "Meals", "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=800&q=80", true],

  // ── WRAPS ──
  ["Vegetable Wrap", 5000, "Wraps", "Meals", "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80"],
  ["Beef Wrap", 7000, "Wraps", "Meals", "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80"],
  ["Chicken Wrap", 8000, "Wraps", "Meals", "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80"],
  ["Fish Wrap", 8000, "Wraps", "Meals", "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80"],
  ["Special Rolex Wrap", 8000, "Wraps", "Meals", "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80", true],

  // ── SANDWICHES ──
  ["Vegetable Sandwich", 7000, "Sandwiches", "Meals", "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80"],
  ["Club Sandwich", 10000, "Sandwiches", "Meals", "https://images.unsplash.com/photo-1567234669003-dce7a7a88823?auto=format&fit=crop&w=800&q=80", true],
  ["Tuna Sandwich", 10000, "Sandwiches", "Meals", "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80"],
  ["Croque Madame", 8000, "Sandwiches", "Meals", "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80"],
  ["Croque Monsieur", 7000, "Sandwiches", "Meals", "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80"],
  ["Hot Dog", 7000, "Sandwiches", "Meals", "https://images.unsplash.com/photo-1612392062126-47a668585b78?auto=format&fit=crop&w=800&q=80"],
  ["Classic BLT Sandwich", 8000, "Sandwiches", "Meals", "https://images.unsplash.com/photo-1567234669003-dce7a7a88823?auto=format&fit=crop&w=800&q=80"],
  ["City Snack BLT Sandwich", 10000, "Sandwiches", "Meals", "https://images.unsplash.com/photo-1567234669003-dce7a7a88823?auto=format&fit=crop&w=800&q=80"],

  // ── BBQ ──
  ["Whole Grilled Chicken", 25000, "BBQ", "Meals", "https://images.unsplash.com/photo-1594221708779-94832f4320d1?auto=format&fit=crop&w=800&q=80", true],
  ["Quarter Grilled Chicken", 8000, "BBQ", "Meals", "https://images.unsplash.com/photo-1594221708779-94832f4320d1?auto=format&fit=crop&w=800&q=80"],
  ["Half Grilled Chicken", 15000, "BBQ", "Meals", "https://images.unsplash.com/photo-1594221708779-94832f4320d1?auto=format&fit=crop&w=800&q=80"],
  ["Whole Grilled Tilapia", 25000, "BBQ", "Meals", "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?auto=format&fit=crop&w=800&q=80", true],
  ["Grilled Whole Rabbit", 15000, "BBQ", "Meals", "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80"],
  ["Nyamachoma Leg", 30000, "BBQ", "Meals", "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80", true],
  ["Nyamachoma Arm", 25000, "BBQ", "Meals", "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80"],
  ["Grilled Full Goat Ribs", 30000, "BBQ", "Meals", "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=80", true],
  ["Half Grilled Goat Ribs", 15000, "BBQ", "Meals", "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=80"],
  ["Chicken Brochette", 5000, "BBQ", "Meals", "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80"],
  ["Fish Brochette", 5000, "BBQ", "Meals", "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80"],
  ["Beef Brochette", 3000, "BBQ", "Meals", "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80"],
  ["Goat Brochette", 3000, "BBQ", "Meals", "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80"],

  // ── DESSERTS ──
  ["Ice Cream", 2000, "Desserts", "Desserts", "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=800&q=80"],
  ["Pancakes", 2000, "Desserts", "Desserts", "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80"],
  ["Waffles", 2000, "Desserts", "Desserts", "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=800&q=80"],
  ["Crepe", 4000, "Desserts", "Desserts", "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=800&q=80"],
  ["Fruit Plate", 7000, "Desserts", "Desserts", "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=800&q=80", true],
  ["Fruit Macedoine", 5000, "Desserts", "Desserts", "https://images.unsplash.com/photo-1564093497595-593b96d80571?auto=format&fit=crop&w=800&q=80"],

  // ── SNACKS ──
  ["Meat Samosa", 500, "Snacks", "Meals", "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80"],
  ["Vegetable Samosa", 1000, "Snacks", "Meals", "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80"],
  ["Doughnut", 2000, "Snacks", "Meals", "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80"],
  ["Cookies", 500, "Snacks", "Meals", "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80"],
  ["Muffins", 500, "Snacks", "Meals", "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=800&q=80"],
  ["Cinnamon Rolls", 4000, "Snacks", "Meals", "https://images.unsplash.com/photo-1509365390695-33aee754301f?auto=format&fit=crop&w=800&q=80"],
  ["Croissant", 3000, "Snacks", "Meals", "https://images.unsplash.com/photo-1555507036-ab1f4038024a?auto=format&fit=crop&w=800&q=80"],
  ["Meat Balls", 3000, "Snacks", "Meals", "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=800&q=80"],
];

const descriptions: Record<string, string> = {
  "Black Tea": "Classic Rwandan black tea with a deep amber color.",
  "Green Tea": "Light and earthy green tea. Pairs well with honey.",
  "African Tea": "Our signature spiced tea blend with cinnamon and cloves.",
  // ... (I'll skip the full list — copy from your menuData.ts descriptions object)
};

const prepTimes: Record<string, string> = {
  "Tea": "3–5 min", "Coffee": "3–5 min", "Smoothies": "5–7 min",
  "Milkshakes": "5–7 min", "Lemonades": "3–5 min", "Fresh Juices": "5–7 min",
  "Detox Drinks": "5–7 min", "Salads": "8–12 min", "Soups": "10–15 min",
  "Beef Dishes": "20–30 min", "Chicken Dishes": "20–30 min",
  "Fish Dishes": "15–25 min", "Pork Dishes": "20–30 min", "Pasta": "15–20 min",
  "Pizza": "18–25 min", "Burgers": "12–18 min", "Wraps": "10–15 min",
  "Sandwiches": "10–15 min", "BBQ": "25–40 min", "Desserts": "5–10 min",
  "Snacks": "5–10 min",
};

const BRANCHES = ["huye", "musanze"];

async function seedMenu() {
  console.log("🌱 Starting menu seed...");
  await connectMongo();
  await ensureMenuIndexes();

  for (const branchId of BRANCHES) {
    console.log(`\n📍 Seeding ${branchId}...`);

    // Clear existing menu for this branch
    const deleted = await clearMenuForBranch(branchId);
    console.log(`   Cleared ${deleted} existing items`);

    // Build items for this branch
    const menuItems = items.map(([name, price, subcategory, category, image, featured], index) => ({
      branchId,
      name,
      category,
      subcategory,
      description: descriptions[name] ?? name,
      price,
      image,
      featured: featured === true,
      prepTime: prepTimes[subcategory] ?? "10–15 min",
      isAvailable: true,
      displayOrder: index,
    }));

    // Bulk insert
    const inserted = await bulkCreateMenuItems(menuItems);
    console.log(`   ✅ Inserted ${inserted} menu items for ${branchId}`);
  }

  console.log("\n🎉 Menu seed complete!");
  process.exit(0);
}

seedMenu().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});