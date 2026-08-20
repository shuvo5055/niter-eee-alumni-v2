ALTER TABLE `alumni` ADD `email` varchar(320);--> statement-breakpoint
ALTER TABLE `alumni` ADD `phone` varchar(80);--> statement-breakpoint
ALTER TABLE `alumni` ADD `address` text;--> statement-breakpoint
ALTER TABLE `alumni` ADD `graduationYear` int;--> statement-breakpoint
ALTER TABLE `alumni` ADD CONSTRAINT `alumni_student_id_uq` UNIQUE(`studentId`);--> statement-breakpoint
ALTER TABLE `alumni` ADD CONSTRAINT `alumni_email_uq` UNIQUE(`email`);