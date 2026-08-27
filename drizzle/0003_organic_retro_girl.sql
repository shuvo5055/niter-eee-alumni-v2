CREATE TABLE `batchAccessAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batchId` int NOT NULL,
	`fingerprintHash` varchar(64) NOT NULL,
	`failedAttempts` int NOT NULL DEFAULT 0,
	`lockedUntil` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `batchAccessAttempts_id` PRIMARY KEY(`id`),
	CONSTRAINT `batch_access_attempts_fingerprint_uq` UNIQUE(`batchId`,`fingerprintHash`)
);
--> statement-breakpoint
CREATE TABLE `batchAlumniSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batchId` int NOT NULL,
	`districtId` int,
	`fullName` varchar(200) NOT NULL,
	`email` varchar(320) NOT NULL,
	`studentId` varchar(80),
	`phone` varchar(80),
	`photoUrl` text,
	`submittedData` json NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewerNotes` text,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`approvedAlumniId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `batchAlumniSubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `batchSubmissionAccess` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batchId` int NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `batchSubmissionAccess_id` PRIMARY KEY(`id`),
	CONSTRAINT `batch_submission_access_token_uq` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE INDEX `batch_alumni_submissions_status_idx` ON `batchAlumniSubmissions` (`status`);--> statement-breakpoint
CREATE INDEX `batch_alumni_submissions_batch_idx` ON `batchAlumniSubmissions` (`batchId`);--> statement-breakpoint
CREATE INDEX `batch_alumni_submissions_email_idx` ON `batchAlumniSubmissions` (`email`);--> statement-breakpoint
CREATE INDEX `batch_alumni_submissions_student_id_idx` ON `batchAlumniSubmissions` (`studentId`);--> statement-breakpoint
CREATE INDEX `batch_submission_access_batch_expiry_idx` ON `batchSubmissionAccess` (`batchId`,`expiresAt`);