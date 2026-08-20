CREATE TABLE `alumniProfileChanges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alumniId` int NOT NULL,
	`submittedByAlumniId` int NOT NULL,
	`proposedData` json NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewNotes` text,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alumniProfileChanges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `alumni` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `alumni` ADD `claimed` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `alumni` ADD `claimedAt` timestamp;--> statement-breakpoint
ALTER TABLE `alumni` ADD `claimFailedAttempts` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `alumni` ADD `claimLockedUntil` timestamp;--> statement-breakpoint
CREATE INDEX `alumni_profile_changes_alumni_idx` ON `alumniProfileChanges` (`alumniId`);--> statement-breakpoint
CREATE INDEX `alumni_profile_changes_status_idx` ON `alumniProfileChanges` (`status`);