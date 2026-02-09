document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('flashcardForm');


    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const character = document.getElementById('newCharacter').value;
        const pinyin = document.getElementById('newPinyin').value;
    })

        const fs = require('fs');
const filePath = './yourfile.json';

try {
    // 1. Read the file
    const data = fs.readFileSync(filePath, 'utf8');

    // 2. Parse the JSON string into a JavaScript object
    const jsonObject = JSON.parse(data);

    // 3. Modify the object (example: update a property)
    jsonObject.someKey = "newValue";
    // Example: add to an array
    if (jsonObject.someArray) {
        jsonObject.someArray.push("newItem");
    }

    // 4. Convert the object back into a JSON string (using 2 for pretty-printing)
    const updatedJsonString = JSON.stringify(jsonObject, null, 2);

    // 5. Write the updated data back to the file
    fs.writeFileSync(filePath, updatedJsonString, 'utf8');
    console.log('JSON file updated successfully.');

} catch (error) {
    console.error('Error modifying JSON file:', error);
}

});