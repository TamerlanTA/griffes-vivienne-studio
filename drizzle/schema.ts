import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** Indique si l'utilisateur a déjà utilisé son essai gratuit */
  hasUsedFreeTrial: int("hasUsedFreeTrial").default(0).notNull(),
  /** Solde de crédits disponibles */
  creditBalance: int("creditBalance").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Table des générations d'étiquettes
 * Stocke l'historique de toutes les étiquettes générées par les utilisateurs
 */
export const generations = mysqlTable("generations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** URL du logo original uploadé par l'utilisateur */
  logoUrl: text("logoUrl").notNull(),
  /** Clé S3 du logo */
  logoKey: text("logoKey").notNull(),
  /** URL de l'étiquette générée */
  labelUrl: text("labelUrl").notNull(),
  /** Clé S3 de l'étiquette */
  labelKey: text("labelKey").notNull(),
  /** Type de texture sélectionné (Classic, Fancy, BIO, Vintage) */
  textureType: varchar("textureType", { length: 50 }).notNull(),
  /** Options supplémentaires en JSON */
  options: text("options"),
  /** Indique si c'était l'essai gratuit */
  isFreeTrial: int("isFreeTrial").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Generation = typeof generations.$inferSelect;
export type InsertGeneration = typeof generations.$inferInsert;

/**
 * Table des transactions de crédits
 * Historique des achats et utilisations de crédits
 */
export const creditTransactions = mysqlTable("creditTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Montant de crédits (positif pour achat, négatif pour utilisation) */
  amount: int("amount").notNull(),
  /** Type de transaction: 'purchase' ou 'usage' */
  type: mysqlEnum("type", ["purchase", "usage"]).notNull(),
  /** Description de la transaction */
  description: text("description"),
  /** ID de la génération associée (si type = 'usage') */
  generationId: int("generationId"),
  /** ID de paiement Stripe (si type = 'purchase') */
  stripePaymentId: varchar("stripePaymentId", { length: 255 }),
  /** Montant payé en euros (si type = 'purchase') */
  amountPaid: int("amountPaid"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;