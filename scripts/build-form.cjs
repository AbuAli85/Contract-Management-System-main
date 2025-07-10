const fs = require('fs');
const path = require('path');

const schema = {
  contract_name: { type: 'text', label: 'Contract Name', required: true },
  contract_type: { type: 'text', label: 'Contract Type', required: true },
  party_a_id: { type: 'select', label: 'Party A', options: [], required: true },
  party_b_id: { type: 'select', label: 'Party B', options: [], required: true },
  promoter_id: { type: 'select', label: 'Promoter', options: [], required: true },
  start_date: { type: 'date', label: 'Start Date', required: false },
  end_date: { type: 'date', label: 'End Date', required: false },
  contract_value: { type: 'number', label: 'Contract Value', required: false },
  content_english: { type: 'textarea', label: 'Content (English)', required: true },
  content_spanish: { type: 'textarea', label: 'Content (Spanish)', required: true },
  status: {
    type: 'select',
    label: 'Status',
    options: ['Draft', 'Pending Review', 'Approved', 'Signed', 'Active', 'Completed', 'Archived'],
    required: true,
  },
}

function generateFormFields(schema) {
  let fields = '';
  for (const key in schema) {
    const field = schema[key];
    const type = field.type;
    const label = field.label || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    const placeholder = field.placeholder || `Enter ${label.toLowerCase()}`;
    const required = field.required ? 'required' : '';

    switch (type) {
      case 'text':
      case 'email':
      case 'password':
      case 'number':
        fields += `
          <div class="mb-4">
            <label for="${key}" class="block text-sm font-medium text-gray-700">${label}</label>
            <input
              type="${type}"
              id="${key}"
              name="${key}"
              placeholder="${placeholder}"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              ${required}
            />
          </div>
        `;
        break;
      case 'textarea':
        fields += `
          <div class="mb-4">
            <label for="${key}" class="block text-sm font-medium text-gray-700">${label}</label>
            <textarea
              id="${key}"
              name="${key}"
              placeholder="${placeholder}"
              rows="4"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              ${required}
            ></textarea>
          </div>
        `;
        break;
      case 'select':
        const optionsHtml = field.options
          .map((option) => `<option value="${option}">${option}</option>`)
          .join('');
        fields += `
          <div class="mb-4">
            <label for="${key}" class="block text-sm font-medium text-gray-700">${label}</label>
            <select
              id="${key}"
              name="${key}"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              ${required}
            >
              ${optionsHtml}
            </select>
          </div>
        `;
        break;
      case 'date':
        fields += `
          <div class="mb-4">
            <label for="${key}" class="block text-sm font-medium text-gray-700">${label}</label>
            <input
              type="date"
              id="${key}"
              name="${key}"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              ${required}
            />
          </div>
        `;
        break;
      default:
        break;
    }
  }
  return fields;
}

const formHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contract Generator Form</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-100 p-6">
    <div class="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 class="text-2xl font-bold mb-6">Generate New Contract</h1>
        ${generateFormFields(schema)}
        <button type="submit" class="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600">Generate Contract</button>
    </div>
</body>
</html>
`

const outputPath = path.join(__dirname, '..', 'public', 'contract-form.html');
fs.writeFileSync(outputPath, formHtml);
console.log(`Generated form HTML at ${outputPath}`);

// Example schema
const mySchema = {
  username: { type: 'text', label: 'Username' },
  email: { type: 'email', label: 'Email Address' },
  password: { type: 'password', label: 'Password' },
  bio: { type: 'textarea', label: 'Biography' },
  role: {
    type: 'select',
    label: 'Role',
    options: [
      { value: 'user', label: 'User' },
      { value: 'admin', label: 'Admin' },
    ],
  },
};

const generatedForm = generateFormFields(mySchema);
const outputPath2 = path.join(__dirname, 'generated-form.html');

fs.writeFileSync(outputPath2, generatedForm);
console.log(`Generated form saved to ${outputPath2}`);
