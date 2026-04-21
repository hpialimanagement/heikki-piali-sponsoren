CREATE TABLE `sponsors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`contactPerson` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`notes` text,
	`status` enum('Noch nicht kontaktiert','E-Mail in Vorbereitung','E-Mail gesendet','Antwort erhalten','Absage','Zusage/Partner') NOT NULL DEFAULT 'Noch nicht kontaktiert',
	`emailSentDate` timestamp,
	`responseDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sponsors_id` PRIMARY KEY(`id`)
);
