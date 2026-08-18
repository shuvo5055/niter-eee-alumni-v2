CREATE TABLE `activityLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorId` int,
	`action` varchar(160) NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` varchar(80),
	`details` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alumni` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`fullName` varchar(200) NOT NULL,
	`batchId` int,
	`districtId` int,
	`session` varchar(64),
	`studentId` varchar(80),
	`bloodGroup` varchar(12),
	`photoUrl` text,
	`school` text,
	`college` text,
	`bsc` text,
	`msc` text,
	`skill` text,
	`researchActivities` text,
	`currentOrganization` text,
	`currentDesignation` text,
	`currentDuration` varchar(160),
	`previousOrganization` text,
	`previousDesignation` text,
	`previousDuration` varchar(160),
	`whatsapp` text,
	`facebook` text,
	`linkedin` text,
	`country` varchar(120) DEFAULT 'Bangladesh',
	`city` varchar(120),
	`industry` varchar(160),
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alumni_id` PRIMARY KEY(`id`),
	CONSTRAINT `alumni_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `batches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batchNumber` int NOT NULL,
	`session` varchar(64),
	`displayName` varchar(120),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `batches_id` PRIMARY KEY(`id`),
	CONSTRAINT `batches_number_uq` UNIQUE(`batchNumber`)
);
--> statement-breakpoint
CREATE TABLE `districts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`division` varchar(120),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `districts_id` PRIMARY KEY(`id`),
	CONSTRAINT `districts_name_uq` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `galleryItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(220) NOT NULL,
	`category` varchar(120) NOT NULL,
	`imageUrl` text NOT NULL,
	`eventDate` timestamp,
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `galleryItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(220) NOT NULL,
	`organization` varchar(220) NOT NULL,
	`location` varchar(220),
	`employmentType` varchar(80),
	`description` text,
	`requirements` text,
	`applicationLink` text,
	`applicationContact` varchar(220),
	`deadline` timestamp,
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteContent` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(120) NOT NULL,
	`value` json,
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteContent_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_content_key_uq` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','editor','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE INDEX `alumni_batch_idx` ON `alumni` (`batchId`);--> statement-breakpoint
CREATE INDEX `alumni_district_idx` ON `alumni` (`districtId`);--> statement-breakpoint
CREATE INDEX `alumni_status_idx` ON `alumni` (`status`);--> statement-breakpoint
CREATE INDEX `jobs_status_idx` ON `jobs` (`status`);