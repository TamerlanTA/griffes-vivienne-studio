CREATE TABLE `creditTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`type` enum('purchase','usage') NOT NULL,
	`description` text,
	`generationId` int,
	`stripePaymentId` varchar(255),
	`amountPaid` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creditTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`logoUrl` text NOT NULL,
	`logoKey` text NOT NULL,
	`labelUrl` text NOT NULL,
	`labelKey` text NOT NULL,
	`textureType` varchar(50) NOT NULL,
	`options` text,
	`isFreeTrial` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `hasUsedFreeTrial` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `creditBalance` int DEFAULT 0 NOT NULL;