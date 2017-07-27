CREATE TABLE funding_nodes (
	status_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	status CHAR(255) NOT NULL,
	device_address CHAR(33) NOT NULL,
	status_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
