CREATE TABLE `accountTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alumniId` int NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`type` enum('CLAIM','RESET_PASSWORD') NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accountTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `account_tokens_hash_uq` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE INDEX `account_tokens_alumni_type_idx` ON `accountTokens` (`alumniId`,`type`);--> statement-breakpoint
CREATE INDEX `account_tokens_expiry_idx` ON `accountTokens` (`expiresAt`);