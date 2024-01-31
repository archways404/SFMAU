const env = require('dotenv');
const ICAL = require('ical.js');
//const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

env.config();

const url = process.env.link;
const filePath = path.join(__dirname, '/downloads/downloadedFile.ics'); // Saves in the same directory as your script

console.log('process.env.link:', process.env.link);

fetch(url)
	.then((res) => {
		if (!res.ok) {
			throw new Error(`HTTP error! status: ${res.status}`);
		}
		return res.arrayBuffer();
	})
	.then((buffer) => {
		fs.writeFileSync(filePath, Buffer.from(buffer));
		console.log('File downloaded successfully');

		// Read the downloaded file
		const data = fs.readFileSync(filePath, 'utf8');

		// Parse the iCal data
		const jcalData = ICAL.parse(data);
		const comp = new ICAL.Component(jcalData);

		// Modify each VEVENT
		comp.getAllSubcomponents('vevent').forEach((event) => {
			let summary = event.getFirstPropertyValue('summary');

			// Extract Kurs.grp and Moment
			const kursGrpMatch = summary.match(/Kurs\.grp: ([^,]+),/);
			const momentMatch = summary.match(/Moment: ([^,]+)/);

			if (kursGrpMatch && momentMatch) {
				let newSummary = kursGrpMatch[1].trim();
				let description = momentMatch[1].trim();

				// Remove "Aktivitetstyp: Okänd" from the description
				description = description.replace('Aktivitetstyp: Okänd', '').trim();

				event.updatePropertyWithValue('summary', newSummary);
				event.updatePropertyWithValue('description', description);
			}
		});

		// Generate the modified iCal data
		const updatedData = comp.toString();

		// Save the updated iCal data back to file
		fs.writeFileSync(filePath, updatedData);
		console.log('iCal file updated successfully');
	})
	.catch((e) => console.error('Error downloading file:', e));
